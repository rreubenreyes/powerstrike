import * as tokens from "./tokens"

export const contexts = {
  default: 'default',
  defaultContextAssign: 'defualtContextAssign',
  multiAssign: 'multiAssign',
  namedStruct: 'namedStruct',
}

export const rules = {
  expressionStart: {
    allows: (token: string, context = contexts.default) => {
      return [
        tokens.keywords.defaults,
        tokens.keywords.exercise,
        tokens.keywords.template,
        tokens.keywords.schedule,
      ].includes(token)
    },
    next: (token: string, context = contexts.default) => {
      switch (token) {
        case tokens.keywords.defaults:
          return [
            { context: contexts.defaultContextAssign, rule: rules.structStart },
          ]
        case tokens.keywords.exercise:
          return [
            { context: contexts.default, rule: rules.identifier },
            { context: contexts.multiAssign, rule: rules.identifier },
          ]
        case tokens.keywords.template:
          return [
            { context: contexts.namedStruct, rule: rules.identifier },
          ]
        case tokens.keywords.schedule:
          return [
            { context: contexts.anonymousStruct, rule: rules.structStart },
          ]
        default:
          return null
      }
    },
  },

  structStart: {
    allows: (token: string, context = contexts.default) => {
      switch (context) {
        case contexts.default: // fallthrough
        case contexts.defaultContextAssign:
          return token === tokens.punctuation.lcbrace
        case contexts.namedStruct:
          return tokens.variableNameExpr.test(token)
        default:
          return null
      }
    },
    next: (token: string, context = contexts.default) => {
      switch (context) {
        case contexts.default:
          return [
            { context: contexts.anonymousStruct, rule: rules.identifier },
          ]
        ]
        case contexts.defaultContextAssign:
          return []
        case contexts.namedStruct:
          return []
        default:
          return null
      }
    }

  }
}
