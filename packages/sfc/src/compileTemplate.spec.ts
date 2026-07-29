import { describe, it, expect } from "vitest";
import type { ParsedSFC } from "@terajs/sfc";
import { compileTemplateFromSFC } from "./compileTemplate";

describe("compileTemplateFromSFC", () => {
  it("produces an IRModule with template and meta/route/ai", () => {
    const sfc: ParsedSFC = {
      filePath: "/pages/test.tera",
      template: `<div>{{ msg }}</div>`,
      script: ``,
      style: null,
      meta: { title: "Test" },
      ai: { intent: "test" },
      routeOverride: { layout: "blog" }
    };

    const ir = compileTemplateFromSFC(sfc);

    expect(ir.filePath).toBe("/pages/test.tera");
    expect(ir.template.length).toBeGreaterThan(0);
    expect(ir.meta.title).toBe("Test");
    expect(ir.ai?.intent).toBe("test");
    expect(ir.route?.layout).toBe("blog");
  });

  it("preserves mutually exclusive v-if branches on self-closing components", () => {
    const sfc: ParsedSFC = {
      filePath: "/components/WorkspaceActionPane.tera",
      template: `
        <SourceRecordPreviewDialog
          v-if="presentation.get().footerButton.previewKind === 'data-card'"
        />
        <SourceRecordComparisonModal
          v-if="presentation.get().footerButton.previewKind !== 'data-card'"
        />
      `,
      script: "",
      style: null,
      meta: {},
      routeOverride: {}
    };

    const ir = compileTemplateFromSFC(sfc);
    const structuralNodes = ir.template.filter((node) =>
      node.type !== "text" || node.value.trim().length > 0
    );

    expect(structuralNodes).toMatchObject([
      {
        type: "if",
        condition: "presentation.get().footerButton.previewKind === 'data-card'",
        then: [{ type: "element", tag: "SourceRecordPreviewDialog" }]
      },
      {
        type: "if",
        condition: "presentation.get().footerButton.previewKind !== 'data-card'",
        then: [{ type: "element", tag: "SourceRecordComparisonModal" }]
      }
    ]);
  });

  it("preserves v-for on self-closing components for late-populated lists", () => {
    const sfc: ParsedSFC = {
      filePath: "/components/SourceRecordComparisonCard.tera",
      template: `
        <SourceRecordComparisonRow
          v-for="field in fields.get()"
          :key="field.label"
          :label="field.label"
          :value="field.value"
        />
      `,
      script: "",
      style: null,
      meta: {},
      routeOverride: {}
    };

    const ir = compileTemplateFromSFC(sfc);
    const structuralNodes = ir.template.filter((node) =>
      node.type !== "text" || node.value.trim().length > 0
    );

    expect(structuralNodes).toMatchObject([
      {
        type: "for",
        each: "fields.get()",
        item: "field",
        body: [{
          type: "element",
          tag: "SourceRecordComparisonRow"
        }]
      }
    ]);
  });
});

