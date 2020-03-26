const path = require('path')
const logger = require(path.resolve('./lib/helpers/logger'))

const authValidate = (req, res, next) => {
  const params = req.body.parameters

  if (params.user && params.pass) {
    next()
  } else if (params.basic) {
    next()
  } else if (params.bearer) {
    next()
  } else {
    res.status(400)
    const loggerError = logger.ERR_MISSING_AUTH()
    res.json(loggerError)
  }
}

module.exports = {
  authValidate
}