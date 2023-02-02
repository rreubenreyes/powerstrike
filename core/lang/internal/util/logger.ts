import bunyan from "bunyan"

import config from "../../config"

const logger = bunyan.createLogger({
  name: config.name,
  level: config.logger.logLevel,
})

export default logger
