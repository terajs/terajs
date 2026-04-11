import { describe, it, expect, vi } from "vitest";
import { validateHydration } from "./diagnostics";

describe("Hydration Diagnostics", () => {
  it("should log a warning when HTML differs", () => {
    vi.stubEnv("NODE_ENV", "development");

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = "<div>Server</div>";

    validateHydration(container, "<div>Client</div>");

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Terajs Hydration Mismatch]"),
      expect.anything(),
      expect.anything()
    );

    consoleWarnSpy.mockRestore();
  });
});
