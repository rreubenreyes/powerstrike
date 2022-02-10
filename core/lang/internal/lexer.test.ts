/* global expect, describe, it */
import * as lexer from "./lexer"
import * as errors from "./util/errors"

describe.only("lexing", () => {
  // TODO(TDD): broke this, expect to fix once lexer is implemented
  it("accepts an empty program", () => {
    const prog = ``
    const gen = lexer.generator(prog)
    const tokens = []
    for (const token of gen) {
      tokens.push(token)
    }
    expect(tokens).toEqual([])
  })

  it("recognizes a string", () => {
    const prog = `"hello"`
    const gen = lexer.generator(prog)
    const tokens = []
    for (const token of gen) {
      tokens.push(token)
    }
    expect(tokens).toEqual([
      {
        kind: "literal",
        subkind: "string",
        value: "hello",
      }
    ])
  })

  it("recognizes a single digit integer", () => {
    const prog = `2`
    const gen = lexer.generator(prog)
    const tokens = []
    for (const token of gen) {
      tokens.push(token)
    }
    expect(tokens).toEqual([
      {
        kind: "literal",
        subkind: "number",
        value: "2",
      }
    ])
  })

  it("recognizes a multi-digit integer", () => {
    const prog = `123`
    const gen = lexer.generator(prog)
    const tokens = []
    for (const token of gen) {
      tokens.push(token)
    }
    expect(tokens).toEqual([
      {
        kind: "literal",
        subkind: "number",
        value: "123",
      }
    ])
  })

  it("recognizes a float", () => {
    const prog = `1.23`
    const gen = lexer.generator(prog)
    const tokens = []
    for (const token of gen) {
      tokens.push(token)
    }
    expect(tokens).toEqual([
      {
        kind: "literal",
        subkind: "number",
        value: "1.23",
      }
    ])
  })

  it("recognizes and throws on an invalid float", () => {
    const prog = `1.2.3`
    const gen = lexer.generator(prog)
    const tokens = []
    expect (() => {
      for (const token of gen) {
        tokens.push(token)
      }
    }).toThrow(new errors.InvalidTokenError("(line 1, col 3): invalid token"))
  })
})
