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
  verifyAccessTokenTemplate: verifyAccessTokenTemplate,
  verifyAccessTokenGenTemplate: verifyAccessTokenGenTemplate
}

function verifyAccessTokenTemplate (options) {
  var aysnc = options.async || 'false'
  var continueOnError = options.continueOnError || 'false'
  var enabled = options.enabled || 'true'
  var name = options.name || 'verifyAccessToken-' + random.randomText()

  var verifyAccessToken = builder.create('OAuthV2')
  verifyAccessToken.att('async', aysnc)
  verifyAccessToken.att('continueOnError', continueOnError)
  verifyAccessToken.att('enabled', enabled)
  verifyAccessToken.att('name', name)

  verifyAccessToken.ele('DisplayName', {}, 'verifyAccessToken')
  verifyAccessToken.ele('Properties', {})
  verifyAccessToken.ele('ExternalAuthorization', {}, false)
  verifyAccessToken.ele('Operation', {}, 'VerifyAccessToken')
  verifyAccessToken.ele('SupportedGrantTypes', {})
  verifyAccessToken.ele('GenerateResponse', {enabled: true})
  verifyAccessToken.ele('Tokens', {})

  var xmlString = verifyAccessToken.end({ pretty: true, indent: '  ', newline: '\n' })
  return xmlString
}

function verifyAccessTokenGenTemplate (options, name) {
  var templateOptions = options
  templateOptions.name = name || 'verifyAccessToken'
  return verifyAccessTokenTemplate(templateOptions)
}
