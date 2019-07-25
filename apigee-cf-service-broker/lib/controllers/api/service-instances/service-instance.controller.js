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
 * Implementation of [service broker API for CF](http://docs.cloudfoundry.org/services/api.html)
 *
 * @module
 */

const path = require('path')
const config = require(path.resolve('./config/environment'))
const catalogData = require(path.resolve('./lib/providers/catalog_data'))
const serviceBinding = require(path.resolve('./lib/providers/service-binding'))
const logger = require(path.resolve('./lib/helpers/logger'))
const ServicePlans = require(path.resolve('./lib/providers/service-plans'))
const { derivePort, deriveAction, deriveProtocol } = require(path.resolve('./lib/helpers/extractors'))

function deriveMicroParams(params) {
  const microParams = {
    target_app_port: derivePort(params),
    target_app_route: params.target_app_route.toString().trim(),
    edgemicro_key: params.edgemicro_key.toString().trim(),
    edgemicro_secret: params.edgemicro_secret.toString().trim()
  }
  return microParams
}

function deriveC2CParams (params, req) {
  const c2cParams = {
    target_app_port: derivePort(params),
    target_app_route: params.target_app_route.toString().trim(),
    bind_resource: req.body.bind_resource.route

  }
  if (params.off_c2c_binding) {
    c2cParams.off_c2c_binding = true
  }
  return c2cParams
}

/*
* {
*   with_docstore: Boolean, false by default,
*   target_app_route: String, app name in cf
*   target_app_port: Number, app port
*   target_app_space_name: String, app space name in cf
* }
* */
const derivePortalParams = (params = {}) => {
  const portalParams = {}

  const keys = [ 'with_docstore', 'target_app_route' ]

  keys.forEach((key) => {
    if (params[key]) {
      portalParams[key] = params[key]
    }
  })
  if (!params.with_docstore) {
    portalParams.with_docstore = false
  }
  portalParams.target_app_port = derivePort(params)

  return portalParams
}

// provising a service instance
const proviseServiceInstance = (req, res) => {
  const org = req.body.parameters.org.toString().trim()
  const env = req.body.parameters.env.toString().trim()
  const result = {
    dashboard_url: config.getApigeeConfiguration(org, env, (err, data) => {
      return data.get('APIGEE_DASHBOARD_URL')
    })
  }
  return res.status(201).json(result)
}
module.exports.proviseServiceInstance = proviseServiceInstance

// update a service instance
const updateServiceInstance = (req, res) => {
  res.status(422).json({
    description: 'Automatic plan changes are not supported today. Please contact Apigee Support.'
  })
}
module.exports.updateServiceInstance = updateServiceInstance

// deprovision a service instance
const removeServiceInstance = (req, res) => {
  res.json({})
}
module.exports.removeServiceInstance = removeServiceInstance

const runResourceBinding = async (req, res) => {
  // use instance_id to retrieve org and environment for proxy
  const bindReq = {
    instance_id: req.params.instance_id,
    binding_id: req.params.binding_id,
    service_id: req.body.service_id,
    org_id: req.body.context ? req.body.context.organization_guid : false,
    space_guid: req.body.context ?  req.body.context.space_guid : false,
    plan_id: req.body.plan_id,
    bind_resource: req.body.parameters.bind_resource || req.body.bind_resource,
    // TODO refactor me - move to base plan object.deriveActions
    action: deriveAction(req.body.parameters),
    org: req.body.parameters.org,
    env: req.body.parameters.env,
    user: req.body.parameters.user,
    pass: req.body.parameters.pass,
    basic: req.body.parameters.basic,
    bearer: req.body.parameters.bearer,
    micro: req.body.parameters.micro,
    // TODO refactor me - move to concrete planObject.derivePlanParameters
    portal: (req.body.plan_id === catalogData.guid.portal) ? derivePortalParams(req.body.parameters) : {},
    // TODO refactor me - move to planObject.derivePlanParameters
    micro_coresident: (req.body.plan_id === catalogData.guid.micro_coresident) ? deriveMicroParams(req.body.parameters) : {},
    micro_c2c: (req.body.plan_id === catalogData.guid.micro_c2c) ? deriveC2CParams(req.body.parameters, req) : {},
    host: req.body.parameters.host,
    // TODO refactor me - move to base plan object.deriveProtocol
    protocol: deriveProtocol(req.body.parameters).protocol,
    configuration: config.getApigeeConfiguration(
      req.body.parameters.org,
      req.body.parameters.env,
      function (err, data) { return data }
    )
  }

  try {
    // console.info('REQ.BODY', req.body)
    // console.info('BIND.REQ', bindReq)
    const plans = new ServicePlans()
    // we can skip proxy creating process if no proxy in parameters.action
    if (!bindReq.action.proxy) {
      const error = plans.validate(req.body)

      if (error) {
        return res.status(400).json(error)
      }
      const outputParam = plans.getOutputParam(req.body)

      return res.status(201).json(outputParam)
    }

    bindReq.plan = plans.getProvider(bindReq)

    if (bindReq.plan && bindReq.plan.error) {
      return res.status(400).json(bindReq.plan.error)
    }

    const bindRes = await serviceBinding.createAsync(bindReq)

    const outputParam = bindReq.plan.getOutputParam(bindRes)

    logger.log.info('runResourceBinding.%o', outputParam)

    return res.status(201).json(outputParam)
  } catch (error) {
    logger.log.error('runResourceBinding.%o', error)

    return res.status(500).json(error)
  }
}
module.exports.runResourceBinding = runResourceBinding

// delete binding
const removeServiceBinding = (req, res) => {
  res.json({})
}
module.exports.removeServiceBinding = removeServiceBinding
