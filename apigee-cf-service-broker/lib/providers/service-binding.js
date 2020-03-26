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

/**
 * Creates/deletes service binding
 * @module
 */

var async = require('async')
var logger = require('../helpers/logger')
var mgmt_api = require('./mgmt_api')
var proxy = require('./edge_proxy')

function createServiceBinding (bindReq, callback) {
  async.waterfall([
    function (cb) {
      mgmt_api.authenticate(bindReq, function (err, data) {
        if (err) {
          // Don't return 401, which is reported as failure of basic-auth to the broker
          if (err.statusCode == 401 || err.statusCode == 403) {
            var loggerError = logger.ERR_APIGEE_AUTH(err, 407)
            return cb(loggerError)
          } else {
            return cb(err, data)
          }
        } else {
          return cb(null)
        }
      })
    },
    function (cb) {
      (async () => {
        try {
          const result = await bindReq.plan.runBinding(bindReq)

          if (result.error) {
            return cb(result.error)
          }
          return cb(null, result)
        } catch (error) {
          return cb(error)
        }
      })()
    },
    function (data, cb) {
      const { appsInternalFullHostName, appsDomain } = data
      
      // TODO refactor me to plan instance
      if(bindReq.micro_c2c && bindReq.micro_c2c.target_app_route && !bindReq.micro_c2c.off_c2c_binding) {
        // can use the parameter on edge_proxy.line-164 to replace public route to internal route for proxy target
        bindReq.micro_c2c.target_app_internal_route = appsInternalFullHostName
        bindReq.base_apps_domain = appsDomain.entity.name
      }

      proxy.create(bindReq, function (err, bindRes) {
        if (err) {
          var loggerError = logger.ERR_PROXY_CREATION_FAILED(err)
          cb(loggerError)
        } else {
          (async  () => {
            const bindingResult = await bindReq.plan.runPostBinding(bindRes)
            if (bindingResult.error) {
              return cb(bindingResult.error)
            }
            // result needs to have URL details in it
            cb(null, bindRes)
          })()
        }
      })
    }
  ],
  callback)
}

// wrap createServiceBinding with Promise - for async-await usage
const createAsync = async (bindReq) => {
  return new Promise((resolve, reject) => {
    return createServiceBinding(bindReq, (err, result) => {
      if (err) return reject(err)

      return resolve(result)
    })
  })
}

module.exports = {
  create: createServiceBinding,
  createAsync
}
