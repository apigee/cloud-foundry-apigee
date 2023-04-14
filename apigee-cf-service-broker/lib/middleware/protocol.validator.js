const path = require('path')
const logger = require(path.resolve('./lib/helpers/logger'))
const { deriveProtocol } = require(path.resolve('./lib/helpers/extractors'))

const protocolValidate = (req, res, next) => {
  const proto = deriveProtocol(req.body.parameters)

  if ("error" in proto) {
    const loggerError = logger.ERR_INVALID_TARGET_PROTOCOL(null, null, '"' + proto.error + '". A valid "protocol" is either "http" or "https".')
    res.status(400).json(loggerError)
  }
  else {
    next()
  }
}

module.exports = {
  protocolValidate
}