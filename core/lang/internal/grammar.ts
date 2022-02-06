import * as lexer from "./lexer"

export interface Rule {
  name: string;
  allows: (token: string) => boolean;
  next: (token: string) => Rule[] | null;
}

export const rules: { [index: string]: Rule } = {
  anyExpression: {
    name: "anyExpression",
    allows: (token) => {
      return [
        lexer.tokens.defaults,
        lexer.tokens.exercise,
        lexer.tokens.template,
        lexer.tokens.schedule,
      ].includes(token)
    },
    next: (token) => {
      switch (token) {
      case lexer.tokens.schedule:
        return [rules.structStart]
      default:
        return null
      }
    },
  },

  structStart: {
    name: "test",
    allows: (token) => {
      return token === lexer.tokens.lcbrace
    },
    next: (token) => {
      switch (token) {
      case lexer.tokens.lcbrace:
        return [rules.identifier, rules.structEnd]
      default:
        return null
      }
    }
  },

  structEnd: {
    name: "structEnd",
    allows: (token) => {
      return token === lexer.tokens.rcbrace
    },
    next: (token) => {
      switch (token) {
      case lexer.tokens.rcbrace:
        return [rules.anyExpression]
      default:
        return null
      }
    }
  },
}
