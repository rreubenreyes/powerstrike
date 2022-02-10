// TODO: use output from the lexer
// /* global expect, describe, test */
// import * as ast from "./ast"
// import * as parser from "./parser"

// describe("parsing", () => {
//   // TODO(TDD): broke this, expect to fix once lexer is implemented
//   test("empty program", () => {
//     const prog = ``
//     const result = parser.parse(prog)
//     expect(result).toEqual(new ast.RootNode())
//   })

//   // TODO(TDD): broke this, expect to fix once lexer is implemented
//   test("minimum viable program", () => {
//     const prog = `
//     schedule {}
//     `
//     const resultAST = parser.parse(prog)
//     expect(resultAST.firstChild()).toBeInstanceOf(ast.AnonymousStructNode)
//     expect(resultAST.firstChild().getRoot()).toBe(resultAST)
//   })

//   // TODO(TDD): not passing yet
//   test("struct with fields", () => {
//     const prog = `
//     schedule {
//       period = time.Week
//     }
//     `
//     const resultAST = parser.parse(prog)
//     expect(resultAST.firstChild()).toBeInstanceOf(ast.AnonymousStructNode)

//     const structNode = resultAST.firstChild()
//     expect(structNode.firstChild()).toBeInstanceOf(ast.BinaryOperationNode)

//     const binaryOperationNode = structNode.firstChild()
//     expect((binaryOperationNode.firstChild() as ast.BinaryOperationNode).getLeft()).toBeInstanceOf(ast.IdentifierNode)
//     expect((binaryOperationNode.firstChild() as ast.BinaryOperationNode).getLeft()).toBeInstanceOf(ast.IdentifierNode)
//   })
// })
