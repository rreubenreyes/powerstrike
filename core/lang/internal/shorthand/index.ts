import _logger from "../util/logger"
import * as lexer from "./lexer"
import * as parser from "./parser"
import * as evaluate from "./evaluate"
import * as errors from "../errors"
import type * as program from "../program"

function resolver(identifiers: { name: string, value: number }[] = []) {
  const logger = _logger.child({ package: "shorthand", method: "#resolver" })

  let _weight: number
  let _sets: number
  let _reps: number
  let _rpe: number | undefined

  function weight(prog: string) {
    const tokens = lexer.lex(prog)
    const ast = parser.parse(tokens)
    if (ast === null) {
      const err = new errors.UserCodeError("incomplete shorthand expression: missing weight")
      logger.error({ err }, err.message)

      throw err
    }

    _weight = evaluate.evaluate(ast, identifiers)

    return { weight, sets, reps, rpe, value }
  }

  function sets(prog: string) {
    const tokens = lexer.lex(prog)
    const ast = parser.parse(tokens)
    if (ast === null) {
      const err = new errors.UserCodeError("incomplete shorthand expression: missing sets")
      logger.error({ err }, err.message)

      throw err
    }

    _sets = evaluate.evaluate(ast, identifiers)

    return { weight, sets, reps, rpe, value }
  }

  function reps(prog: string) {
    const tokens = lexer.lex(prog)
    const ast = parser.parse(tokens)
    if (ast === null) {
      const err = new errors.UserCodeError("incomplete shorthand expression: missing reps")
      logger.error({ err }, err.message)

      throw err
    }

    _reps = evaluate.evaluate(ast, identifiers)

    return { weight, sets, reps, rpe, value }
  }

  function rpe(prog: string) {
    const tokens = lexer.lex(prog)
    const ast = parser.parse(tokens)
    if (ast !== null) {
      _rpe = evaluate.evaluate(ast, identifiers)
    }

    return { weight, sets, reps, rpe, value }
  }

  function value() {
    if (!_weight || !_sets || !_reps) {
      const err = new errors.ImplementationError("unexpected missing shorthand part")
      logger.fatal({ err }, err.message)

      throw err
    }

    return {
      weight: _weight,
      sets: _sets,
      reps: _reps,
      rpe: _rpe,
    }
  }

  return { weight, sets, reps, rpe, value }
}

export function resolve(
  opts: program.Defaults["shorthand"],
  prog: string,
  identifiers: { name: string, value: number }[] = [],
): program.RenderedExercise["definition"] {
  const logger = _logger.child({ package: "shorthand", method: "~resolve" })
  if (!opts.enabled) {
    const err = new errors.ShorthandNotAllowedError("can\'t resolve shorthand expression: defaults:shorthand:enabled is false")

    logger.error({ err }, err.message)
    throw err
  }
  logger.trace("resolving shorthand definition")

  const [scheme, rpe = ""] = prog.split("@")
  let weight, sets, reps: string
  if (opts.setsBeforeReps) {
    [weight, sets, reps] = scheme.split(":")
  } else {
    [weight, reps, sets] = scheme.split(":")
  }

  const definition = resolver(identifiers)
    .weight(weight)
    .sets(sets)
    .reps(reps)
    .rpe(rpe)
    .value()

  logger.trace({ definition }, "resolved shorthand definition")

  return definition
}

export function resolveExpression(
  prog: string,
  identifiers: { name: string, value: number }[] = [],
): number {
  const logger = _logger.child({ package: "shorthand", method: "~resolveExpression" })

  const tokens = lexer.lex(prog)
  const ast = parser.parse(tokens)
  if (ast === null) {
    const err = new errors.UserCodeError("incomplete shorthand expression: missing weight")
    logger.error({ err }, err.message)

    throw err
  }

  const resolved = evaluate.evaluate(ast, identifiers)

  return resolved
}
