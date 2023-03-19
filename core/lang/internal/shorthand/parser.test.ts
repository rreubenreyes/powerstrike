import * as parser from "./parser"
import type * as lexer from "./lexer"

describe("parser~parse", () => {
  interface Test {
    name: string,
    args: lexer.Token[],
    want?: parser.ASTNode | null,
    wantErr: boolean,
  }

  const fn = parser.parse
  const tests: Test[] = [
    {
      name: "ignores whitespace",
      args: [{ kind: "whitespace", value: " " }],
      want: null,
      wantErr: false,
    },
    {
      // 2
      name: "single literal",
      args: [{ kind: "numeric", value: "2" }],
      want: {
        kind: "literal",
        literal: "number",
        raw: "2",
        value: 2
      },
      wantErr: false,
    },
    {
      // hello
      name: "single identifier",
      args: [{ kind: "identifier", value: "hello" }],
      want: {
        kind: "identifier",
        raw: "hello",
        ref: "hello"
      },
      wantErr: false,
    },
    {
      // +
      name: "standalone operator",
      args: [{ kind: "operator", value: "+" }],
      wantErr: true,
    },
    {
      // -2
      name: "unary_op: single expression",
      args: [
        { kind: "operator", value: "-" },
        { kind: "numeric", value: "2" },
      ],
      want: {
        kind: "unary_op",
        op: "-",
        operand: { kind: "literal", literal: "number", raw: "2", value: 2 },
      },
      wantErr: false,
    },
    {
      // -
      name: "unary_op: unterminated",
      args: [
        { kind: "operator", value: "-" },
      ],
      wantErr: true,
    },
    {
      // 2 + 2
      name: "binary_op: single expression",
      args: [
        { kind: "numeric", value: "2" },
        { kind: "operator", value: "+" },
        { kind: "numeric", value: "2" },
      ],
      want: {
        kind: "binary_op",
        op: "+",
        lh: { kind: "literal", literal: "number", raw: "2", value: 2 },
        rh: { kind: "literal", literal: "number", raw: "2", value: 2 },
      },
      wantErr: false,
    },
    {
      // 2 +
      name: "binary_op: unterminated expression",
      args: [
        { kind: "numeric", value: "2" },
        { kind: "operator", value: "+" },
      ],
      wantErr: true,
    },
    {
      // (2 + 2)
      name: "binary_op: single expression in parens",
      args: [
        { kind: "delimiter", value: "(" },
        { kind: "numeric", value: "2" },
        { kind: "operator", value: "+" },
        { kind: "numeric", value: "2" },
        { kind: "delimiter", value: ")" },
      ],
      want: {
        kind: "binary_op",
        op: "+",
        lh: { kind: "literal", literal: "number", raw: "2", value: 2 },
        rh: { kind: "literal", literal: "number", raw: "2", value: 2 },
      },
      wantErr: false,
    },
    {
      // ((2 + 2))
      name: "binary_op: nested groups are valid",
      args: [
        { kind: "delimiter", value: "(" },
        { kind: "delimiter", value: "(" },
        { kind: "numeric", value: "2" },
        { kind: "operator", value: "+" },
        { kind: "numeric", value: "2" },
        { kind: "delimiter", value: ")" },
        { kind: "delimiter", value: ")" },
      ],
      want: {
        kind: "binary_op",
        op: "+",
        lh: { kind: "literal", literal: "number", raw: "2", value: 2 },
        rh: { kind: "literal", literal: "number", raw: "2", value: 2 },
      },
      wantErr: false,
    },
    {
      // 1 + 2 * 3 - 4 / 5
      // = 1 + (2 * 3) - (4 / 5)
      name: "binary_op: operator precedence",
      args: [
        { kind: "numeric", value: "1" },
        { kind: "operator", value: "+" },
        { kind: "numeric", value: "2" },
        { kind: "operator", value: "*" },
        { kind: "numeric", value: "3" },
        { kind: "operator", value: "-" },
        { kind: "numeric", value: "4" },
        { kind: "operator", value: "/" },
        { kind: "numeric", value: "5" },
      ],
      want: {
        kind: "binary_op",
        op: "-",
        lh: {
          kind: "binary_op",
          op: "+",
          lh: { kind: "literal", literal: "number", raw: "1", value: 1 },
          rh: {
            kind: "binary_op",
            op: "*",
            lh: { kind: "literal", literal: "number", raw: "2", value: 2 },
            rh: { kind: "literal", literal: "number", raw: "3", value: 3 },
          },
        },
        rh: {
          kind: "binary_op",
          op: "/",
          lh: { kind: "literal", literal: "number", raw: "4", value: 4 },
          rh: { kind: "literal", literal: "number", raw: "5", value: 5 },
        },
      },
      wantErr: false,
    },
    {
      // (1 + 2) * 3 - 4 / 5
      name: "binary_op: grouping overrides operator precedence",
      args: [
        { kind: "delimiter", value: "(" },
        { kind: "numeric", value: "1" },
        { kind: "operator", value: "+" },
        { kind: "numeric", value: "2" },
        { kind: "delimiter", value: ")" },
        { kind: "operator", value: "*" },
        { kind: "numeric", value: "3" },
        { kind: "operator", value: "-" },
        { kind: "numeric", value: "4" },
        { kind: "operator", value: "/" },
        { kind: "numeric", value: "5" },
      ],
      want: {
        kind: "binary_op",
        op: "-",
        lh: {
          kind: "binary_op",
          op: "*",
          lh: {
            kind: "binary_op",
            op: "+",
            lh: { kind: "literal", literal: "number", raw: "1", value: 1 },
            rh: { kind: "literal", literal: "number", raw: "2", value: 2 },
          },
          rh: { kind: "literal", literal: "number", raw: "3", value: 3 },
        },
        rh: {
          kind: "binary_op",
          op: "/",
          lh: { kind: "literal", literal: "number", raw: "4", value: 4 },
          rh: { kind: "literal", literal: "number", raw: "5", value: 5 },
        },
      },
      wantErr: false,
    },
    {
      // (one + two) * ((three - four) / five)
      name: "binary_op: can parse operations on identifiers",
      args: [
        { kind: "delimiter", value: "(" },
        { kind: "identifier", value: "one" },
        { kind: "operator", value: "+" },
        { kind: "identifier", value: "two" },
        { kind: "delimiter", value: ")" },
        { kind: "operator", value: "*" },
        { kind: "delimiter", value: "(" },
        { kind: "delimiter", value: "(" },
        { kind: "identifier", value: "three" },
        { kind: "operator", value: "-" },
        { kind: "identifier", value: "four" },
        { kind: "delimiter", value: ")" },
        { kind: "operator", value: "/" },
        { kind: "identifier", value: "five" },
        { kind: "delimiter", value: ")" },
      ],
      want: {
        kind: "binary_op",
        op: "*",
        lh: {
          kind: "binary_op",
          op: "+",
          lh: { kind: "identifier", ref: "one", raw: "one" },
          rh: { kind: "identifier", ref: "two", raw: "two" }
        },
        rh: {
          kind: "binary_op",
          op: "/",
          lh: {
            kind: "binary_op",
            op: "-",
            lh: { kind: "identifier", ref: "three", raw: "three" },
            rh: { kind: "identifier", ref: "four", raw: "four" }
          },
          rh: { kind: "identifier", ref: "five", raw: "five" }
        },
      },
      wantErr: false,
    },
  ]

  for (const t of tests) {
    test(t.name, () => {
      if (t.wantErr) {
        expect(() => fn(t.args)).toThrow()
      } else {
        expect(fn(t.args)).toEqual(t.want)
      }
    })
  }
})
