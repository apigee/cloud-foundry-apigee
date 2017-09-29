'use strict'
/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var chai = require('chai')
chai.use(require('chai-things'))
var expect = chai.expect
var should = require('should')  // eslint-disable-line
var supertest = require('supertest')
var server = require('../server')
// Using Port 8000 to start test server
var port = 8000
var api = supertest('http://localhost:' + port)
var app
var catalogData = require('../helpers/catalog_data')
var config = require('../helpers/config')

require('./helpers/api_mocks.js')

describe('Component APIs', function () {
  this.timeout(0)
  var authHeader = 'Basic ' + new Buffer(config.default.get('SECURITY_USER_NAME') + ':' + config.default.get('SECURITY_USER_PASSWORD')).toString('base64')
  var badAuthHeader = 'Basic ' + new Buffer('admin:' + 'wrong-password').toString('base64')
  before('Starting test server', function () {  // eslint-disable-line
    app = server.listen(8000)
  })

  describe('API Security', function () {

    it('Valid Auth should return 200', function (done) {
      api.get('/')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('message')
          done()
        })
    })
    it('Invalid Auth should return 401', function (done) {
      api.get('/')
        .set('Accept', 'application/json')
        .set('Authorization', badAuthHeader)
        .expect(401, done)
    })
  })
  describe('Catalog APIs', function () {
    it('Invalid Auth should return 401', function (done) {
      api.get('/v2/catalog')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('Valid Auth should return 200', function (done) {
      api.get('/v2/catalog')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200, done)
    })
    it('Catalog API should return list of service plans', function (done) {
      api.get('/v2/catalog')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('services')
          res.body.services.forEach(function (service) {
            service.should.have.property('name')
            service.should.have.property('id')
            service.should.have.property('description')
            service.should.have.property('bindable')
            service.should.have.property('plans')
            service.plans.forEach(function (plan) {
              plan.should.have.property('id')
              plan.should.have.property('name')
              plan.should.have.property('description')
            })
          })
          done()
        })
    })
  })

  describe('Service Instance APIs', function () {
    it('Invalid Auth should return 401', function (done) {
      api.put('/v2/service_instances/:instance_id')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('Patch to Service Instance should return 422', function (done) {
      api.patch('/v2/service_instances/:instance_id')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(422, done)
    })
    it('Service instance creation should return a 201 response with dashboard_url', function (done) {
      var serviceInstance = {
        instance_id: 'instance-guid-here',
        payload: {
          organization_guid: 'org-guid-here',
          plan_id: catalogData.guid.org,
          service_id: 'service-guid-here',
          space_guid: 'space-guid-here',
          parameters: {
            org: 'org-name-here',
            env: 'env-name-here',
          }
        }
      }
      api.put('/v2/service_instances/' + serviceInstance.instance_id)
        .send(serviceInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(201)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('dashboard_url')
          expect(res.body.dashboard_url).to.equal('https://enterprise.apigee.com/platform/#/')
          done()
        })
    })

    it('Request with missing org/env mapping should return a 400 response', function (done) {
      var serviceInstance = {
        instance_id: 'instance-guid-here',
        payload: {
          organization_guid: 'org-guid-here',
          plan_id: catalogData.guid.org,
          service_id: 'service-guid-here',
          space_guid: 'space-guid-here',
          parameters: {
          }
        }
      }
      api.put('/v2/service_instances/' + serviceInstance.instance_id)
        .send(serviceInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(400, done)
    })

    it('Request with incorrect org to env mapping should return a 400 response', function (done) {
      var serviceInstance = {
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
      api.put('/v2/service_instances/' + serviceInstance.instance_id)
        .send(serviceInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(400, done)
    })

    it('Request with missing org should return a 400 response', function (done) {
      var serviceInstance = {
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
      api.put('/v2/service_instances/' + serviceInstance.instance_id)
        .send(serviceInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(400, done)
    })

    it('Request with missing env should return a 400 response', function (done) {
      var serviceInstance = {
        instance_id: 'instance-guid-here',
        payload: {
          organization_guid: 'org-guid-here',
          plan_id: catalogData.guid.org,
          service_id: 'service-guid-here',
          space_guid: 'space-guid-here',
          parameters: {
            org: 'invalid-org',
          }
        }
      }
      api.put('/v2/service_instances/' + serviceInstance.instance_id)
        .send(serviceInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(400, done)
    })
  })

  describe("Org Plan Request Validations", function(){
    it('Valid Auth on org route binding API with invalid org parameters should return 400 - target_app_port', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on org route binding API with invalid org parameters should return 400 - target_app_route', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on org route binding API with invalid org parameters should return 400 - edgemicro_key', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on org route binding API with invalid org parameters should return 400 - edgemicro_secret', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on org route binding API with invalid org parameters should return 400 - micro', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

  })

  describe("Micro Plan Request Validations", function(){

    it('Valid Auth on micro route binding API with missing micro parameter should return 400', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on micro route binding API with invalid micro parameters should return 400 - target_app_port', function (done) {
      var bindingInstance = {
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
            target_app_port: '8080',
//            protocol: 'http'
          }
        }
      }
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on micro route binding API with invalid parameters should return 400 - target_app_route', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on micro route binding API with invalid micro parameters should return 400 - edgemicro_key', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on micro route binding API with invalid micro parameters should return 400 - edgemicro_secret', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })
    
  })

  describe("Micro coresident Plan Request Validations", function(){

    it('Valid Auth on coresident app binding API with missing "target_app_route" parameter should return 400', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on coresident app binding API with missing "target_app_port" parameter should return 400', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on coresident app binding API with missing "edgemicro_key" parameter should return 400', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on coresident app binding API with missing "edgemicro_secret" parameter should return 400', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Valid Auth on coresident app binding API with invalid microgateway-coresident parameter "micro" should return 400', function (done) {
      var bindingInstance = {
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
            micro: "micro route"
//            protocol: 'http'
          }
        }
      }
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Binding with "bind-route-service" (route in bind_resource) instead of "bind-service" should return 400 with micro coresident plan', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
        .send(bindingInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(400, done)
    })
  })

  describe("Non Plan Based Request Content Validation", function(){
    
    it('Invalid JSON req payload should return Json Schema Validation error', function (done) {
      api.put('/v2/service_instances/12345/service_bindings/67890')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .send("{'invalidJSON")
        .expect(400)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('jsonSchemaValidation')
          expect(res.body.jsonSchemaValidation).to.equal(true)
          done()
        })
    })

    it('Invalid Protocol on route binding API should return a 400', function(done) {
      var bindingInstance = {
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
            api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
              .send(bindingInstance.payload)
              .set('Accept', 'application/json')
              .set('Authorization', authHeader)
              .expect(400, done)
    })

    it('Valid Auth on route binding API with incorrect org/env mapping should return 400', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
      .send(bindingInstance.payload)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader)
      .expect(400, done)
    })

    it('Invalid Auth should return 401', function (done) {
      api.put('/v2/service_instances/:instance_id/service_bindings/:binding_id')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
  })

  describe('Route Binding APIs', function () {
    it('Invalid Apigee Credentials should return a 407 response - http', function (done) {
      var bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here',
        payload: {
          organization_guid: 'org-guid-here',
          plan_id: catalogData.guid.org,
          service_id: 'service-guid-here',
          space_guid: 'space-guid-here',
          parameters: {
            host: config.default.get('APIGEE_PROXY_HOST_TEMPLATE'),
            org: 'org-name-here',
            env: 'env-name-here',
            user: 'apigee-user-here',
            pass: 'apigee-pass-here',
            action: 'proxy bind',
            protocol: 'http'
          }
        }
      }
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
        .send(bindingInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(407, done)
    })

    it('Valid Auth on route binding API should return 201 with route_service_url - org plan', function (done) {
      var bindingInstance = {
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
//            protocol: 'http'
          }
        }
      }
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
        .send(bindingInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(201)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('route_service_url')
          expect(res.body.route_service_url).to.equal('https://cdmo-test.apigee.net/route-url-here')
          done()
        })
    })

    it('Valid Auth on route binding API should return 201 with route_service_url - micro plan', function (done) {
      var bindingInstance = {
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
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
        .send(bindingInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(201)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('route_service_url')
          expect(res.body.route_service_url).to.equal('https://edgemicro-cf-app-url/route-url-here')
          done()
        })
    })

    it('Valid Auth on route binding API should return 201 with route_service_url - micro coresident', function (done) {
      var bindingInstance = {
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
//            protocol: 'http'
          }
        }
      }
      api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
        .send(bindingInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(201)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('credentials')
          expect(res.body.credentials.edgemicro_key).to.equal('key')
          expect(res.body.credentials.edgemicro_secret).to.equal('secret')
          done()
        })
    })
  })

  describe('Delete Route Binding & Delete Service Instance', function () {
    it('Invalid Auth should return 401 on route binding deletion', function (done) {
      api.put('/v2/service_instances/:instance_id/service_bindings/:binding_id')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('Valid Auth on delete binding API call should return 200', function (done) {
      var bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here'
      }
      api.del('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200, done)
    })
    it('Invalid Auth should return 401 on service instance deletion', function (done) {
      api.del('/v2/service_instances/:instance_id')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('Valid service instance delete should delete the instance and return 200', function (done) {
      var serviceInstance = 'instance-guid-here'
      api.del('/v2/service_instances/' + serviceInstance)
        .set('Authorization', authHeader)
        .expect(200, done)
    })

  })
  after(function (done) {   // eslint-disable-line
    this.timeout(0)
    app.close()
    done()
  })
})

// console.log(config.default.get('APIGEE_DASHBOARD_URL'))
// console.log(config.getApigeeConfiguration("org1","tests", function(err, data){return "hi"}))
describe('Get Apigee Config', function () {
  var org = 'test-org'
  var env = 'test'
  it("Config Module Should Return Expected Values", function(){
      chai.assert.equal(config.getApigeeConfiguration(org, env, function(err, data){if(err){console.log(err)} else{return data.get('APIGEE_DASHBOARD_URL')}}),'https://onprem.com/platform/#/')
      chai.assert.equal(config.getApigeeConfiguration(org, env, function(err, data){if(err){console.log(err)} else{return data.get('APIGEE_MGMT_API_URL')}}),'https://onprem.com/v1')
      chai.assert.equal(config.getApigeeConfiguration(org, env, function(err, data){if(err){console.log(err)} else{return data.get('APIGEE_PROXY_DOMAIN')}}),'onprem.net')
      chai.assert.equal(config.getApigeeConfiguration(org, env, function(err, data){if(err){console.log(err)} else{return data.get('APIGEE_PROXY_HOST_TEMPLATE')}}),'${org}-${env}.${domain}')
      chai.assert.equal(config.getApigeeConfiguration(org, env, function(err, data){if(err){console.log(err)} else{return data.get('APIGEE_PROXY_NAME_TEMPLATE')}}),'cf-${route}')
  })
})
