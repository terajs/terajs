import { describe, expect, it, vi } from "vitest";
import { mount, unmount } from "@terajs/renderer-web";
import { mountTerajs, TerajsDirective } from "./TerajsWrapper";

vi.mock("@terajs/renderer-web", () => ({
  mount: vi.fn(),
  unmount: vi.fn()
}));

vi.mock("@terajs/reactivity", () => ({
  signal: vi.fn((initial: unknown) => {
    let current = initial;
    const accessor = (() => current) as (() => unknown) & { set(next: unknown): void };
    accessor.set = (next) => {
      current = next;
    };
    return accessor;
  })
}));

describe("adapter-vue TerajsWrapper", () => {
  it("mountTerajs mounts and returns a disposer", () => {
    const el = document.createElement("div");
    const component = { name: "Counter" };

    const dispose = mountTerajs(el, component, { count: 1 });

    const mountMock = vi.mocked(mount);
    const signalProps = mountMock.mock.calls[0]?.[2] as Record<string, (() => unknown) & { set(next: unknown): void }>;

    expect(mountMock).toHaveBeenCalledTimes(1);
    expect(signalProps.count()).toBe(1);

    dispose();

    expect(vi.mocked(unmount)).toHaveBeenCalledTimes(1);
  });

  it("directive updates props without remounting when component is stable", () => {
    const el = document.createElement("div");
    const component = { name: "Counter" };

    TerajsDirective.mounted(el, {
      value: {
        component,
        props: { count: 1 }
      }
    });

    const mountMock = vi.mocked(mount);
    const unmountMock = vi.mocked(unmount);
    const signalProps = mountMock.mock.calls[0]?.[2] as Record<string, (() => unknown) & { set(next: unknown): void }>;

    TerajsDirective.updated(el, {
      value: {
        component,
        props: { count: 2 }
      },
      oldValue: {
        component,
        props: { count: 1 }
      }
    });

    expect(mountMock).toHaveBeenCalledTimes(1);
    expect(unmountMock).toHaveBeenCalledTimes(0);
    expect(signalProps.count()).toBe(2);
  });

  it("directive remounts when component changes and cleans up before unmount", () => {
    const el = document.createElement("div");
    const first = { name: "First" };
    const second = { name: "Second" };

    TerajsDirective.mounted(el, {
      value: {
        component: first,
        props: { enabled: true }
      }
    });

    TerajsDirective.updated(el, {
      value: {
        component: second,
        props: { enabled: false }
      },
      oldValue: {
        component: first,
        props: { enabled: true }
      }
    });

    const mountMock = vi.mocked(mount);
    const unmountMock = vi.mocked(unmount);

    expect(mountMock).toHaveBeenCalledTimes(2);
    expect(unmountMock).toHaveBeenCalledTimes(1);

    TerajsDirective.beforeUnmount(el);
    expect(unmountMock).toHaveBeenCalledTimes(2);
  });
});
