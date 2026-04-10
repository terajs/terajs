import { describe, it, expect } from "vitest";
import { parseSFC } from "@terajs/sfc";

describe("SFC <ai> block", () => {
  it("parses simple AI metadata", () => {
    const sfc = parseSFC(
      `
      <template>Hello</template>
      <ai>
        summary: This is a test
        keywords: test, terajs
      </ai>
      `,
      "/components/AiTest.tera"
    );

    expect(sfc.ai?.summary).toBe("This is a test");
    expect(sfc.ai?.keywords).toEqual(["test", "terajs"]);
  });

  it("handles empty <ai> block", () => {
    const sfc = parseSFC(
      `
      <template>Hello</template>
      <ai></ai>
      `,
      "/components/EmptyAi.tera"
    );

    expect(sfc.ai?.summary).toBeUndefined();
    expect(sfc.ai?.keywords).toBeUndefined();
  });
});

