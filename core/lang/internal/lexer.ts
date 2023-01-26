// TODO(TDD): write tests
import _logger from "./util/logger"
import * as stateMachine from "./util/state_machine"
import * as errors from "./util/errors"

const logger = _logger.child({ component: "lexer" })

export interface Token {
  kind: string;
  subkind?: string;
  value: string;
}

export interface Keyword extends Token {
  kind: "keyword";
}

export interface Identifier extends Token {
  kind: "identifier";
}

export interface BooleanLiteral extends Token {
  kind: "literal";
  subkind: "boolean";
}

export interface NumberLiteral extends Token {
  kind: "literal";
  subkind: "number";
}

export interface StringLiteral extends Token {
  kind: "literal";
  subkind: "string";
}

export interface Comment extends Token {
  kind: "comment";
}

export interface UnaryOperator extends Token {
  kind: "unaryOperator";
}

export interface BinaryOperator extends Token {
  kind: "binaryOperator";
}

export interface Separator extends Token {
  subkind: "separator";
}

function createToken(context: Context): Token {
  const { kind, subkind, value } = context
  return { kind, subkind, value }
}

function isKeyword(value: string): boolean {
  return value === "defaults" ||
    value === "exercise" ||
    value === "template" ||
    value === "schedule" ||
    value === "if" ||
    value === "else" ||
    value === "for" ||
    value === "in" ||
    value === "end"
}

function isBooleanLiteral(value: string): boolean {
  return value === "true" || value === "false"
}

function isDigit(char: string): boolean {
  return /[0-9]/.test(char)
}

// isObscureSymbol is true if the character could have different meanings
// depending on the value of potential characters that follow it.
function isObscureSymbol(char: string): boolean {
  return char === "<"
  || char === ">"
  || char === "!"
  || char === "+"
  || char === "-"
  || char === "*"
  || char === "="
  || char === "%"
}

function isSeparator(char: string): boolean {
  return (
    char === "."
    || char === ","
    || char === "("
    || char === ")"
    || char === "["
    || char === "]"
    || char === "{"
    || char === "}"
  )
}

// function isValidIdentifier(char: string): boolean {
//   return /^[a-zA-Z_][a-zA-Z_0-9]*$/.test(char)
// }

function isNonBreakingWhitespace(char: string): boolean {
  return char === " " || char === "\t" || char === "\n"
}

function isBreakingWhitespace(char: string): boolean {
  return char === "\n"
}

function isAnyWhitespace(char: string): boolean {
  return isNonBreakingWhitespace(char) || isBreakingWhitespace(char)
}


interface Context {
  char: string;
  kind: "literal" | "identifier" | "keyword" | "separator" | "obscure" | "binaryOperator" | "unaryOperator" | "unknown";
  subkind?: string;
  value: string;
  isEOF: boolean;
  error: boolean;
  done: boolean;
}

export function* generator(prog: string) {
  logger.trace({ method: "~generator" }, "starting")

  // TODO: handle comments
  // TODO: handle identifiers
  const machine = stateMachine.create({
    startAt: "default",
    states: [
      {
        name: "default",
        handler: (params: Context): Context => {
          logger.trace(params, "handling 'default' state")
          // yield separator
          if (isSeparator(params.char)) {
            logger.trace(params, `encountered complete token: separator '${params.char}'`)
            return {
              ...params,
              kind: "separator",
              value: params.char,
              done: true,
              error: false,
            }
          }

          // yield keyword
          if (isKeyword(params.value)) {
            logger.trace(params, `encountered complete token: keyword '${params.char}'`)
            return {
              ...params,
              kind: "keyword",
              done: true,
              error: false,
            }
          }

          // yield boolean literal
          if (isBooleanLiteral(params.value)) {
            logger.trace(params, `encountered complete token: boolean literal '${params.char}'`)
            return {
              ...params,
              kind: "literal",
              subkind: "boolean",
              done: true,
              error: false,
            }
          }

          // begin constructing obscure kind
          if (isObscureSymbol(params.char)) {
            logger.trace(params, `encountered incomplete token: obscure symbol '${params.char}'`)
            return {
              ...params,
              kind: "obscure",
              subkind: "unknown",
              value: params.char,
              done: false,
              error: false,
            }
          }

          // begin constructing number literal
          if (isDigit(params.char)) {
            logger.trace(params, `encountered incomplete token: number literal '${params.char}'`)
            return {
              ...params,
              kind: "literal",
              subkind: "number",
              value: params.value + params.char,
              done: params.isEOF,
              error: false,
            }
          }

          // begin constructing string literal
          if (params.char === "\"") {
            logger.trace(params, "encountered incomplete token: string literal")
            return {
              ...params,
              kind: "literal",
              subkind: "string",
              value: "",
              error: false,
              done: false,
            }
          }

          logger.trace(params, "could not recognize token in 'default' state")
          return params
        },
        next: (prev: Context) => {
          logger.trace(prev, "transitioning from 'default' state")

          if (prev.kind === "keyword") {
            logger.trace(prev, "transitioning to 'default' state")
            return "default"
          }
          if (prev.kind === "obscure") {
            logger.trace(prev, "transitioning to 'obscure' state")
            return "obscure"
          }
          if (prev.kind === "literal" && prev.subkind === "boolean") {
            logger.trace(prev, "transitioning to 'default' state")
            return "default"
          }
          if (prev.kind === "literal" && prev.subkind === "number") {
            if (prev.isEOF) {
              logger.trace(prev, "transitioning to 'default' state")
              return "default"
            }
            logger.trace(prev, "transitioning to 'numberLiteral' state")
            return "numberLiteral"
          }
          if (prev.kind === "literal" && prev.subkind === "string") {
            logger.trace(prev, "transitioning to 'stringLiteral' state")
            return "stringLiteral"
          }

          logger.error(prev, "no valid state transitions")
          return null
        },
        end: false,
      },
      {
        name: "obscure",
        handler: (params: Context): Context => {
          logger.trace(params, "handling 'obscure' state")

          const discover = (kind: Context["kind"], subkind: Context["subkind"], value: string) => {
            logger.trace(params, `encountered complete token: ${kind} '${subkind}'`)
            return {
              ...params,
              kind,
              subkind,
              value,
              done: true,
              error: false,
            }
          }

          logger.trace(params, `attempting to complete token for '${params.value}'`)
          switch (params.value) {
          // an exclamation can be terminated by non-breaking whitespace, open parentheses, equal sign, or a valid identifier
          case "!":
            if (isNonBreakingWhitespace(params.char)) {
              return discover("unaryOperator", "logicalNegation", "!")
            }
            if (params.char === "(") {
              return discover("unaryOperator", "logicalNegation", "!")
            }
            if (/[a-zA-Z_]/.test(params.char)) {
              return discover("unaryOperator", "logicalNegation", "!")
            }
            if (params.char === "=") {
              return discover("binaryOperator", "neq", "!=")
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          // plus can be terminated by non-breaking whitespace, open parentheses, plus, equal sign, or a valid identifier
          case "+":
            if (params.char === "+") {
              return discover("unaryOperator", "increment", "++")
            }
            if (params.char === "=") {
              return discover("binaryOperator", "addAssign", "+=")
            }
            if (isNonBreakingWhitespace(params.char)) {
              return discover("binaryOperator", "add", "+")
            }
            if (params.char === "(") {
              return discover("binaryOperator", "add", "+")
            }
            if (/[a-zA-Z_]/.test(params.char)) {
              return discover("binaryOperator", "add", "+")
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          // minus can be terminated by whitespace, open parentheses, plus, equal sign, or a valid identifier
          case "-":
            if (params.char === "-") {
              return discover("unaryOperator", "decrement", "--")
            }
            if (params.char === "=") {
              return discover("binaryOperator", "subtractAssign", "-=")
            }
            if (isNonBreakingWhitespace(params.char)) {
              return discover("binaryOperator", "subtract", "-")
            }
            if (params.char === "(") {
              return discover("binaryOperator", "subtract", "-")
            }
            if (/[a-zA-Z_]/.test(params.char)) {
              return discover("binaryOperator", "subtract", "-")
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          // asterisk can be terminated by whitespace, open parentheses, equal sign, or a valid identifier
          case "*":
            if (params.char === "=") {
              return discover("binaryOperator", "multiplyAssign", "*=")
            }
            if (isNonBreakingWhitespace(params.char)) {
              return discover("binaryOperator", "multiply", "*")
            }
            if (params.char === "(") {
              return discover("binaryOperator", "multiply", "*")
            }
            if (/[a*zA*Z_]/.test(params.char)) {
              return discover("binaryOperator", "multiply", "*")
            }
            // if the next char is another asterisk, then the symbol must derive from the power operator
            if (params.char === "*") {
              return {
                ...params,
                kind: "obscure",
                value: "**",
                done: true,
                error: false,
              }
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          // double asterisk can be terminated by whitespace, open parentheses, equal sign, or a valid identifier
          case "**":
            if (params.char === "=") {
              return discover("binaryOperator", "powerAssign", "**=")
            }
            if (isNonBreakingWhitespace(params.char)) {
              return discover("binaryOperator", "power", "**")
            }
            if (params.char === "(") {
              return discover("binaryOperator", "power", "**")
            }
            if (/[a*zA*Z_]/.test(params.char)) {
              return discover("binaryOperator", "power", "**")
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          // slash can be terminated by whitespace, open parentheses, equal sign, or a valid identifier
          case "/":
            if (params.char === "=") {
              return discover("binaryOperator", "divideAssign", "/=")
            }
            if (isNonBreakingWhitespace(params.char)) {
              return discover("binaryOperator", "divide", "/")
            }
            if (params.char === "(") {
              return discover("binaryOperator", "divide", "/")
            }
            if (/[a\/zA\/Z_]/.test(params.char)) {
              return discover("binaryOperator", "divide", "/")
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          // percent can be terminated by whitespace, open parentheses, equal sign, or a valid identifier
          case "%":
            if (params.char === "=") {
              return discover("binaryOperator", "moduloAssign", "%=")
            }
            if (isNonBreakingWhitespace(params.char)) {
              return discover("binaryOperator", "modulo", "%")
            }
            if (params.char === "(") {
              return discover("binaryOperator", "modulo", "%")
            }
            if (/[a\/zA\/Z_]/.test(params.char)) {
              return discover("binaryOperator", "modulo", "%")
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          // equal sign can be terminated by whitespace, open parentheses, equal sign, or a valid identifier
          case "=":
            if (params.char === "=") {
              return discover("binaryOperator", "eq", "==")
            }
            if (isNonBreakingWhitespace(params.char)) {
              return discover("binaryOperator", "assign", "=")
            }
            if (params.char === "(") {
              return discover("binaryOperator", "assign", "=")
            }
            if (/[a-zA-Z_]/.test(params.char)) {
              return discover("binaryOperator", "assign", "=")
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          // left chevron can be terminated by non-breaking whitespace, open parentheses, equal sign, or a valid identifier
          case "<":
            if (params.char === "=") {
              return discover("binaryOperator", "lte", "<=")
            }
            if (isNonBreakingWhitespace(params.char)) {
              return discover("binaryOperator", "lt", "<")
            }
            if (params.char === "(") {
              return discover("binaryOperator", "lt", "<")
            }
            if (/[a\/zA\/Z_]/.test(params.char)) {
              return discover("binaryOperator", "lt", "<")
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          // right chevron can be terminated by non-breaking whitespace, open parentheses, equal sign, or a valid identifier
          case ">":
            if (params.char === "=") {
              return discover("binaryOperator", "gte", ">=")
            }
            if (isNonBreakingWhitespace(params.char)) {
              return discover("binaryOperator", "gt", ">")
            }
            if (params.char === "(") {
              return discover("binaryOperator", "gt", ">")
            }
            if (/[a\/zA\/Z_]/.test(params.char)) {
              return discover("binaryOperator", "gt", ">")
            }
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          default:
            return {
              ...params,
              kind: "obscure",
              done: true,
              error: true,
            }
          }
        },
        next: (prev: Context) => {
          if (prev.kind === "obscure") {
            logger.trace(prev, "transitioning to 'obscure' state because current symbol is still obscure")
            return "obscure"
          }
          if (prev.kind !== "unaryOperator" && prev.kind !== "binaryOperator") {
            logger.error(prev, "no valid state transitions from 'obscure': discovered kind is neither 'unaryOperator' nor 'binaryOperator'")
            return null
          }

          logger.trace(prev, "transitioning to 'default' state: found valid kind")
          return "default"
        },
        end: false,
      },
      {
        name: "stringLiteral",
        handler: (params: Context): Context => {
          logger.trace(params, "handling 'stringLiteral' state")

          if (isBreakingWhitespace(params.char)) {
            logger.trace(params, "breaking whitespace is invalid within string literal: will throw InvalidTokenError")
            return {
              ...params,
              error: true,
              done: true,
            }
          }
          if (params.char === "\"") {
            logger.trace(params, "found end of string literal")
            return {
              ...params,
              error: false,
              done: true,
            }
          }

          logger.trace(params, "advancing string literal")
          return {
            ...params,
            value: params.value + params.char,
            error: false,
            done: false,
          }
        },
        next: (prev: Context) => {
          if (isBreakingWhitespace(prev.char)) {
            logger.trace(prev, "no valid state transitions from 'stringLiteral': breaking whitespace is invalid within string literal")
            return null
          }
          if (prev.char === "\"") {
            logger.trace(prev, "transitioning to 'default' state: terminated string literal")
            return "default"
          }

          logger.trace(prev, "transitioning to 'stringLiteral' state because current string is unterminated")
          return "stringLiteral"
        },
        end: false,
      },
      {
        name: "numberLiteral",
        handler: (params: Context): Context => {
          logger.trace(params, "handling 'numberLiteral' state")

          if (isDigit(params.char) || (params.char === "." && !params.value.includes("."))) {
            logger.trace(params, "advancing number literal")
            return {
              ...params,
              value: params.value + params.char,
              error: false,
              done: params.isEOF,
            }
          }
          if (isAnyWhitespace(params.char)) {
            logger.trace(params, "found end of number literal")
            return {
              ...params,
              done: true,
              error: false,
            }
          }

          logger.trace(params, "invalid character found within number literal: will throw InvalidTokenError")
          return {
            ...params,
            error: true,
            done: true,
          }
        },
        next: (prev: Context) => {
          if ((isDigit(prev.char) || prev.char === ".") && !prev.error) {
            logger.trace(prev, "transitioning to 'numberLiteral' state because current number is unterminated")
            return "numberLiteral"
          }
          if (isAnyWhitespace(prev.char)) {
            logger.trace(prev, "transitioning to 'default' state: terminated number literal")
            return "default"
          }

          logger.trace(prev, "no valid state transitions from 'numberLiteral': invalid character within number literal")
          return null
        },
        end: false,
      },
    ]
  })

  logger.debug({ method: "~generator" }, "starting token generation")
  let currentContext: Context | null = null
  let col = 0
  let line = 1
  let char: string
  for (let i = 0; i < prog.length; i++) {
    char = prog[i]
    if (currentContext === null) {
      currentContext = {
        char,
        kind: "unknown",
        isEOF: false,
        value: "",
        error: false,
        done: false,
      }
    }

    currentContext = machine.next({ ...currentContext, char, isEOF: i === prog.length - 1 }).result
    if (currentContext.error) {
      const err = new errors.InvalidTokenError(`(line ${line}, col ${col}): invalid token`)
      logger.error({ err }, err.message)
      throw err

    }
    if (currentContext.done) {
      yield createToken(currentContext)
    }

    col++
    if (char === "\n") {
      line++
      col = 0
    }
  }

  logger.trace({ method: "~generator" }, "done")
  return null
}
