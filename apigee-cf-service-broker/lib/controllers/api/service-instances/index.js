const express = require('express')
const path = require('path')
const validate = require('express-jsonschema').validate
const config = require(path.resolve('./config/environment'))
const auth = require(path.resolve('./lib/helpers/auth'))(config)
const bindingSchema = require(path.resolve('./schemas/service_binding'))
const { configValidate } = require(path.resolve('./lib/middleware/config.validator'))
const { authValidate } = require(path.resolve('./lib/middleware/auth.validator'))
const { actionValidate } = require(path.resolve('./lib/middleware/action.validator'))
const { protocolValidate } = require(path.resolve('./lib/middleware/protocol.validator'))

const controller = require(path.resolve('./lib/controllers/api/service-instances/service-instance.controller'))

const router = express.Router();

router.use(auth)

router.put('/:instance_id', configValidate, controller.proviseServiceInstance)
router.patch('/:instance_id', controller.updateServiceInstance)
router.delete('/:instance_id', controller.removeServiceInstance)
router.put(
  '/:instance_id/service_bindings/:binding_id',
  validate({body: bindingSchema.bind}),
  authValidate,
  actionValidate,
  protocolValidate,
  configValidate,
  controller.runResourceBinding
)

router.delete('/:instance_id/service_bindings/:binding_id', controller.removeServiceBinding)

module.exports = router;
