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

/**
 * isUnaryOpSequence checks the next two tokens of `t` to determine
 * if the following two tokens form a valid `<unary_op>`. The definition of
 * `<unary_op`> adheres to the following grammar:
 *
 * `<unary_op> ::= "-" <expr_p2>`
 */
function isUnaryOpSequence(t: Queue<lexer.Token>): boolean {
  const cur = t.cur()
  const next = t.peek()
  const validUnaryOps = ["-"]

  return Boolean(
    (cur && (cur.kind === "operator" && validUnaryOps.includes(cur.value)))
    && (next && (next.kind === "identifier" || next.kind === "numeric"))
  )
}

/**
 * parseExpressionP1 returns a `<expr_p1>`, which is defined according to the following grammar:
 *
 * `<expr_p1> ::= <expr_p1> ("*" | "/") <expr_p1> | <declaration>`
 */
function parseExpressionP1(t: Queue<lexer.Token>, sibling?: ASTNode): ASTNode {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "#parseExpressionP1" })
  logger.trace("parsing expr")

  const curToken = t.cur()
  if (!curToken) {
    logger.trace("no more tokens, will throw")
    const err = new errors.ParsingError("invalid expr: unexpected end of program")
    logger.error({ err }, err.message)

    throw err
  }

  let expr: ASTNode
  if (curToken.kind === "identifier") {
    logger.trace({ cur: curToken, sibling }, "<expr_p1> ::= <identifier>")

    expr = {
      kind: "identifier",
      raw: curToken.value,
      ref: curToken.value,
    }
  } else if (curToken.kind === "numeric") {
    logger.trace({ cur: curToken, sibling }, "<expr_p1> ::= <literal>")

    expr = {
      kind: "literal",
      literal: "number",
      raw: curToken.value,
      value: Number(curToken.value),
    }
  } else if (curToken.kind === "delimiter") {
    if (curToken.value === "(") {
      logger.trace({ cur: curToken, sibling }, "<expr_p1> ::= \"(\"")

      expr = parseDeclaration(t)
    } else if (curToken.value === ")") {
      logger.trace({ cur: curToken, sibling }, "<expr_p1> ::= \")\"")

      if (!sibling) {
        const err = new errors.ParsingError("unexpected token")
        logger.error({ err, curToken }, err.message)
        throw err
      }

      logger.trace({ cur: curToken, sibling }, "just parsed grouped expression, next operator is valid")
      expr = sibling
    } else {
      const err = new errors.ParsingError("unexpected token")
      logger.error({ err, curToken }, err.message)

      throw err
    }
  } else if (isUnaryOpSequence(t)) {
    // <expr_p1> ::= <unary_op>
    logger.trace({ cur: curToken, sibling }, "<expr_p1> ::= <unary_op>")
    const operand = curToken.value
    t.advance()
    const nextTerm = parseExpressionP1(t)

    expr = {
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
    logger.trace({ expr }, "no more tokens, returning last node")
    return expr
  }

  logger.trace({ next }, "lookahead")
  let nextTerm: ASTNode
  while (next && (next.value === "*" || next.value === "/")) {
    logger.trace("lookahead found operator, constructing binary operation")
    // if next token is a multiply/divide operator, this is a binary operation,
    // so recurse until we can construct a binary_op node
    t.advance(2)
    nextTerm = parseExpressionP1(t)
    expr = {
      kind: "binary_op",
      op: next.value,
      lh: expr,
      rh: nextTerm,
    }

    next = t.peek()
  }

  logger.trace({ node: expr }, "resolving expression")
  return expr
}

/**
 * parseExpressionP2 returns a `<expr_p2>`, which is defined according to the following grammar:
 *
 * `<expr_p2> ::= <expr_p2> ("+" | "-") <expr_p2> | <expr_p1>`
 */
function parseExpressionP2(t: Queue<lexer.Token>, sibling?: ASTNode): ASTNode {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "#parseExpressionP2" })
  logger.trace("parsing expression")

  const curToken = t.cur()
  if (!curToken) {
    logger.trace("no more tokens, will throw")
    const err = new errors.ParsingError("invalid expression: unexpected end of program")
    logger.error({ err }, err.message)

    throw err
  }

  logger.trace({ cur: curToken }, "<expr_p2> ::= <expr_p1>")
  let expr: ASTNode = parseExpressionP1(t, sibling)

  let next = t.peek()
  if (!next) {
    logger.trace({ expr }, "no more tokens, returning last node")
    return expr
  }

  // <expr_p2> ::= <expr_p2> ("+" | "-") <expr_p2>
  logger.trace({ next }, "lookahead")
  let nextExpression: ASTNode
  while (next && (next.value === "+" || next.value === "-")) {
    logger.trace({ cur: curToken }, "<expr_p2> ::= <expr_p2> (\"+\" | \"-\") <expr_p2>")
    // if next token is an add/subtract operator, this is a binary operation,
    // so recurse until we can construct a binary_op node
    t.advance(2)
    nextExpression = parseExpressionP1(t, sibling)
    expr = {
      kind: "binary_op",
      op: next.value,
      lh: expr,
      rh: nextExpression,
    }

    next = t.peek()
  }

  logger.trace({ node: expr }, "")
  return expr
}

/**
 * parseDeclaration returns a `<declaration>`, which is defined according to the following grammar:
 *
 * `<declaration> ::= "(" <expr_p2> ")" | <unary_op> | <literal> | <identifier>`
 */
function parseDeclaration(t: Queue<lexer.Token>): ASTNode {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "#parseDeclaration" })
  logger.trace("parsing declaration")

  let curToken = t.cur()
  if (!curToken) {
    logger.trace("no more tokens, will throw")
    const err = new errors.ParsingError("invalid declaration: unexpected end of program")
    logger.error({ err }, err.message)

    throw err
  }

  if (curToken.kind === "delimiter" && curToken.value === "(") {
    logger.trace({ cur: curToken }, "<declaration> ::= \"(\" <expr_p2> \")\"")
    curToken = t.advance()

    logger.trace({ cur: curToken }, "grouped expression: found expression, parsing")
    const expr = parseExpressionP2(t)

    curToken = t.advance()
    logger.trace({ cur: curToken }, "grouped expression: looking for close paren")
    if (curToken && curToken.kind !== "delimiter" && curToken.value !== ")") {
      const err = new errors.ParsingError("invalid expression: unterminated group")
      logger.error({ err, cur: curToken }, err.message)

      throw err
    }

    logger.trace("grouped expression: advancing past close paren")

    return parseExpressionP2(t, expr)
  }
  if (curToken.kind === "numeric") {
    logger.trace({ cur: curToken }, "<declaration> ::= <literal>")
    return parseExpressionP2(t)
  }
  if (curToken.kind === "identifier") {
    logger.trace({ cur: curToken }, "<declaration> ::= <identifier>")
    return parseExpressionP2(t)
  }
  if (isUnaryOpSequence(t)) {
    logger.trace({ cur: curToken, next: t.peek() }, "<declaration> ::= <unary_op>")
    return parseExpressionP2(t)
  }

  throw new errors.ParsingError("invalid declaration")
}

/**
 * parse parses a sequences of `lexer.Token`s according to the following grammar:
 *
 * `<declaration> ::= "(" <expr_p2> ")" | <unary_op> | <literal> | <identifier>`
 * `<unary_op>    ::= "-" <expr_p2>`
 * `<expr_p1>     ::= <expr_p1> ("*" | "/") <expr_p1> | <declaration>`
 * `<expr_p2>     ::= <expr_p2> ("+" | "-") <expr_p2> | <expr_p1>`
 *
 * Whitespace tokens are ignored.
 */
export function parse(tokens: lexer.Token[]): ASTNode | null {
  const logger = _logger.child({ package: "shorthand", component: "parser", method: "~parse" })
  logger.trace("parsing AST tokens")

  const q = createQueue(tokens.filter((t) => t.kind !== "whitespace"))
  if (!q.cur()){
    logger.debug("empty program")
    return null
  }

  const root = parseDeclaration(q)

  logger.trace({ root }, "resolved AST")
  return root
}
