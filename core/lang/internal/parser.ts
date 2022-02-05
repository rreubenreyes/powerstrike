import _ from "lodash"

import * as typedef from "./typedef"
import * as grammar from "./grammar"
import * as stdlib from "./stdlib"
import * as errors from "./errors"
import logger from "./logger"

interface GlobalContext {
  [key: string]: unknown;
  defaults: {
    exercise: {
      unit: typeof stdlib.Units.Kilogram[keyof typeof stdlib.Units.Kilogram];
    };
  };
}

const globalContext: GlobalContext = {
  defaults: {
    exercise: {
      unit: stdlib.Units.Kilogram,
    }
  }
}

function setGlobalContext(path: string, value: unknown): void {
  if (!_.has(globalContext, path)) {
    throw new errors.InvalidContextPathError(`invalid context path ${path}`)
  }
  _.set(globalContext, path, value)
}

export function getGlobalContext(): GlobalContext {
  return globalContext
}

export function createSchedule(opts: Partial<typedef.Schedule>): typedef.Schedule {
  const {
    period = stdlib.Time.Any,
    blocks = []
  } = opts

  return { period, blocks }
}

export function parse(input: string) {
  const prog = input.trim()
  logger.trace({ prog }, "trimmed input")

  const rule = grammar.rules.expressionStart()
  for (const token of prog.split(/\s/)) {
    if (!rule.allows(token)) {
      throw new errors.UnexpectedTokenError(`unexpected token ${token}`)
    }
    logger.trace({ token }, "token is allowed")
  }
}
