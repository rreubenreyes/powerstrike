import _ from "lodash"

import * as ast from "./ast"
import * as typedef from "./typedef"
import * as tokens from "./tokens"
import * as grammar from "./grammar"
import * as stdlib from "./stdlib"
import * as errors from "./errors"
import logger from "./logger"

interface GlobalNamespace {
  [key: string]: unknown;
  defaults: {
    exercise: {
      unit: typeof stdlib.Units.Kilogram[keyof typeof stdlib.Units.Kilogram];
    };
  };
}

const globalNamespace: GlobalNamespace = {
  defaults: {
    exercise: {
      unit: stdlib.Units.Kilogram,
    }
  }
}

function setGlobalNamespace(path: string, value: unknown): void {
  if (!_.has(globalNamespace, path)) {
    throw new errors.InvalidContextPathError(`invalid context path ${path}`)
  }
  _.set(globalNamespace, path, value)
}

export function getGlobalNamespace(): GlobalNamespace {
  return globalNamespace
}

function createContextStack() {
  const stack: grammar.Context[] = []
  return {
    push: (context: string): void => {
      if (!grammar.isContext(context)) {
        throw new errors.ImplementationError(`internal: invalid context ${context}`)
      }
      stack.push(context)
    },
    pop: (): grammar.Context | undefined => {
      return stack.pop()
    },
    isEmpty: (): boolean => {
      return stack.length === 0
    },
  }
}

export function createSchedule(opts: Partial<typedef.Schedule>): typedef.Schedule {
  const {
    period = stdlib.Time.Any,
      blocks = []
  } = opts

  return { period, blocks }
}

function* progTokenGenerator(prog: string) {
  const lines = prog.split(/[\f\r\n\v]/)
  for (let line = 1; line <= lines.length; line++) {
    let curToken = ""
    for (let col = 1; col <= lines[line - 1].length; col++) {
      const char = lines[line - 1][col - 1]
      if (/\S/.test(char)) {
        logger.trace({ curToken, char, col }, "still in token")
        curToken += char
        continue
      }
      logger.trace({ curToken, col }, "yielding next token")
      yield { line, col, token: curToken }
      curToken = ""
    }
  }
  return null
}

export function parse(input: string) {
  const prog = input.trim()
  const context = createContextStack()
  logger.trace({ prog }, "trimmed input")

  context.push(grammar.contexts.default)
  const progTokens = progTokenGenerator(prog)
  let allowedRules = [grammar.rules.anyExpression]
  let node = new ast.RootNode()
  for (const { line, col, token } of progTokens) {
    logger.trace({ token }, "received token")
    for (const rule of allowedRules) {
      // evaluate if current rule allows the current token
      if (!rule.allows(String(token))) {
        logger.trace({ rule, token }, "rule does not allow token; evaluating next")
        continue
      }

      // handle token
      logger.trace({ rule, token }, "rule allows token")
      const currentContext = context.pop()
      if (currentContext === grammar.contexts.default) {
        if (rule === grammar.rules.structStart) {
          if (token === tokens.keywords.schedule) {
            const next = rule.next(token, currentContext)
            if (!next) {
              throw new errors.UnexpectedTokenError(`(line ${line}, col ${col - token.length}): unexpected token "${token}"`)
            }

            const nextNode = new ast.AnonymousStructNode(token, node)
            const { context: nextContext, rules: nextRules } = next
            node = nextNode
            allowedRules = nextRules
            context.push(nextContext)
          }
        }
      }
    }

    // if loop is not broken, parser cannot handle this token at this state
    throw new errors.UnexpectedTokenError(`(line ${line}, col ${col - token.length}): unexpected token "${token}"`)
  }

  // evaluate EOF case
  if (progTokens === null) {
    if (!context.isEmpty()) {
      logger.trace("encountered unexpected EOF")
      throw new errors.UnexpectedEOF("unexpected EOF")
    }
  }

  logger.trace("encountered valid EOF")
  return node
}
