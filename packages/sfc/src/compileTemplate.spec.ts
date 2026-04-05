import { describe, it, expect } from "vitest";
import type { ParsedSFC } from "@nebula/sfc";
import { compileTemplateFromSFC } from "./compileTemplate";

describe("compileTemplateFromSFC", () => {
  it("produces an IRModule with template and meta/route/ai", () => {
    const sfc: ParsedSFC = {
      filePath: "/pages/test.nbl",
      template: `<div>{{ msg }}</div>`,
      script: ``,
      style: null,
      meta: { title: "Test" },
      ai: { intent: "test" },
      routeOverride: { layout: "blog" }
    };

    const ir = compileTemplateFromSFC(sfc);

    expect(ir.filePath).toBe("/pages/test.nbl");
    expect(ir.template.length).toBeGreaterThan(0);
    expect(ir.meta.title).toBe("Test");
    expect(ir.ai?.intent).toBe("test");
    expect(ir.route?.layout).toBe("blog");
  });
});
