const ApigeeControllerBase = require("./base");

/**
 *
 * @description Manage API folders on Apigee
 *
 */
class ApigeeForlders extends ApigeeControllerBase {
  /*
  * @description
  *
  * @param
  *
  * @returns
  *
  * */
  getName (param) {
    return `${param.portal.target_app_name}-spec`
  }

  /**
   *
   * @description Add new folder
   *
   */
  async add (param) {
    const url = `${this.getApiUrl(true)}/organizations/${param.org}/specs/folder`

    const options = {
      method: "POST",
      url: url,
      headers: {
        Authorization: `${this.AUTH_TOKEN.token_type} ${this.AUTH_TOKEN.access_token}`
      },
      json: param
    }

    return  this.REST.request(options, this.HttpStatus.OK, true)
  }

  /**
   *
   * @description List of folders for organisation
   *
   */
  async getList (param) {
    const url = `${this.getApiUrl(true)}/organizations/${param.org}/specs/folder/home`

    const options = {
      method: 'GET',
      url: url,
      headers: {
        Authorization: `${this.AUTH_TOKEN.token_type} ${this.AUTH_TOKEN.access_token}`
      },
      useQuerystring: true
    }

    const result =  this.REST.request(options, this.HttpStatus.OK, true);

    return result
  }
}

module.exports = ApigeeForlders
