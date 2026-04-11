import { describe, it, expect, vi } from "vitest";
import { Portal } from "./Portal";
import { setCurrentRenderer } from "../renderer";

describe("Portal (runtime platform-agnostic)", () => {
  it("delegates portal mount and unmount to the active renderer", () => {
    const mount = vi.fn();
    const unmount = vi.fn();
    const portalContainer = { id: "portal-target" };

    setCurrentRenderer({
      isServer: false,
      mount: (fn) => mount(fn),
      unmount: () => unmount(),
      createPortalContainer: (target: string) => {
        expect(target).toBe("body");
        return portalContainer;
      }
    });

    Portal({
      children: () => "teleported content"
    });

    expect(mount).toHaveBeenCalled();
    expect(unmount).not.toHaveBeenCalled();
  });

  it("renders children inline on the server", () => {
    setCurrentRenderer({
      isServer: true,
      mount: () => {},
      unmount: () => {},
      createPortalContainer: () => null
    });

    const result = Portal({
      children: () => "inline content"
    });

    expect(result).toBe("inline content");
  });
});
