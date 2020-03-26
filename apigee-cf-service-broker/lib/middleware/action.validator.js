const path = require('path')
const logger = require(path.resolve('./lib/helpers/logger'))
const { quote } = require(path.resolve('./lib/helpers/string'))
const { deriveAction } = require(path.resolve('./lib/helpers/extractors'))
const { VERBS } = require(path.resolve('./lib/helpers/enums'))

const actionValidate = (req, res, next) => {
  const action = deriveAction(req.body.parameters)

  if (action.errors.length) {
    const loggerError = logger.ERR_SPECIFIED_UNSUPPORTED_ACTION(null, null, action.errors.map(quote).join(', '))

    return res.status(400).json(loggerError)
  }
  else if (action.any) {
    return next()
  }
  else {
    const loggerError = logger.ERR_MISSING_SUPPORTED_ACTION(null, null, VERBS.map(quote).join(' or '))

    return res.status(400).json(loggerError)
  }
}

module.exports = {
  actionValidate
}