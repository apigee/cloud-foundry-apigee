const ServicePlans = require('../lib/providers/service-plans')

const plan = new ServicePlans()
const microc2c = plan.getProvider('micro_c2c')
const microc2c = plan.getProvider('micro')

console.info('microc2c.getUrlFromProxyToApp', microc2c.getUrlFromProxyToApp({}))
console.info('microc2c.deriveParams', microc2c.deriveParams({
  target_app_port: 20,
  target_app_route: 'dev',
  target_app_space_name: 'space'
}))
