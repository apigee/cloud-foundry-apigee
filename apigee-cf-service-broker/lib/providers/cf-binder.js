const label = 'CFClient'
const path = require('path')
const config = require(path.resolve('./config/environment'))
const CloudFoundryRoutes = require(path.resolve('./lib/providers/cf-nodejs-client/model/cloudcontroller/Routes'))
const CloudFoundryUsersUAA = require(path.resolve('./lib/providers/cf-nodejs-client/model/uaa/UsersUAA'))
const Domains = require(path.resolve('./lib/providers/cf-nodejs-client/model/cloudcontroller/Domains'))
const ServicePlans = require(path.resolve('./lib/providers/cf-nodejs-client/model/cloudcontroller/ServicePlans'))
const Apps = require(path.resolve('./lib/providers/cf-nodejs-client/model/cloudcontroller/Apps'))
const Networking = require(path.resolve('./lib/providers/cf-nodejs-client/model/cloudcontroller/Networking'))
const logger = require(path.resolve('./lib/helpers/logger'))

const uaaService = new CloudFoundryUsersUAA(config.cf.loginEndpoint)
const routesService = new CloudFoundryRoutes(config.cf.apiUrl)
const domainsService = new Domains(config.cf.apiUrl)
const appsService = new Apps(config.cf.apiUrl)
const networkingService = new Networking(config.cf.apiUrl)
const servicePlansService = new ServicePlans(config.cf.apiUrl)
/*
* @description CF Binder for calls REST cf api
*
* */
class CFBinder {
  constructor () {
    this.loginResponse = false
    this.appRoute = false
  }
  /**
   * Method to authenticate with Cloud Foundry UAA. All params from process.env.CF_LOGIN, CF_LOGIN_PASSWORD
   * @return {Object}          [UAA Response]
   *  {
   *    access_token: {String}
   *    token_type: {String}
   *    id_token: {String}
   *    refresh_token: {String}
   *    expires_in: {Number}
   *    scope:  {String}
   *    jti:  {String}
   *  }
   */
  async login () {
    const login = config.cf.user
    const password = config.cf.password

    try {
      this.loginResponse = await uaaService.login(login, password)

      return this.loginResponse
    } catch (err) {
      console.error(`${label}.login error`, err)

      const error = logger.ERR_CF_AUTH(err)

      return { error }
    }
  }

  getAppInternalFullHostname () {
    const result = `${this.appRoute.entity.host}.${config.cf.appsInternalDomain}`

    return result
  }

  async getServicePlans () {
    servicePlansService.setToken(this.loginResponse)
    try {
      const result = await servicePlansService.getServicePlans()

      return result
    } catch (err) {
      logger.log.error(`${label}.getServicePlans error`, err)

      const error = logger.ERR_CF_CANT_GET_APP(err)

      return { error }
    }
  }

  async getApps (param) {
    appsService.setToken(this.loginResponse)

    let spaceGuid = false
    if (param.space) {
      spaceGuid = param.space.metadata.guid
    }
    try {
      const apps = await appsService.getApps({}, spaceGuid)

      if (!apps) {
        const error = logger.ERR_CF_EMPTY_APP()

        return { error }
      }
      return apps
    } catch (err) {
      const error = logger.ERR_CF_CANT_GET_APP(err)

      return { error }
    }
  }

  async getSharedDomains () {
    domainsService.setToken(this.loginResponse)
    try {
      const domains = await domainsService.getSharedDomains()

      return domains
    } catch (err) {
      console.error(`${label}.getSharedDomains error`, err)

      const error = logger.ERR_CF_INTERNAL_DOMAIN(err)

      return { error }
    }
  }

  async getRoutes () {
    routesService.setToken(this.loginResponse)
    try {
      const routes = await routesService.getRoutes({})

      return routes
    } catch (err) {
      console.error(`${label}.getRoutes error`, err)

      const error = logger.ERR_CF_ROUTES(err)

      return { error }
    }
  }

  async associateRoute (param) {
    appsService.setToken(this.loginResponse)
    try {
      const { route, app } = param

      const mappedResult = await appsService.associateRoute(app.metadata.guid, route.metadata.guid)

      return mappedResult
    } catch (err) {
      console.error(`${label}.associateRoute error`, err)

      return { error: err }
    }
  }

  async addRoute (param) {
    routesService.setToken(this.loginResponse)
    try {
      const result = await routesService.add(param)

      return result
    } catch (err) {
      console.error(`${label}.associateRoute error`. err)

      return { error: err }
    }
  }
  /*
  * Method to give access for created proxy to *.apps.internal resources
  *
  * @param {Object}
  *
  * @return {Object}
  *
  * @usage
  *   const API_URL = 'url-to-any-apigee-or-cf-app-api
  *   const service = new Networking(API_URL)
  *   const options = {
  *     destination: {
  *       guid: ''
  *     },
  *     source: {
  *       guid: ''
  *     }
  *   }
  *   const run = async () => {
  *     await service.login()
  *     await service.addNetworkingPolicy(options)
  *   }
  *
  *   run()
  * */
  async addNetworkingPolicy (param) {
    networkingService.setToken(this.loginResponse)

    const { destination, source, port } = param

    try {
      /*
      *
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
      */

      const result = await networkingService.add({
        policies: [
          {
            destination: {
              id: destination.guid,
              ports: {
                start: +(port),
                end: +(port)
              },
              protocol: 'tcp'
            },
            source: {
              id: source.guid
            }
          }
        ]
      })

      return result
    } catch (err) {
      if (!err) return {}

      console.error(`${label}.addNetworkingPolicy error`, err)

      const error = logger.ERR_CF_ADD_NETWORKING_POLICY(err, 400, err.description)

      return { error }
    }
  }
  /*
  * @param {
  *   targetAppRoute: String
  *   spaceGuid: GUID,
  *   targetAppPort: Number
  *   domainForSearch: String
  * }
  * */
  async runBinding (param) {
    const label = 'CFBinder.runBinding'

    logger.log.info(`${label}.start with domainForSearch:${param.domainForSearch}`)

    try {
      const loginResponse = await this.login()
      if (loginResponse.error) {
        return loginResponse
      }

      const domains = await this.getSharedDomains()
      if (domains && domains.error) {
        return domains
      }

      const domain = domains.resources.find(s => s.entity.name === param.domainForSearch)

      if (!domain) {
        const error = logger.ERR_CF_EMPTY_DOMAIN()

        return { error }
      }
      logger.log.info(`${label} base domain got`)

      const apps = await this.getApps({ space: { metadata: { guid: param.spaceGuid } } })

      if (apps && apps.error) {
        return apps
      }

      logger.log.info(`${label} app got`)

      let appname = param.targetAppRoute.split('.')[0]

      const app = apps.resources.find(a => a.entity.name === appname)

      if (!app) {
        const error = logger.ERR_CF_EMPTY_APP()

        return { error }
      }

      const routeHostName = param.targetAppRoute.split('.')[0]
      const routes = await this.getRoutes()
      if (routes && routes.error) {
        return routes
      }
      let route = routes.resources.find(r => r.entity.host === routeHostName && r.entity.domain_guid === domain.metadata.guid)
      if (!route) {
        route = await this.addRoute({
          domain_guid: domain.metadata.guid,
          space_guid: param.spaceGuid,
          host: routeHostName
        })
        logger.log.info(`${label} route created`)
      }

      logger.log.info(`${label} route got`)

      this.appRoute = route

      const mapRouteToApp = await this.associateRoute({
        route,
        app
      })

      if (mapRouteToApp.error) {
        return mapRouteToApp
      }

      logger.log.info(`${label} route mapped to app`)

      const microcgatewayApp = apps.resources.find(a => a.entity.name === config.cf.microgatewayAppName)

      if (!microcgatewayApp) {
        const error = logger.ERR_CF_MICROGATEWAY_APP_NAME_UNKNOWN()

        return { error }
      }

      logger.log.info(`${label} microcgateway-app got`)

      const netPolicyResult = await this.addNetworkingPolicy({
        destination: {
          guid: app.metadata.guid
        },
        source: {
          guid: microcgatewayApp.metadata.guid
        },
        port: param.targetAppPort
      })
      if (netPolicyResult.error) {
        return netPolicyResult
      }

      logger.log.info(`${label} netpolicy for microc2c-app created`)

      const brokerApp = apps.resources.find(a => a.entity.name === config.cf.brokerAppName)
      if (!brokerApp) {
        const error = logger.ERR_CF_EMPTY_BROKER_APP()

        return { error }
      }

      logger.log.info(`${label} brokerapp got`)

      const netPolicyResultForBroker = await this.addNetworkingPolicy({
        destination: {
          guid: app.metadata.guid
        },
        source: {
          guid: brokerApp.metadata.guid
        },
        port: param.targetAppPort
      })

      if (netPolicyResultForBroker.error) {
        return netPolicyResultForBroker
      }

      const appsInternalFullHostName = this.getAppInternalFullHostname()

      logger.log.info(`${label} brokerapp netpolicy ready with appsInternalFullHostName: %s`, appsInternalFullHostName)

      // all data returned for debug purposes
      return {
        appsDomain: domain,
        route,
        mapRouteToApp,
        appsInternalFullHostName,
        netPolicyResultForBroker,
        netPolicyResult
      }
    } catch (err) {
      logger.log.error(`${label}.runBinding error`, err)

      const error = logger.ERR_CF_BINDING_ROUTE(err)

      return { error }
    }
  }
}

module.exports = {
  CFBinder
}
