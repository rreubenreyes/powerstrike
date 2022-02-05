import VError from "verror"

function define(name: string): typeof err {
  const err = class extends VError { // eslint-disable-line
    constructor(message: string, overrideOpts: VError.Options = {}) {
      super({
        ...overrideOpts,
        name,
      }, message)
    }
  }
  Object.defineProperty(err, "name", { value: name })

  return err
}

export const InvalidContextPathError = define("InvalidContextPathError")
export const UnexpectedTokenError = define("UnexpectedTokenError")
