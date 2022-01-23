export const Time = {
  Any: "any",
  Second: "second",
  Minute: "minute",
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year",
} as const

export interface ExerciseDef {
  name: string
  kind?: "simple" | "complex"
  sets?: number
  reps?: number
  weight?: number
  comment?: string
}

export interface CompleteExercise {
  name: string
  kind: "simple" | "complex"
  sets: number
  reps: number
  weight: number
  comment?: string
}

export interface TemplateDef {
  inputs: string[]
  sessions: {
    key: string
    exercises: ExerciseDef[]
  }[]
}

export interface CompleteTemplate {
  sessions: {
    key: string
    exercises: CompleteExercise[]
  }[]
}

export interface Schedule {
  period: typeof Time[keyof typeof Time];
  blocks: CompleteTemplate[]
}

export function createSchedule(opts: Partial<Schedule>): Schedule {
  const {
    period = Time.Any,
    blocks = []
  } = opts

  return { period, blocks }
}
