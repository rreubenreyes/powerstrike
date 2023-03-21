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
      wantErr: true,
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
      name: "invalid declared exercises: not a list",
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
      name: "invalid declared exercise name: not a string",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises:
          - name: 2
      `],
      wantErr: true,
    },
    {
      name: "invalid declared exercise property: not a number",
      args: [`
        defaults:
          units: kilograms
          exercises:
            shorthand:
              enabled: true
              sets_before_reps: true

        exercises:
          - name: squat
            alias: squat
            prop: invalid
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
      name: "invalid blocks",
      args: [`
        schedule:
          blocks: invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid schedule",
      args: [`
        schedule: invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid program",
      args: [`2`],
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
                - squat_starting_weight: 225
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
    {
      name: "invalid templates - not a list",
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

        templates: invalid

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid templates - not a list of map",
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
          - invalid

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid template name - not a string",
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
          - name: 2

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid template inputs - not a list",
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
          - name: test
            inputs: invalid

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid template inputs - not a list of string",
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
          - name: test
            inputs:
              - valid
              - 2

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid template sessions - not a list",
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
          - name: test
            inputs:
              - valid
            sessions: invalid

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid template sessions - not a list of map",
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
          - name: test
            inputs:
              - valid
            sessions:
              - invalid

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid template session name - not a string",
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
          - name: test
            inputs:
              - valid
            sessions:
              - name: 2

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid templated exercises - not a list",
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
          - name: test
            inputs:
              - valid
            sessions:
              - name: test
                exercises: invalid

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid templated exercise - not a map",
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
          - name: test
            inputs:
              - valid
            sessions:
              - name: test
                exercises:
                  - 2

        schedule:
          blocks:
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid blocks: not a list of map",
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
            - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid block name: not a string",
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
            - name: 2
      `],
      wantErr: true,
    },
    {
      name: "invalid block template: not a string",
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
              template: 2
      `],
      wantErr: true,
    },
    {
      name: "invalid block inputs: not a list",
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
              inputs: invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid block inputs: not a list of map",
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
                - invalid
      `],
      wantErr: true,
    },
    {
      name: "invalid block inputs: not a list of map of (string, number)",
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
                - test: true
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
