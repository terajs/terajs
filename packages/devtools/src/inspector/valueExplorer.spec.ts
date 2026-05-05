import { describe, expect, it } from "vitest";
import { renderValueExplorer } from "./valueExplorer.js";

describe("valueExplorer", () => {
  it("renders structured values as a collapsible tree", () => {
    const markup = renderValueExplorer({
      title: "Docs",
      params: {
        slug: "intro"
      },
      draft: true,
      count: 2
    }, "meta-panel.route", new Set(["meta-panel.route/params"]));

    expect(markup).toContain("structured-value-viewer");
    expect(markup).toContain("value-node-toggle");
    expect(markup).toContain('data-action="toggle-value-node"');
    expect(markup).toContain('data-value-path="meta-panel.route/params"');
    expect(markup).toContain("value-leaf");
    expect(markup).toContain("json-key");
    expect(markup).toContain("json-string");
    expect(markup).toContain("json-boolean");
    expect(markup).toContain("json-number");
    expect(markup).toContain("&quot;title&quot;");
    expect(markup).toContain("&quot;slug&quot;");
  });

  it("renders long string values as block previews", () => {
    const markup = renderValueExplorer({
      component: "function ComponentWrapper(props) {\n  return props.children;\n}\nconst value = props.value;"
    }, "logs.event", new Set<string>());

    expect(markup).toContain("value-leaf--block");
    expect(markup).toContain("value-preview-block");
    expect(markup).toMatch(/String \d+ chars \| 4 lines/);
    expect(markup).toContain("function ComponentWrapper(props)");
  });
});