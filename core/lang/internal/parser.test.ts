/* global expect, describe, test */
import * as ast from "./ast"
import * as parser from "./parser"

describe("parsing", () => {
  test("empty program", () => {
    const prog = ``
    const result = parser.parse(prog)
    expect(result).toEqual(new ast.RootNode())
  })

  test("minimum viable program", () => {
    const prog = `
      schedule {}
    `
    const resultAST = parser.parse(prog)
    for (const child of resultAST.getChildren()) {
      expect(child).toBeInstanceOf(ast.AnonymousStructNode)
    }
  })
})
