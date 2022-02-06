import logger from "./logger"
import * as errors from "./errors"

export const tokens = {
  // keywords
  defaults: "defaults",
  exercise: "exercise",
  template: "template",
  schedule: "schedule",
  if: "if",
  else: "else",
  for: "for",
  in: "in",
  end: "end",

  // binary operators
  assign: "=",
  plus: "+",
  minus: "-",
  divide: "/",
  multiply: "*",
  modulo: "%",

  // punctuation
  fullstop: ".",
  comma: ",",
  lparen: "(",
  rparen: ")",
  lsqbrace: "[",
  rsqbrace: "]",
  lcbrace: "{",
  rcbrace: "}",

  // binary expressions
  eq: "==",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
  not: "not",
}

export function* generator(prog: string) {
  const lines = prog.split(/[\f\r\n\v]/)
  for (let line = 1; line <= lines.length; line++) {
    let token = ""
    for (let col = 1; col <= lines[line - 1].length; col++) {
      const char = lines[line - 1][col - 1]
      if (/\S/.test(char)) {
        token += char
        continue
      }
      logger.trace({ token, col }, "yielding next token")
      if (!Object.values(tokens).includes(token)) {
        throw new errors.UnrecognizedTokenError(`(line ${line}, col ${col - token.length}): unexpected token "${token}"`)
      }
      yield { line, col, token: token }
      token = ""
    }
  }
  return null
}
