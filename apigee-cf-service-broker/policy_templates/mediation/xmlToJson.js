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
  xmlToJsonTemplate: xmlToJsonTemplate,
  xmlToJsonGenTemplate: xmlToJsonGenTemplate
}

function xmlToJsonTemplate (options) {
  var aysnc = options.async || 'false'
  var continueOnError = options.continueOnError || 'false'
  var enabled = options.enabled || 'true'
  var name = options.name || 'Quota-' + random.randomText()
  var displayName = options.displayName || name
  var format = options.format || 'yahoo'
  var source = options.source || 'response'
  var outputVariable = options.outputVariable || 'response'
  var xmlToJson = builder.create('XMLToJSON')
  xmlToJson.att('async', aysnc)
  xmlToJson.att('continueOnError', continueOnError)
  xmlToJson.att('enabled', enabled)
  xmlToJson.att('name', name)
  xmlToJson.ele('DisplayName', {}, displayName)
  xmlToJson.ele('Properties')
  xmlToJson.ele('Format', {}, format)
  xmlToJson.ele('OutputVariable', {}, outputVariable)
  xmlToJson.ele('Source', {}, source)
  var xmlString = xmlToJson.end({ pretty: true, indent: '  ', newline: '\n' })
  return xmlString
}

function xmlToJsonGenTemplate (options, name) {
  var templateOptions = options
  templateOptions.source = options['on']
  templateOptions.outputVariable = options['on']
  templateOptions.name = name
  return xmlToJsonTemplate(templateOptions)
}
