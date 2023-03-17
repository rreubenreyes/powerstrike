import * as errors from "../errors"
import _logger from "../util/logger"
import type * as lexer from "./lexer"

interface List {
  kind: "list"
  elements: ASTNode[]
}

interface NumberLiteral {
  kind: "literal"
  literal: "number"
  raw: string
  value: number
}

type Literal = NumberLiteral

interface Identifier {
  kind: "identifier"
  raw: string
  ref: string
}

interface BinaryOp {
  kind: "binary_op"
  lh: ASTNode
  rh: ASTNode
  op: string
}

export type ASTNode = (
  Literal
  | Identifier
  | BinaryOp
  | List
)

type Context = "declaration" | "expression"

interface Queue<T> {
  done(): boolean
  cur(): T
  advance(amt?: number): T
  peek(amt?: number): T
}

function createQueue<T>(arr: T[]): Queue<T> {
  const logger = _logger.child({ package: "shorthand", component: "parser", instanceOf: "Queue" })
  function done() {
    return arr.length === 0
  }

  function cur() {
    // logger.trace({ size: arr.length }, "getting current item")
    return arr[0]
  }

  function advance(amt = 1) {
    // logger.trace({ size: arr.length }, "advancing")
    let next
    for (let i = 0; i < amt; i++) {
      next = arr.shift()
    }

    if (next === undefined) {
      logger.trace("queue is done, will throw")
      throw new errors.ImplementationError("queue is done")
    }

    return next
  }

  function peek(amt = 1) {
    // logger.trace({ size: arr.length }, "peeking")

    const next = arr[amt]
    // if (next === undefined) {
    //   logger.trace("queue is done, will throw")
    //   throw new errors.ImplementationError("queue is done")
    // }

    return next
  }

  return { done, cur, advance, peek }
}

// <term> ::= <term> ("*" | "/") <term> | <declaration>
function parseTerm(t: Queue<lexer.Token>): ASTNode {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "#parseTerm" })
  logger.trace("starting")

  if (t.done()) {
    logger.trace("no more tokens, will throw")
    const err = new errors.ParsingError("invalid expression")
    logger.error({ err }, err.message)
  }

  let term: ASTNode
  if (t.cur().kind === "identifier") {
    logger.trace({ cur: t.cur() }, "token is identifier")
    // <term> ::= <identifier>
    term = {
      kind: "identifier",
      raw: t.cur().value,
      ref: t.cur().value,
    }
  } else {
    logger.trace({ cur: t.cur() }, "token is literal")
    // <term> ::= <literal>
    term = {
      kind: "literal",
      literal: "number",
      raw: t.cur().value,
      value: Number(t.cur().value),
    }
  }

  let next = t.peek()
  if (!next) {
    logger.trace({ term }, "no more tokens, returning last node")
    return term
  }

  logger.trace({ next }, "lookahead")
  let nextTerm: ASTNode
  while (next && (next.value === "*" || next.value === "/")) {
    logger.trace("lookahead found operator, constructing binary operation")
    // if next token is a multiply/divide operator, this is a binary operation,
    // so recurse until we can construct a binary_op node
    t.advance(2)
    nextTerm = parseTerm(t)
    term = {
      kind: "binary_op",
      op: next.value,
      lh: term,
      rh: nextTerm,
    }

    if (!t.done()) {
      next = t.peek()
    }
  }
  logger.trace("no more operators, returning term")

  logger.trace("done")
  return term
}

// <exp> ::= <exp> ("+" | "-") <exp> | <term>
function parseExpression(t: Queue<lexer.Token>): ASTNode {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "#parseExpression" })
  logger.trace("starting")

  if (t.done()) {
    logger.trace("no more tokens, will throw")
    const err = new errors.ParsingError("invalid expression")
    logger.error({ err }, err.message)
  }

  // <exp> ::= <term>
  logger.trace("parsing term")
  let expr: ASTNode = parseTerm(t)
  logger.trace({ expr }, "parsed term")

  let next = t.peek()
  if (!next) {
    logger.trace({ expr }, "no more tokens, returning last node")
    return expr
  }

  // <exp> ::= <exp> ("+" | "-") <exp>
  logger.trace({ next }, "lookahead")
  let nextExpression: ASTNode
  while (next && (next.value === "+" || next.value === "-")) {
    logger.trace("lookahead found operator, constructing binary operation")
    // if next token is an add/subtract operator, this is a binary operation,
    // so recurse until we can construct a binary_op node
    t.advance(2)
    nextExpression = parseTerm(t)
    expr = {
      kind: "binary_op",
      op: next.value,
      lh: expr,
      rh: nextExpression,
    }

    if (!t.done()) {
      next = t.peek()
    }
  }
  logger.trace("no more operators, returning expression")

  logger.trace("done")
  return expr
}

// <declaration> ::= "(" <exp> ")" | <literal> | <identifier>
function parseDeclaration(t: Queue<lexer.Token>): ASTNode {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "#parseDeclaration" })
  logger.trace("starting")

  if (t.done()) {
    logger.trace("no more tokens, will throw")
    const err = new errors.ParsingError("invalid expression")
    logger.error({ err }, err.message)
  }

  let next = t.cur()
  if (next.kind === "delimiter" && next.value === "(") {
    logger.trace("found grouped declaration")
    // <declaration> ::= "(" <exp> ")"
    const expr = parseExpression(t)
    next = t.advance()
    if (next.kind === "delimiter" && next.value === ")") {
      throw new errors.ParsingError("invalid declaration")
    }

    return expr
  }
  if (next.kind === "numeric") {
    logger.trace({ next }, "token is numeric")
    // <declaration> ::= <literal>
    return parseExpression(t)
  }
  if (next.kind === "identifier") {
    logger.trace({ next }, "token is identifier")
    // <declaration> ::= <identifier>
    return parseExpression(t)
  }

  throw new errors.ParsingError("invalid declaration")
}

export function parse(tokens: lexer.Token[]): ASTNode | null {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "~parse" })
  logger.trace("starting")

  const q = createQueue(tokens.filter((t) => t.kind !== "whitespace"))
  if (q.done()){
    logger.trace("empty program")
    return null
  }

  const root = parseDeclaration(q)

  logger.trace("done")
  return root
}
