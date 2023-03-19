import * as lexer from "./lexer"

describe("lexer~lex", () => {
  interface Test {
    name: string,
    args: string,
    want?: lexer.Token[],
    wantErr: boolean,
  }

  const fn = lexer.lex
  const tests: Test[] = [
    {
      name: "whitespace: single whitespace produces one token",
      args: " ",
      want: [
        { kind: "whitespace", value: " " },
      ],
      wantErr: false,
    },
    {
      name: "whitespace: many consecutive whitespace produces one token",
      args: "   ",
      want: [
        { kind: "whitespace", value: " " },
      ],
      wantErr: false,
    },
    {
      name: "numeric: valid numerics",
      args: "1 0.1 .1",
      want: [
        { kind: "numeric", value: "1" },
        { kind: "whitespace", value: " " },
        { kind: "numeric", value: "0.1" },
        { kind: "whitespace", value: " " },
        { kind: "numeric", value: ".1" },
      ],
      wantErr: false,
    },
    {
      name: "numeric: float with too many decimals",
      args: "1.1.1",
      wantErr: true,
    },
    {
      name: "identifier: valid identifiers",
      args: "Aardvark aardvark _aardvark Hello_world-",
      want: [
        { kind: "identifier", value: "Aardvark" },
        { kind: "whitespace", value: " " },
        { kind: "identifier", value: "aardvark" },
        { kind: "whitespace", value: " " },
        { kind: "identifier", value: "_aardvark" },
        { kind: "whitespace", value: " " },
        { kind: "identifier", value: "Hello_world-" },
      ],
      wantErr: false,
    },
    {
      name: "delimiters",
      args: "()",
      want: [
        { kind: "delimiter", value: "(" },
        { kind: "delimiter", value: ")" },
      ],
      wantErr: false,
    },
    {
      name: "operators",
      args: "+-/*@",
      want: [
        { kind: "operator", value: "+" },
        { kind: "operator", value: "-" },
        { kind: "operator", value: "/" },
        { kind: "operator", value: "*" },
        { kind: "operator", value: "@" },
      ],
      wantErr: false,
    },
    {
      name: "unsupported token",
      args: "%",
      wantErr: true,
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
