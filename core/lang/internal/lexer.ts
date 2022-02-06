import logger from "./logger"

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
  whitespace: " ",

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
    for (let col = 0; col < lines[line - 1].length; col++) {
      const char = lines[line - 1][col]
      logger.trace({ token, col }, "yielding next token")
      if (!Object.values(tokens).includes(token)) {
        token += char
        continue
      }
      yield { line, col, token: token }
      token = ""
    }
  }
}
