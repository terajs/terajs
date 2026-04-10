import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter, getRouteDataResourceKey, type RouteDefinition } from "@terajs/router";
import { invalidateResources } from "@terajs/runtime";

import { Form, FormStatus, SubmitButton } from "./form";
import { Link } from "./link";
import { mount, unmount } from "./mount";
import { createRouteView } from "./routerView";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "index",
    path: "/",
    filePath: "/pages/index.tera",
    component: async () => ({ default: () => document.createTextNode("home") }),
    layout: null,
    middleware: [],
    prerender: true,
    hydrate: "eager",
    edge: false,
    meta: {},
    layouts: [],
    ...overrides
  };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("web app flow", () => {
  it("handles navigation, route shells, mutation helpers, and route revalidation together", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let profileName = "Ada";
    let settingsModule:
      | {
          default: (props: { data: { name: string } }) => Node;
          load: () => { name: string };
        }
      | undefined;
    let resolveSettingsComponent: ((value: {
      default: (props: { data: { name: string } }) => Node;
      load: () => { name: string };
    }) => void) | undefined;

    const router = createRouter(
      [
        route({
          id: "home",
          path: "/",
          component: async () => ({
            default: () => {
              const el = document.createElement("div");
              el.append("home ");
              el.appendChild(Link({ to: "/settings", children: "Settings" }));
              return el;
            }
          })
        }),
        route({
          id: "settings",
          path: "/settings",
          component: () => {
            if (settingsModule) {
              return Promise.resolve(settingsModule);
            }

            return new Promise((resolve) => {
              resolveSettingsComponent = (value) => {
                settingsModule = value;
                resolve(value);
              };
            });
          }
        })
      ],
      { history: createMemoryHistory("/") }
    );

    mount(
      createRouteView(router, {
        loading: () => document.createTextNode("loading route"),
        pending: ({ match }) => {
          const shell = document.createElement("p");
          shell.textContent = `shell:${match.fullPath}`;
          return shell;
        },
        keepPreviousDuringLoading: true
      }),
      root
    );
    await flush();

    expect(root.textContent).toContain("home");

    root.querySelector("a")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    await Promise.resolve();

    expect(root.textContent).toContain("home");
    expect(root.textContent).toContain("shell:/settings");

    resolveSettingsComponent?.({
      default: ({ data }: { data: { name: string } }) => {
        const heading = document.createElement("h1");
        heading.textContent = `profile:${data.name}`;

        const input = document.createElement("input");
        input.name = "name";
        input.value = data.name;

        return Form({
          action: async ({ values }) => {
            const nextName = values.name;
            profileName = Array.isArray(nextName) ? String(nextName[0] ?? "") : String(nextName ?? "");
            await invalidateResources(getRouteDataResourceKey("settings"));
            return "saved";
          },
          children: [
            heading,
            input,
            SubmitButton({ children: "Save" }),
            FormStatus({ idle: "idle", pending: "saving" })
          ]
        });
      },
      load: () => ({ name: profileName })
    });
    await flush();

    expect(root.textContent).toContain("profile:Ada");
    expect(root.textContent).toContain("idle");

    const input = root.querySelector('input[name="name"]') as HTMLInputElement;
    input.value = "Grace";

    root.querySelector("form")?.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await flush();
    }

    expect(root.textContent).toContain("profile:Grace");

    unmount(root);
  });
});