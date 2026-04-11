import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { mount, unmount } from "@terajs/renderer-web";
import { TerajsWrapper } from "./TerajsWrapper";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

describe("adapter-react TerajsWrapper", () => {
  it("mounts once and updates signal-backed props without remounting", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = createRoot(container);
    const Component = () => document.createElement("div");

    await act(async () => {
      root.render(<TerajsWrapper component={Component} props={{ count: 1, label: "first" }} />);
    });

    const mountMock = vi.mocked(mount);
    const unmountMock = vi.mocked(unmount);

    expect(mountMock).toHaveBeenCalledTimes(1);
    const signalProps = mountMock.mock.calls[0]?.[2] as Record<string, (() => unknown) & { set(next: unknown): void }>;
    expect(signalProps.count()).toBe(1);
    expect(signalProps.label()).toBe("first");

    await act(async () => {
      root.render(<TerajsWrapper component={Component} props={{ count: 2, label: "second" }} />);
    });

    expect(mountMock).toHaveBeenCalledTimes(1);
    expect(unmountMock).toHaveBeenCalledTimes(0);
    expect(signalProps.count()).toBe(2);
    expect(signalProps.label()).toBe("second");

    await act(async () => {
      root.unmount();
    });

    expect(unmountMock).toHaveBeenCalledTimes(1);
  });

  it("remounts when component identity changes", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = createRoot(container);
    const First = () => document.createElement("div");
    const Second = () => document.createElement("span");

    await act(async () => {
      root.render(<TerajsWrapper component={First} props={{ ready: true }} />);
    });

    await act(async () => {
      root.render(<TerajsWrapper component={Second} props={{ ready: false }} />);
    });

    const mountMock = vi.mocked(mount);
    const unmountMock = vi.mocked(unmount);

    expect(mountMock).toHaveBeenCalledTimes(2);
    expect(unmountMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });

    expect(unmountMock).toHaveBeenCalledTimes(2);
  });
});
