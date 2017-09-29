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
 * Configuration helper
 * @module
 */

var nconf = require('nconf')

var defaults = {
    APIGEE_DASHBOARD_URL: 'https://enterprise.apigee.com/platform/#/',
    APIGEE_MGMT_API_URL: 'https://api.enterprise.apigee.com/v1',
    APIGEE_PROXY_DOMAIN: 'apigee.net',
    APIGEE_PROXY_HOST_TEMPLATE: '${org}-${env}.${domain}',
    APIGEE_PROXY_NAME_TEMPLATE: 'cf-${route}',
    auth: 'staticauth'
}

// arguments, environment vars
nconf.use('memory')
    .argv()
    .env()
    .defaults(defaults)

// read from manifest.yml if in TEST
if (process.env.NODE_ENV === 'TEST') {
  var yaml = require('js-yaml')
  var fs = require('fs')
  var fromManifest = yaml.safeLoad(fs.readFileSync('manifest.yml', 'utf8'))
  nconf.defaults(Object.assign({}, defaults, fromManifest.env))
  nconf.set('SECURITY_USER_PASSWORD', 'testing')
  nconf.set('SECURITY_USER_NAME', 'tester')
}

module.exports = nconf
