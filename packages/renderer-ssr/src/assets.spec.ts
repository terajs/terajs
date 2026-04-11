import { renderToString } from "./renderToString";

describe("SSR Asset Injection", () => {
  it("should inject modulepreload and stylesheet links correctly", () => {
    const ir = {
      filePath: "/pages/index.tera",
      template: [],
      meta: {},
      ai: {},
      route: null
    } as any;

    const { head } = renderToString(ir, {
      assets: ["/main.js", "/style.css"]
    });

    expect(head).toContain('<link rel="modulepreload" href="/main.js">');
    expect(head).toContain('<link rel="stylesheet" href="/style.css">');
  });
});
