import { describe, it, expect } from "vitest";
import { parseSFC } from "./parseSfc";

describe("route block extraction", () => {
  it("returns null when no route block exists", () => {
    const sfc = parseSFC("<template></template>", "/pages/x.tera");
    expect(sfc.routeOverride).toBeNull();
  });

  it("parses route override block", () => {
    const sfc = parseSFC("<route>layout: admin</route>", "/pages/x.tera");
    expect(sfc.routeOverride?.layout).toBe("admin");
  });
});
