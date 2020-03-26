const path = require('path')
const url = require('url')
const YAML = require('json-to-pretty-yaml')
const ApigeeControllerBase = require('./base')
const { SPEC_KINDS } = require(path.resolve('./lib/helpers/enums'))
const logger = require(path.resolve('./lib/helpers/logger'))

/**
 * Manage API products on Apigee
 */
class ApigeeSpecs extends ApigeeControllerBase {
  /*
  * @description
  *
  * @param
  *
  * @returns
  *
  * */
  generateName (param) {
    // ",", ".", "-", "_"
    const result = `Spec for ${param.proxyname.replace(/[,.-]/gi, '')}`

    return result
  }

  /*
  * @description
  *
  * @param
  *
  * @returns
  *
  * */
  async getSpecFromAppAsYaml (url, proxyURL) {
    const urlObject = new URL(proxyURL)

    logger.log.info(`ApigeeSpecs.getSpecFromAppAsYaml url: ${url}`)

    const options = {
      method: 'GET',
      url: url,
      headers: {
        Authorization: `${this.AUTH_TOKEN.token_type} ${this.AUTH_TOKEN.access_token}`
      }
    };
    const result = await this.REST.request(options, this.HttpStatus.OK, true)

    result.host = urlObject.host
    result.basePath = `/${urlObject.pathname.trim().split('/')[1]}`

    const yaml = YAML.stringify(result)

    return yaml
  }
  /*
  * https://apigee.com/organizations/<ORG-NAME>/specs/doc
  *
  * kind: "Doc"
  * name: "sample-doc"
  * folder: FOLDER-ID
  * */
  async add (param) {
    const { org, folderId, name } = param

    const url = `${this.getApiUrl(true)}/organizations/${org}/specs/doc`

    const specParams = {
      kind: SPEC_KINDS.doc,
      folder: folderId,
      name
    }

    const options = {
      method: 'POST',
      url: url,
      headers: {
        Authorization: `${this.AUTH_TOKEN.token_type} ${this.AUTH_TOKEN.access_token}`
      },
      json: specParams
    };

    const result = this.REST.request(options, this.HttpStatus.CREATED, true)

    return result
  }

  /*
  * @description
  *
  * @param
  *
  * @returns
  *
  * */
  async update (param) {
    const { org, specId, body } = param

    const url = `${this.getApiUrl(true)}/organizations/${org}/specs/doc/${specId}/content`

    const options = {
      method: 'PUT',
      url: url,
      headers: {
        Authorization: `${this.AUTH_TOKEN.token_type} ${this.AUTH_TOKEN.access_token}`,
        'Content-type': 'text/plain'
      },
      body
    }

    return this.REST.request(options, this.HttpStatus.OK, false)
  }
  /*
  * {
       "id":147770,
       "folder":147770,
       "kind":"Folder",
       "name":"/orgs/yauhenikisialiou-eval root",
       "created":"2019-02-26T17:07:45.805Z",
       "modified":"2019-02-26T17:07:45.805Z",
       "content":[
          {
             "id":174245,
             "folder":147770,
             "kind":"Folder",
             "name":"test",
             "created":"2019-06-11T11:13:38.612Z",
             "modified":"2019-06-11T11:13:38.612Z"
          }
       ]
    }
  * */
  /*
  * @description
  *
  * @param
  *
  * @returns
  *
  * */
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

    const result = this.REST.request(options, this.HttpStatus.OK, true);

    return result
  }
}

module.exports = ApigeeSpecs
