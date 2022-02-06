import * as ast from "./ast"
import * as lexer from "./lexer"
import * as grammar from "./grammar"
import * as errors from "./errors"
import logger from "./logger"

function consume(ctx: { line: number; col: number; token: string; rule: grammar.Rule }) {
  const nextRules = ctx.rule.next(ctx.token)
  if (!nextRules) {
    throw new errors.ParsingError(`(line ${ctx.line}, col ${ctx.col - ctx.token.length}): unexpected token "${ctx.token}"`)
  }

  return { rules: nextRules }
}

export function parse(input: string) {
  const prog = input.trim()
  logger.trace({ prog }, "trimmed input")

  const gen = lexer.generator(prog)
  let allowedRules = [grammar.rules.anyExpression]
  let node = new ast.RootNode()
  for (const { line, col, token } of gen) {
    (() => {
      for (const rule of allowedRules) {
        const ctx = { line, col, token, rule }
        logger.trace(ctx, "received next token")
        logger.trace(ctx, `current rule is '${rule.name}'`)

        if (!rule.allows(token)) {
          logger.trace(ctx, "rule does not allow token; evaluating next")
          continue
        }
        logger.trace(ctx, "rule allows token")

        if (rule === grammar.rules.anyExpression) {
          logger.trace(ctx, "encountered whitespace")
          if (token === lexer.tokens.whitespace) {
            return
          }

          if (token === lexer.tokens.schedule) {
            logger.trace(ctx, "encountered keyword 'schedule'")
            const { rules: nextRules } = consume(ctx)
            const nextNode = new ast.AnonymousStructNode("schedule", node)
            node = nextNode
            allowedRules = nextRules

            return
          }
        }
        if (rule === grammar.rules.structStart) {
          if (token === lexer.tokens.whitespace) {
            logger.trace(ctx, "encountered whitespace")
            return
          }

          if (token === lexer.tokens.lcbrace) {
            logger.trace(ctx, "encountered punctuation 'lcbrace'")
            const { rules: nextRules } = consume(ctx)
            allowedRules = nextRules

            return
          }
        }
        if (rule === grammar.rules.structEnd) {
          if (token === lexer.tokens.whitespace) {
            logger.trace(ctx, "encountered whitespace")
            return
          }

          if (token === lexer.tokens.rcbrace) {
            logger.trace(ctx, "encountered punctuation 'rcbrace'")
            const { rules: nextRules } = consume(ctx)
            allowedRules = nextRules
            node = node.head()

            return
          }
        }
      }

      throw new errors.ParsingError(`(line ${line}, col ${col - token.length}): unexpected token "${token}"`)
    })()
  }

  logger.trace({ node: node.kind }, "parsed all tokens")
  if (!(node instanceof ast.RootNode)) {
    logger.trace("encountered unexpected EOF")
    throw new errors.ParsingError("unexpected EOF")
  }

  logger.trace("encountered valid EOF")
  return node
}
