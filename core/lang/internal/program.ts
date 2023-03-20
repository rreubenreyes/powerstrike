export interface Defaults {
  units: string
  exercises: {
    properties: string[],
  },
  shorthand: {
    enabled: boolean
    setsBeforeReps: boolean
  }
}

export interface DeclaredExercise {
  name: string
  alias: string
}

export interface ExplicitExercise {
  weight: number
  sets: number
  reps: number
  rpe?: number
}

interface ShorthandStatement {
  kind: "shorthand"
  value: string
}

export type TemplatedExercise = ExplicitExercise | ShorthandStatement

interface LiteralStatement {
  kind: "literal"
  value: unknown
}

export type Statement = ShorthandStatement | LiteralStatement

export interface Session {
  name: string
  exercises: TemplatedExercise[]
}

export interface Template {
  name: string
  alias: string
  inputs: string[]
  // outputs: string[]
  sessions: Session[]
}

export interface Block {
  name: string
  template: string
  inputs: { name: string, value: number }[]
}

export interface Schedule {
  blocks: Block[]
}

export interface RenderedProgram {
  schedule: {
    blocks: {
      name: string
      sessions: {
        name: string
        exercises: ExplicitExercise
      }[]
    }
  }
}

export function defaultDefaults(): Defaults {
  return {
    units: "kilograms",
    exercises: {
      properties: ["starting weight"]
    },
    shorthand: {
      enabled: true,
      setsBeforeReps: true,
    }
  }
}
