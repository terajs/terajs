import { describe, it, expect } from "vitest";
import type { IRModule } from "@terajs/compiler";
import { renderToStream } from "./renderToStream";

function mockIR(template: any[], meta: any = {}, route: any = null): IRModule {
  return {
    filePath: "/pages/index.nbl",
    template,
    meta,
    route
  };
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    result += decoder.decode(chunk.value);
  }

  return result;
}

describe("renderToStream", () => {
  it("streams a plain text body plus hydration marker", async () => {
    const ir = mockIR([{ type: "text", value: "Hello" }]);
    const stream = await renderToStream(ir);
    const html = await readStream(stream);

    expect(html).toContain("Hello");
    expect(html).toContain('<script type="application/terajs-hydration">{"mode":"eager"}</script>');
  });

  it("renders a suspense boundary with fallback and later content markers", async () => {
    const ir = mockIR([
      {
        type: "element",
        tag: "Suspense",
        props: [],
        children: [
          {
            type: "element",
            tag: "div",
            props: [],
            children: [{ type: "text", value: "Loaded" }]
          },
          {
            type: "slot",
            name: "fallback",
            fallback: [{ type: "text", value: "Loading..." }]
          }
        ]
      }
    ], {}, null);
    ir.hasAsyncResource = true;

    const stream = await renderToStream(ir);
    const html = await readStream(stream);

    expect(html).toContain("Loading...");
    expect(html).toContain("Loaded");
    expect(html).toContain("$teraSwap(");
    expect(html).toContain("<template id=\"terajs-suspense-template-");
  });

  it("injects serialized resource payloads into swap chunks", async () => {
    const ir = mockIR([
      {
        type: "element",
        tag: "Suspense",
        props: [],
        children: [
          {
            type: "element",
            tag: "div",
            props: [],
            children: [{ type: "text", value: "Loaded" }]
          },
          {
            type: "slot",
            name: "fallback",
            fallback: [{ type: "text", value: "Loading..." }]
          }
        ]
      }
    ]);
    ir.hasAsyncResource = true;

    const stream = await renderToStream(ir, {
      data: {
        user: {
          status: "success",
          data: { id: 1 }
        }
      }
    });
    const html = await readStream(stream);

    expect(html).toContain("window.__TERAJS_DATA__");
    expect(html).toContain('"user":{"status":"success","data":{"id":1}}');
  });
});
