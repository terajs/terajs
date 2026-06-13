import { describe, it, expect } from "vitest";
import { parseSFC } from "@terajs/sfc";
import { compileSfcToComponent } from "./compileSfcToComponent";

describe("compileSFC integration", () => {
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
