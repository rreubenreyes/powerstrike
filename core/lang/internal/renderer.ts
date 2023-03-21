import _logger from "./util/logger"
import * as errors from "./errors"
import * as parser from "./parser"
import * as program from "./program"
import * as shorthand from "./shorthand"

function renderStatement(
  opts: { identifiers?: { name: string, value: number }[] },
  statement: program.Statement
): number {
  const logger = _logger.child({
    package: "internal",
    component: "renderer",
    method: "#renderStatement",
  })

  if (statement.kind === "literal") {
    return statement.value
  }
  if (statement.kind === "shorthand") {
    return shorthand.resolveExpression(statement.value, opts.identifiers)
  }

  const err = new errors.ImplementationError("unexpected invalid statement")
  logger.fatal({ err }, err.message)
  throw err
}

function renderExercise(
  opts: {
    defaults: program.Defaults
    exercises: Record<string, program.DeclaredExercise>
    block: program.Block
  },
  te: program.TemplatedExercise,
): program.RenderedExercise {
  const logger = _logger.child({
    package: "internal",
    component: "renderer",
    method: "#renderExercise",
    block: opts.block.name,
  })

  const de = opts.exercises[te.name]
  if (!de) {
    const err = new errors.InvalidProgramError(
      `invalid session - block "${opts.block.name}" references undeclared exercise "${te.name}"`
    )
    logger.error({ err }, err.message)
    throw err
  }

  const exerciseIdentifiers = Object.values(opts.exercises).flatMap((i) => {
    return Object.entries(i.properties).map(([k, v]) => {
      return {
        name: `${i.name}.${k}`,
        value: v.value
      }
    })
  })
  const inputIdentifiers = opts.block.inputs.map((i) => {
    const resolved = renderStatement({
      identifiers: exerciseIdentifiers,
    }, i.value)

    return {
      name: i.name,
      value: resolved
    }
  })
  const identifiers = [...exerciseIdentifiers, ...inputIdentifiers]

  let definition: program.RenderedExercise["definition"]
  if (te.kind === "explicit") {
    definition = {
      weight: renderStatement({ identifiers }, te.definition.weight),
      sets: renderStatement({ identifiers }, te.definition.sets),
      reps: renderStatement({ identifiers }, te.definition.reps),
      rpe: te.definition.rpe ? renderStatement({ identifiers }, te.definition.rpe) : undefined,
    }
  } else if (te.kind === "shorthand") {
    definition = shorthand.resolve(opts.defaults.shorthand, te.value, identifiers)
  } else {
    const err = new errors.ImplementationError("unexpected invalid exercise block")

    logger.fatal({ err }, err.message)
    throw err
  }

  return {
    name: de.name,
    alias: de.alias,
    definition,
  }
}

function renderSession(
  opts: {
    defaults: program.Defaults
    exercises: Record<string, program.DeclaredExercise>
    template: program.Template
    block: program.Block
  },
  session: program.Session,
): program.RenderedSession {
  const logger = _logger.child({
    package: "internal",
    component: "renderer",
    method: "#renderSession",
    block: opts.block.name,
    template: opts.template.name,
  })

  logger.trace("rendering session")

  return {
    name: session.name,
    exercises: session.exercises.map((e) => renderExercise({
      defaults: opts.defaults,
      exercises: opts.exercises,
      block: opts.block,
    }, e))
  }
}

function renderBlock(
  opts: {
    defaults: program.Defaults
    templates: Record<string, program.Template>
    exercises: Record<string, program.DeclaredExercise>
  },
  block: program.Block,
): program.RenderedBlock {
  const logger = _logger.child({
    package: "internal",
    "component": "renderer",
    "method": "#renderBlock"
  })

  const template = opts.templates[block.template]
  if (!template) {
    const err = new errors.InvalidProgramError(
      `invalid schedule - block "${block.name}" references undeclared template "${block.template}"`
    )
    logger.error({ err }, err.message)
    throw err
  }

  logger.trace({ block: block.name }, "rendering sessions")
  const sessions = template.sessions.map((s) => renderSession({
    defaults: opts.defaults,
    exercises: opts.exercises,
    template,
    block,
  }, s))

  return {
    name: block.name,
    sessions,
  }
}

export function render(input: string): program.RenderedProgram {
  const logger = _logger.child({
    package: "internal",
    component: "renderer",
    method: "~render"
  })

  logger.trace("rendering program")

  const {
    defaults,
    exercises,
    templates,
    schedule,
  } = parser.parse(input)

  const blocks = schedule.blocks.map((b) => renderBlock({
    defaults,
    exercises,
    templates,
  }, b))

  const rendered = { schedule: { blocks } }
  logger.debug({ rendered }, "rendered program")

  return rendered
}
