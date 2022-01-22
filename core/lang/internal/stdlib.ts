export { Time } from "./typedef"

export const Scheme = {
  AMRAP: "AMRAP",
  EMOM: "EMOM",
  MRS: "MRS",
  RM: (limit: number) => `${limit}RM`,
}

export const Units = {
  Kilogram: "kg",
  Pound: "lb",
}

