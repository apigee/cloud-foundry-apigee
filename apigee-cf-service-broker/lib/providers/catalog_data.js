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
 * Catalog data and GUIDs
 * @module
 */

// cf-cli sets to req.body.plan_id from service_plan.entity.unique_id
// all info about service-plans can get from command
//  # CF_LOGIN=<user> CF_LOGIN_PASSWORD=<password> node commands/service-plans
// or
//  # cf -v service-access
const ORG_GUID = 'D45A55FE-9576-427A-A0B7-B09E56BCB5C7'
const MICRO_CORESIDENT_GUID = '0E1FFDCC-88E1-4AE3-8ED1-889689212F98'
const MICRO_GUID = '0D41E763-E48C-4CF4-BE21-5772A219D624'
const MICRO_C2C_GUID = '2A7D9A35-1CB3-4E05-8085-CC0100331A96'
const PORTAL_UUID = '04B7CC7F-EE5D-4BF4-A5D7-1C637651F545'

// service catalog - TODO: this should be configurable
const getServiceCatalog = () => {
  return [
    {
      id: '5E3F917B-9225-4BE4-802F-8F1491F714C0',
      name: 'apigee-edge',
      description: 'Apigee Edge API Platform',
      bindable: true,
      tags: ['api', 'api management', 'api platform'],
      metadata: {
        displayName: 'Apigee Edge API Platform',
        imageUrl: 'http://apigee.com/about/sites/all/themes/apigee_themes/apigee_bootstrap/ApigeeLogo@2x.png',
        longDescription: 'Apigee Edge enables digital business acceleration with a unified and complete platform, purpose-built for the digital economy. Edge simplifies managing the entire digital value chain with API Services, Developer Services, and Analytics Services.',
        providerDisplayName: 'Apigee',
        documentationUrl: 'http://apigee.com/docs/',
        supportUrl: 'http://community.apigee.com/'
      },
      requires: ['route_forwarding'],
      plan_updateable: true,
      plans: [
        {
          id: ORG_GUID,
          name: 'org',
          description: 'Apigee Edge for Route Services',
          metadata: {
            displayName: 'Apigee Edge for Route Services'
          },
          free: true
        },
        {
          id: MICRO_GUID,
          name: 'microgateway',
          description: 'Apigee Edge Microgateway for Route Services. This plan requires launching Microgateway as a separate Cloud Foundry application',
          metadata: {
            displayName: 'Apigee Edge Microgateway for Route Services as its own Cloud Foundry application'
          },
          free: true
        },
        {
          id: MICRO_CORESIDENT_GUID,
          name: 'microgateway-coresident',
          description: 'Apigee Edge Microgateway coresident plan. Coresident means Microgateway will be on the same container as the target application',
          metadata: {
            displayName: 'Apigee Edge Microgateway coresident plan for running Microgateway on the same container as the target application'
          },
          free: true
        },
        {
          id: MICRO_C2C_GUID,
          name: 'microgateway-c2c',
          description: 'Apigee Edge Microgateway C2C plan. C2C means Microgateway will use CloudFounry container to container networking to access backend APP. Backend app will not have a route',
          metadata: {
            displayName: 'Apigee Edge Microgateway C2C plan for running Microgateway and backend app in the same CloudFounry internal domain'
          },
          free: true
        },
        {
          id: PORTAL_UUID,
          name: 'portal',
          description: 'Apigee Edge Portal plan. Creates portal for org plan',
          metadata: {
            displayName: 'Apigee Edge Portal plan creates proxy, portal, api product for app'
          },
          free: true
        }
      ],
      dashboard_client: {
        id: 'apigee-dashboard-client-id',
        secret: 'secret code phrase',
        redirect_uri: 'https://enterprise.apigee.com'
      }
    }
  ]
}

module.exports = {
  guid: Object.freeze({
    org: ORG_GUID,
    micro: MICRO_GUID,
    micro_coresident: MICRO_CORESIDENT_GUID,
    micro_c2c: MICRO_C2C_GUID,
    portal: PORTAL_UUID
  }),
  getServiceCatalog
}
