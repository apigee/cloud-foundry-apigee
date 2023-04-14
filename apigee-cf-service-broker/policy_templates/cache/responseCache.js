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
  responseCacheTemplate: responseCacheTemplate,
  responseCacheGenTemplate: responseCacheGenTemplate
}

function responseCacheTemplate (options) {
  var aysnc = options.async || 'false'
  var continueOnError = options.continueOnError || 'false'
  var enabled = options.enabled || 'true'
  var name = options.name || 'responseCache-' + random.randomText()
  var displayName = options.displayName || name
  var keyFragment = options.keyFragment || ''
  var keyFragmentRef = options.keyFragmentRef || 'request.uri'
  var scope = options.scope || 'Exclusive'
  var timeoutInSec = options.timeoutInSec || '300'
  var cache = builder.create('ResponseCache')
  cache.att('async', aysnc)
  cache.att('continueOnError', continueOnError)
  cache.att('enabled', enabled)
  cache.att('name', name)

  cache.ele('DisplayName', {}, displayName)
  cache.ele('Properties', {})

  var cacheKey = cache.ele('CacheKey', {})
  cacheKey.ele('Prefix', {})
  cacheKey.ele('KeyFragment', {ref: keyFragmentRef, type: 'string'})

  cache.ele('Scope', {}, scope)
  var expirySettings = cache.ele('ExpirySettings', {})
  expirySettings.ele('ExpiryDate', {})
  expirySettings.ele('TimeOfDay', {})
  expirySettings.ele('TimeoutInSec', {}, timeoutInSec)
  cache.ele('SkipCacheLookup', {})
  cache.ele('SkipCachePopulation', {})
  var xmlString = cache.end({ pretty: true, indent: '  ', newline: '\n' })
  return xmlString
}

function responseCacheGenTemplate (options, name) {
  var templateOptions = options
  templateOptions.keyFragment = options.identifier
  templateOptions.name = name
  templateOptions.timeoutInSec = options.time
  return responseCacheTemplate(templateOptions)
}
