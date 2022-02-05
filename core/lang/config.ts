import pkg from "./package.json"
import type Bunyan from "bunyan"

export default {
  get name() {
    return pkg.name
  },
  get version() {
    return pkg.version
  },
  get logger() {
    return {
      logLevel: (process.env.LOG_LEVEL as Bunyan.LogLevel) || "info",
    }
  }
}
