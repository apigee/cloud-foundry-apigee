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
  INFO_PROXY_CREATED_STOP: 'I0001'
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
  E0080: 'Not a Microgateway plan: "micro" parameter invalid',
  E0081: 'Missing at least one supported "action"',
  E0082: 'Unsupported "action"(s)',
  E0083: 'Unrecognized Service Plan',
  E0084: 'Org plan requires "host" parameter',
  E0085: 'Microgateway plan requires "micro" parameter',
  E0086: 'Missing authorization ("bearer" or "basic" or "user"&"pass")',
  E0087: 'Error Authenticating to Apigee. Try refreshing Bearer token',
  E0088: 'Invalid target web "protocol"',
  I0001: 'Proxy created; as requested, no binding attempted'
}

var getMessage = function(code) {
  return util.format('[%s] - %s', code, messages[code])
}

function LoggerError(code, statusCode, detailMessage) {
    Error.captureStackTrace(this, handle_error)
    let line = this.stack.split('\n')[1]
    this.topOfStack = line ? line.trim() : line
    this.code = code
    this.description = getMessage(code)  // 'description' expected in CF response
    if (detailMessage) {
      this.description += ': ' + detailMessage;
    }
    this.statusCode = statusCode || 500
}
util.inherits(LoggerError, Error)

var handle_error = function(code, originalErr, statusCode, detailMessage) {
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
        errDetails: originalErr
    }, error.description);
    return error
}


module.exports.log = log;
for (let name in codes) {
    const code = codes[name]
    const fn = handle_error.bind(this, code)
    fn.code = code
    module.exports[name] = fn
}
