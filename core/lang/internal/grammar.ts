// TODO: use output from the lexer
// import * as lexer from "./lexer"

// export interface Rule {
//   name: string;
//   allows: (token: string) => boolean;
//   next: (token: string) => Rule[] | null;
// }

// export const rules: { [index: string]: Rule } = {
//   anyExpression: {
//     name: "anyExpression",
//     allows: (token) => {
//       return [
//         lexer.tokens.defaults,
//         lexer.tokens.exercise,
//         lexer.tokens.template,
//         lexer.tokens.schedule,
//         lexer.tokens.whitespace,
//       ].includes(token)
//     },
//     next: (token) => {
//       switch (token) {
//       case lexer.tokens.schedule:
//         return [rules.structStart]
//       case lexer.tokens.whitespace:
//         return [rules.anyExpression]
//       default:
//         return null
//       }
//     },
//   },

//   structStart: {
//     name: "structStart",
//     allows: (token) => {
//       return token === lexer.tokens.lcbrace
//         || token === lexer.tokens.whitespace
//     },
//     next: (token) => {
//       switch (token) {
//       case lexer.tokens.lcbrace:
//         return [rules.structEnd, rules.identifier]
//       case lexer.tokens.whitespace:
//         return [rules.structStart]
//       default:
//         return null
//       }
//     }
//   },

//   structEnd: {
//     name: "structEnd",
//     allows: (token) => {
//       return token === lexer.tokens.rcbrace
//         || token === lexer.tokens.whitespace
//     },
//     next: (token) => {
//       switch (token) {
//       case lexer.tokens.rcbrace:
//         return [rules.anyExpression]
//       case lexer.tokens.whitespace:
//         return [rules.structEnd]
//       default:
//         return null
//       }
//     }
//   },
// }
