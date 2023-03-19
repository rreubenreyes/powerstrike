import yaml from "js-yaml"

import * as errors from "./errors"
import * as program from "./program"

// const evaluateType = new yaml.Type("!evaluate", {
//   kind: "mapping",
//   resolve: (data) => typeof data === "string",
//   construct: (data): program.Statement => {
//     if (typeof data !== "string") {
//       throw new errors.InvalidEvaluateType("!evaluate tags must be used with strings")
//     }

//     return {
//       kind: "evaluated",
//       definition: data
//     }
//   }
// })

const shorthandType = new yaml.Type("!shorthand", {
  kind: "mapping",
  resolve: (data) => typeof data === "string",
  construct: (data): program.Statement => {
    if (typeof data !== "string") {
      throw new errors.InvalidEvaluateType("!evaluate tags must be used with strings")
    }

    return {
      kind: "shorthand",
      value: data
    }
  }
})

export const schema = yaml.DEFAULT_SCHEMA.extend([
  // evaluateType,
  shorthandType
])
