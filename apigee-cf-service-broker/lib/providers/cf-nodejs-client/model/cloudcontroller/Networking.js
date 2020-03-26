"use strict";

const CloudControllerBase = require("./CloudControllerBase");
const rest = require("restler");//TODO: Analyze a way to remove this dependency
const fs = require("fs");

/**
 * This public class manages the operations related with Networking on Cloud Controller.
 */
class Networking extends CloudControllerBase {

  /**
   * Creates a new network policy on Cloud Controller.
   * {@link http://apidocs.cloudfoundry.org/214/apps/creating_an_app.html}
   *
   * @example REST - from cf -v add-network-policy edgemicro-app-harper --destination-app sample --protocol tcp --port 8080
   *  REQUEST: [2019-05-30T15:59:47+03:00]
   *  POST /networking/v1/external/policies HTTP/1.1
   *  Host: api.system.pcf24.apigee.xyz
   *  Accept: application/json
   *  Authorization: [PRIVATE DATA HIDDEN]
   *  Content-Type: application/json
   *  User-Agent: cf/6.44.1+c3b20bfbe.2019-05-08 (go1.12.5; amd64 linux)
   * {
   *   "policies": [
   *     {
   *       "destination": {
   *         "id": "destination app guid",
   *         "ports": {
   *           "end": 8080,
   *           "start": 8080
   *         },
   *         "protocol": "tcp"
   *       },
   *       "source": {
   *         "id": "source app guid"
   *       }
   *     }
   *   ]
   * }
   *
   */
  add (netOptions) {
    const url = `${this.API_URL}/networking/v1/external/policies`
    const options = {
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${this.UAA_TOKEN.token_type} ${this.UAA_TOKEN.access_token}`
      },
      // form is here because cf-networking api cant read application/json
      form: JSON.stringify(netOptions)
    }
    // this.HttpStatus.OK - deprecated status from cf api v1
    const result = this.REST.request(options, this.HttpStatus.OK, true)

    return result
  }
}

module.exports = Networking
