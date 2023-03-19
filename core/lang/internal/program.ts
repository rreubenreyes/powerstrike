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
  rendersAs: string
}

export interface TemplatedExercise {
  name: string
  definition: {
    weight: number
    sets: number
    reps: number
    rpe?: number
  }
}

interface ShorthandStatement {
  kind: "shorthand"
  value: string
}

interface LiteralStatement {
  kind: "literal"
  value: unknown
}

export type Statement = ShorthandStatement | LiteralStatement

interface Session {
  name: string
  exercises: Record<string, {
    weight: Statement
    sets: Statement
    reps: Statement
  }>[]
}

export interface Template {
  name: string
  rendersAs: string
  inputs: string[]
  outputs: string[]
  sessions: Session[]
}

interface Block {
  name: string
  template: string
  inputs: Record<string, Statement>[]
}

export interface Schedule {
  blocks: Block[]
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
