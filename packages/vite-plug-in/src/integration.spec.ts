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

    expect(compiled).toContain('const name = signal("Terajs");');
    expect(compiled).not.toContain("setup");
  });
});
