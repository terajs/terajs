import { describe, expect, it } from "vitest";
import { signal } from "@terajs/reactivity";

import { withErrorBoundary } from "./errorBoundary";
import { mount, unmount } from "./mount";

describe("withErrorBoundary", () => {
  it("renders fallback when the wrapped component throws during initial render", () => {
    const root = document.createElement("div");
    const Wrapped = withErrorBoundary(
      () => {
        throw new Error("boom");
      },
      {
        fallback: ({ error }) => {
          const el = document.createElement("p");
          el.textContent = error instanceof Error ? error.message : String(error);
          return el;
        }
      }
    );

    mount(Wrapped, root);

    expect(root.textContent).toBe("boom");

    unmount(root);
  });

  it("renders fallback when a reactive update throws and can retry", () => {
    const root = document.createElement("div");
    const state = signal<"ok" | "fail">("ok");
    const Wrapped = withErrorBoundary(
      () => () => {
        if (state() === "fail") {
          throw new Error("update failed");
        }

        const el = document.createElement("p");
        el.textContent = "ready";
        return el;
      },
      {
        fallback: ({ retry }) => {
          const button = document.createElement("button");
          button.textContent = "retry";
          button.addEventListener("click", () => {
            state.set("ok");
            retry();
          });
          return button;
        }
      }
    );

    mount(Wrapped, root);
    expect(root.textContent).toBe("ready");

    state.set("fail");
    expect(root.textContent).toBe("retry");

    root.querySelector("button")?.dispatchEvent(new MouseEvent("click"));
    expect(root.textContent).toBe("ready");

    unmount(root);
  });
});