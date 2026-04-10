import { describe, expect, it, vi } from "vitest";
import { onMounted } from "@terajs/runtime";
import { signal } from "@terajs/reactivity";

import * as dom from "./dom";
import { hydrateRoot } from "./hydrate";
import { jsx } from "./jsx-runtime";

describe("hydrateRoot", () => {
  it("hydrates without calling DOM clear on SSR roots", () => {
    const root = document.createElement("div");
    root.innerHTML = "<div data-ssr='true'>Server</div>";
    const clearSpy = vi.spyOn(dom, "clear");

    const App = () => {
      const next = document.createElement("div");
      next.setAttribute("data-ssr", "true");
      next.textContent = "Client";
      return next;
    };

    hydrateRoot(App, root);

    expect(clearSpy).not.toHaveBeenCalled();
    expect(root.innerHTML).toBe("<div data-ssr=\"true\">Client</div>");
  });

  it("runs component mounted hooks during hydration", () => {
    const root = document.createElement("div");
    root.innerHTML = "<div>Server</div>";
    let mountedCalls = 0;

    const App = () => {
      onMounted(() => {
        mountedCalls += 1;
      });

      const next = document.createElement("div");
      next.textContent = "Client";
      return next;
    };

    hydrateRoot(App, root);

    expect(mountedCalls).toBe(1);
  });

  it("respects mode none and leaves SSR markup untouched", () => {
    const root = document.createElement("div");
    root.innerHTML = "<div id='ssr'>Server</div>";

    const payloadScript = document.createElement("script");
    payloadScript.type = "application/terajs-hydration";
    payloadScript.textContent = JSON.stringify({ mode: "none" });
    document.head.appendChild(payloadScript);

    const App = () => {
      const next = document.createElement("div");
      next.id = "csr";
      next.textContent = "Client";
      return next;
    };

    hydrateRoot(App, root);

    expect(root.querySelector("#ssr")?.textContent).toBe("Server");
    expect(root.querySelector("#csr")).toBeNull();

    payloadScript.remove();
  });

  it("reuses SSR nodes in place and resumes reactive prop updates", () => {
    const root = document.createElement("div");
    root.innerHTML = "<button id='server'><span>Server</span></button>";

    const ssrButton = root.firstElementChild as HTMLButtonElement;
    const id = signal("client");

    const App = () => jsx("button", {
      id: () => id(),
      children: jsx("span", { children: "Server" })
    });

    hydrateRoot(App, root);

    const hydratedButton = root.firstElementChild as HTMLButtonElement;
    expect(hydratedButton).toBe(ssrButton);
    expect(hydratedButton.id).toBe("client");

    id.set("updated");

    expect(root.firstElementChild).toBe(ssrButton);
    expect((root.firstElementChild as HTMLButtonElement).id).toBe("updated");
  });

  it("binds events on reused SSR nodes", () => {
    const root = document.createElement("div");
    root.innerHTML = "<button type='button'>Tap</button>";
    const ssrButton = root.firstElementChild as HTMLButtonElement;
    let clicks = 0;

    const App = () => jsx("button", {
      type: "button",
      onClick: () => {
        clicks += 1;
      },
      children: "Tap"
    });

    hydrateRoot(App, root);

    const hydratedButton = root.firstElementChild as HTMLButtonElement;
    expect(hydratedButton).toBe(ssrButton);

    hydratedButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(clicks).toBe(1);
  });

  it("falls back to replacement when SSR structure mismatches", () => {
    const root = document.createElement("div");
    root.innerHTML = "<p>Server</p>";
    const ssrNode = root.firstElementChild;

    const App = () => jsx("div", { children: "Client" });

    hydrateRoot(App, root);

    expect(root.firstElementChild?.tagName).toBe("DIV");
    expect(root.firstElementChild?.textContent).toBe("Client");
    expect(root.contains(ssrNode)).toBe(false);
  });
});
