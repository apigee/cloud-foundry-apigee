'use strict'

const Promise = require('bluebird')
const request = require('request')
const rest = require('restler')
const HttpStatus = require('./http-status')

/**
 * HttpUtils is a private class designed manage REST operations with
 * Cloud Foundry components (Cloud controller, UAA, Metrics).
 * It is used by all classes of project.
 */
class HttpUtils {

  /**
   * Empty constructor
   * @constructor
   * @returns {void}
   */
  constructor () {

  }

  /**
   * Stablish a http communications using REST Verbs: GET/POST/PUT/DELETE
   *
   * @param  {json} options          [define options to make the request with the CF component]
   * @param  {number} httpStatusAssert [set expected http status code (200,201,204, etc...)]
   * @param  {boolan} jsonOutput       [if the REST method retuns a String or a JSON representation]
   * @return {string}                  [JSON/String]
   *
   * @example
   * var url = "https://api.run.pivotal.io/v2/info";
   *       var options = {
   *           method: 'GET',
   *           url: url
   *       };
   * HttpUtils.request(options, "200", true);
   */
  request (options, httpStatusAssert, jsonOutput) {
    let result = null

    //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const requestWithDefaults = request.defaults({
      rejectUnauthorized: false
    })

    return new Promise(function (resolve, reject) {
      let localResponse
      try {
        requestWithDefaults(options, function (error, response, body) {
          localResponse = response
          if (error) {
            return reject(error)
          }

          if (jsonOutput) {
            try {
              Object.prototype.toString.call(body) === '[object String]'
                ? result = JSON.parse(body)
                : result = body
            } catch (errorJSON) {
              console.info('errorJSON', errorJSON, body)
              return reject(body)
            }
          } else {
            result = body
          }

          if (!error && response.statusCode === httpStatusAssert) {
            return resolve(result)
          }

          //Defensive code.
          if (body.length === 0) {
            return reject('EMPTY_BODY')
          }

          if (!error && options.method === 'POST') {
            if (response.statusCode === HttpStatus.CREATED && /networking\/v1\/external\/policies/.test(options.url)) {
              return resolve(response)
            }
          }

          return reject(body)
        })
      } catch (error) {
        return reject(error)
      }
    })
  }

  /**
   * Method designed to upload zip file to Cloud Controller.
   * It is the unique usage of Restler dependency.
   *
   * @param  {string} url              [url]
   * @param  {json} options          [options]
   * @param  {number} httpStatusAssert [set expected http status code (200,201,204, etc...)]
   * @param  {boolan} jsonOutput       [if the REST method retuns a String or a JSON representation]
   * @return {string}                  [JSON/String]
   */
  upload (url, options, httpStatusAssert, jsonOutput) {

    return new Promise(function (resolve, reject) {

      try {

        rest.put(url, options).on('complete', function (result, response) {
          if (result instanceof Error) {
            reject(result)
          }

          if (response.statusCode === httpStatusAssert) {

            if (jsonOutput) {
              return resolve(JSON.parse(result))
            }

            return resolve(result)
          }
        })

      } catch (error) {
        return reject(error)
      }

    })
  }
}

module.exports = HttpUtils
