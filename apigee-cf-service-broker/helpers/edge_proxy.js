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
 * Create proxy on Edge
 * @module
 */

var config = require('./config')
var JSZip = require('jszip')
var fs = require('fs')
var importProxy = require('./mgmt_api').importProxy
var getVirtualHosts = require('./mgmt_api').getVirtualHosts
var logger = require('./logger')
var template = require('es6-template-strings')
var openApi = require('./open_api.js')


// create proxy in edge org
function createProxy (bindReq, callback) {
  var proxyHostTemplate = bindReq.host || bindReq.configuration.get('APIGEE_PROXY_HOST_TEMPLATE')
  var mangledName = bindReq.proxyname || template(bindReq.configuration.get('APIGEE_PROXY_NAME_TEMPLATE'), {
    route: bindReq.bind_resource.route || bindReq.micro_coresident.target_app_route
  })
  // Regex of allowed characters (obviously case insensitive) according to API docs
  mangledName = mangledName.replace(/[^A-Z0-9._\-$ %]+/ig, '_')  // route can be host.domain/path

  var union = {}
  if (Object.getOwnPropertyNames(bindReq.micro_coresident).length > 0) {
      proxyHostTemplate = bindReq.micro_coresident.target_app_route
      mangledName = 'edgemicro_' + mangledName
      union = Object.assign({
        domain: bindReq.configuration.get('APIGEE_PROXY_DOMAIN'),
        proxyname: mangledName,
        basepath: '/',
        credentials: { edgemicro_key: bindReq.micro_coresident.edgemicro_key, edgemicro_secret: bindReq.micro_coresident.edgemicro_secret }
      }, bindReq)
  }
  else{
    if (bindReq.micro){
      proxyHostTemplate = bindReq.micro
      mangledName = 'edgemicro_' + mangledName
    }
    union = Object.assign({
      domain: bindReq.configuration.get('APIGEE_PROXY_DOMAIN'),
      proxyname: mangledName,
      basepath: '/' + bindReq.bind_resource.route,
      credentials: {}
    }, bindReq)
  }

  var bindResponse = function(deployRes) {
    if (bindReq.action.bind) {
      var proxyUrlRoot = template(proxyHostTemplate, union)
      bindReq.proxyURL = 'https://' + proxyUrlRoot + union.basepath
      bindReq.proxyname = union.proxyname
      bindReq.credentials = union.credentials
      logger.log.info('route proxy url:', bindReq.proxyURL, '->', bindReq.proxyname)
      callback(null, bindReq)  // bindReq request plus added results becomes bindRes response
    }
    else {
      var detail = "proxy name: " + union.proxyname + ", revision: " + deployRes.revision
      if (deployRes.statusCode != 200 && deployRes.statusCode != 201) {
        detail += ", detail: " + deployRes.body.message
      }
      var loggerError = logger.INFO_PROXY_CREATED_STOP(null, null, detail)
      callback(loggerError)
    }
  }

  if (bindReq.action.proxy) {
    uploadProxy(union, function (err, deployRes) {
      if (err) {
        var loggerError = logger.ERR_PROXY_UPLOAD_FAILED(err)
        callback(loggerError)
      } else {
        logger.log.info("created proxy")
        logger.log.info(deployRes)
        bindResponse(deployRes)
      }
    })
  }
  else {
    bindResponse()
  }
}

// should just get route details here, so we have access to parameters (add features)
function uploadProxy (proxyData, callback) {
  getZip(proxyData, function (err, zipBuffer) {
    if (err) {
      var loggerError = logger.ERR_PROXY_ZIP(err)
      callback(loggerError)
    } else {
      importProxy(proxyData, zipBuffer, callback)
    }
  })
}

/**
 * @param proxyData - Union of properties required for this function, and `mgmt_api.getVirtualHosts`
 * @param proxyData.proxyname
 * @param proxyData.basepath
 * @param proxyData.bind_resource.route
 */
function getZip (proxyData, callback) {
  fs.readFile('./proxy-resources/apiproxy.zip', function (err, data) {
    if (err) {
      var loggerError = logger.ERR_PROXY_READ_FAILED(err)
      callback(loggerError)
    } else {
      var zip = new JSZip(data)
      var re1 = /%BASEPATH%/g
      var re2 = /%PROXYNAME%/g
      var re3 = /%VIRTUALHOSTS%/g
      var re4 = /%TARGETURL%/g
      // get virtual hosts for org/env
      getVirtualHosts(proxyData, function (err, data) {
        if (err) {
          var loggerError = logger.ERR_UAE(err)
          callback(loggerError)
        } else {
          var dummyTargetUrl
          if(Object.getOwnPropertyNames(proxyData.micro_coresident).length > 0){
            dummyTargetUrl = proxyData.protocol + "://localhost:" + proxyData.micro_coresident.target_app_port
          }
          else{
            dummyTargetUrl = proxyData.protocol + "://" + proxyData.bind_resource.route  // Actual is X-Cf-Forwarded-Url header
          }
          var vHostString = JSON.parse(data).map(function (val) { return '<VirtualHost>' + val + '</VirtualHost>' }).join('\n')
          var proxyDefTemplate = zip.folder('apiproxy/proxies').file('default.xml')
          var proxyDefValue = proxyDefTemplate.asText().replace(re1, proxyData.basepath)
          proxyDefValue = proxyDefValue.replace(re3, vHostString)
          zip.folder('apiproxy/proxies').file('default.xml', proxyDefValue)
          var proxyNameTemplate = zip.file('apiproxy/cf-proxy.xml').asText()
          zip.file('apiproxy/cf-proxy.xml', proxyNameTemplate.replace(re2, proxyData.proxyname))
          var targetNameTemplate = zip.file('apiproxy/targets/default.xml').asText()
          zip.file('apiproxy/targets/default.xml', targetNameTemplate.replace(re4, dummyTargetUrl))
          // Check for open Api & add policy support
          openApi.generatePolicy(dummyTargetUrl, zip, function(err, updatedZip) {
            if (err) {
              callback(null, this.zip.generate({type: 'nodebuffer'}))
            }
            else {
              callback(null, updatedZip.generate({type: 'nodebuffer'}))
            }
          }.bind({ zip: zip }))
        }
      })
    }
  })
}

module.exports = {
  create: createProxy
}
