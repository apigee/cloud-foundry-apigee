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
var config = require('../../config/environment')
const { LOGIN_ENDPOINT, CF_API_URL, APPS_INTERNAL_DOMAIN } = require('../../lib/providers/cf-binder')
const openApiJson = require('./openApi.json')
const fs = require('fs')
const path = require('path')
const openApiYaml = fs.readFileSync(path.resolve('./test/helpers/openApi.yaml'))

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

nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/apis?action=import&name=edgemicro_target_app_route-here', /.*/)
  .times(6)
  .reply(201, [
    'default',
    'secure'
  ])

nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/apis?action=import&name=edgemicro_app-name-here.apps.pcf24.apigee.xyz', /.*/)
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
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/apis?action=import&name=cf-bind_resource-route-url-here.com', /.*/)
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

nock(config.default.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo/apis/edgemicro_app-name-here.apps.pcf24.apigee.xyz')
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

nock(config.default.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo/apis/edgemicro_cf-bind_resource-route-url-here.com')
  .times(6)
  .reply(200, {
    metaData: {
      createdAt: 1453098892108,
      createdBy: 'xx@xx.com',
      lastModifiedAt: 1453099158391,
      lastModifiedBy: 'xx@xx.com'
    },
    name: 'cf-bind_resource-route-url-here.com',
    revision: [
      '1'
    ]
  })

// https://api.enterprise.apigee.com/v1
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo/apis/edgemicro_target_app_route-here', /.*/)
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

nock(config.default.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo/apis/cf-bind_resource-route-url-here.com')
  .times(6)
  .reply(200, {
    metaData: {
      createdAt: 1453098892108,
      createdBy: 'xx@xx.com',
      lastModifiedAt: 1453099158391,
      lastModifiedBy: 'xx@xx.com'
    },
    name: 'cf-bind_resource-route-url-here.com',
    revision: [
      '1'
    ]
  })

// Apigee Deploy Proxy Details Nock - edgemicro
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/environments/test/apis/edgemicro_app-name-here.apps.pcf24.apigee.xyz/revisions/1/deployments')
  .times(6).reply(200)

nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/environments/test/apis/edgemicro_cf-route-url-here/revisions/1/deployments')
  .times(6).reply(200)
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/environments/test/apis/edgemicro_cf-bind_resource-route-url-here.com/revisions/1/deployments')
  .times(6).reply(200)
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/environments/test/apis/edgemicro_target_app_route-here/revisions/1/deployments')
  .times(6).reply(200)

// Apigee UnDeploy Proxy Details Nock - edgemicro
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .delete('/organizations/cdmo/environments/test/apis/edgemicro_cf-route-url-here/revisions/1/deployments')
  .times(6).reply(200)

nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/environments/test/apis/cf-route-url-here/revisions/1/deployments')
  .times(6).reply(200)
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/environments/test/apis/cf-bind_resource-route-url-here.com/revisions/1/deployments')
  .times(6).reply(200)

// Apigee UnDeploy Proxy Details Nock
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .delete('/organizations/cdmo/environments/test/apis/cf-route-url-here/revisions/1/deployments')
  .times(6).reply(200)

// Apigee addproduct nock
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/apiproducts')
  .times(10)
  .reply(201, {
    'apiResources': [
      '/resource'
    ],
    'approvalType': 'auto',
    'attributes': [
      {
        'name': 'access',
        'value': 'public'
      }
    ],
    'description': '{description}',
    'displayName': '{display_name}',
    'environments': [
      'test',
      'prod'
    ],
    'name': 'api-product-name',
    'proxies': [],
    'quota': '1',
    'quotaInterval': '1',
    'quotaTimeUnit': 'minute',
    'scopes': []
  })

// Cloud foundry calls
// cf-cli - login to cf
nock(LOGIN_ENDPOINT)
  .post('/oauth/token')
  .times(10)
  .reply(200,
    {
      access_token: 'access_token',
      token_type: 'bearer',
      id_token: 'idtoken',
      refresh_token: 'refresh_token',
      expires_in: 200,
      scope: 'scope',
      jti: 'jti'
    })

// cf-cli - get spaces
nock(CF_API_URL)
  .get('/v2/spaces')
  .times(10)
  .reply(200, {
    resources: [
      {
        entity: {
          name: 'space-name-here'
        },
        metadata: {
          guid: 'space-guid-here'
        }
      }
    ]
  })

// cf-cli - get shared domains with apps.internal
nock(CF_API_URL)
  .get('/v2/shared_domains')
  .times(10)
  .reply(200, {
    resources: [
      {
        entity: {
          name: APPS_INTERNAL_DOMAIN
        },
        metadata: {
          guid: 'domain-guid-here'
        }
      },
      {
        entity: {
          name: config.cf.appsBaseDomain
        },
        metadata: {
          guid: 'cf-base-domain-guid'
        }
      }
    ]
  })

// cf-cli - get routes
nock(CF_API_URL)
  .get('/v2/routes')
  .times(10)
  .reply(200, {
    resources: [
      {
        entity: {
          host: 'target_app_route-here',
          domain_guid: 'cf-base-domain-guid'
        },
        metadata: {
          guid: 'route-guid-here'
        }
      }
    ]
  })

// cf-cli - get apps
nock(CF_API_URL)
  .get('/v2/apps')
  .times(10)
  .reply(200, {
    resources: [
      {
        entity: {
          name: 'app-name-here'
        },
        metadata: {
          guid: 'app-guid-here'
        }
      },
      {
        entity: {
          name: 'c2c-mg-name'
        },
        metadata: {
          guid: 'app-guid-here'
        }
      },
      {
        entity: {
          name: 'cf-broker-name'
        },
        metadata: {
          guid: 'app-guid-here'
        }
      }
    ]
  })

nock(CF_API_URL)
  .get('/v2/spaces/space-guid-here/apps')
  .times(10)
  .reply(200, {
    resources: [
      {
        entity: {
          name: 'target_app_route-here'
        },
        metadata: {
          guid: 'target_app_route-here-guid'
        }
      },
      {
        entity: {
          name: 'app-name-here'
        },
        metadata: {
          guid: 'app-guid-here'
        }
      },
      {
        entity: {
          name: 'c2c-mg-name'
        },
        metadata: {
          guid: 'c2c-mg-guid'
        }
      },
      {
        entity: {
          name: 'cf-broker-name'
        },
        metadata: {
          guid: 'cf-broker-guid'
        }
      }
    ]
  })

// cf-cli - remove route
nock(CF_API_URL)
  .delete('/v2/routes/route-guid-here')
  .times(10)
  .reply(200, {})

// cf-cli - add route
nock(CF_API_URL)
  .post('/v2/routes')
  .times(10)
  .reply(201, {
    entity: {
      host: 'route-host-here'
    },
    metadata: {
      guid: 'route-guid-here'
    }
  })

// cf-cli - map-route
// /v2/apps/${appGuid}/routes/${routeGuid}
nock(CF_API_URL)
  .put('/v2/apps/app-guid-here/routes/route-guid-here')
  .times(10)
  .reply(201, {
    fake: 'fake'
  })
nock(CF_API_URL)
  .put('/v2/apps/target_app_route-here-guid/routes/route-guid-here')
  .times(10)
  .reply(201, {
    fake: 'fake'
  })

// https://api.system.pcf24.apigee.xyz/networking/v1/external/policies
// cf-cli - add networking policy
nock(CF_API_URL)
  .post('/networking/v1/external/policies')
  .times(10)
  .reply(200, {})

// apigee portal list
// https://apigee.com/portals/api/sites?orgname=cdmo
nock('https://apigee.com')
  .get('/portals/api/sites?orgname=cdmo')
  .times(10)
  .reply(200, {
    data: [
      {
        id: 'portal-id-here',
        name: 'Portal name here',
        trashed: false,
        trashedOn: null
      }
    ],
    error_code: null,
    message: 'Returning sites',
    request_id: '1083343753',
    status: 'success'
  })

// https://apigee.com/organizations/yauhenikisialiou-eval/specs/folder/home
nock('https://apigee.com')
  .get('/organizations/cdmo/specs/folder/home')
  .times(10)
  .reply(200, {
    content: [
      { id: 174245, folder: 147770, kind: 'Folder', name: 'test', created: '2019-06-11T11:13:38.612Z' }
    ],
    created: '2019-02-26T17:07:45.805Z',
    folder: 147770,
    id: 147770,
    kind: 'Folder',
    modified: '2019-02-26T17:07:45.805Z',
    name: '/orgs/yauhenikisialiou-eval root'
  })
// create folder in apigee
nock('https://apigee.com')
  .post('/organizations/cdmo/specs/folder')
  .times(10)
  .reply(200, {
    content: [],
    created: '2019-06-12T13:40:06.839Z',
    folder: 147770,
    id: 174636,
    kind: 'Folder',
    modified: '2019-06-12T13:40:06.839Z',
    name: 'target_app-name-here'
  })

// apigee login
// https://login.apigee.com/oauth/token
nock('login.apigee.com')
  .post('/oauth/token')
  .times(10)
  .reply(200, {
    access_token: '123',
    token_type: 'bearer'
  })

// https://apigee.com/organizations/cdmo/specs/doc
// apigee specs create
nock('https://apigee.com')
  .post('/organizations/cdmo/specs/doc')
  .times(10)
  .reply(201, {
    id: 'spec-id-here'
  })

nock('https://apigee.com')
  .put('/organizations/cdmo/specs/doc/spec-id-here/content')
  .times(10)
  .reply(200, {
    id: 'spec-id-here'
  })

// apigee portals list
nock('https://apigee.com')
  .get('/organizations/cdmo/portals/api/sites')
  .times(10)
  .reply(200, {
    data: []
  })
// apigee create portal
nock('https://apigee.com')
  .post('/portals/api/sites')
  .times(10)
  .reply(200, {
    data: {
      id: 'portal-id-here',
      orgname: 'cdmo'
    }
  })

// apigee portals - add spec to portal
nock('https://apigee.com')
  .post('/portals/api/sites/portal-id-here/apidocs')
  .times(10)
  .reply(200, {
    data: {
      id: 'portal-id-here',
      orgname: 'cdmo'
    }
  })

// apigee apiproducts
nock(config.default.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo/apiproducts?expand=true')
  .times(10)
  .reply(200, {
    apiProduct: []
  })

// openapi app specs
const openApiSpecs = [
  'http://localhost:8081',
  'http://route-url-here',
  'http://bind_resource-route-url-here.com',
  'http://target_app_route-here',
  'http://route-host-here.apps.internal',
  'http://target_app_route-here.cf-base-domain'
]
for (let baseUrl of openApiSpecs) {
  nock(baseUrl)
    .get('/openApi.json')
    .times(10)
    .reply(200, openApiJson)

  nock(baseUrl)
    .get('/openApi.yaml')
    .times(10)
    .reply(200, openApiYaml)
}

// https://cdmo-test.onprem.net/bind_resource-route-url-here.com/openapi
nock('https://cdmo-test.onprem.net')
  .get('/bind_resource-route-url-here.com/openapi')
  .times(10)
  .reply(200, openApiJson)

nock('https://target_app_route-here.cf-base-domain')
  .get('/openapi')
  .times(10)
  .reply(200, openApiJson)
