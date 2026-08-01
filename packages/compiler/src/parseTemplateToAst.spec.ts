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

  it("parses supported event modifiers separately from the event name", () => {
    const ast = parseTemplateToAst(`<a href="/next" @click.prevent.stop="go()">Go</a>`)

    expect(ast).toEqual([
      {
        type: "element",
        tag: "a",
        props: [
          { name: "href", value: "/next", kind: "static" },
          { name: "click", value: "go()", kind: "event", modifiers: ["prevent", "stop"] }
        ],
        children: [
          { type: "text", value: "Go" }
        ]
      }
    ])
  })

  it("throws for unsupported event modifiers", () => {
    expect(() => parseTemplateToAst(`<button @click.capture="go()"></button>`))
      .toThrowError('Unsupported event modifier ".capture" on "@click.capture". Supported modifiers: prevent, stop.')
  })

  it("parses v-if into IfNode", () => {
    const ast = parseTemplateToAst(`<div v-if="ok">Yes</div>`)

    expect(ast).toEqual([
      {
        type: "if",
        condition: "ok",
        then: [
          {
            type: "element",
            tag: "div",
            props: [],
            children: [
              { type: "text", value: "Yes" }
            ]
          }
        ]
      }
    ])
  })

  it("parses v-if on self-closing component tags into IfNode", () => {
    const ast = parseTemplateToAst(`<RouterView v-if="ready" />`)

    expect(ast).toEqual([
      {
        type: "if",
        condition: "ready",
        then: [
          {
            type: "element",
            tag: "RouterView",
            props: [],
            children: []
          }
        ]
      }
    ])
  })

  it("parses v-for on self-closing component tags into ForNode", () => {
    const ast = parseTemplateToAst(`<ItemCard v-for="item in items" :item="item" />`)

    expect(ast).toEqual([
      {
        type: "for",
        each: "items",
        item: "item",
        isStructural: true,
        index: undefined,
        body: [
          {
            type: "element",
            tag: "ItemCard",
            props: [
              { name: "item", value: "item", kind: "bind" }
            ],
            children: []
          }
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
          {
            type: "element",
            tag: "div",
            props: [],
            children: [
              { type: "text", value: "Yes" }
            ]
          }
        ],
        else: [
          {
            type: "element",
            tag: "div",
            props: [],
            children: [
              { type: "text", value: "No" }
            ]
          }
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
          {
            type: "element",
            tag: "div",
            props: [],
            children: [
              { type: "text", value: "Yes" }
            ]
          }
        ],
        else: [
          {
            type: "if",
            condition: "maybe",
            then: [
              {
                type: "element",
                tag: "div",
                props: [],
                children: [
                  { type: "text", value: "Maybe" }
                ]
              }
            ],
            else: [
              {
                type: "element",
                tag: "div",
                props: [],
                children: [
                  { type: "text", value: "No" }
                ]
              }
            ]
          }
        ]
      }
    ])
  })

  it("throws on v-else with missing v-if condition", () => {
    expect(() => parseTemplateToAst(`<div v-else>No</div>`)).toThrowError("v-else used without a preceding v-if");
  })

  it("parses v-for into ForNode and preserves element wrapper", () => {
    const ast = parseTemplateToAst(`<li v-for="item in items">{{ item }}</li>`)

    expect(ast).toEqual([
      {
        type: "for",
        each: "items",
        item: "item",
        isStructural: true,
        index: undefined,
        body: [
          {
            type: "element",
            tag: "li",
            props: [],
            children: [
              { type: "interp", expression: "item" }
            ]
          }
        ]
      }
    ])
  })

  it("parses v-for with index and preserves element wrapper", () => {
    const ast = parseTemplateToAst(`<li v-for="(item, i) in items">{{ i }} - {{ item }}</li>`)

    expect(ast).toEqual([
      {
        type: "for",
        each: "items",
        isStructural: true,
        item: "item",
        index: "i",
        body: [
          {
            type: "element",
            tag: "li",
            props: [],
            children: [
              { type: "interp", expression: "i" },
              { type: "text", value: " - " },
              { type: "interp", expression: "item" }
            ]
          }
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

  it("parses slot outlet props and scoped default slot templates", () => {
    const ast = parseTemplateToAst(`
      <VirtualScroller>
        <template #default="{ item, index: position }">
          <button @click="select(item, position)">{{ item.label }}</button>
        </template>
      </VirtualScroller>
    `)

    expect(ast).toMatchObject([
      { type: "text" },
      {
        type: "element",
        tag: "VirtualScroller",
        children: [
          { type: "text" },
          {
            type: "slot-template",
            name: "default",
            bindings: [
              { prop: "item", local: "item" },
              { prop: "index", local: "position" }
            ],
            children: [
              { type: "text" },
              {
                type: "element",
                tag: "button",
                props: [{ kind: "event", name: "click", value: "select(item, position)" }]
              },
              { type: "text" }
            ]
          },
          { type: "text" }
        ]
      },
      { type: "text" }
    ])
  })

  it("parses named scoped slots and child-provided outlet values", () => {
    const ast = parseTemplateToAst(`
      <template v-slot:header="{ title }"><h2>{{ title }}</h2></template>
      <slot name="header" :title="heading">Fallback</slot>
    `)

    expect(ast).toMatchObject([
      { type: "text" },
      {
        type: "slot-template",
        name: "header",
        bindings: [{ prop: "title", local: "title" }]
      },
      { type: "text" },
      {
        type: "slot",
        name: "header",
        props: [{ kind: "bind", name: "title", value: "heading" }],
        fallback: [{ type: "text", value: "Fallback" }]
      },
      { type: "text" }
    ])
  })

  it("rejects scoped slot declarations outside template elements", () => {
    expect(() => parseTemplateToAst(`<div #default="{ item }">{{ item }}</div>`))
      .toThrow("must be declared on a <template> element")
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
