import { describe, it, expect } from "vitest";
import { generateIRModule } from "./irGenerator";
import type { IRModule } from "./irTypes";
import type { ParsedSFC } from "./sfcTypes";

describe("IRModule Generator (integration)", () => {
  it("generates a minimal IRModule", () => {
    const sfc: ParsedSFC = {
      filePath: "/pages/index.tera",
      template: "Hello",
      script: "",
      style: null,
      meta: {},
      routeOverride: null
    };

    const ir = generateIRModule(sfc);

    const expected: IRModule = {
      filePath: "/pages/index.tera",
      meta: {},
      route: null,
      template: [
        { type: "text", value: "Hello", flags: { static: true }, loc: undefined }
      ]
    };

    expect(ir).toEqual(expected);
  });

  it("includes meta from <meta> block", () => {
    const sfc: ParsedSFC = {
      filePath: "/pages/home.tera",
      template: "",
      script: "",
      style: null,
      meta: {
        title: "Home",
        description: "Welcome"
      },
      routeOverride: null
    };

    const ir = generateIRModule(sfc);

    expect(ir.meta.title).toBe("Home");
    expect(ir.meta.description).toBe("Welcome");
  });

  it("includes route overrides from <route> block", () => {
    const sfc: ParsedSFC = {
      filePath: "/pages/admin.tera",
      template: "",
      script: "",
      style: null,
      meta: {},
      routeOverride: {
        layout: "admin",
        hydrate: "visible"
      }
    };

    const ir = generateIRModule(sfc);

    expect(ir.route?.layout).toBe("admin");
    expect(ir.route?.hydrate).toBe("visible");
  });

  it("normalizes template AST into IRNodes", () => {
    const sfc: ParsedSFC = {
      filePath: "/pages/test.tera",
      template: "<div>{{ msg }}</div>",
      script: "",
      style: null,
      meta: {},
      routeOverride: null
    };

    const ir = generateIRModule(sfc);

    expect(ir.template[0]).toMatchObject({
      type: "element",
      tag: "div",
      flags: {
        static: false
      },
      children: [
        {
          type: "interp",
          expression: "msg",
          binding: {
            kind: "simple-path",
            segments: ["msg"]
          }
        }
      ]
    });
  });

  it("adds simple-path hints to bound props", () => {
    const sfc: ParsedSFC = {
      filePath: "/pages/props.tera",
      template: `<div :title="user.name"></div>`,
      script: "",
      style: null,
      meta: {},
      routeOverride: null
    };

    const ir = generateIRModule(sfc);

    expect(ir.template[0]).toMatchObject({
      type: "element",
      props: [
        {
          kind: "bind",
          name: "title",
          value: "user.name",
          binding: {
            kind: "simple-path",
            segments: ["user", "name"]
          }
        }
      ]
    });
  });

  it("marks fully static element subtrees as static", () => {
    const sfc: ParsedSFC = {
      filePath: "/pages/static.tera",
      template: "<section><h1>Hello</h1><p>World</p></section>",
      script: "",
      style: null,
      meta: {},
      routeOverride: null
    };

    const ir = generateIRModule(sfc);

    expect(ir.template[0]).toMatchObject({
      type: "element",
      tag: "section",
      flags: {
        static: true
      }
    });
  });

  it("normalizes Portal nodes into portal IR", () => {
    const sfc: ParsedSFC = {
      filePath: "/pages/modal.tera",
      template: `<Portal :to="overlay"><div>{{ msg }}</div></Portal>`,
      script: "",
      style: null,
      meta: {},
      routeOverride: null
    };

    const ir = generateIRModule(sfc);

    expect(ir.template[0]).toMatchObject({
      type: "portal",
      target: { kind: "bind", name: "to", value: "overlay" },
      children: [
        {
          type: "element",
          tag: "div",
          children: [
            { type: "interp", expression: "msg" }
          ]
        }
      ]
    });
  });
});

