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

var nock = require('nock')
var config = require('../../helpers/config')
/* As per NOCK - works only once per API call */

// Auth Fail Apigee - Nock Interceptor
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/org-name-here')
  .times(6)
  .reply(401)
// Auth Success Apigee - Nock Interceptor
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo')
  .times(6)
  .reply(200, {
    createdAt: '1416395731939',
    createdBy: 'noreply_admin@apigee.com',
    displayName: 'cdmo',
    environments: [
      'test',
      'prod'
    ],
    lastModifiedAt: 1454446553950,
    lastModifiedBy: 'noreply_cpsadmin@apigee.com',
    name: 'cdmo',
    properties: {
      property: [
        {
          name: 'features.isCpsEnabled',
          value: 'true'
        }
      ]
    },
    type: 'trial'
  })
// Apigee Get VirtiaHosts Nock
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo/environments/test/virtualhosts')
  .times(6)
  .reply(200, [
    'default',
    'secure'
  ])

// Apigee Upload Proxy nock - edgemicro
nock(config.default.get('APIGEE_MGMT_API_URL'))
.post('/organizations/cdmo/apis?action=import&name=edgemicro_cf-route-url-here', /.*/)
.times(6)
.reply(201, [
  'default',
  'secure'
])

// Apigee Upload Proxy nock
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/apis?action=import&name=cf-route-url-here', /.*/)
  .times(6)
  .reply(201, [
    'default',
    'secure'
  ])

// Apigee Get Proxy Details Nock
nock(config.default.get('APIGEE_MGMT_API_URL'))
.get('/organizations/cdmo/apis/edgemicro_cf-route-url-here')
.times(6)
.reply(200, {
  metaData: {
    createdAt: 1453098892108,
    createdBy: 'xx@xx.com',
    lastModifiedAt: 1453099158391,
    lastModifiedBy: 'xx@xx.com'
  },
  name: 'cf-route-url-here',
  revision: [
    '1'
  ]
})

// Apigee Get Proxy Details Nock
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo/apis/cf-route-url-here')
  .times(6)
  .reply(200, {
    metaData: {
      createdAt: 1453098892108,
      createdBy: 'xx@xx.com',
      lastModifiedAt: 1453099158391,
      lastModifiedBy: 'xx@xx.com'
    },
    name: 'cf-route-url-here',
    revision: [
      '1'
    ]
  })
// Apigee Deploy Proxy Details Nock - edgemicro
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/environments/test/apis/edgemicro_cf-route-url-here/revisions/1/deployments')
  .times(6).reply(200)
// Apigee UnDeploy Proxy Details Nock - edgemicro
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .delete('/organizations/cdmo/environments/test/apis/edgemicro_cf-route-url-here/revisions/1/deployments')
  .times(6).reply(200)

nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/environments/test/apis/cf-route-url-here/revisions/1/deployments')
  .times(6).reply(200)
// Apigee UnDeploy Proxy Details Nock
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .delete('/organizations/cdmo/environments/test/apis/cf-route-url-here/revisions/1/deployments')
  .times(6).reply(200)