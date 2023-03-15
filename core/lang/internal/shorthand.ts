import * as errors from "./errors"

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

interface WhitespaceToken {
  kind: "whitespace"
}

type Token = IdentifierToken | ScalarToken | DelimiterToken | WhitespaceToken

interface Context {
  state: Token["kind"] | "unidentified" | "lookahead_identifier"
  cur: string
  remaining: string
}

function consume(ctx: Context, next: string): { done: boolean, output: Token[] } {
  // if context is unidentified, we're at the beginning of a token
  if (ctx.state === "unidentified") {
    if (/[0-9\.]/.test(next)) {
    // valid beginning scalar characters
      ctx.state = "scalar"
    } else if (/[\x\(\)]/.test(next)) {
      // valid beginning delimiter characters
      ctx.state = "delimiter"
    } else if (/[a-zA-Z]/.test(next)) {
      // valid beginning identifier characters
      ctx.state = "identifier"
    } else if (/\s/.test(next)) {
      // valid beginning whitespace characters
      ctx.state = "whitespace"
    }
  }

  if (ctx.state === "scalar") {
    const token = { kind: ctx.kind, value: ctx.cur }

    if (/[0-9]/.test(next)) {
      token.value += next
      return {
        done: false,
        output: [token]
      }
    }

    if (next === ".") {
      if (ctx.cur.includes(".")) {
        throw new errors.InvalidShorthandTokenError("invalid scalar")
      }
      return {
        done: false,
        output: [token]
      }
    }

    if (/\s/.test(next)) {
      return {
        done: true,
        output: [token]
      }
    }
  }

  if (ctx.state === "delimiter") {
    const token = { kind: ctx.kind, value: ctx.cur }

    if (/[\(\)x]/.test(next)) {
      return {
        done: true,
        output: [token]
      }
    }
  }

  if (ctx.state === "identifier") {
    const token = { kind: ctx.kind, value: ctx.cur }

    if (/[a-zA-z]/.test(next)) {
      return {
        done: false,
        output: [token]
      }
    }

    if (/\s/.test(next)) {
      // continue consuming until next non-whitespace
      return {
        done: true,
        output: [token]
      }
    }
  }

  if (ctx.state = "lookahead_identifier") {

  }
}

function tokenize(s: string): Token[] {
}

// AST parsing
interface NumberScalar {
  kind: "scalar"
  value: number
}

interface BinaryExpression {
  kind: "binary expression"
  lh: ASTNode
  rh: ASTNode
  operation: string
}

type ASTNode = Identifier | NumberScalar | BinaryExpression

function group(x: string) {

}

function parse(x: string) {

}

function evaluate(tree: ASTNode) {

}
