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


'use strict'

var express = require('express')
var api = require('./api/api')
var catalog = require('./api/catalog')
var service_instances = require('./api/service_instances')
var bodyParser = require('body-parser')
var logger = require('./helpers/logger')
var util = require('util')

// restrict to SSL in CF
function enforceTLS (req, res, next) {
  var proto = req.get('X-forwarded-proto')
  if (process.env.NODE_ENV === 'TEST') {
    // TODO: would be nice to really test ssl locally
    // if (req.secure) proto = 'https'
    proto = 'https'
  }
  if (proto !== 'https') {
    res.status(403)
    var loggerError = logger.ERR_REQ_INVALID_PROTOCOL()
    var responseData = {
      msg: loggerError.message
    }
    res.json(responseData)
  } else {
    next()
  }
}

var app = express()
app.use(bodyParser.json())

app.use('/', enforceTLS, api)
app.use('/v2/catalog', enforceTLS, catalog)
app.use('/v2/service_instances/', enforceTLS, service_instances)

// schema validation
app.use(function (err, req, res, next) {
  var responseData
  if (err.name === 'JsonSchemaValidation') {
    var loggerError = logger.ERR_REQ_JSON_SCHEMA_FAIL(err)
    res.status(400)
    responseData = {
      msg: loggerError.message,
      jsonSchemaValidation: true,
      description: err.validations  // All of your validation information
    }
    res.json(responseData)
  } else {
    // pass error to next error middleware handler
    next(err)
  }
})

var port = process.env.PORT || 8888
app.listen(port)
logger.log.info(util.format('Listening on port %s', port))
module.exports = app
