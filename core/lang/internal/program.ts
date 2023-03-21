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

interface Literal {
  kind: "literal"
  value: number
}

interface ShorthandExpression {
  kind: "shorthand"
  value: string
}

export type Statement = Literal | ShorthandExpression

export interface DeclaredExercise {
  name: string
  alias: string
  properties: Record<string, Literal>
}

export interface ExplicitExercise {
  kind: "explicit"
  name: string
  definition: {
    weight: Statement
    sets: Statement
    reps: Statement
    rpe?: Statement
  }
}

export interface ShorthandExercise {
  kind: "shorthand"
  name: string
  alias?: string
  value: string
}

export type TemplatedExercise = ExplicitExercise | ShorthandExercise

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
  inputs: { name: string, value: Statement }[]
}

export interface Schedule {
  blocks: Block[]
}

export interface RenderedExercise {
  name: string
  alias: string
  definition: {
    weight: number
    sets: number
    reps: number
    rpe?: number
  }
}

export interface RenderedSession {
  name: string
  exercises: RenderedExercise[]
}

export interface RenderedBlock {
  name: string
  sessions: RenderedSession[]
}

export interface RenderedProgram {
  schedule: {
    blocks: RenderedBlock[]
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
