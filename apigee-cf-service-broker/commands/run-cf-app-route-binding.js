const { CFBinder } = require('../lib/providers/cf-binder')

const run = async () => {
  const client = new CFBinder()
  await client.login()
  const result = await client.runBinding({
    "target_app_port": 80,
    "target_app_route": "sample",
    "target_app_space_name": "dev"
  })
  console.info('RES', result)
  // console.info('new route', client.getAppInternalFullHostname())
}

run()