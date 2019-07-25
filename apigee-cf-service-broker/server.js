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

// const fs = require('fs')
// const https = require('https');
const express = require('express')
const bodyParser = require('body-parser')
const api = require('./lib/controllers/api/api')
const catalog = require('./lib/controllers/api/catalog')
const serviceInstances = require('./lib/controllers/api/service-instances')
const logger = require('./lib/helpers/logger')
const config = require('./config/environment')

// restrict to SSL in CF
const enforceTLS = (req, res, next) => {
  let proto = req.get('X-forwarded-proto')

  if (process.env.NODE_ENV === 'TEST') {
    // TODO: would be nice to really test ssl locally
    // if (req.secure) proto = 'https'
    proto = 'https'
  }

  if (proto !== 'https') {
    res.status(403)
    const loggerError = logger.ERR_REQ_INVALID_PROTOCOL()
    const responseData = {
      msg: loggerError.message
    }
    res.json(responseData)
  } else {
    next()
  }
}

const app = express()
app.use(bodyParser.json())

app.use('/', enforceTLS, api)
app.use('/v2/catalog', enforceTLS, catalog)
app.use('/v2/service_instances/', enforceTLS, serviceInstances)

// schema validation
app.use((err, req, res, next) => {
  let responseData
  if (err.name === 'JsonSchemaValidation') {
    const loggerError = logger.ERR_REQ_JSON_SCHEMA_FAIL(err)
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

// https.createServer({
//   key: fs.readFileSync('./server.key'),
//   cert: fs.readFileSync('./server.cert')
// }, app)
//   .listen(config.port);

app.listen(config.port)

logger.log.info(`Listening on port ${config.port}`)

module.exports = app
