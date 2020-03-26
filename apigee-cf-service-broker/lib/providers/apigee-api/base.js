const path = require('path')
const config = require(path.resolve('./config/environment'))
const HttpUtils = require(path.resolve('./lib/helpers/http-utils'))
const HttpStatus = require(path.resolve('./lib/helpers/http-status'))

/**
 *
 */
class ApigeeControllerBase {

  /**
   * @constructor
   * @returns {void}
   */
  constructor() {
    this.API_URL = config.defaults.APIGEE_MGMT_API_URL
    this.REST = new HttpUtils();
    this.HttpStatus = HttpStatus;
  }

  getApiUrl (unoficial = false) {
    // TODO investigate me - unoficial way for development only
    if (unoficial) return 'https://apigee.com'

    return this.API_URL
  }

  /**
   * Set token
   * @param {JSON} token [Oauth token from get_token apigee cli]
   *  { token_type: String, access_token: String }
   *
   */
  setToken (token) {
    this.AUTH_TOKEN = token;
  }
}

module.exports = ApigeeControllerBase