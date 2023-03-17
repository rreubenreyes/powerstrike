import * as errors from "./errors"
import _logger from "./util/logger"

// tokenizing
interface IdentifierToken {
  kind: "identifier"
  value: string
}

interface ScalarToken {
  kind: "scalar"
  value: string
}

interface DelimiterToken {
  kind: "delimiter"
  value: string
}

interface OperatorToken {
  kind: "operator"
  value: string
}

interface AmbiguousToken {
  kind: "ambiguous"
  value: string
}

interface WhitespaceToken {
  kind: "whitespace"
}

export type Token = IdentifierToken
| ScalarToken
| DelimiterToken
| WhitespaceToken
| OperatorToken
| AmbiguousToken

interface Context {
  state: Token["kind"] | "unidentified"
  cur: string
}

function* consume(prog: string) {
  let logger = _logger.child({ component: "shorthand", method: "#consume" })
  logger.trace("starting")

  const ctx: Context = {
    state: "unidentified",
    cur: ""
  }
  logger.trace({ ctx }, "created blank context")

  let token: Token
  const done = () => {
    logger.trace({ token }, "will yield token")

    ctx.state = "unidentified"
    ctx.cur = ""

    logger.trace({ ctx }, "reset context")

    if (token.kind === "identifier" && token.value === "x") {
      logger.trace({ ctx }, "token is single `x`, returning `ambiguous`")
      token = { kind: "ambiguous", value: "x" }
    }
    return token
  }

  for (let i = 0; i < prog.length;) {
    const next = prog[i]
    logger = logger.child({ i, next, ctx, length: prog.length })
    logger.trace("marching")

    // if context is unidentified, we're at the beginning of a token
    if (ctx.state === "unidentified") {
      if (/[0-9\.]/.test(next)) {
        // valid beginning scalar characters
        logger.trace("next state is scalar")
        ctx.state = "scalar"
      } else if (/[a-zA-Z_]/.test(next)) {
        // valid beginning identifier characters
        logger.trace("next state is identifier")
        ctx.state = "identifier"
      } else if (/\s/.test(next)) {
        // valid beginning whitespace characters
        logger.trace("next state is whitespace")
        ctx.state = "whitespace"
      } else if (/[\(\)]/.test(next)) {
        // delimiters are identifiable by a single character, so we can yield immediately
        logger.trace("next state is delimiter")
        token = { kind: "delimiter", value: next }

        yield done()
        i++
        continue
      } else if (/[\+\-\/\*@]/.test(next)) {
        // operators are identifiable by a single character, so we can yield immediately
        logger.trace("next state is operator")
        token = { kind: "operator", value: next }

        yield done()
        i++
        continue
      } else {
        throw new errors.InvalidShorthandTokenError("invalid token")
      }
    }

    if (ctx.state === "scalar") {
      if (/[0-9]/.test(next)) {
        logger.trace("encountered valid scalar character")
        ctx.cur += next
        token = { kind: ctx.state, value: ctx.cur }

        // progress to next char and restart this loop
        i++
        continue
      }

      if (next === ".") {
        if (ctx.cur.includes(".")) {
          const err = new errors.InvalidShorthandTokenError("invalid scalar")
          logger.error({ err }, err.message)
          throw err
        }

        logger.trace("encountered valid scalar character")
        ctx.cur += next
        token = { kind: ctx.state, value: ctx.cur }
        i++
        continue
      }

      token = { kind: ctx.state, value: ctx.cur }

      // we have exited the context of a scalar, so just restart this loop and reconsider the char
      yield done()
      continue
    }

    if (ctx.state === "identifier") {
      // identifiers can start with [a-zA-Z_]
      if (!ctx.cur.length && /[a-zA-Z_]/.test(next)) {
        logger.trace("encountered valid initial identifier character")

        ctx.cur += next
        token = { kind: ctx.state, value: ctx.cur }
        i++
        continue
      }

      // identifiers can contain [0-9a-zA-z_\-]
      if (ctx.cur.length && /[0-9a-zA-z_\-]/.test(next)) {
        logger.trace("encountered valid initial character")

        ctx.cur += next
        token = { kind: ctx.state, value: ctx.cur }
        i++
        continue
      }

      token = { kind: ctx.state, value: ctx.cur }

      // we have exited the context of an identifier, so just restart this loop and reconsider the char
      yield done()
      continue
    }

    if (ctx.state === "whitespace") {
      if (/\s/.test(next)) {
        ctx.cur += next
        token = { kind: ctx.state }
        i++
        continue
      }

      // we have exited the context of whitespace, so just restart this loop and reconsider the char
      yield done()
      continue
    }

    const err = new errors.InvalidShorthandTokenError("invalid token")
    logger.error({ err }, err.message)
    throw err
  }

  if (ctx.state !== "unidentified") {
    logger.trace("no more chars, yielding final token")
    yield done()
  } else {
    logger.trace("no more chars, no final token to yield")
  }

  logger.trace("done")
  return null
}

export function tokenize(prog: string): Token[] {
  const logger = _logger.child({ component: "shorthand", method: "~tokenize" })
  logger.trace("starting")

  const tokens: Token[] = []
  for (const token of consume(prog)) {
    logger.trace({ token }, "consumed token")
    tokens.push(token)
  }

  logger.trace("done")
  return tokens
}

// AST parsing
// interface NumberScalar {
//   kind: "scalar"
//   value: number
// }

// interface BinaryExpression {
//   kind: "binary expression"
//   lh: ASTNode
//   rh: ASTNode
//   operation: string
// }

// type ASTNode = Identifier | NumberScalar | BinaryExpression

// function group(x: string) {

// }

// function parse(x: string) {

// }

// function evaluate(tree: ASTNode) {

// }
