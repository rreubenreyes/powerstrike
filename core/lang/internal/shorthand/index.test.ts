import * as shorthand from "."
import type * as program from "../program"

describe("shorthand~resolve", () => {
  interface Test {
    name: string,
    args: [program.Defaults["shorthand"], string, { name: string, value: number }[]?],
    want?: program.TemplatedExercise["definition"]
    wantErr: boolean,
  }

  const fn = shorthand.resolve
  const tests: Test[] = [
    {
      name: "can resolve identifiers",
      args: [
        { enabled: true, setsBeforeReps: true },
        "(squat_starting_weight + squat_increment * 2):(rx_sets):(rx_reps)@rpe",
        [
          { name: "squat_starting_weight", value: 225 },
          { name: "squat_increment", value: 10 },
          { name: "rx_sets", value: 3 },
          { name: "rx_reps", value: 5 },
          { name: "rpe", value: 8 }
        ]
      ],
      want: {
        weight: 245,
        sets: 3,
        reps: 5,
        rpe: 8,
      },
      wantErr: false,
    },
    {
      name: "sets before reps, RPE present",
      args: [
        { enabled: true, setsBeforeReps: true },
        "225:3:5@8",
      ],
      want: {
        weight: 225,
        sets: 3,
        reps: 5,
        rpe: 8
      },
      wantErr: false,
    },
    {
      name: "reps before sets, RPE present",
      args: [
        { enabled: true, setsBeforeReps: false },
        "225:3:5@8"
      ],
      want: {
        weight: 225,
        sets: 5,
        reps: 3,
        rpe: 8
      },
      wantErr: false,
    },
    {
      name: "don't evaluate if disabled",
      args: [
        { enabled: false, setsBeforeReps: true },
        "225:3:5",
      ],
      wantErr: true,
    },
    {
      name: "weight not present",
      args: [
        { enabled: true, setsBeforeReps: true },
        ":3:5",
      ],
      wantErr: true,
    },
    {
      name: "sets not present",
      args: [
        { enabled: true, setsBeforeReps: true },
        "225::5",
      ],
      wantErr: true,
    },
    {
      name: "reps not present",
      args: [
        { enabled: true, setsBeforeReps: true },
        "225:3:",
      ],
      wantErr: true,
    },
    {
      name: "RPE not present",
      args: [
        { enabled: true, setsBeforeReps: true },
        "225:3:5",
      ],
      want: {
        weight: 225,
        sets: 3,
        reps: 5,
        rpe: undefined,
      },
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
