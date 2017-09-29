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

var config = require('./config')
var logger = require('./logger')
var mgmt_api = require('./mgmt_api')
var proxy = require('./edge_proxy')


function createServiceBinding (bindReq, callback) {
  async.waterfall([
    function (cb) {
      mgmt_api.authenticate(bindReq, function (err, data) {
        if (err) {
          // Don't return 401, which is reported as failure of basic-auth to the broker
          if (err.statusCode == 401) {
            var loggerError = logger.ERR_APIGEE_AUTH(err, 407)
            cb(loggerError)
          }
          else {
            cb(err, data)
          }
        } else {
          cb(null)
        }
      })
    },
    // function (cb) {
    //   mgmt_api.undeployProxy(bindReq, function (err, result) {
    //     // Don't return 401, which is reported as failure of basic-auth to the broker
    //     if (err && err.statusCode == 401) {
    //       var loggerError = logger.ERR_APIGEE_AUTH(err, 407)
    //       cb(loggerError)
    //     }
    //     if (err && err.statusCode == 404) {
    //       // proxy manually deleted , not found, proceed with service binding deletion
    //       cb(null)
    //     } else if (err) {
    //       cb(err, result)
    //     } else {
    //       cb(null)
    //     }
    //   })
    // },
    function (cb) {
      proxy.create(bindReq, function (err, bindRes) {
        if (err) {
          var loggerError = logger.ERR_PROXY_CREATION_FAILED(err)
          cb(loggerError)
        } else {
          // result needs to have URL details in it
          cb(null, bindRes)
        }
      })
    }
  ],
  callback)
}


module.exports = {
  create: createServiceBinding
}
