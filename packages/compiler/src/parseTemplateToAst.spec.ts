import { parseTemplateToAst } from "./parseTemplateToAst"
import { describe, it, expect } from "vitest"

describe("parseTemplateToAst", () => {
  it("parses plain text", () => {
    const ast = parseTemplateToAst("hello world")

    expect(ast).toEqual([
      {
        type: "text",
        value: "hello world"
      }
    ])
  })

  it("parses a simple element", () => {
    const ast = parseTemplateToAst("<div></div>")

    expect(ast).toEqual([
      {
        type: "element",
        tag: "div",
        props: [],
        children: []
      }
    ])
  })

  it("parses nested elements", () => {
    const ast = parseTemplateToAst("<div><span>hi</span></div>")

    expect(ast).toEqual([
      {
        type: "element",
        tag: "div",
        props: [],
        children: [
          {
            type: "element",
            tag: "span",
            props: [],
            children: [
              { type: "text", value: "hi" }
            ]
          }
        ]
      }
    ])
  })

  it("parses interpolations", () => {
    const ast = parseTemplateToAst("Hello {{ name }}!")

    expect(ast).toEqual([
      { type: "text", value: "Hello " },
      { type: "interp", expression: "name" },
      { type: "text", value: "!" }
    ])
  })

  it("parses static attributes", () => {
    const ast = parseTemplateToAst(`<input type="text" disabled />`)

    expect(ast).toEqual([
      {
        type: "element",
        tag: "input",
        props: [
          { name: "type", value: "text", kind: "static" },
          { name: "disabled", value: "", kind: "static" }
        ],
        children: []
      }
    ])
  })

  it("parses :bind attributes", () => {
    const ast = parseTemplateToAst(`<div :foo="bar"></div>`)

    expect(ast).toEqual([
      {
        type: "element",
        tag: "div",
        props: [
          { name: "foo", value: "bar", kind: "bind" }
        ],
        children: []
      }
    ])
  })

  it("parses @event attributes", () => {
    const ast = parseTemplateToAst(`<button @click="doThing"></button>`)

    expect(ast).toEqual([
      {
        type: "element",
        tag: "button",
        props: [
          { name: "click", value: "doThing", kind: "event" }
        ],
        children: []
      }
    ])
  })

  it("parses v-if into IfNode", () => {
    const ast = parseTemplateToAst(`<div v-if="ok">Yes</div>`)

    expect(ast).toEqual([
      {
        type: "if",
        condition: "ok",
        then: [
          { type: "text", value: "Yes" }
        ]
      }
    ])
  })

  it("parses v-if with else", () => {
    const ast = parseTemplateToAst(`<div v-if="ok">Yes</div><div v-else>No</div>`)

    expect(ast).toEqual([
      {
        type: "if",
        condition: "ok",
        then: [
          { type: "text", value: "Yes" }
        ],
        else: [
          { type: "text", value: "No" }
        ]
      }
    ])
  })

  it("parses v-if with else-if", () => {
    const ast = parseTemplateToAst(`<div v-if="ok">Yes</div><div v-else-if="maybe">Maybe</div><div v-else>No</div>`)

    expect(ast).toEqual([
      {
        type: "if",
        condition: "ok",
        then: [
          { type: "text", value: "Yes" }
        ],
        else: [
          {
            type: "if",
            condition: "maybe",
            then: [
              { type: "text", value: "Maybe" }
            ],
            else: [
              { type: "text", value: "No" }
            ]
          }
        ]
      }
    ])
  })

  it("throws on v-else with missing v-if condition", () => {
    expect(() => parseTemplateToAst(`<div v-else>No</div>`)).toThrowError("v-else used without a preceding v-if");
  })

  it("parses v-for into ForNode", () => {
    const ast = parseTemplateToAst(`<li v-for="item in items">{{ item }}</li>`)

    expect(ast).toEqual([
      {
        type: "for",
        each: "items",
        item: "item",
        index: undefined,
        body: [
          { type: "interp", expression: "item" }
        ]
      }
    ])
  })

  it("parses v-for with index", () => {
    const ast = parseTemplateToAst(`<li v-for="(item, i) in items">{{ i }} - {{ item }}</li>`)

    expect(ast).toEqual([
      {
        type: "for",
        each: "items",
        item: "item",
        index: "i",
        body: [
          { type: "interp", expression: "i" },
          { type: "text", value: " - " },
          { type: "interp", expression: "item" }
        ]
      }
    ])
  })

  it("parses slot outlets with fallback content", () => {
    const ast = parseTemplateToAst(`<slot name="header">Fallback</slot>`)

    expect(ast).toEqual([
      {
        type: "slot",
        name: "header",
        fallback: [
          { type: "text", value: "Fallback" }
        ]
      }
    ])
  })

  it("parses Portal primitives into portal nodes", () => {
    const ast = parseTemplateToAst(`<Portal to="#overlay"><div>Hi</div></Portal>`)

    expect(ast).toEqual([
      {
        type: "portal",
        target: { name: "to", value: "#overlay", kind: "static" },
        children: [
          {
            type: "element",
            tag: "div",
            props: [],
            children: [
              { type: "text", value: "Hi" }
            ]
          }
        ]
      }
    ])
  })
})
