const path = require('path');
require('dotenv').config();

// Development specific configuration
// ==================================
module.exports = {
  cf: {
    user: process.env.CF_LOGIN,
    password: process.env.CF_LOGIN_PASSWORD,
    appsBaseDomain: process.env.APPS_BASE_DOMAIN,
    microgatewayAppName: process.env.MICROGATEWAY_APP_NAME,
    brokerAppName: process.env.BROKER_APP_NAME,

    loginEndpoint: process.env.LOGIN_ENDPOINT,
    apiUrl: process.env.CF_API_URL,
    appsInternalDomain: process.env.APPS_INTERNAL_DOMAIN
  },
  auth: {
    securityUserName: process.env.SECURITY_USER_NAME,
    securityUserPassword: process.env.SECURITY_USER_PASSWORD,
    type: 'staticauth'
  }
};
