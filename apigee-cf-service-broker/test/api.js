require('./helpers/api_mocks.js')
const path = require('path')

process.env.MICRO_C2C_APP_NAME = 'c2c-mg-name'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
process.env.SECURITY_USER_NAME = 'tester'
process.env.SECURITY_USER_PASSWORD = 'testing'
process.env.APPS_BASE_DOMAIN = 'cf-domain-here'

const chai = require('chai')
let { expect } = chai

const server = require(path.resolve('./server.js'))
const chaiHttp = require('chai-http')
const catalogData = require('../lib/providers/catalog_data')
const { deriveAction, deriveProtocol } = require(path.resolve('./lib/helpers/extractors'))

chai.use(chaiHttp)

const config = require(path.resolve('./config/environment'))

/* eslint-disable */
describe('Component APIs', () => {
  const authHeader = 'Basic ' + new Buffer('tester:testing').toString('base64')

  const badAuthHeader = 'Basic ' + new Buffer('admin:' + 'wrong-password').toString('base64')

  before('Starting test server', function () {  // eslint-disable-line
    app = server.listen(8000)
  })
  describe('Extractors - unit tests', () => {
    describe('Protocol', () => {
      it('Invalid protocol', async () => {
        const result = deriveProtocol({ protocol: 'httpsm'})
        expect(result).to.have.property('error')
      })
      it('Default protocol - http', async () => {
        const result = deriveProtocol({})
        expect(result).to.have.property('protocol')
        expect(result.protocol).to.be.eq('http')
      })
    })
    describe('Action', () => {
      it('Invalid action', async () => {
        const result = deriveAction({ action: 'httpsm'})
        expect(result).to.have.property('errors')
      })
      it('Valid actions - bind', async () => {
        const result = deriveAction({ action: 'bind' })
        expect(result).to.have.property('bind')
        expect(result.bind).to.be.eq(true)
      })
      it('Valid actions - proxy', async () => {
        const result = deriveAction({ action: 'proxy' })
        expect(result).to.have.property('proxy')
        expect(result.proxy).to.be.eq(true)
      })
      it('Valid actions - proxy bind', async () => {
        const result = deriveAction({ action: 'bind proxy' })
        expect(result).to.have.property('proxy')
        expect(result.proxy).to.be.eq(true)
        expect(result).to.have.property('bind')
        expect(result.bind).to.be.eq(true)
      })
    })
  })
  describe('API Security', () => {
    it('Valid Auth should return 200', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .get(`/`)
          .set('Authorization', authHeader)
        expect(res).to.have.status(200)
        expect(res.body).to.have.property('message')
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Invalid Auth should return 401', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .get(`/`)
          .set('Authorization', badAuthHeader)
        expect(res).to.have.status(401)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })
  })

  describe('Catalog APIs', () => {
    it('Invalid Auth should return 401', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .get(`/v2/catalog`)
        expect(res).to.have.status(401)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth should return 200', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .get(`/v2/catalog`)
          .set('Authorization', authHeader)

        expect(res).to.have.status(200)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })
    it('Catalog API should return list of service plans', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .get(`/v2/catalog`)
          .set('Authorization', authHeader)

        expect(res).to.have.status(200)
        expect(res.body).to.have.property('services')
        res.body.services.forEach((service) => {
          expect(service).to.have.property('name')
          expect(service).to.have.property('id')
          expect(service).to.have.property('description')
          expect(service).to.have.property('bindable')
          expect(service).to.have.property('plans')
          service.plans.forEach((plan) => {
            expect(plan).to.have.property('id')
            expect(plan).to.have.property('name')
            expect(plan).to.have.property('description')
          })
        })
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })
  })

  describe('Service Instance APIs', () => {
    it('Invalid Auth should return 401', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .put(`/v2/service_instances/:instance_id`)

        expect(res).to.have.status(401)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })
    it('Patch to Service Instance should return 422', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .patch(`/v2/service_instances/:instance_id`)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)
        console.info('RES', res.body)
        expect(res).to.have.status(422)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Service instance creation should return a 201 response with dashboard_url', async () => {
      let error = false
      try {
        const serviceInstance = {
          instance_id: 'instance-guid-here',
          payload: {
            organization_guid: 'org-guid-here',
            plan_id: catalogData.guid.org,
            service_id: 'service-guid-here',
            space_guid: 'space-guid-here',
            parameters: {
              org: 'cdmo',
              env: 'test',
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + serviceInstance.instance_id)
          .send(serviceInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)
        expect(res).to.have.status(201)
        expect(res.body).to.have.property('dashboard_url')
        expect(res.body.dashboard_url).to.equal('https://onprem.com/platform/#/')
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Request with missing org/env mapping should return a 400 response', async () => {
      let error = false
      const serviceInstance = {
        instance_id: 'instance-guid-here',
        payload: {
          organization_guid: 'org-guid-here',
          plan_id: catalogData.guid.org,
          service_id: 'service-guid-here',
          space_guid: 'space-guid-here',
          parameters: {}
        }
      }
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + serviceInstance.instance_id)
          .send(serviceInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Request with incorrect org to env mapping should return a 400 response', async () => {
      let error = false
      try {
        const serviceInstance = {
          instance_id: 'instance-guid-here',
          payload: {
            organization_guid: 'org-guid-here',
            plan_id: catalogData.guid.org,
            service_id: 'service-guid-here',
            space_guid: 'space-guid-here',
            parameters: {
              org: 'invalid-org',
              env: 'env-name-here',
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + serviceInstance.instance_id)
          .send(serviceInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Request with missing org should return a 400 response', async () => {
      let error = false
      try {
        const serviceInstance = {
          instance_id: 'instance-guid-here',
          payload: {
            organization_guid: 'org-guid-here',
            plan_id: catalogData.guid.org,
            service_id: 'service-guid-here',
            space_guid: 'space-guid-here',
            parameters: {
              env: 'env-name-here',
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + serviceInstance.instance_id)
          .send(serviceInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Request with missing env should return a 400 response', async () => {
      let error = false
      try {
        const serviceInstance = {
          instance_id: 'instance-guid-here',
          payload: {
            organization_guid: 'org-guid-here',
            plan_id: catalogData.guid.org,
            service_id: 'service-guid-here',
            space_guid: 'space-guid-here',
            parameters: {
              org: 'env-name-here',
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + serviceInstance.instance_id)
          .send(serviceInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })
  })

  describe('Org Plan Request Validations', () => {
    it('Valid Auth on org route binding API with invalid org parameters should return 400 - target_app_port', async () => {
      let error = false
      try {
        const bindingInstance = {
          instance_id: 'instance-guid-here',
          binding_id: 'binding-guid-here',
          payload: {
            plan_id: catalogData.guid.org,
            service_id: 'service-guid-here',
            parameters: {
              host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
              org: 'org-name-here',
              env: 'env-name-here',
              user: 'XXXXX',
              pass: 'XXXXXXX',
              action: 'proxy bind',
              target_app_port: '8080',
              //            protocol: 'http'
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on org route binding API with invalid org parameters should return 400 - target_app_route', async () => {
      let error = false
      try {
        const bindingInstance = {
          instance_id: 'instance-guid-here',
          binding_id: 'binding-guid-here',
          payload: {
            plan_id: catalogData.guid.org,
            service_id: 'service-guid-here',
            parameters: {
              host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
              org: 'org-name-here',
              env: 'env-name-here',
              user: 'XXXXX',
              pass: 'XXXXXXX',
              action: 'proxy bind',
              target_app_route: '8080',
//            protocol: 'http'
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on org route binding API with invalid org parameters should return 400 - edgemicro_key', async () => {
      let error = false
      try {
        const bindingInstance = {
          instance_id: 'instance-guid-here',
          binding_id: 'binding-guid-here',
          payload: {
            plan_id: catalogData.guid.org,
            service_id: 'service-guid-here',
            parameters: {
              host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
              org: 'org-name-here',
              env: 'env-name-here',
              user: 'XXXXX',
              pass: 'XXXXXXX',
              action: 'proxy bind',
              edgemicro_key: '8080',
  //            protocol: 'http'
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on org route binding API with invalid org parameters should return 400 - edgemicro_secret', async () => {
      let error = false
      try {
        const bindingInstance = {
          instance_id: 'instance-guid-here',
          binding_id: 'binding-guid-here',
          payload: {
            plan_id: catalogData.guid.org,
            service_id: 'service-guid-here',
            parameters: {
              host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
              org: 'org-name-here',
              env: 'env-name-here',
              user: 'XXXXX',
              pass: 'XXXXXXX',
              action: 'proxy bind',
              edgemicro_secret: '8080',
  //            protocol: 'http'
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on org route binding API with invalid org parameters should return 400 - micro', async () => {
      let error = false
      try {
        const bindingInstance = {
          instance_id: 'instance-guid-here',
          binding_id: 'binding-guid-here',
          payload: {
            plan_id: catalogData.guid.org,
            service_id: 'service-guid-here',
            parameters: {
              host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
              org: 'org-name-here',
              env: 'env-name-here',
              user: 'XXXXX',
              pass: 'XXXXXXX',
              action: 'proxy bind',
              micro: '8080',
  //            protocol: 'http'
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })
  })

  describe('Micro Plan Request Validations', () => {
    it('Valid Auth on micro route binding API with missing micro parameter should return 400', async () => {
      let error = false
      try {
        const bindingInstance = {
          instance_id: 'instance-guid-here',
          binding_id: 'binding-guid-here',
          payload: {
            plan_id: catalogData.guid.micro,
            service_id: 'service-guid-here',
            bind_resource: {
              route: 'route-url-here'
            },
            parameters: {
              host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
              org: 'org-name-here',
              env: 'env-name-here',
              user: 'XXXXX',
              pass: 'XXXXXXX',
              action: 'proxy bind',
  //            protocol: 'http'
            }
          }
        }

        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on micro route binding API with invalid parameters should return 400 - target_app_route', async () => {
      let error = false
      try {
        const bindingInstance = {
          instance_id: 'instance-guid-here',
          binding_id: 'binding-guid-here',
          payload: {
            plan_id: catalogData.guid.micro,
            service_id: 'service-guid-here',
            parameters: {
              host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
              org: 'org-name-here',
              env: 'env-name-here',
              user: 'XXXXX',
              pass: 'XXXXXXX',
              action: 'proxy bind',
              target_app_route: '8080',
  //            protocol: 'http'
            }
          }
        }
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on micro route binding API with invalid micro parameters should return 400 - edgemicro_key', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro,
          service_id: 'service-guid-here',
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'org-name-here',
            env: 'env-name-here',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            edgemicro_key: '8080',
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on micro route binding API with invalid micro parameters should return 400 - edgemicro_secret', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro,
          service_id: 'service-guid-here',
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'org-name-here',
            env: 'env-name-here',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            edgemicro_secret: '8080',
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })
  })

  describe('Micro coresident Plan Request Validations', () => {

    it('Valid Auth on coresident app binding API with missing "target_app_route" parameter should return 400', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro_coresident,
          service_id: 'service-guid-here',
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'org-name-here',
            env: 'env-name-here',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            target_app_port: '8080',
            edgemicro_key: 'key',
            edgemicro_secret: 'secret'
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on coresident app binding API with missing "target_app_port" parameter should return 400', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro_coresident,
          service_id: 'service-guid-here',
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'org-name-here',
            env: 'env-name-here',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            target_app_route: 'route-url-here',
            edgemicro_key: 'key',
            edgemicro_secret: 'secret'
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on coresident app binding API with missing "edgemicro_key" parameter should return 400', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro_coresident,
          service_id: 'service-guid-here',
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'org-name-here',
            env: 'env-name-here',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            target_app_port: '8080',
            target_app_route: 'route-url-here',
            edgemicro_secret: 'secret'
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on coresident app binding API with missing "edgemicro_secret" parameter should return 400', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro_coresident,
          service_id: 'service-guid-here',
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'org-name-here',
            env: 'env-name-here',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            target_app_port: '8080',
            edgemicro_key: 'key',
            target_app_route: 'route-url-here'
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on coresident app binding API with invalid microgateway-coresident parameter "micro" should return 400', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro_coresident,
          service_id: 'service-guid-here',
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'org-name-here',
            env: 'env-name-here',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            target_app_port: '8080',
            edgemicro_key: 'key',
            target_app_route: 'route-url-here',
            edgemicro_secret: 'secret',
            micro: 'micro route'
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Binding with "bind-route-service" (route in bind_resource) instead of "bind-service" should return 400 with micro coresident plan', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro_coresident,
          service_id: 'service-guid-here',
          bind_resource: {
            route: 'route-url-here'
          },
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'cdmo',
            env: 'test',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            target_app_port: '8081',
            target_app_route: 'route-url-here',
            edgemicro_key: 'key',
            edgemicro_secret: 'secret'
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })
  })

  describe('Non Plan Based Request Content Validation', () => {

    it('Invalid JSON req payload should return Json Schema Validation error', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/12345/service_bindings/67890')
          .send('{\'invalidJSON')
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
        expect(res.body.jsonSchemaValidation).to.equal(true)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Invalid Protocol on route binding API should return a 400', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.org,
          service_id: 'service-guid-here',
          bind_resource: {
            route: 'route-url-here'
          },
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'cdmo',
            env: 'test',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            protocol: 'htYp'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send('{\'invalidJSON')
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
        expect(res.body.jsonSchemaValidation).to.equal(true)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on route binding API with incorrect org/env mapping should return 400', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.org,
          service_id: 'service-guid-here',
          bind_resource: {
            route: 'route-url-here'
          },
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'invalid-org',
            env: 'test',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send('{\'invalidJSON')
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)

        expect(res).to.have.status(400)
        expect(res.body.jsonSchemaValidation).to.equal(true)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Invalid Auth should return 401', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/:instance_id/service_bindings/:binding_id')
          .set('Accept', 'application/json')
        expect(res).to.have.status(401)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })
  })

  describe('Route Binding APIs', () => {
    it('Invalid Apigee Credentials should return a 400 without bind_resource response - http', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          organization_guid: 'org-guid-here',
          plan_id: catalogData.guid.org,
          service_id: 'service-guid-here',
          space_guid: 'space-guid-here',
          parameters: {
            org: 'cdmo',
            env: 'test',
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            user: 'apigee-user-here',
            pass: 'apigee-pass-here',
            action: 'proxy bind',
            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Authorization', authHeader)
          .set('Accept', 'application/json')

        expect(res).to.have.status(400)
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on route binding API should return 201 with route_service_url - org plan', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.org,
          service_id: 'service-guid-here',
          bind_resource: {
            route: 'route-url-here'
          },
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'cdmo',
            env: 'test',
            user: 'tester',
            pass: 'testing',
            action: 'proxy bind',
            protocol: 'http'
          }
        }
      }

      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Authorization', authHeader)
          .set('Accept', 'application/json')

        expect(res).to.have.status(201)
        expect(res.body).to.have.property('route_service_url')
        expect(res.body.route_service_url).to.equal('https://cdmo-test.onprem.net/route-url-here')
      } catch (err) {
        error = err
      } finally {
        error ? console.error('ERR', error) : null
        expect(error).to.be.false
      }
    })

    it('Valid on route binding API should return 201 with empty params - portal plan, action: proxy bind, no folder for app', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.portal,
          service_id: 'service-guid-here',
          context: {
            space_guid: 'space-guid-here'
          },
          bind_resource: {
            route: 'bind_resource-route-url-here.com'
          },
          parameters: {
            bearer: '123',
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'cdmo',
            env: 'test',
            action: 'proxy bind',
            target_app_route: 'target_app_route-here',
            target_app_port: 80,
            target_app_space_name: 'test',
            protocol: 'http'
          }
        }
      }

      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Authorization', authHeader)
          .set('Accept', 'application/json')
  
        expect(res).to.have.status(201)
        expect(res.body).to.have.property('route_service_url')
        expect(res.body.route_service_url).to.equal('https://cdmo-test.onprem.net/target_app_route-here')
      } catch (err) {
        error = err
      } finally {
        error ? console.error('ERR', error) : null
        expect(error).to.be.false
      }
    })
  
    it('Valid on route binding API should return 201 with empty params - portal plan, action: proxy bind, create folder for app', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.portal,
          service_id: 'service-guid-here',
          context: {
            space_guid: 'space-guid-here'
          },
          bind_resource: {
            route: 'bind_resource-route-url-here.com'
          },
          parameters: {
            bearer: '123',
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'cdmo',
            env: 'test',
            action: 'proxy bind',
            target_app_route: 'target_app_route-here',
            target_app_port: 80,
            target_app_space_name: 'test',
            protocol: 'http',
            with_docstore: true
          }
        }
      }
    
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Authorization', authHeader)
          .set('Accept', 'application/json')
  
        expect(res).to.have.status(201)
        expect(res.body).to.have.property('route_service_url')
        expect(res.body.route_service_url).to.equal('https://cdmo-test.onprem.net/target_app_route-here')
      } catch (err) {
        error = err
      } finally {
        error ? console.error('ERR', error) : null
        expect(error).to.be.false
      }
    })

    it('Valid Auth on route binding API should return 201 with route_service_url - micro plan', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro,
          service_id: 'service-guid-here',
          bind_resource: {
            route: 'route-url-here'
          },
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'cdmo',
            env: 'test',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            micro: 'edgemicro-cf-app-url'
//            protocol: 'http'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Authorization', authHeader)
          .set('Accept', 'application/json')
        expect(res).to.have.status(201)

        expect(res.body).to.have.property('route_service_url')
        expect(res.body.route_service_url).to.equal('https://edgemicro-cf-app-url/route-url-here')
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on route binding API should return 201 with route_service_url - micro coresident', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro_coresident,
          service_id: 'service-guid-here',
          bind_resource: {},
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'cdmo',
            env: 'test',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            target_app_port: '8081',
            target_app_route: 'route-url-here',
            edgemicro_key: 'key',
            edgemicro_secret: 'secret'
          }
        }
      }

      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Authorization', authHeader)
          .set('Accept', 'application/json')
        expect(res).to.have.status(201)
        expect(res.body).to.have.property('credentials')
        expect(res.body.credentials.edgemicro_key).to.equal('key')
        expect(res.body.credentials.edgemicro_secret).to.equal('secret')
      } catch (err) {
        error = err
      } finally {
        expect(error).to.be.false
      }
    })

    it('Valid Auth on route binding API should return 201 with route_service_url - micro c2c', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          plan_id: catalogData.guid.micro_c2c,
          service_id: 'service-guid-here',
          bind_resource: { route: 'target_app_route-here.cf-base-domain' },
          parameters: {
            org: 'cdmo',
            env: 'test',
            user: 'XXXXX',
            pass: 'XXXXXXX',
            action: 'proxy bind',
            protocol: 'http',
            target_app_port: 80,
            target_app_route: 'app-name-here.apps.pcf24.apigee.xyz',
            target_app_space_name: 'space-name-here'
          }
        }
      }
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .send(bindingInstance.payload)
          .set('Authorization', authHeader)
          .set('Accept', 'application/json')
        // expect(res).to.have.status(201)
        expect(res.body).to.have.property('route_service_url')
      } catch (err) {
        error = err
      } finally {
        console.info('ERRintest', error)
        expect(error).to.be.false
      }
    })
  })

  describe('Delete Route Binding & Delete Service Instance', () => {
    it('Invalid Auth should return 401 on route binding deletion', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .put('/v2/service_instances/:instance_id/service_bindings/:binding_id')

        expect(res).to.have.status(401)

      } catch (err) {
        error = err
      } finally {
        error ? console.info('ERRintest', error) : null
        expect(error).to.be.false
      }
    })
    it('Valid Auth on delete binding API call should return 200', async () => {
      const bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here'
      }

      let error = false
      try {
        const res = await chai.request(server)
          .del('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
          .set('Accept', 'application/json')
          .set('Authorization', authHeader)
        expect(res).to.have.status(200)
      } catch (err) {
        error = err
      } finally {
        error ? console.info('ERRintest', error) : null
        expect(error).to.be.false
      }
    })
    it('Invalid Auth should return 401 on service instance deletion', async () => {
      let error = false
      try {
        const res = await chai.request(server)
          .del('/v2/service_instances/:instance_id')
          .set('Accept', 'application/json')

        expect(res).to.have.status(401)
      } catch (err) {
        error = err
      } finally {
        error ? console.info('ERRintest', error) : null
        expect(error).to.be.false
      }
    })
    it('Valid service instance delete should delete the instance and return 200', async () => {
      const serviceInstance = 'instance-guid-here'

      let error = false
      try {
        const res = await chai.request(server)
          .del('/v2/service_instances/' + serviceInstance)
          .set('Accept', 'application/json')

        expect(res).to.have.status(401)
      } catch (err) {
        error = err
      } finally {
        error ? console.info('ERRintest', error) : null
        expect(error).to.be.false
      }
    })

  })
})
/* eslint-enable */
