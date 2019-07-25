const path = require('path')
const Org = require('./org')
const Micro = require('./micro')
const Microc2c = require('./micro-c2c')
const MicroCoresident = require('./micro-coresident')
const Portal = require('./portal')
const config = require(path.resolve('./config/environment'))
const logger = require(path.resolve('./lib/helpers/logger'))
const { guid } = require(path.resolve('./lib/providers/catalog_data'))
const { SERVICE_PLANS } = require(path.resolve('./lib/helpers/enums'))

class ServicePlans {
  checkNonCoresidentPlan (param) {
    let loggerError
    if (param.target_app_route) {
      loggerError = logger.ERR_NOT_MICRO_CORES_PLAN(null, null, '"target_app_route" parameter is invalid')
    } else if (param.target_app_port) {
      loggerError = logger.ERR_NOT_MICRO_CORES_PLAN(null, null, '"target_app_port" parameter is invalid')
    } else if (param.edgemicro_key) {
      loggerError = logger.ERR_NOT_MICRO_CORES_PLAN(null, null, '"edgemicro_key" parameter is invalid')
    } else if (param.edgemicro_secret) {
      loggerError = logger.ERR_NOT_MICRO_CORES_PLAN(null, null, '"edgemicro_secret" parameter is invalid')
    }

    return loggerError
  }

  checkCoresidentPlan (param) {
    let loggerError

    if (!param.micro_coresident.target_app_route) {
      loggerError = logger.ERR_MISSING_MICRO_CORES_PARAMETER(null, null, '"target_app_route" is required')
    } else if (!param.micro_coresident.target_app_port) {
      loggerError = logger.ERR_MISSING_MICRO_CORES_PARAMETER(null, null, '"target_app_port" is required')
    } else if (!param.micro_coresident.edgemicro_key) {
      loggerError = logger.ERR_MISSING_MICRO_CORES_PARAMETER(null, null, '"edgemicro_key" is required')
    } else if (!param.micro_coresident.edgemicro_secret) {
      loggerError = logger.ERR_MISSING_MICRO_CORES_PARAMETER(null, null, '"edgemicro_secret" is required')
    } else if (param.micro) {
      loggerError = logger.ERR_NOT_MICRO_PLAN()
    } else if (param.bind_resource.route) {
      loggerError = logger.ERR_BAD_BIND_COMMAND()
    }

    return loggerError
  }

  getProvider (param) {
    let result

    let loggerError

    if (param.plan_id === guid.org) {
      result = new Org()
      result.name = SERVICE_PLANS.org
    } else if (param.plan_id === guid.micro_coresident) {
      // micro coresident plan
      result = new MicroCoresident()
      result.name = SERVICE_PLANS.microCoresident
    } else if (param.plan_id === guid.micro) {
      // micro plan
      result = new Micro()
      result.name = SERVICE_PLANS.micro
    } else if (param.plan_id === guid.micro_c2c) {
      // Micro C2C plan
      result = new Microc2c()
      result.name = SERVICE_PLANS.microc2c
    } else if (param.plan_id === guid.portal) {
      // Portal plan
      result = new Portal()
      result.name = SERVICE_PLANS.portal
    } else {
      // unknown plan
      loggerError = logger.ERR_INVALID_SERVICE_PLAN()
    }

    if (loggerError) {
      return { error: loggerError }
    }
    // mixins for plan instances from the provider
    // they used in plan.validate
    result.checkNonCoresidentPlan = this.checkNonCoresidentPlan.bind(result)
    result.checkCoresidentPlan = this.checkCoresidentPlan.bind(result)

    loggerError = result.validate(param)

    if (loggerError) {
      return { error: loggerError }
    }
    return result
  }

  validate (body) {
    if (!body.parameters.target_app_route) {
      return logger.ERR_MISSING_TARGET_APP_ROUTE()
    }
    return false
  }

  getOutputParam (body) {
    if (body.bind_resource && body.bind_resource.route) {
      return { route_service_url: `${body.parameters.protocol}://${body.bind_resource.route}` }
    }
    return { route_service_url: `${body.parameters.protocol}://${body.parameters.target_app_route}.${config.cf.appsBaseDomain}` }
  }
}

module.exports = ServicePlans
