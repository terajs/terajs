import { describe, it, expect } from "vitest";
import { parseSFC } from "@terajs/sfc";
import { compileSfcToComponent } from "./compileSfcToComponent";

describe("compileSFC integration", () => {
  it("preserves scoped slot templates and child-provided values", () => {
    const code = `
      <template>
        <VirtualScroller :items="items.get()">
          <template #default="{ item, index }">
            <button @click="select(item.id, index)">
              {{ item.label }}
            </button>
          </template>
        </VirtualScroller>
      </template>
    `;

    const sfc = parseSFC(code, "/components/VirtualAccountList.tera");
    const compiled = compileSfcToComponent(sfc);
    const serializedIr = compiled.match(/export let ir = ([\s\S]*?);\n\nexport \{ __ssfc \};/)?.[1];
    const ir = JSON.parse(serializedIr ?? "null");
    const scroller = ir.template.find((node: any) =>
      node.type === "element" && node.tag === "VirtualScroller"
    );
    const structuralChildren = scroller.children.filter((node: any) =>
      node.type !== "text" || node.value.trim().length > 0
    );

    expect(structuralChildren).toMatchObject([{
      type: "slot-template",
      name: "default",
      bindings: [
        { prop: "item", local: "item" },
        { prop: "index", local: "index" }
      ],
      children: [
        { type: "text" },
        {
          type: "element",
          tag: "button",
          props: [{
            kind: "event",
            name: "click",
            value: "select(item.id, index)"
          }]
        },
        { type: "text" }
      ]
    }]);
  });

  it("preserves v-if on sibling self-closing child components", () => {
    const code = `
      <template>
        <SourceRecordPreviewDialog
          v-if="sourceRecordPresentation.get().showPreview"
          :record="sourceRecordPresentation.get().sourceRecord"
        />
        <SourceRecordComparisonModal
          v-if="sourceRecordPresentation.get().showComparison"
          :source-record="sourceRecordPresentation.get().sourceRecord"
          :target-record="sourceRecordPresentation.get().targetRecord"
        />
      </template>
    `;

    const sfc = parseSFC(code, "/tasks/MigrationBlockingIssueTask.tera");
    const compiled = compileSfcToComponent(sfc);
    const serializedIr = compiled.match(/export let ir = ([\s\S]*?);\n\nexport \{ __ssfc \};/)?.[1];
    const ir = JSON.parse(serializedIr ?? "null");

    expect(ir.template).toMatchObject([
      {
        type: "if",
        condition: "sourceRecordPresentation.get().showPreview",
        then: [
          {
            type: "element",
            tag: "SourceRecordPreviewDialog"
          }
        ]
      },
      {
        type: "text"
      },
      {
        type: "if",
        condition: "sourceRecordPresentation.get().showComparison",
        then: [
          {
            type: "element",
            tag: "SourceRecordComparisonModal"
          }
        ]
      }
    ]);
  });

  it("compiles a script block as an implicit setup function", () => {
    const code = `
      <script>
        const name = signal("Terajs");
      </script>
      <template>
        <div>Hello {{ name() }}</div>
      </template>
    `;

    const sfc = parseSFC(code, "test.tera");
    const compiled = compileSfcToComponent(sfc);

    expect(compiled).toContain('const name = signal("Terajs", { key: "name" });');
    expect(compiled).not.toContain("setup");
  });

  it("compiles scoped style blocks into registered browser module styles", () => {
    const code = `
      <template>
        <article class="card">Styled</article>
      </template>
      <style scoped>
        .card { color: red; }
      </style>
    `;

    const sfc = parseSFC(code, "/routes/styled.tera");
    const compiled = compileSfcToComponent(sfc);

    expect(compiled).toContain("registerStyle");
    expect(compiled).toContain("unregisterStyle");
    expect(compiled).toContain('const __terajsStyleId = "tera-style:/routes/styled.tera";');
    expect(compiled).toContain("[data-tera-");
    expect(compiled).toContain(".card");
    expect(compiled).toContain("color: red");
    expect(compiled).toContain("import.meta.hot.dispose");
  });
});
