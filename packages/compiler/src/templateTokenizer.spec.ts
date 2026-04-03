import { describe, it, expect } from "vitest"
import { tokenizeTemplate } from "./templateTokenizer"

describe("templateTokenizer", () => {
  it("tokenizes plain text", () => {
    const tokens = tokenizeTemplate("hello world")

    expect(tokens).toEqual([
      {
        type: "text",
        value: "hello world",
        start: 0,
        end: 11
      }
    ])
  })

  it("tokenizes a simple element", () => {
    const tokens = tokenizeTemplate("<div></div>")

    expect(tokens).toEqual([
      {
        type: "tagOpen",
        value: "div",
        start: 0,
        end: 4
      },
      {
        type: "tagClose",
        value: "div",
        start: 5,
        end: 10
      }
    ])
  })

  it("tokenizes attributes", () => {
    const tokens = tokenizeTemplate(`<input type="text" disabled />`)

    expect(tokens).toEqual([
      {
        type: "tagOpen",
        value: "input",
        start: 0,
        end: 6
      },
      {
        type: "attrName",
        value: "type",
        start: 7,
        end: 11
      },
      {
        type: "attrValue",
        value: "text",
        start: 13,
        end: 18
      },
      {
        type: "attrName",
        value: "disabled",
        start: 19,
        end: 27
      },
      {
        type: "tagSelfClose",
        value: "/>",
        start: 28,
        end: 30
      }
    ])
  })

  it("tokenizes interpolations", () => {
    const tokens = tokenizeTemplate("Hello {{ name }}!")

    expect(tokens).toEqual([
      {
        type: "text",
        value: "Hello ",
        start: 0,
        end: 6
      },
      {
        type: "interp",
        value: " name ",
        start: 6,
        end: 16
      },
      {
        type: "text",
        value: "!",
        start: 16,
        end: 17
      }
    ])
  })

  it("tokenizes nested elements", () => {
    const tokens = tokenizeTemplate("<div><span>hi</span></div>")

    expect(tokens).toEqual([
      {
        type: "tagOpen",
        value: "div",
        start: 0,
        end: 4
      },
      {
        type: "tagOpen",
        value: "span",
        start: 5,
        end: 10
      },
      {
        type: "text",
        value: "hi",
        start: 11,
        end: 13
      },
      {
        type: "tagClose",
        value: "span",
        start: 13,
        end: 19
      },
      {
        type: "tagClose",
        value: "div",
        start: 20,
        end: 25
      }
    ])
  })

  it("tokenizes directives as attrName + attrValue", () => {
    const tokens = tokenizeTemplate(
      `<div :if="show" :for="item in list"></div>`
    )

    expect(tokens).toEqual([
      {
        type: "tagOpen",
        value: "div",
        start: 0,
        end: 4
      },
      {
        type: "attrName",
        value: ":if",
        start: 5,
        end: 8
      },
      {
        type: "attrValue",
        value: "show",
        start: 10,
        end: 15
      },
      {
        type: "attrName",
        value: ":for",
        start: 16,
        end: 20
      },
      {
        type: "attrValue",
        value: "item in list",
        start: 22,
        end: 35
      },
      {
        type: "tagClose",
        value: "div",
        start: 36,
        end: 41
      }
    ])
  })

  it("tokenizes comments", () => {
    const tokens = tokenizeTemplate("Hello <!-- test --> world")

    expect(tokens).toEqual([
      {
        type: "text",
        value: "Hello ",
        start: 0,
        end: 6
      },
      {
        type: "comment",
        value: " test ",
        start: 6,
        end: 19
      },
      {
        type: "text",
        value: " world",
        start: 19,
        end: 25
      }
    ])
  })
})
