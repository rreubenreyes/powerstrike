import * as tokens from "./tokens"

export const contexts = {
  default: "default",
  defaultContextAssign: "defualtContextAssign",
  multiAssign: "multiAssign",
  namedStruct: "namedStruct",
  anonymousStruct: "anonymousStruct",
}

export type Context = keyof typeof contexts

export function isContext(context: string): context is Context {
  return Object.values(contexts).includes(context)
}

interface Rule {
  name: string;
  allows: (token: string, context?: typeof contexts[keyof typeof contexts]) => boolean;
  next: (token: string, context?: typeof contexts[keyof typeof contexts]) => {
    context: string;
    rules: Rule[];
    endOfExpression: boolean;
  } | null;
}

// const regex = {
//   validIdentifier: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
// }

export const rules: { [index: string]: Rule } = {
  anyExpression: {
    name: "anyExpression",
    allows: (token) => {
      return [
        tokens.keywords.defaults,
        tokens.keywords.exercise,
        tokens.keywords.template,
        tokens.keywords.schedule,
      ].includes(token)
    },
    next: (token) => {
      switch (token) {
      case tokens.keywords.schedule:
        return {
          context: contexts.anonymousStruct,
          rules: [rules.structStart],
          endOfExpression: false,
        }
      default:
        return null
      }
    },
  },

  structStart: {
    name: "structStart",
    allows: (token, context = contexts.default) => {
      switch (context) {
      case contexts.anonymousStruct:
        return token === tokens.punctuation.lcbrace
      default:
        return false
      }
    },
    next: (token, context = contexts.default) => {
      switch (context) {
      case contexts.anonymousStruct:
        switch (token) {
        case tokens.punctuation.lcbrace:
          return {
            context: contexts.anonymousStruct,
            rules: [rules.identifier, rules.structEnd],
            endOfExpression: false,
          }
        }
      default:
        return null
      }
    }
  },

  structEnd: {
    name: "structEnd",
    allows: (token, context = contexts.default) => {
      switch (context) {
      case contexts.anonymousStruct:
        return token === tokens.punctuation.rcbrace
      default:
        return false
      }
    },
    next: (token, context = contexts.default) => {
      switch (context) {
      case contexts.anonymousStruct:
        switch (token) {
        case tokens.punctuation.rcbrace:
          return {
            context: contexts.anonymousStruct,
            rules: [rules.anyExpression],
            endOfExpression: true,
          }
        }
      default:
        return null
      }
    }
  },
}
