const ApigeeControllerBase = require('./base')

/**
 * Manage API products on Apigee
 */
class ApiProduct extends ApigeeControllerBase {

  /**
   * Get api product list from apigee
   * {@link http://apidocs.cloudfoundry.org/214/events/list_all_events.html}
   *
   * @param  {JSON} filter [Query String Parameters]
   * @return {JSON}              [return a JSON response]
   */
  async getList (filter) {
    const { org } = filter

    const url = `${this.getApiUrl(false)}/organizations/${org}/apiproducts?expand=true`;

    const options = {
      method: "GET",
      url: url,
      headers: {
        Authorization: `${this.AUTH_TOKEN.token_type} ${this.AUTH_TOKEN.access_token}`
      },
      useQuerystring: true
    };

    const result =  this.REST.request(options, this.HttpStatus.OK, true);

    return result
  }

  /*
  * @description
  *
  * {@link http://apidocs.cloudfoundry.org/214/events/list_all_events.html}
  *
  * @param
  *
  * @returns
  *
  * */
  add (param) {
    const { org } = param

    const url = `${this.getApiUrl(false)}/organizations/${org}/apiproducts`

    const options = {
      method: "POST",
      url: url,
      headers: {
        Authorization: `${this.AUTH_TOKEN.token_type} ${this.AUTH_TOKEN.access_token}`
      },
      json: param
    };

    const result = this.REST.request(options, this.HttpStatus.CREATED, true)

    return result
  }
}

module.exports = ApiProduct;
