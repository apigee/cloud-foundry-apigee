const path = require('path')
const config = require(path.resolve('./config/environment'))
const logger = require(path.resolve('./lib/helpers/logger'))
const ApigeeAuth = require('apigee-auth')
const { API_PRODUCT } = require(path.resolve('./lib/helpers/enums'))
const ApigeePortals = require(path.resolve('./lib/providers/apigee-api/portal'))
const ApigeeSpecs = require(path.resolve('./lib/providers/apigee-api/specs'))
const ApigeeFolders = require(path.resolve('./lib/providers/apigee-api/folders'))
const ApigeeApiProducts = require(path.resolve('./lib/providers/apigee-api/api-product'))
const { CFBinder } = require(path.resolve('./lib/providers/cf-binder'))

/*
  * @description Portal plan class
  *
  * */

class Portal {
  // TODO implement me
  createProxy () {
    console.info('Implement me')
  }
  /*
  * @description Validate input params for binding and proxy creating
  *
  * @param
  *
  * @returns
  *   success: false
  *   error: error object
  *
  * */
  validate (param) {
    if (param.micro) {
      return logger.ERR_NOT_MICRO_PLAN()
    } else if (param.micro && param.micro.edgemicro_key) {
      return logger.ERR_NOT_MICRO_CORES_PLAN(null, null, '"edgemicro_key" parameter is invalid')
    } else if (param.micro && param.micro.edgemicro_secret) {
      return logger.ERR_NOT_MICRO_CORES_PLAN(null, null, '"edgemicro_secret" parameter is invalid')
    }
    if (param.action.proxy) {
      if (!param[this.name].target_app_route) {
        return logger.ERR_MISSING_MICRO_C2C_PARAMETER(
          null,
          null,
          `Param "target_app_route" is required for plan "${this.name}"`
        )
      } else if (!param[this.name].target_app_port) {
        return logger.ERR_MISSING_MICRO_C2C_PARAMETER(
          null,
          null,
          `Param "target_app_port" is required for plan "${this.name}"`
        )
      }
    } else if (param.action.bind) {
      if (!param[this.name].target_app_route) {
        return logger.ERR_MISSING_MICRO_C2C_PARAMETER(
          null,
          null,
          `Param "target_app_route" is required for plan "${this.name}"`
        )
      }
    }

    return false
  }

  /*
  * @description Returns output params for REST caller
  *
  * @param
  *
  * @returns
  *
  * */
  getOutputParam (param) {
    return { route_service_url: param.proxyURL }
  }

  /*
  * @description Runs automation tasks - creates folder, apiProduct, portal, specs for portal for input app
  *
  * @param
  *
  * @returns
  *
  * */
  async runBinding (param) {
    const cfbinder = new CFBinder()
    try {
      const loginResponse = await cfbinder.login()
      if (loginResponse.error) {
        return loginResponse
      }

      const result = await cfbinder.runBinding({
        targetAppRoute: param.portal.target_app_route,
        spaceGuid: param.space_guid,
        targetAppPort: param.portal.target_app_port,
        domainForSearch: config.cf.appsBaseDomain
      })
      if (result.error) {
        return result
      }
      return result
    } catch (error) {
      throw logger.ERR_CF_BRS_FAILED(error)
    }
  }

  _generateProductName (param) {
    return param.portal.target_app_route.replace(/[\.-]+/g, '_')
  }

  _generateProductDisplayName (param) {
    return `Product for app "${param.portal.target_app_route}"`
  }

  _generateProxies (param) {
    if (param.action.proxy) {
      return [param.proxyname]
    }
    return []
  }

  _getOpenApiSpecUrl (param) {
    let url = `https://${param.portal.target_app_route}.${config.cf.appsBaseDomain}/openapi`

    return url
  }

  /*
  * @description
  *
  * @param
  *
  * @returns
  *
  * */
  async runPostBinding (param) {
    try {
      const apiProductParams = {
        org: param.org,
        name: this._generateProductName(param),
        displayName: this._generateProductDisplayName(param),
        approvalType: API_PRODUCT.approvalType.auto,
        attributes: [
          {
            name: 'access',
            value: API_PRODUCT.attributes.access.auto
          }
        ],
        description: `Default auto "${this._generateProductName(param)}" description for api`,
        environments: ['test', 'prod'],
        proxies: this._generateProxies(param),
        quota: API_PRODUCT.defaults.quota,
        quotaInterval: API_PRODUCT.defaults.quotaInterval,
        quotaTimeUnit: API_PRODUCT.defaults.quotaTimeUnit,
      }

      let token = {}
      if (param.user && param.pass) {
        const apigeeAuth = new ApigeeAuth(param.user, param.pass)

        token = await apigeeAuth.getToken()
      } else if (param.bearer) {
        token = {
          token_type: 'Bearer',
          access_token: param.bearer
        }
      }
      const apiProductsService = new ApigeeApiProducts()
      apiProductsService.setToken(token)

      const portalApiService = new ApigeePortals()
      portalApiService.setToken(token)

      const folderService = new ApigeeFolders()
      folderService.setToken(token)

      const specsService = new ApigeeSpecs()
      specsService.setToken(token)

      const apiProducts = await apiProductsService.getList(param)
      let apiProduct = apiProducts.apiProduct.find((a) => { return a.name === apiProductParams.name })

      if (!apiProduct) {
        apiProduct = await apiProductsService.add(apiProductParams)
      }

      logger.log.info(`${this.name}.runPostBinding.apiProduct ready`)

      const folderName = folderService.getName(param)
      const folders = await folderService.getList(param)
      let folder = folders

      if (param.portal.with_docstore) {
        // create folder if not exists
        const found = folders.content.find((f) => { f.name === folderName })

        !found
          ? folder = await folderService.add({
              org: param.org,
              folder: folders.id,
              kind: 'Folder',
              name: folderName
            })
          : null
      }

      logger.log.info(`${this.name}.runPostBinding.folder ready`)

      const openApiAppSpecUrl = this._getOpenApiSpecUrl(param)

      logger.log.info(`${this.name}.runPostBinding.openApiUrl ${openApiAppSpecUrl}`)

      const openApiYamlSpec = await specsService.getSpecFromAppAsYaml(
        openApiAppSpecUrl, param.proxyURL
      )

      logger.log.info(`${this.name}.runPostBinding.openApiSpec downloaded`)

      const spec = await specsService.add({
        org: param.org,
        folderId: folder.id,
        name: specsService.generateName(param)
      })

      logger.log.info(`${this.name}.runPostBinding.spec created`)

      await specsService.update({
        org: param.org,
        specId: spec.id,
        body: openApiYamlSpec
      })
      logger.log.info(`${this.name}.runPostBinding.spec filled`)

      const portals = await portalApiService.getList(param)
      const portalName = portalApiService.generateName(param)
      const portalId = portalApiService.generatePortalId(portalName, param.org)

      let portal = portals.data.find((p) => { return p.id === portalId })

      if (!portal) {
        const name = portalApiService.generateName(param)

        portal = await portalApiService.add({
          orgname: param.org,
          name
        })
        // add to portal created apiProduct
        await portalApiService.addApiProductToPortalWithSpec({
          apiProduct, portal, spec, orgname: param.org
        })
      }
      logger.log.info(`${this.name}.runPostBinding.portal ready`)

      logger.log.info(`${this.name}.runPostBinding finished`)

      return { apiProduct, portals, portal }
    } catch (error) {
      // TODO investigate errors and delete all created resources - if some errors occured
      return { error: logger.ERR_PORTAL_PLAN_RUN_BINDING(null, error, 500, error.message) }
    }
  }
}

module.exports = Portal

