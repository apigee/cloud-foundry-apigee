const path = require('path')
require('dotenv').config()

const yaml = require('js-yaml')
const fs = require('fs')
const fromManifest = yaml.safeLoad(fs.readFileSync(path.resolve('./manifest.yml'), 'utf8'))

// nconf.defaults(Object.assign({}, defaults, fromManifest.env))

// Development specific configuration
// ==================================
module.exports = {
  defaults: fromManifest.env,
  cf: {
    user: 'cftester',
    password: 'cftesting',
    appsBaseDomain: 'cf-base-domain',
    microgatewayAppName: 'c2c-mg-name',
    brokerAppName: 'cf-broker-name'
  },
  auth: {
    securityUserName: 'tester',
    securityUserPassword: 'testing',
    type: 'staticauth'
  }
};
