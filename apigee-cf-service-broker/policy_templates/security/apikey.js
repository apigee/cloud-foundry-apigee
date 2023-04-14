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

var builder = require('xmlbuilder')
var random = require('../../lib/helpers/random.js')

module.exports = {
  apiKeyTemplate: apiKeyTemplate,
  apiKeyGenTemplate: apiKeyGenTemplate
}

function apiKeyTemplate (options) {
  var aysnc = options.async || 'false'
  var continueOnError = options.continueOnError || 'false'
  var enabled = options.enabled || 'true'
  var name = options.name || 'apiKey-' + random.randomText()
  var keyRef = options.keyRef || 'request.queryparam.apikey'

  var apiKey = builder.create('VerifyAPIKey')
  apiKey.att('async', aysnc)
  apiKey.att('continueOnError', continueOnError)
  apiKey.att('enabled', enabled)
  apiKey.att('name', name)

  apiKey.ele('Properties', {})
  apiKey.ele('APIKey', {ref: keyRef})

  var xmlString = apiKey.end({ pretty: true, indent: '  ', newline: '\n' })
  return xmlString
}

function apiKeyGenTemplate (options, name) {
  var templateOptions = options
  templateOptions.name = name
  templateOptions.keyRef = 'request.' + options.in + '.' + options.keyName
  return apiKeyTemplate(templateOptions)
}
