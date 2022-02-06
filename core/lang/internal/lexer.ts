// TODO(TDD): write tests
import _logger from "./util/logger"
import * as stateMachine from "./util/state_machine"
// import * as errors from "./util/errors"
//
const logger = _logger.child({ component: "lexer" })

export interface Token {
  kind: string;
  value: string;
}

export interface Keyword extends Token {
  kind: "keyword";
}

export interface Identifier extends Token {
  kind: "identifier";
}

export interface BooleanLiteral extends Token {
  kind: "boolean";
}

export interface IntegerLiteral extends Token {
  kind: "number";
}

export interface StringLiteral extends Token {
  kind: "string";
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
  kind: "separator";
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
  token: "literal" | "identifier" | "keyword" | "separator" | "obscure" | "binaryOperator" | "unaryOperator" | "unknown";
  kind?: string;
  value: string;
  error: boolean;
  done: boolean;
}

export function* generator(prog: string) {
  const lines = prog.split(/[\f\r\n\v]/)
  let token = ""
  let line = 1
  let col = 0

  // TODO: handle comments
  // TODO: handle identifiers
  const machine = stateMachine.create({
    startAt: "default",
    states: [
      {
        name: "default",
        handler: (params: Context) => {
          logger.trace(params, "handling 'default' state")
          // yield separator
          if (isSeparator(params.char)) {
            logger.trace(params, `encountered complete token: separator '${params.value}'`)
            return {
              ...params,
              token: "separator",
              value: params.char,
              done: true,
              error: false,
            }
          }

          // yield keyword
          if (isKeyword(params.value)) {
            logger.trace(params, `encountered complete token: keyword '${params.value}'`)
            return {
              ...params,
              token: "keyword",
              done: true,
              error: false,
            }
          }

          // yield boolean literal
          if (isBooleanLiteral(params.value)) {
            logger.trace(params, `encountered complete token: boolean literal '${params.value}'`)
            return {
              ...params,
              token: "literal",
              kind: "boolean",
              done: true,
              error: false,
            }
          }

          // begin constructing obscure token
          if (isObscureSymbol(params.char)) {
            logger.trace(params, `encountered incomplete token: obscure symbol '${params.value}'`)
            return {
              ...params,
              token: "obscure",
              kind: "unknown",
              value: params.char,
              done: false,
              error: false,
            }
          }

          // begin constructing number literal
          if (isDigit(params.value)) {
            logger.trace(params, `encountered incomplete token: number literal '${params.value}'`)
            return {
              ...params,
              token: "literal",
              kind: "number",
              value: params.value,
              done: false,
              error: false,
            }
          }

          // begin constructing string literal
          if (params.char === "\"") {
            logger.trace(params, "encountered incomplete token: string literal")
            return {
              ...params,
              token: "literal",
              kind: "string",
              value: "",
              error: false,
              done: false,
            }
          }

          return params
        },
        next: (prev: Context) => {
          if (prev.token === "keyword") {
            logger.trace(prev, "transitioning to 'default' state")
            return "default"
          }
          if (prev.token === "obscure") {
            logger.trace(prev, "transitioning to 'obscure' state")
            return "obscure"
          }
          if (prev.token === "literal" && prev.kind === "boolean") {
            logger.trace(prev, "transitioning to 'default' state")
            return "default"
          }
          if (prev.token === "literal" && prev.kind === "number") {
            logger.trace(prev, "transitioning to 'numberLiteral' state")
            return "numberLiteral"
          }
          if (prev.token === "literal" && prev.kind === "string") {
            logger.trace(prev, "transitioning to 'stringLiteral' state")
            return "stringLiteral"
          }

          logger.error(prev, "no valid state transitions")
          return null
        },
        end: false,
      } as stateMachine.Node,
      {
        name: "obscure",
        handler: (params: Context): Context => {
          logger.trace(params, "handling 'obscure' state")

          const discover = (token: Context["token"], kind: Context["kind"], value: string) => {
            logger.trace(params, `encountered complete token: ${token} '${kind}'`)
            return {
              ...params,
              token,
              kind,
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
              token: "obscure",
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
              token: "obscure",
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
              token: "obscure",
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
                token: "obscure",
                value: "**",
                done: true,
                error: false,
              }
            }
            return {
              ...params,
              token: "obscure",
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
              token: "obscure",
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
              token: "obscure",
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
              token: "obscure",
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
              token: "obscure",
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
              token: "obscure",
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
              token: "obscure",
              done: true,
              error: true,
            }
          default:
            return {
              ...params,
              token: "obscure",
              done: true,
              error: true,
            }
          }
        },
        next: (prev: Context) => {
          if (prev.token === "obscure") {
            logger.trace(prev, "transitioning to 'obscure' state because current symbol is still obscure")
            return "obscure"
          }
          if (prev.token !== "unaryOperator" && prev.token !== "binaryOperator") {
            logger.error(prev, "no valid state transitions from 'obscure': discovered token is neither 'unaryOperator' nor 'binaryOperator'")
            return null
          }

          logger.trace(prev, "transitioning to 'default' state: found valid token")
          return "default"
        },
        end: false,
      } as stateMachine.Node,
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
      } as stateMachine.Node,
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
              done: false,
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

          logger.trace(params, "invalid token found within number literal: will throw InvalidTokenError")
          return {
            ...params,
            error: true,
            done: true,
          }
        },
        next: (prev: Context) => {
          if (isDigit(prev.char) || (prev.char === "." && !prev.value.includes("."))) {
            logger.trace(prev, "transitioning to 'numberLiteral' state because current string is unterminated")
            return "numberLiteral"
          }
          if (isAnyWhitespace(prev.char)) {
            logger.trace(prev, "transitioning to 'default' state: terminated number literal")
            return "default"
          }

          logger.trace(prev, "no valid state transitions from 'numberLiteral': invalid token within number literal")
          return null
        },
        end: false,
      } as stateMachine.Node,
    ]
  })

  for (line = 1; line <= lines.length; line++) {
    for (col = 0; col < lines[line - 1].length; col++) {
    }
  }

  return null
}
