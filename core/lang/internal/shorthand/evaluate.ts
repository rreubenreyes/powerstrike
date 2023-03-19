import _logger from "../util/logger"
import * as errors from "../errors"
import type * as parser from "./parser"

type LinksMap = Record<string, number>

function linkIdentifiers(identifiers: { name: string, value: number }[]) {
  const logger = _logger.child({ package: "shorthand", component: "evaluate", method: "#linkIdentifiers" })
  logger.debug({ identifiers }, "linking identifiers")

  const links = identifiers.reduce<LinksMap>((links, cur) => {
    if (links[cur.name]) {
      throw new errors.UserCodeError(`duplicate identifier ${cur.name}`)
    }

    links[cur.name] = cur.value
    return links
  }, {})

  logger.debug({ links }, "linked identifiers")
  return links
}

function walk(root: parser.ASTNode, links: LinksMap) {
  const logger = _logger.child({ package: "shorthand", component: "evaluate", method: "#walk" })
  logger.trace("starting")

  let result: number
  if (root.kind === "unary_op") {
    if (root.op === "-") {
      const operand = walk(root.operand, links)
      result = -operand
      return result
    }

    throw new errors.UserCodeError(`invalid operation`)
  }
  if (root.kind === "binary_op") {
    if (root.op === "+") {
      const lh = walk(root.lh, links)
      const rh = walk(root.rh, links)

      result = lh + rh

      logger.debug({ result }, "done")
      return result
    }
    if (root.op === "-") {
      const lh = walk(root.lh, links)
      const rh = walk(root.rh, links)

      result = lh - rh

      logger.debug({ result }, "done")
      return result
    }
    if (root.op === "*") {
      const lh = walk(root.lh, links)
      const rh = walk(root.rh, links)

      result = lh * rh

      logger.debug({ result }, "done")
      return result
    }
    if (root.op === "/") {
      const lh = walk(root.lh, links)
      const rh = walk(root.rh, links)

      result = lh / rh

      logger.debug({ result }, "done")
      return result
    }

    throw new errors.UserCodeError(`invalid operation ${root.op}`)
  }
  if (root.kind === "literal") {
    const result = root.value
    logger.debug({ result }, "done")

    return result
  }
  if (root.kind === "identifier") {
    if (!links[root.ref]) {
      const err = new errors.UserCodeError(`undefined variable ${root.ref}`)
      logger.error({ err, root, links }, err.message)

      throw err
    }

    const result = links[root.ref]
    logger.debug({ result }, "done")

    return result
  }

  throw new errors.ImplementationError("unrecognized statement")
}

export function evaluate(ast: parser.ASTNode, identifiers: { name: string, value: number }[]): number {
  const logger = _logger.child({ package: "shorthand", component: "evaluate", method: "~evaluate" })
  logger.trace("starting")

  const links = linkIdentifiers(identifiers)

  const result = walk(ast, links)

  logger.trace("done")
  return result
}
