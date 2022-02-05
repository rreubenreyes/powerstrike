/* global expect, describe, test */
import * as ast from "./ast"
import * as parser from "./parser"
import * as typedef from "./typedef"

describe("parsing", () => {
  test("empty program", () => {
    const prog = ``
    const result = parser.parse(prog)
    expect(result).toEqual(new ast.RootNode())
  })

  test.only("minimum viable program", () => {
    const prog = `
      schedule {}
    `
    const result = parser.parse(prog)
    expect(result).toBe({
      schedule: {
        period: typedef.Time.Any,
        blocks: []
      }
    })
  })
})
