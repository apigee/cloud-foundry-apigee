const path = require('path')
const nconf = require('nconf')
const _ = require('lodash')
const logger = require(path.resolve('./lib/helpers/logger'))

let vcapApplicationConfig

Object.prototype.toString.call(process.env.VCAP_APPLICATION) === '[object String]'
  ? vcapApplicationConfig = JSON.parse(process.env.VCAP_APPLICATION)
  : vcapApplicationConfig = {
    // for tests and local usage
    application_name: 'cf-broker-name'
  }

// All configurations will extend these options
// ============================================
const all = {
  vcapApplication: vcapApplicationConfig,
  env: process.env.NODE_ENV || 'development',
  // Server port
  port: process.env.PORT || 8888,
  // Server IP
  ip: process.env.IP || '0.0.0.0',
  defaults: {
    APIGEE_DASHBOARD_URL: 'https://enterprise.apigee.com/platform/#/',
    APIGEE_MGMT_API_URL: 'https://api.enterprise.apigee.com/v1',
    APIGEE_PROXY_DOMAIN: 'apigee.net',
    APIGEE_PROXY_HOST_TEMPLATE: '${org}-${env}.${domain}',
    APIGEE_PROXY_NAME_TEMPLATE: 'cf-${route}',
    auth: 'staticauth'
  }
};

// read in specific apigee configurations
all.getApigeeConfiguration = (userOrg, userEnv, callback) => {
  const configString = nconf.get('APIGEE_CONFIGURATIONS')

  let configurations

  if (configString) {
    try {
      configurations = JSON.parse(configString)
    } catch (e) {
      logger.log.error(e)

      const loggerError = logger.ERR_CONFIG_PARSE(
        null,
        null,
        `${configString}. With ERROR message: "${e.message}". Please make sure your configuration is in the correct JSON format`
      )
      return callback(loggerError)
    }

    for (var i = 0; i < configurations.length; i++) {
      if (configurations[i].org === userOrg && configurations[i].env === userEnv) {
        Object.keys(configurations[i]).forEach(function (key) {
          nconf.set(key.toUpperCase(), configurations[i][key])
          logger.log.info('Config key: ', key.toUpperCase(), ' = ', configurations[i][key])
        })
        return callback(null, nconf)
      }
    }
    const loggerError = logger.ERR_ORG_ENV_NOT_FOUND(
      null,
      null,
      `Specified "org" = "${userOrg}" with "env" = "${userEnv}" do not exist in your Tile or Open Source Cloud Foundry configuration. Please contact your Cloud Foundry administrator for more assistance`)
    return callback(loggerError)
  }
  const loggerError = logger.ERR_NO_CONFIGURATION()
  callback(loggerError)
}

// arguments, environment vars
nconf.use('memory')
  .argv()
  .env()
  .defaults(all.defaults)

all.default = nconf

// Export the config object based on the NODE_ENV
// ==============================================
/* eslint-disable */
const mod = require(`./${all.env.toLowerCase()}.js`) || {};
/* eslint-enable */

module.exports = _.merge(
  all,
  mod,
);
