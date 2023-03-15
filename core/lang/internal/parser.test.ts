import * as parser from "./parser"

interface Test {
  name: string,
  args: [number, { procedure: () => Promise<any>, onExceeded?: () => Promise<void> }],
  wantSpy: (args0: Test["args"][0], args1: Test["args"][1]) => void,
  wantErr: false,
}

const delay = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

describe("parser~parse", () => {
  const fn = parser.parse
  const tests: Test[] = [
  ]

  for (const t of tests) {
    test(t.name, async () => {
      const [args0, args1] = t.args
      if (t.wantErr) {
        expect(() => fn(args0, args1)).rejects.toThrow()
      } else {
        await fn(args0, args1)
        t.wantSpy(args0, args1)
      }
    })
  }
})
