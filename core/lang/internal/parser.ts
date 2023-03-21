import yaml from "js-yaml"

import _logger from "./util/logger"
import * as errors from "./errors"
import * as program from "./program"
import * as reflect from "./util/reflect"
import * as yamlUtils from "./yaml"

let allowImplicitShorthand = true

function isStatementValue(value: unknown): value is program.Statement["value"] {
  return typeof value === "string" || typeof value === "number"
}

function parseStatement(value: unknown): program.Statement {
  const logger = _logger.child({ method: "#parseStatement" })

  if (typeof value === "string") {
    return {
      kind: "shorthand",
      value,
    }
  }
  if (typeof value === "number") {
    return {
      kind: "literal",
      value,
    }
  }

  const err = new errors.InvalidProgramError("invalid statement")
  logger.error({ err }, err.message)

  throw err
}

function parseDefaults(record: unknown): program.Defaults {
  const logger = _logger.child({ method: "#parseDefaults" })
  const dd = program.defaultDefaults()

  if (record === undefined) {
    return dd
  }

  if (!reflect.isRecord(record)) {
    const err = new errors.InvalidProgramError("invalid defaults - expected map")
    logger.error({ err }, err.message)

    throw err
  }

  if (typeof record.units === "string") {
    if (!["kilograms", "pounds"].includes(record.units)) {
      const err = new errors.InvalidProgramError("invalid defaults:units - expected one of [\"kilograms\", \"pounds\"]")
      logger.error({ err }, err.message)

      throw err
    }
    dd.units = record.units
  }

  if (reflect.isRecord(record.exercises)) {
    const exercises = dd.exercises

    if (Array.isArray(record.exercises.properties)) {
      if (record.exercises.properties.some(p => typeof p !== "string")) {
        const err = new errors.InvalidProgramError("invalid defaults:exercises:properties - expected string")
        logger.error({ err }, err.message)

        throw err
      }
      exercises.properties = record.exercises.properties
    }

    dd.exercises = exercises
  }

  if (reflect.isRecord(record.shorthand)) {
    const shorthand = dd.shorthand

    if (typeof record.shorthand.enabled !== "boolean") {
      const err = new errors.InvalidProgramError("invalid defaults:shorthand:enabled - expected bool")
      logger.error({ err }, err.message)

      throw err
    }
    shorthand.enabled = record.shorthand.enabled

    if (typeof record.shorthand.sets_before_reps !== "boolean") {
      const err = new errors.InvalidProgramError("invalid defaults:shorthand:sets_before_reps - expected bool")
      logger.error({ err }, err.message)

      throw err
    }
    shorthand.setsBeforeReps = record.shorthand.sets_before_reps

    dd.shorthand = shorthand
  }

  return dd
}

function parseDeclaredExercise(exercise: unknown): program.DeclaredExercise {
  const logger = _logger.child({ method: "#parseDeclaredExercise" })

  if (!reflect.isRecord(exercise)) {
    const err = new errors.InvalidProgramError("invalid exercises - expected list<map>")
    logger.error({ err }, err.message)

    throw err
  }

  const {
    name: exerciseName,
    alias: exerciseAlias,
    renders_as: exerciseRendersAs,
    ...exerciseProps
  } = exercise

  if (typeof exerciseName !== "string") {
    const err = new errors.InvalidProgramError("invalid exercises[]:name - expected string")
    logger.error({ err }, err.message)

    throw err
  }

  const alias = typeof exerciseRendersAs === "string"
    ? exerciseRendersAs
    : typeof exerciseAlias === "string" ? exerciseAlias : undefined

  const properties = Object.entries(exerciseProps).reduce<program.DeclaredExercise["properties"]>((obj, [k, v]) => {
    logger.trace({ k, v }, "parsing property")
    if (typeof v === "number") {
      obj[k] = {
        kind: "literal",
        value: v
      }

      return obj
    }

    const err = new errors.InvalidProgramError("invalid exercises[] - properties must be number")
    logger.error({ err }, err.message)

    throw err
  }, {})

  return {
    name: exerciseName,
    alias: alias || exerciseName,
    properties,
  }
}

function parseDeclaredExercises(arr: unknown = []) {
  const logger = _logger.child({ method: "#parseDeclaredExercises" })

  if (!Array.isArray(arr)) {
    const err = new errors.InvalidProgramError("invalid exercises - expected list")
    logger.error({ err }, err.message)

    throw err
  }

  return arr.map(parseDeclaredExercise)
}

function parseTemplatedExercise(input: unknown): program.TemplatedExercise {
  const logger = _logger.child({ method: "#parseTemplatedExercise" })

  logger.trace({ input }, "parsing templated exercise")
  if (!reflect.isRecord(input)) {
    const err = new errors.InvalidProgramError("invalid exercises - expected list<map>")
    logger.error({ err }, err.message)

    throw err
  }

  const [[name, definition]] = Object.entries(input)
  if (typeof name !== "string") {
    const err = new errors.InvalidProgramError("invalid exercises[] - expected list<map<string, map>>")
    logger.error({ err }, err.message)

    throw err
  }

  logger.trace({ exercise: { name, definition } }, "exercise is valid record")
  let exercise: program.TemplatedExercise
  if (reflect.isRecord(definition)) {
    // explicitly declared exercise
    if (isStatementValue(definition.weight)
        && isStatementValue(definition.sets)
        && isStatementValue(definition.reps)
        && (isStatementValue(definition.rpe) || typeof definition.rpe === "undefined")) {
      logger.trace({ input }, "exercise is explicitly declared")
      exercise = {
        kind: "explicit",
        name,
        definition: {
          weight: parseStatement(definition.weight),
          sets: parseStatement(definition.sets),
          reps: parseStatement(definition.reps),
          rpe: definition.rpe ? parseStatement(definition.rpe) : undefined,
        },
      }
    } else if (definition.kind === "shorthand" && typeof definition.value === "string") {
      logger.trace({ input }, "exercise is explicit shorthand statement")
      exercise = {
        kind: "shorthand",
        name,
        value: definition.value,
      }
    } else {
      const err = new errors.InvalidProgramError("invalid exercises[]")
      logger.error({ err }, err.message)

      throw err
    }
  } else if (typeof definition === "string" && allowImplicitShorthand) {
    logger.trace({ input }, "exercise might be implicit shorthand - will lazily evaluate")
    exercise = {
      kind: "shorthand",
      name,
      value: definition,
    }
  } else {
    const err = new errors.InvalidProgramError("invalid exercises[]")
    logger.error({ err }, err.message)

    throw err
  }

  return exercise
}

function parseTemplatedExercises(arr: unknown = []) {
  const logger = _logger.child({ method: "#parseTemplatedExercises" })

  if (!Array.isArray(arr)) {
    const err = new errors.InvalidProgramError("invalid exercises - expected list")
    logger.error({ err }, err.message)

    throw err
  }

  return arr.map(parseTemplatedExercise)
}

function parseSession(record: unknown): program.Session {
  const logger = _logger.child({ method: "#parseSession" })
  if (!reflect.isRecord(record)) {
    const err = new errors.InvalidProgramError("invalid templates[]:sessions[] - expected list<map>")
    logger.error({ err }, err.message)

    throw err
  }

  if (typeof record.name !== "string") {
    const err = new errors.InvalidProgramError("invalid templates[]:sessions[]:name - expected string")
    logger.error({ err }, err.message)

    throw err
  }

  return {
    name: record.name,
    exercises: parseTemplatedExercises(record.exercises)
  }
}

function parseTemplate(record: unknown): program.Template {
  const logger = _logger.child({ method: "#parseTemplate" })
  logger.trace({ record }, "parsing template")

  if (!reflect.isRecord(record)) {
    const err = new errors.InvalidProgramError("invalid exercises - expected list<map>")
    logger.error({ err }, err.message)

    throw err
  }

  if (typeof record.name !== "string") {
    const err = new errors.InvalidProgramError("invalid exercises[]:name - expected string")
    logger.error({ err }, err.message)

    throw err
  }

  logger.trace({ inputs: record.inputs }, "parsing inputs")
  if (!Array.isArray(record.inputs)) {
    const err = new errors.InvalidProgramError("invalid templates[]:inputs - expected list")
    logger.error({ err }, err.message)

    throw err
  }

  if (!record.inputs.every((i) => typeof i === "string")) {
    const err = new errors.InvalidProgramError("invalid templates[]:inputs - expected list<string>")
    logger.error({ err }, err.message)

    throw err
  }

  if (!Array.isArray(record.sessions)) {
    const err = new errors.InvalidProgramError("invalid templates[]:sessions - expected list")
    logger.error({ err }, err.message)

    throw err
  }

  return {
    name: record.name,
    alias: typeof record["renders as"] === "string"
      ? record["renders as"]
      : typeof record.alias === "string" ? record.alias : record.name,
    inputs: record.inputs,
    sessions: record.sessions.map(parseSession),
    // TODO: implement outputs
    // outputs: record.outputs.map(parseOutput),
  }
}

function parseTemplates(arr: unknown = []) {
  const logger = _logger.child({ method: "#parseTemplates" })

  if (!Array.isArray(arr)) {
    const err = new errors.InvalidProgramError("invalid templates - expected list")
    logger.error({ err }, err.message)

    throw err
  }

  return arr.map(parseTemplate)
}

function parseBlock(input: unknown): program.Block {
  const logger = _logger.child({ method: "#parseBlock" })

  if (!reflect.isRecord(input)) {
    const err = new errors.InvalidProgramError("invalid schedule:blocks[] - expected list<map>")
    logger.error({ err }, err.message)

    throw err
  }

  if (typeof input.name !== "string") {
    const err = new errors.InvalidProgramError("invalid schedule:blocks[]:name - expected string")
    logger.error({ err }, err.message)

    throw err
  }
  if (typeof input.template !== "string") {
    const err = new errors.InvalidProgramError("invalid schedule:blocks[]:template - expected string")
    logger.error({ err }, err.message)

    throw err
  }
  if (!Array.isArray(input.inputs)) {
    const err = new errors.InvalidProgramError("invalid templates[]:inputs - expected list")
    logger.error({ err }, err.message)

    throw err
  }

  return {
    name: input.name,
    template: input.template,
    inputs: input.inputs.map((i) => {
      if (!reflect.isRecord(i)) {
        const err = new errors.InvalidProgramError("invalid templates[]:inputs - expected list<map<string, number>>")
        logger.error({ err }, err.message)

        throw err
      }
      const [[name, value]] = Object.entries(i)
      if (typeof value === "number") {
        return {
          name,
          value: {
            kind: "literal",
            value
          },
        }
      }
      if (typeof value === "string") {
        return {
          name,
          value: {
            kind: "shorthand",
            value
          },
        }
      }
      const err = new errors.InvalidProgramError("invalid templates[]:inputs - expected list<map<string, number|string>>")
      logger.error({ err }, err.message)

      throw err
    })
  }
}

function parseBlocks(input: unknown[]) {
  return input.map(parseBlock)
}

function parseSchedule(input: unknown) {
  const logger = _logger.child({ method: "#parseSchedule" })

  if (!reflect.isRecord(input)) {
    const err = new errors.InvalidProgramError("invalid schedule - expected map")
    logger.error({ err }, err.message)

    throw err
  }
  if (!Array.isArray(input.blocks)) {
    const err = new errors.InvalidProgramError("invalid schedule:blocks[] - expected list<map>")
    logger.error({ err }, err.message)

    throw err
  }

  return {
    blocks: parseBlocks(input.blocks)
  }
}

export function parse(input: string): {
  defaults: program.Defaults
  exercises: Record<string, program.DeclaredExercise>
  templates: Record<string, program.Template>
  schedule: program.Schedule
} {
  const logger = _logger.child({
    package: "internal",
    component: "parser",
    method: "#parse"
  })

  logger.trace("parsing program")

  logger.trace("loading yaml")
  const p = yaml.load(input, { schema: yamlUtils.schema })
  logger.trace(p, "loaded yaml")

  if (!reflect.isRecord(p)) {
    const err = new errors.InvalidProgramError("invalid program input")
    logger.error({ err }, err.message)

    throw err
  }

  const defaults = parseDefaults(p.defaults)
  allowImplicitShorthand = defaults.shorthand.enabled

  const exercises: program.DeclaredExercise[] = parseDeclaredExercises(p.exercises)
  const templates: program.Template[] = parseTemplates(p.templates)
  const schedule: program.Schedule = parseSchedule(p.schedule || { blocks: [] })

  return {
    defaults,
    exercises: exercises.reduce<Record<string, program.DeclaredExercise>>((obj, e) => {
      obj[e.name] = e
      return obj
    }, {}),
    templates: templates.reduce<Record<string, program.Template>>((obj, t) => {
      obj[t.name] = t
      return obj
    }, {}),
    schedule,
  }
}
