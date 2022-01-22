export const Time = {
  Second: "second",
  Minute: "minute",
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year",
} as const

export interface ExerciseDefinition {
  name: string
  kind: "simple" | "complex"
  sets?: number
  reps?: number
  weight?: number
  comment?: string
}

export interface Exercise {
  name: string
  kind: "simple" | "complex"
  sets: number
  reps: number
  weight: number
  comment?: string
}

export interface Template {
  inputs: string[]
  sessions: {
    key: string
    exercises: ExerciseDefinition[]
  }[]
}

export interface FilledTemplate {
  sessions: {
    key: string
    exercises: Exercise[]
  }[]
}

export interface Schedule {
  period: typeof Time[keyof typeof Time];
  blocks: FilledTemplate[]
}

