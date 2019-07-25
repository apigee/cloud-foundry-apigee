const path = require('path')
const logger = require(path.resolve('./lib/helpers/logger'))

class MicroCoresident {
  // TODO implement me
  createProxy () {
    console.info('Implement me')
  }
  validate (param) {
    return this.checkCoresidentPlan(param)
  }

  getOutputParam (param) {
    const { credentials } = param

    return { credentials, route_service_url: param.proxyURL }
  }

  async runBinding (param) {
    logger.log.info('MicroCoresident.runBinding.stub')
    return Promise.resolve({})
  }

  async runPostBinding() {
    logger.log.info('MicroCoresident.runPostBinding.stub')
    return Promise.resolve({})
  }
}

module.exports = MicroCoresident
