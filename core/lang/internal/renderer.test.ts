import * as renderer from "./renderer"
import type * as program from "./program"

describe("shorthand~resolve", () => {
  interface Test {
    name: string,
    args: [string],
    want?: program.RenderedProgram
    wantErr: boolean,
  }

  const fn = renderer.render
  const tests: Test[] = [
    {
      name: "empty program",
      args: [""],
      want: {
        schedule: {
          blocks: []
        }
      },
      wantErr: false,
    },
    {
      name: "explicitly declared exercises",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises:
          - name: squat
            starting_weight: 225

        templates:
          - name: test template
            inputs:
              - squat_starting_weight
            sessions:
              - name: test session
                exercises:
                  - squat:
                      weight: squat_starting_weight
                      sets: 5
                      reps: 5

        schedule:
          blocks:
            - name: test block
              template: test template
              inputs:
                - squat_starting_weight: squat.starting_weight + 20
      `],
      want: {
        schedule: {
          blocks: [
            {
              name: "test block",
              sessions: [
                {
                  name: "test session",
                  exercises: [
                    {
                      name: "squat",
                      alias: "squat",
                      definition: {
                        weight: 245,
                        sets: 5,
                        reps: 5,
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      wantErr: false,
    },
    {
      name: "invalid exercise definition",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises:
          - name: squat
            starting_weight: 225

        templates:
          - name: test template
            inputs:
              - squat_starting_weight
            sessions:
              - name: test session
                exercises:
                  - squat: 2

        schedule:
          blocks:
            - name: test block
              template: test template
              inputs:
                - squat_starting_weight: squat.starting_weight + 20
      `],
      wantErr: true,
    },
    {
      name: "invalid declared exercises",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises: invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid session",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises:
          - name: squat
            starting_weight: 225

        templates:
          - name: test template
            inputs:
              - squat_starting_weight
            sessions: invalid

        schedule:
          blocks:
            - name: test block
              template: test template
              inputs:
                - squat_starting_weight: squat.starting_weight + 20
      `],
      wantErr: true,
    },
    {
      name: "implicit and explicit shorthand",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises:
          - name: squat
            starting_weight: 225
          - name: deadlift
            starting_weight: 225

        templates:
          - name: test template
            inputs:
              - squat_starting_weight
              - deadlift_starting_weight
            sessions:
              - name: test session
                exercises:
                  - squat: (squat_starting_weight):5:5
                  - deadlift: !shorthand (deadlift_starting_weight):5:5

        schedule:
          blocks:
            - name: test block
              template: test template
              inputs:
                - squat_starting_weight: squat.starting_weight + 20
                - deadlift_starting_weight: deadlift.starting_weight + 20
      `],
      want: {
        schedule: {
          blocks: [
            {
              name: "test block",
              sessions: [
                {
                  name: "test session",
                  exercises: [
                    {
                      name: "squat",
                      alias: "squat",
                      definition: {
                        weight: 245,
                        sets: 5,
                        reps: 5,
                      }
                    },
                    {
                      name: "deadlift",
                      alias: "deadlift",
                      definition: {
                        weight: 245,
                        sets: 5,
                        reps: 5,
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      wantErr: false,
    },
    {
      name: "templates can directly refer to declared exercises",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises:
          - name: squat
            starting_weight: 225

        templates:
          - name: test template
            inputs:
              - squat_starting_weight
            sessions:
              - name: test session
                exercises:
                  - squat: (squat.starting_weight):5:5

        schedule:
          blocks:
            - name: test block
              template: test template
              inputs:
                - squat_starting_weight: squat.starting_weight + 20
      `],
      want: {
        schedule: {
          blocks: [
            {
              name: "test block",
              sessions: [
                {
                  name: "test session",
                  exercises: [
                    {
                      name: "squat",
                      alias: "squat",
                      definition: {
                        weight: 225,
                        sets: 5,
                        reps: 5,
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      wantErr: false,
    },
    {
      name: "throws on referencing undeclared exercise",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises:
          - name: squat
            starting_weight: 225

        templates:
          - name: test template
            inputs:
              - squat_starting_weight
            sessions:
              - name: test session
                exercises:
                  - deadlift: (deadlift_starting_weight):5:5

        schedule:
          blocks:
            - name: test block
              template: test template
              inputs:
                - squat_starting_weight: squat.starting_weight + 20
      `],
      wantErr: true,
    },
    {
      name: "throws on referencing undeclared template",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises:
          - name: squat
            starting_weight: 225

        templates:
          - name: test template
            inputs:
              - squat_starting_weight
            sessions:
              - name: test session
                exercises:
                  - squat: (squat_starting_weight):5:5

        schedule:
          blocks:
            - name: test block
              template: not declared
              inputs:
                - squat_starting_weight: squat.starting_weight + 20
      `],
      wantErr: true,
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
