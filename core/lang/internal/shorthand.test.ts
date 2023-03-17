import * as shorthand from "./shorthand"

describe("parser~parse", () => {
  interface Test {
    name: string,
    args: string,
    want?: shorthand.Token[],
    wantErr: boolean,
  }

  const fn = shorthand.tokenize
  const tests: Test[] = [
    {
      name: "whitespace: single whitespace produces one token",
      args: " ",
      want: [
        { kind: "whitespace" },
      ],
      wantErr: false,
    },
    {
      name: "whitespace: many consecutive whitespace produces one token",
      args: "   ",
      want: [
        { kind: "whitespace" },
      ],
      wantErr: false,
    },
    {
      name: "scalar: valid scalars",
      args: "1 0.1 .1",
      want: [
        { kind: "scalar", value: "1" },
        { kind: "whitespace" },
        { kind: "scalar", value: "0.1" },
        { kind: "whitespace" },
        { kind: "scalar", value: ".1" },
      ],
      wantErr: false,
    },
    {
      name: "scalar: float with too many decimals",
      args: "1.1.1",
      wantErr: true,
    },
    {
      name: "identifier: valid identifiers",
      args: "Aardvark aardvark _aardvark Hello_world-",
      want: [
        { kind: "identifier", value: "Aardvark" },
        { kind: "whitespace" },
        { kind: "identifier", value: "aardvark" },
        { kind: "whitespace" },
        { kind: "identifier", value: "_aardvark" },
        { kind: "whitespace" },
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
      name: "ambiguous",
      args: "x",
      want: [
        { kind: "ambiguous", value: "x" },
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
