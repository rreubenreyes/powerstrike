import VError from "verror"

export class ContextPathNotExistsError extends VError {
  constructor(message: string, overrideOpts: VError.Options = {}) {
    super({
      ...overrideOpts,
      name: "ContextPathNotExistsError",
    }, message)
  }
}
