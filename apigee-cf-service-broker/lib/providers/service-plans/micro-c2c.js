const path = require('path')
const logger = require(path.resolve('./lib/helpers/logger'))
const config = require(path.resolve('./config/environment'))
const { CFBinder } = require(path.resolve('./lib/providers/cf-binder'))

class Microc2c {
  // TODO implement me
  createProxy () {
    console.info('Implement me')
  }
  deriveParams (params) {
    const c2cParams = {
      target_app_port: params.target_app_port.toString().trim(),
      target_app_route: params.target_app_route.toString().trim(),
      target_app_space_name: params.target_app_space_name.toString().trim()
    }
    if (params.off_c2c_binding) {
      c2cParams.off_c2c_binding = true
    }
    return c2cParams
  }

  getUrlFromProxyToApp (param) {
    const { appName, baseAppsDomain, targetAppRoute, protocol, port } = param
    return `${protocol}://${appName}.${baseAppsDomain}:${port}/${targetAppRoute}`
  }

  validate (param) {
    let loggerError
    if (!param.micro_c2c.target_app_route) {
      loggerError = logger.ERR_MISSING_MICRO_C2C_PARAMETER(null, null, '"target_app_route"')
    } else if (!param.micro_c2c.target_app_port) {
      loggerError = logger.ERR_MISSING_MICRO_C2C_PARAMETER(null, null, '"target_app_port"')
    } else if (param.micro) {
      loggerError = logger.ERR_NOT_MICRO_PLAN()
    } else if (param.micro && param.micro.edgemicro_key) {
      loggerError = logger.ERR_NOT_MICRO_CORES_PLAN(null, null, '"edgemicro_key" parameter is invalid')
    } else if (param.micro && param.micro.edgemicro_secret) {
      loggerError = logger.ERR_NOT_MICRO_CORES_PLAN(null, null, '"edgemicro_secret" parameter is invalid')
    }
    return loggerError
  }

  getOutputParam (param) {
    return {
      route_service_url: param.proxyURL
    }
  }

  async runBinding (param) {
    const cfbinder = new CFBinder()
    try {
      const loginResponse = await cfbinder.login()
      if (loginResponse.error) {
        return loginResponse
      }

      const result = await cfbinder.runBinding({
        targetAppRoute: param.micro_c2c.target_app_route,
        spaceGuid: param.space_guid,
        targetAppPort: param.micro_c2c.target_app_port,
        domainForSearch: config.cf.appsInternalDomain
      })
      if (result.error) {
        return result
      }
      return result
    } catch (error) {
      throw logger.ERR_CF_BRS_FAILED(error)
    }
  }

  async runPostBinding () {
    logger.log.info('Microc2c.runPostBinding.stub')
    return Promise.resolve({})
  }
}

module.exports = Microc2c
