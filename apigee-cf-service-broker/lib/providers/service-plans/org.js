const path = require('path')
const logger = require(path.resolve('./lib/helpers/logger'))

class Org {
  // TODO implement me
  createProxy () {
    console.info('Implement me')
  }

  validate (param) {
    const result = this.checkNonCoresidentPlan(param)

    if (result) {
      return result
    }

    if (param.micro) {
      return logger.ERR_NOT_MICRO_PLAN()
    } else if (!param.bind_resource) {
      return logger.ERR_BIND_RESOURCE_REQURED()
    }
    return result
  }

  getOutputParam (param) {
    return { route_service_url: param.proxyURL }
  }

  async runBinding (param) {
    logger.log.info('Org.runBinding.stub')
    return Promise.resolve({})
  }

  async runPostBinding() {
    logger.log.info('Org.runPostBinding.stub')
    return Promise.resolve({})
  }
}

module.exports = Org
