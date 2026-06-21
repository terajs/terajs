import { describe, expect, it } from "vitest";

import { rewriteScopedCss } from "./rewriteScopedCss.js";

describe("rewriteScopedCss", () => {
  it("scopes plain selector lists", () => {
    expect(rewriteScopedCss(".title, main .card { color: red; }", "tera-test")).toBe(
      ".title[data-tera-test], main .card[data-tera-test] { color: red; }"
    );
  });

  it("keeps media queries intact while scoping nested selectors", () => {
    const css = [
      ".title { font-size: 32px; }",
      "@media (max-width: 760px) {",
      "  .title { font-size: 24px; }",
      "  .grid, main .table { display: block; }",
      "}"
    ].join("\n");

    const scoped = rewriteScopedCss(css, "tera-media");

    expect(scoped).toContain("@media (max-width: 760px) {");
    expect(scoped).not.toContain("@media (max-width: 760px)[data-tera-media]");
    expect(scoped).toContain(".title[data-tera-media] { font-size: 24px; }");
    expect(scoped).toContain(".grid[data-tera-media], main .table[data-tera-media] { display: block; }");
  });

  it("does not scope keyframe steps inside animation rules", () => {
    const css = [
      "@keyframes fade {",
      "  from { opacity: 0; }",
      "  to { opacity: 1; }",
      "}",
      ".box { animation: fade 1s; }"
    ].join("\n");

    const scoped = rewriteScopedCss(css, "tera-motion");

    expect(scoped).toContain("@keyframes fade {");
    expect(scoped).toContain("from { opacity: 0; }");
    expect(scoped).toContain("to { opacity: 1; }");
    expect(scoped).not.toContain("from[data-tera-motion]");
    expect(scoped).toContain(".box[data-tera-motion] { animation: fade 1s; }");
  });
});
