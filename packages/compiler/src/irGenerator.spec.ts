import { describe, it, expect } from "vitest"
import { parseSFC } from "@nebula/sfc"
import { generateIRModule } from "./irGenerator"
import type { IRModule } from "./irTypes"

describe("IRModule Generator", () => {
  it("generates a minimal IRModule", () => {
    const sfc = parseSFC(
      `<template>Hello</template>`,
      "/pages/index.nbl"
    )

    const ir = generateIRModule(sfc)

    const expected: IRModule = {
      filePath: "/pages/index.nbl",
      meta: {},
      route: null,
      template: [
        { type: "text", value: "Hello", flags: {}, loc: undefined }
      ]
    }

    expect(ir).toEqual(expected)
  })

  it("includes meta from <meta> block", () => {
    const sfc = parseSFC(
      `<template></template>
       <meta>
         title: Home
         description: Welcome
       </meta>`,
      "/pages/home.nbl"
    )

    const ir = generateIRModule(sfc)

    expect(ir.meta.title).toBe("Home")
    expect(ir.meta.description).toBe("Welcome")
  })

  it("includes route overrides from <route> block", () => {
    const sfc = parseSFC(
      `<template></template>
       <route>
         layout: admin
         hydrate: visible
       </route>`,
      "/pages/admin.nbl"
    )

    const ir = generateIRModule(sfc)

    expect(ir.route?.layout).toBe("admin")
    expect(ir.route?.hydrate).toBe("visible")
  })

  it("normalizes template AST into IRNodes", () => {
    const sfc = parseSFC(
      `<template><div>{{ msg }}</div></template>`,
      "/pages/test.nbl"
    )

    const ir = generateIRModule(sfc)

    expect(ir.template[0]).toMatchObject({
      type: "element",
      tag: "div",
      children: [
        { type: "interp", expression: "msg" }
      ]
    })
  })
})
