"use strict";

const ApigeeControllerBase = require("./base");

/**
 * Manage API products on Apigee
 */
class ApigeePortalPlan extends ApigeeControllerBase {
  generateName (param) {
    return `Portal for ${param.portal.target_app_route}`
  }
  /*
  * @description
  *
  * @param
  *
  * @returns
  *
  * */
  generatePortalId (name, orgname) {
    const clearedRoute = name.replace(/[\W\s]/gi,'').toLowerCase()

    return `${orgname}-${clearedRoute}`
  }

  /*
  * @description
  *
  * @param
  *
  * @returns
  *
  * */
  async addApiProductToPortalWithSpec (param) {
    const { apiProduct, portal, spec } = param

    const url = `${this.getApiUrl(true)}/portals/api/sites/${portal.data.id}/apidocs`

    const portalParams = {
      orgname: portal.data.orgname,
      anonAllowed: null,
      description: 'Default description',
      specContent: spec.id,
      specId: spec.name,
      title: apiProduct.displayName,
      edgeAPIProductName: apiProduct.name,
      visibility: true
    }
    const options = {
      method: "POST",
      url: url,
      headers: {
        Authorization: `${this.AUTH_TOKEN.token_type} ${this.AUTH_TOKEN.access_token}`
      },
      json: portalParams
    };

    return  this.REST.request(options, this.HttpStatus.OK, true)
  }

  /**
   * Create portal
   *
   * @param  {JSON} filter [Body Parameters]
   * @return {JSON}              [return a JSON response]
   */
  async add (param) {
    const url = `${this.getApiUrl(true)}/portals/api/sites`
    const { orgname, name } = param
    const portalId = this.generatePortalId(name, orgname)

    const portalParams = {
      id: portalId,
      orgName: orgname,
      orgname,
      name,
      portalVersion: 2,
      teams: [],
      idpEnabled: false,
      migrationDestSiteId: '',
      migrationSrcSiteId: '',
      zoneId: '',
      analyticsScript: '',
      analyticsTrackingId: '',
      currentDomain: '',
      customDomain: '',
      description: ''
    }
    const options = {
      method: "POST",
      url: url,
      headers: {
        Authorization: `${this.AUTH_TOKEN.token_type} ${this.AUTH_TOKEN.access_token}`
      },
      json: portalParams
    };

    return  this.REST.request(options, this.HttpStatus.OK, true)
  }

  /*
  * @description
  *
  * @param
  *
  * @returns
  *
  * */
  async getList (param) {
    const url = `${this.getApiUrl(true)}/portals/api/sites?orgname=${param.org}`

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

module.exports = ApigeePortalPlan
