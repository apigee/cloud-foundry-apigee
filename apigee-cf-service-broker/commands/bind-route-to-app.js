const path = require('path')
const commandLineArgs = require('command-line-args')
const { CF_API_URL, CFBinder } = require('../lib/providers/cf-binder')
const Apps = require(path.resolve('./lib/providers/cf-nodejs-client/model/cloudcontroller/Apps'))

const optionDefinitions = [
  { name: 'src', alias: 's', type: String },
  { name: 'dst', alias: 'd', type: String },
];

const options = commandLineArgs(optionDefinitions);

const run = async () => {
  const client = new CFBinder()
  await client.login()

  const apps = await client.getApps({
    space: { metadata: { guid: '15ecd7cf-42b0-439d-a009-57df23b9c400' } }
  })
  const app = apps.resources.find(r => r.entity.name = options.src)

  const route = await client.getRoute({ target_app_route: options.dst } )

  const appsService = new Apps(CF_API_URL)
  appsService.setToken(client.loginResponse)

  const mappedResult = await appsService.associateRoute(app.metadata.guid, route.metadata.guid)

  console.info('new route', JSON.stringify(app, null, 2), route, mappedResult)
}

run()