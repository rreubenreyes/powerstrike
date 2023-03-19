import * as evaluate from "./evaluate"
import type * as parser from "./parser"

describe("eval~evaluate", () => {
  interface Test {
    name: string,
    args: [parser.ASTNode, { name: string, value: number }[]],
    want?: number,
    wantErr: boolean,
  }

  const fn = evaluate.evaluate
  const tests: Test[] = [
    {
      // 2
      name: "single literal",
      args: [{
        kind: "literal",
        literal: "number",
        raw: "2",
        value: 2
      }, []],
      want: 2,
      wantErr: false,
    },
    {
      // hello
      name: "identifiers: single identifier",
      args: [
        {
          kind: "identifier",
          raw: "hello",
          ref: "hello"
        },
        [{ name: "hello", value: 2 }],
      ],
      want: 2,
      wantErr: false,
    },
    {
      // hello
      name: "identifiers: invalid indentifier",
      args: [
        {
          kind: "identifier",
          raw: "hello",
          ref: "hello"
        },
        [{ name: "not_hello", value: 2 }],
      ],
      wantErr: true,
    },
    {
      name: "identifiers: duplicate indentifier",
      args: [
        {
          kind: "identifier",
          raw: "hello",
          ref: "hello"
        },
        [
          { name: "hello", value: 2 },
          { name: "hello", value: 3 },
        ],
      ],
      wantErr: true,
    },
    {
      // -2
      name: "unary_op: negation",
      args: [
        {
          kind: "unary_op",
          op: "-",
          operand: { kind: "literal", literal: "number", raw: "2", value: 2 },
        },
        []
      ],
      want: -2,
      wantErr: false,
    },
    {
      // -2
      name: "unary_op: invalid",
      args: [
        {
          kind: "unary_op",
          op: "x",
          operand: { kind: "literal", literal: "number", raw: "2", value: 2 },
        },
        []
      ],
      wantErr: true,
    },
    {
      // -2
      name: "binary_op: invalid",
      args: [
        {
          kind: "binary_op",
          op: "x",
          lh: { kind: "literal", literal: "number", raw: "2", value: 2 },
          rh: { kind: "literal", literal: "number", raw: "2", value: 2 },
        },
        []
      ],
      wantErr: true,
    },
    {
      // -2
      name: "binary op: order of operations",
      args: [
        {
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
        [
          { name: "one", value: 1 },
          { name: "two", value: 2 },
          { name: "three", value: 3 },
          { name: "four", value: 4 },
          { name: "five", value: 5 },
        ]
      ],
      want: (1 + 2) * ((3 - 4) / 5),
      wantErr: false,
    },
  ]

  for (const t of tests) {
    test(t.name, () => {
      if (t.wantErr) {
        expect(() => fn(...t.args)).toThrow()
      } else {
        expect(fn(...t.args)).toEqual(t.want)
      }
    })
  }
})
