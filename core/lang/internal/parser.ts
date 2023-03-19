import yaml from "js-yaml"

import * as errors from "./errors"
import * as program from "./program"
import * as yamlUtils from "./yaml"
import * as reflect from "./util/reflect"

function parseDefaults(record: unknown): program.Defaults {
  const dd = program.defaultDefaults()

  if (record === undefined) {
    return dd
  }

  if (!reflect.isRecord(record)) {
    throw new errors.SyntaxError("invalid defaults - expected map")
  }

  if (typeof record.units === "string") {
    if (!["kilograms", "pounds"].includes(record.units)) {
      throw new errors.SyntaxError("invalid defaults:units - expected one of [\"kilograms\", \"pounds\"]")
    }
    dd.units = record.units
  }

  if (reflect.isRecord(record.exercises)) {
    const exercises = dd.exercises

    if (Array.isArray(record.exercises.properties)) {
      if (record.exercises.properties.some(p => typeof p !== "string")) {
        throw new errors.SyntaxError("invalid defaults:exercises:properties - expected string")
      }
      exercises.properties = record.exercises.properties
    }

    dd.exercises = exercises
  }

  if (reflect.isRecord(record.shorthand)) {
    const shorthand = dd.shorthand

    if (typeof record.shorthand.enabled !== "boolean") {
      throw new errors.SyntaxError("invalid defaults:shorthand:enabled - expected bool")
    }
    shorthand.enabled = record.shorthand.enabled

    if (typeof record.shorthand.sets_before_reps !== "boolean") {
      throw new errors.SyntaxError("invalid defaults:shorthand:sets_before_reps - expected bool")
    }
    shorthand.setsBeforeReps = record.shorthand.sets_before_reps

    dd.shorthand = shorthand
  }

  return dd
}

export function parse(input: string) {
  const p = yaml.load(input, { schema: yamlUtils.schema })

  if (!reflect.isRecord(p)) {
    throw new errors.InvalidProgramError("invalid program input")
  }

  const defaults = parseDefaults(p.defaults)
}
