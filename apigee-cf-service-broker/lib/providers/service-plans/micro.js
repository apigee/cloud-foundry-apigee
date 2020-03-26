const path = require('path')
const logger = require(path.resolve('./lib/helpers/logger'))

class Micro {
  // TODO implement me
  createProxy () {
    console.info('Implement me')
  }
  getUrlFromProxyToApp (param) {
    const { appName, baseAppsDomain, targetAppRoute } = param
    return `https://${this.name}.${appName}.${baseAppsDomain}/${targetAppRoute}`
  }

  deriveParams (params) {
    const microParams = {
      target_app_port: params.target_app_port.toString().trim(),
      target_app_route: params.target_app_route.toString().trim(),
      edgemicro_key: params.edgemicro_key.toString().trim(),
      edgemicro_secret: params.edgemicro_secret.toString().trim()
    }
    return microParams
  }

  validate (param) {
    let result
    // micro plan
    result = this.checkNonCoresidentPlan(param)
    if (result) {
      // oops - error
      return result
    }

    if (!param.micro) {
      result = logger.ERR_MICRO_PLAN_REQUIRES_MICRO()
    }
    return result
  }

  getOutputParam (param) {
    return { route_service_url: param.proxyURL }
  }

  async runBinding () {
    logger.log.info('Micro.runBinding.stub')
    return Promise.resolve({})
  }

  async runPostBinding() {
    logger.log.info('Micro.runPostBinding.stub')
    return Promise.resolve({})
  }
}

module.exports = Micro
