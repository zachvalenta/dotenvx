const logger = require('./../shared/logger')
const dotenv = require('dotenv')

const config = function (options) {
  return dotenv.config(options)
}

const parse = function (src) {
  const result = dotenv.parse(src)

  logger.debug(result)

  return result
}

const populate = function (processEnv = {}, parsed = {}, overload = false) {
  if (typeof parsed !== 'object') {
    throw new Error('OBJECT_REQUIRED: Please check the parsed argument being passed to populate')
  }

  const populated = new Set()
  const preExisting = new Set()

  // set processEnv
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (overload === true) {
        processEnv[key] = parsed[key]
        populated.add(key)

        logger.verbose(`${key} set`)
        logger.debug(`${key} set to ${parsed[key]}`)
      } else {
        preExisting.add(key)

        logger.verbose(`${key} pre-exists`)
        logger.debug(`${key} pre-exists as ${processEnv[key]}`)
      }
    } else {
      processEnv[key] = parsed[key]
      populated.add(key)

      logger.verbose(`${key} set`)
      logger.debug(`${key} set to ${parsed[key]}`)
    }
  }

  return {
    populated,
    preExisting
  }
}

module.exports = {
  config,
  parse,
  populate
}
