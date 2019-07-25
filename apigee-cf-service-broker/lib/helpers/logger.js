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
 * Log messages/errors
 * @module
 */

var log = require('bunyan').createLogger({name: 'apigee'})
var util = require('util')

var codes = {
  ERR_UAE: 'E0000',
  ERR_CODE_COVERAGE_BADGE: 'E0001',
  ERR_REQ_JSON_SCHEMA_FAIL: 'E0010',
  ERR_REQ_INVALID_PROTOCOL: 'E0011',
  ERR_PROXY_CREATION_FAILED: 'E0020',
  ERR_PROXY_UPLOAD_FAILED: 'E0021',
  ERR_PROXY_ZIP: 'E0022',
  ERR_PROXY_READ_FAILED: 'E0023',
  ERR_PROXY_VHOSTS_NON200_RES: 'E0024',
  ERR_APIGEE_AUTH: 'E0030',
  ERR_APIGEE_REQ_FAILED: 'E0031',
  ERR_APIGEE_PROXY_UPLOAD: 'E0032',
  ERR_APIGEE_GET_PROXY_REV_FAILED: 'E0033',
  ERR_APIGEE_DEPLOY_PROXY: 'E0034',
  ERR_APIGEE_UNDEPLOY_PROXY_FAILED: 'E0035',
  ERR_APIGEE_PROXY_NOT_FOUND: 'E0036',
  ERR_OPENAPI_PARSE_FAIL: 'E0060',
  ERR_POLICIES_NOT_FOUND: 'E0061',
  ERR_INVALID_OPENAPI_SPEC: 'E0062',
  ERR_NOT_MICRO_PLAN: 'E0080',
  ERR_MISSING_SUPPORTED_ACTION: 'E0081',
  ERR_SPECIFIED_UNSUPPORTED_ACTION: 'E0082',
  ERR_INVALID_SERVICE_PLAN: 'E0083',
  ERR_ORG_PLAN_REQUIRES_HOST: 'E0084',
  ERR_MICRO_PLAN_REQUIRES_MICRO: 'E0085',
  ERR_MISSING_AUTH: 'E0086',
  ERR_APIGEE_AUTH_BEARER_FAILED: 'E0087',
  ERR_INVALID_TARGET_PROTOCOL: 'E0088',
  ERR_MISSING_ORG: 'E0089',
  ERR_MISSING_ENV: 'E0090',
  ERR_MISSING_ENV_ORG: 'E0091',
  ERR_ORG_ENV_NOT_FOUND: 'E0092',
  ERR_NO_CONFIGURATION: 'E0093',
  ERR_CONFIG_PARSE: 'E0094',
  ERR_MISSING_MICRO_CORES_PARAMETER: 'E0095',
  ERR_NOT_MICRO_CORES_PLAN: 'E0096',
  ERR_BAD_BIND_COMMAND: 'E0097',
  ERR_MISSING_MICRO_C2C_PARAMETER: 'E0098',
  INFO_PROXY_CREATED_STOP: 'I0001',
  ERR_CF_AUTH: 'E1010',
  ERR_PROXY_BIND_FAILED: 'E1011',
  ERR_CF_BINDING_ROUTE: 'E1012',
  ERR_CF_EMPTY_SPACE: 'E1013',
  ERR_CF_GET_SPACE: 'E1014',
  ERR_CF_EMPTY_DOMAIN: 'E1015',
  ERR_CF_INTERNAL_DOMAIN: 'E1016',
  ERR_CF_ROUTES: 'E1017',
  ERR_CF_BIND_APP_TO_ROUTE: 'E1018',
  ERR_CF_CANT_GET_APP: 'E1019',
  ERR_CF_EMPTY_APP: 'E1020',
  ERR_CF_ADD_NETWORKING_POLICY: 'E1021',
  ERR_BIND_RESOURCE_REQURED: 'E1022',
  ERR_CF_EMPTY_BROKER_APP: 'E1023',
  ERR_CF_EMPTY_APP_DOMAIN: 'E1024',
  ERR_CF_BRS_FAILED: 'E1025',
  ERR_PORTAL_PLAN_RUN_BINDING: 'E1026',
  ERR_BIND_RESOURCE_APP_NAME_REQURED: 'E1027',
  ERR_BIND_RESOURCE_TARGET_APP_NAME_REQURED: 'E1028',
  ERR_MISSING_TARGET_APP_ROUTE: 'E1029'
}

var messages = {
  E0000: 'Unexpected Application Error',
  E0001: 'Error generating code coverage badge',
  E0010: 'Invalid JSON Sent to the server',
  E0011: 'Invalid protocol, needs to be TLS enabled. Send req over https',
  E0020: 'Proxy Creation Failed',
  E0021: 'Proxy Upload Failed',
  E0022: 'Error in zipping proxy bundle',
  E0023: 'Error in reading proxy template',
  E0024: 'Apigee returned non-200 response while fetching Virtual Hosts',
  E0030: 'Error Authenticating to Apigee, Please check Apigee credentials',
  E0031: 'Error making request to Apigee',
  E0032: 'Error uploading proxy to Apigee',
  E0033: 'Error Retrieving proxy revision details from Apigee',
  E0034: 'Error deploying proxy to Apigee',
  E0035: 'Error undeploying proxy from Apigee',
  E0036: 'Error proxy not found in Apigee',
  E0060: 'Error getting OpenAPI interface file',
  E0061: 'Unable to find policies in Open API spec',
  E0062: 'Invalid Open API Spec, Check policy attachment',
  E0080: 'Not a "microgateway" plan, "micro" parameter is invalid',
  E0081: 'Missing at least one supported "action"',
  E0082: 'Unsupported "action"(s)',
  E0083: 'Unrecognized Service Plan',
  E0084: 'Org plan requires "host" parameter',
  E0085: 'Microgateway plan requires "micro" parameter',
  E0086: 'Missing authorization ("bearer" or "basic" or "user"&"pass")',
  E0087: 'Error Authenticating to Apigee. Try refreshing Bearer token',
  E0088: 'Invalid target web "protocol"',
  E0089: 'Missing or empty "org" parameter',
  E0090: 'Missing or empty "env" parameter',
  E0091: 'Missing or empty "org" and "env" parameters',
  E0092: 'Inorrect "org" and "env" mapping',
  E0093: 'No configuration was found in your service broker environment. Please contact your Cloud Foundry administrator for more assistance',
  E0094: 'Error parsing "APIGEE_CONFIGURATIONS"',
  E0095: '"microgateway-coresident" plan requires the following parameter',
  E0096: 'Not a microgateway-coresident plan',
  E0097: 'Looks like a "bind-route-service" was run instead of "bind-service". Please use "bind-service" with the "microgateway-coresident" plan instead',
  I0001: 'Proxy created; as requested, no binding attempted',
  E1010: 'Unsuccessfull login to Cloud Foundry',
  E1011: 'Proxy binding failed',
  E1012: 'Create route in CF failed',
  E1013: 'Empty space',
  E1014: 'Error to get spaces list',
  E1015: 'Domain apps.internal not found',
  E1016: 'Cant get shared domains list',
  E1017: 'Cant get routes for app',
  E1018: 'Cant bind app to apps.internal',
  E1019: 'Cant get app',
  E1020: 'No such app',
  E1021: 'Cant add networking policy',
  E1022: 'Param "bind_resource" required',
  E1023: 'Broker app name required in manifest',
  E1024: 'Apps domain should be set in env',
  E1025: 'Bind-route-service failed with errors',
  E1026: 'Portal plan binding failed with errors',
  E1027: 'For portal plan param target_app_name required',
  E1028: 'Parameter "target_app_name" required',
  E1029: 'Parameter "target_app_route" required'
}

var getMessage = function (code) {
  return util.format('[%s] - %s', code, messages[code])
}

function LoggerError (code, statusCode, detailMessage) {
  Error.captureStackTrace(this, handle_error)
  let line = this.stack.split('\n')[1]
  this.topOfStack = line ? line.trim() : line
  this.code = code
  this.description = getMessage(code)  // 'description' expected in CF response
  if (detailMessage) {
    this.description += ': ' + detailMessage
  }
  this.statusCode = statusCode || 500
}

util.inherits(LoggerError, Error)

var handle_error = function (code, originalErr, statusCode, detailMessage) {
  if (originalErr instanceof LoggerError) {
    if (statusCode) {
      originalErr.statusCode = statusCode
    }
    return originalErr
  }

  const error = new LoggerError(code, statusCode, detailMessage)

  log.error({
    errAt: error.topOfStack,
    errStatusCode: statusCode,  // undefined if used default 500
    errDetails: originalErr,
    errDescription: error.description
  }, error.description)
  return error
}

module.exports.log = log

for (let name in codes) {
  const code = codes[name]
  const fn = handle_error.bind(this, code)
  fn.code = code
  module.exports[name] = fn
}
