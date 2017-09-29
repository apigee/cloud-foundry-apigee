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
var random = require('../../util/random.js')

module.exports = {
  jsonToXmlTemplate: jsonToXmlTemplate,
  jsonToXmlGenTemplate: jsonToXmlGenTemplate
}

function jsonToXmlTemplate (options) {
  var aysnc = options.async || 'false'
  var continueOnError = options.continueOnError || 'false'
  var enabled = options.enabled || 'true'
  var name = options.name || 'Quota-' + random.randomText()
  var displayName = options.displayName || name
  var source = options.source || 'response'
  var outputVariable = options.outputVariable || 'response'
  var jsonToXml = builder.create('JSONToXML')
  jsonToXml.att('async', aysnc)
  jsonToXml.att('continueOnError', continueOnError)
  jsonToXml.att('enabled', enabled)
  jsonToXml.att('name', name)
  jsonToXml.ele('DisplayName', {}, displayName)
  jsonToXml.ele('Properties')
  var jsonToXmlOptions = jsonToXml.ele('Options')
  jsonToXmlOptions.ele('NullValue', 'NULL')
  jsonToXmlOptions.ele('NamespaceBlockName', '#namespaces')
  jsonToXmlOptions.ele('DefaultNamespaceNodeName', '$default')
  jsonToXmlOptions.ele('NamespaceSeparator', ':')
  jsonToXmlOptions.ele('TextNodeName', '#text')
  jsonToXmlOptions.ele('AttributeBlockName', '#attrs')
  jsonToXmlOptions.ele('AttributePrefix', '@')
  jsonToXmlOptions.ele('InvalidCharsReplacement', '_')
  jsonToXmlOptions.ele('ObjectRootElementName', 'Root')
  jsonToXmlOptions.ele('ArrayRootElementName', 'Array')
  jsonToXmlOptions.ele('ArrayItemElementName', 'Item')
  jsonToXml.ele('OutputVariable', {}, outputVariable)
  jsonToXml.ele('Source', {}, source)
  var xmlString = jsonToXml.end({ pretty: true, indent: '  ', newline: '\n' })
  return xmlString
}

function jsonToXmlGenTemplate (options, name) {
  var templateOptions = options
  templateOptions.format = options['on']
  templateOptions.outputVariable = options['on']
  templateOptions.name = name

  return jsonToXmlTemplate(templateOptions)
}
