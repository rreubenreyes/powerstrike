import * as typedef from "./typedef"
import * as stdlib from "./stdlib"
import * as errors from "./errors"

const globalContext = {
  defaults: {
    exercise: {
      unit: stdlib.Units.Kilogram,
    }
  }
}

function setGlobalContext(path: string, value: unknown): void {
  const parts = path.split('.')
  let cur = globalContext
  for (const part of parts) {
    if (cur[part] === undefined) {
      throw new errors.InvalidContextPathError(`invalid context path ${path}`)
    }
    cur = globalContext[part]
  }

  cur = value
}

function getGlobalContext() {
  return globalContext
}

export function parse(input: string): typedef.Schedule {
  // todo: implement
}
