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

interface UnaryOp {
  kind: "unary_op"
  op: string
  operand: ASTNode
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
  | UnaryOp
  | BinaryOp
  | List
)

interface Queue<T> {
  cur(): T | undefined
  advance(amt?: number): T | undefined
  peek(amt?: number): T | undefined
}

function createQueue<T>(arr: T[]): Queue<T> {
  function cur(): T | undefined {
    return arr[0]
  }

  function advance(amt = 1): T | undefined {
    for (let i = 0; i < amt; i++) {
      arr.shift()
    }

    return cur()
  }

  function peek(amt = 1): T | undefined {
    const next = arr[amt]

    return next
  }

  return { cur, advance, peek }
}

function isUnaryOpSequence(t: Queue<lexer.Token>): boolean {
  const cur = t.cur()
  const next = t.peek()
  const validUnaryOps = ["-"]

  return Boolean(
    (cur && (cur.kind === "operator" && validUnaryOps.includes(cur.value)))
    && (next && (next.kind === "identifier" || next.kind === "numeric"))
  )
}

// <term> ::= <term> ("*" | "/") <term> | <declaration>
function parseTerm(t: Queue<lexer.Token>, sibling?: ASTNode): ASTNode {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "#parseTerm" })
  logger.trace("starting")

  const curToken = t.cur()
  if (!curToken) {
    logger.trace("no more tokens, will throw")
    const err = new errors.ParsingError("invalid expression")
    logger.error({ err }, err.message)

    throw err
  }

  logger.trace({ cur: curToken }, "token is present")

  let term: ASTNode
  if (curToken.kind === "identifier") {
    logger.trace({ cur: curToken }, "token is identifier")
    // <term> ::= <identifier>
    term = {
      kind: "identifier",
      raw: curToken.value,
      ref: curToken.value,
    }
  } else if (curToken.kind === "numeric") {
    logger.trace({ cur: t.cur() }, "token is literal")
    // <term> ::= <literal>
    term = {
      kind: "literal",
      literal: "number",
      raw: curToken.value,
      value: Number(curToken.value),
    }
  } else if (curToken.kind === "delimiter") {
    if (curToken.value === "(") {
      // <term> ::= "("
      logger.trace({ cur: curToken, sibling }, "found grouped expression")
      term = parseDeclaration(t)
    } else if (curToken.value === ")") {
      // <term> ::= ")"
      if (!sibling) {
        const err = new errors.ParsingError("unexpected token")
        logger.error({ err, curToken }, err.message)
        throw err
      }

      logger.trace({ cur: curToken, sibling }, "just parsed grouped expression, next operator is valid")
      term = sibling
    } else {
      const err = new errors.ParsingError("unexpected token")
      logger.error({ err, curToken }, err.message)

      throw err
    }
  } else if (isUnaryOpSequence(t)) {
    // <term> ::= <unary_op>
    logger.trace({ cur: t.cur() }, "next term is unary op sequence")
    const operand = curToken.value
    t.advance()
    const nextTerm = parseTerm(t)

    term = {
      kind: "unary_op",
      op: operand,
      operand: nextTerm,
    }
  } else {
    const err = new errors.ParsingError("unexpected token")
    logger.error({ err, curToken }, err.message)

    throw err
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

    next = t.peek()
  }
  logger.trace({ node: term }, "no more operators, returning expression")

  logger.trace("done")
  return term
}

// <exp> ::= <exp> ("+" | "-") <exp> | <term>
function parseExpression(t: Queue<lexer.Token>, sibling?: ASTNode): ASTNode {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "#parseExpression" })
  logger.trace("starting")

  const curToken = t.cur()
  if (!curToken) {
    logger.trace("no more tokens, will throw")
    const err = new errors.ParsingError("invalid expression")
    logger.error({ err }, err.message)

    throw err
  }

  logger.trace({ cur: curToken }, "token is present")

  // <exp> ::= <term>
  logger.trace({ cur: curToken }, "parsing term")
  let expr: ASTNode = parseTerm(t, sibling)
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
    nextExpression = parseTerm(t, sibling)
    expr = {
      kind: "binary_op",
      op: next.value,
      lh: expr,
      rh: nextExpression,
    }

    next = t.peek()
  }
  logger.trace({ node: expr }, "no more operators, returning expression")

  logger.trace("done")
  return expr
}

// <declaration> ::= "(" <exp> ")" | <unary_op> | <literal> | <identifier>
function parseDeclaration(t: Queue<lexer.Token>): ASTNode {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "#parseDeclaration" })
  logger.trace("starting")

  let curToken = t.cur()
  if (!curToken) {
    logger.trace("no more tokens, will throw")
    const err = new errors.ParsingError("invalid expression")
    logger.error({ err }, err.message)

    throw err
  }

  logger.trace({ cur: curToken }, "token is present")

  if (curToken.kind === "delimiter" && curToken.value === "(") {
    // <declaration> ::= "(" <exp> ")"
    logger.trace({ cur: curToken }, "found grouped expression")
    curToken = t.advance()
    logger.trace({ cur: curToken }, "grouped expression: found expression, parsing")
    const expr = parseExpression(t)

    curToken = t.advance()
    logger.trace({ cur: curToken }, "grouped expression: looking for close paren")
    if (curToken && curToken.kind !== "delimiter" && curToken.value !== ")") {
      const err = new errors.ParsingError("invalid expression: unterminated group")
      logger.error({ err, cur: curToken }, err.message)

      throw err
    }

    logger.trace("grouped expression: advancing past close paren")

    return parseExpression(t, expr)
  }
  if (curToken.kind === "numeric") {
    // <declaration> ::= <literal>
    logger.trace({ cur: curToken }, "token is numeric")
    return parseExpression(t)
  }
  if (curToken.kind === "identifier") {
    // <declaration> ::= <identifier>
    logger.trace({ cur: curToken }, "token is identifier")
    return parseExpression(t)
  }
  if (isUnaryOpSequence(t)) {
    // <declaration> ::= <unary_op>
    logger.trace({ cur: curToken, next: t.peek() }, "found unary op sequence")
    return parseExpression(t)
  }

  throw new errors.ParsingError("invalid declaration")
}

export function parse(tokens: lexer.Token[]): ASTNode | null {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "~parse" })
  logger.trace("starting")

  const q = createQueue(tokens.filter((t) => t.kind !== "whitespace"))
  if (!q.cur()){
    logger.trace("empty program")
    return null
  }

  const root = parseDeclaration(q)

  logger.trace("done")
  return root
}
