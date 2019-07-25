const path = require('path')
const config = require(path.resolve('./config/environment'))
const logger = require(path.resolve('./lib/helpers/logger'))

const configValidate = (req, res, next) => {
  const org = (req.body.parameters && req.body.parameters.org) ? req.body.parameters.org.toString().trim() : ''
  const env = (req.body.parameters && req.body.parameters.env) ? req.body.parameters.env.toString().trim() : ''

  let loggerError
  if (org && env) {
    config.getApigeeConfiguration(org, env, function(err, data){
      if (err){
        loggerError = err
      }
    })
    if (loggerError){
      res.status(400)
      return res.json(loggerError)
    }
    else {
      return next()
    }
  }
  else if (org){
    res.status(400)
    loggerError = logger.ERR_MISSING_ENV()
    return res.json(loggerError)
  }
  else if (env){
    res.status(400)
    loggerError = logger.ERR_MISSING_ORG()
    return res.json(loggerError)
  }
  else{
    res.status(400)
    loggerError = logger.ERR_MISSING_ENV_ORG()
    return res.json(loggerError)
  }
}

module.exports = {
  configValidate
}