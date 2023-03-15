import yaml from "js-yaml"

import * as errors from "./errors"
import * as program from "./program"
import * as yamlUtils from "./yaml"
import * as reflect from "./util/reflect"

function parseDefaults(defaults: unknown): program.Defaults {
  const dd = program.defaultDefaults()

  if (!defaults) {
    return dd
  }

  if (!reflect.isRecord(defaults)) {
    throw new errors.SyntaxError("invalid defaults")
  }

  if (typeof defaults.units === "string") {
    if (!["kilograms", "pounds"].includes(defaults.units)) {
      throw new errors.SyntaxError("invalid defaults:units")
    }
    dd.units = defaults.units
  }

  if (reflect.isRecord(defaults.exercises)) {
    const exercises = dd.exercises
    if (Array.isArray(defaults.exercises.properties)) {
      if (defaults.exercises.properties.some(p => typeof p !== "string")) {
        throw new errors.SyntaxError("invalid defaults:exercises:properties")
      }
      exercises.properties = defaults.exercises.properties
    }

    dd.exercises = exercises

    if (reflect.isRecord(defaults.shorthand)) {
      const shorthand = dd.shorthand
      if (typeof defaults.shorthand.enabled !== "boolean") {
        throw new errors.SyntaxError("invalid defaults:shorthand:enabled")
      }
      shorthand.enabled = defaults.shorthand.enabled

      if (typeof defaults.shorthand.sets_before_reps !== "boolean") {
        throw new errors.SyntaxError("invalid defaults:shorthand:sets_before_reps")
      }
      shorthand.setsBeforeReps = defaults.shorthand.sets_before_reps

      if (typeof defaults.shorthand.reps_before_sets !== "boolean") {
        throw new errors.SyntaxError("invalid defaults:shorthand:reps_before_sets")
      }
      shorthand.repsBeforeSets = defaults.shorthand.reps_before_sets
    }
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
