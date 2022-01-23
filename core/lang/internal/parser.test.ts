/* global jest, expect, describe, test */
import * as parser from "./parser"
import * as typedef from "./typedef"

describe("parsing", () => {
  test("minimum viable program", () => {
    const prog = `schedule {}`
    const result = parser.parse(prog)
    expect(result).toBe({
      period: typedef.Time.Any,
      blocks: []
    })
  })

  test("parses the minimum viable program", () => {
    const prog = `schedule {}`
    const result = parser.parse(prog)
    expect(result).toBe({
      period: typedef.Time.Any,
      blocks: []
    })
  })
})
