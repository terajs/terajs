import { describe, it, expect } from "vitest";
import { parseSFC } from "@nebula/sfc/index.js";

describe("route block extraction", () => {
  it("returns null when no route block exists", () => {
    const sfc = parseSFC("<template></template>", "/pages/x.nbl");
    expect(sfc.routeOverride).toBeNull();
  });

  it("parses route override block", () => {
    const sfc = parseSFC("<route>layout: admin</route>", "/pages/x.nbl");
    expect(sfc.routeOverride?.layout).toBe("admin");
  });
});
