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
      name: "standalone operator",
      args: [{ kind: "operator", value: "+" }],
      wantErr: true,
    },
    {
      name: "single binary expression",
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
