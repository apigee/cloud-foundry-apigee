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
 * Implementation of [catalog API for CF](http://docs.cloudfoundry.org/services/api.html)
 * @module
 */

const path = require('path')
const config = require(path.resolve('./config/environment'))
const express = require('express')
const router = express.Router()
const auth = require(path.resolve('./lib/helpers/auth'))(config)
const catalogData = require(path.resolve('./lib/providers/catalog_data'))

// TODO - populate services object from a data store.. CPS?
// TODO - this catalog will be different for private cloud

const services = catalogData.getServiceCatalog()

// basic auth on this
router.use(auth)

router.get('/', (req, res) => {
  res.json({services: services})
})

/**
 * Router for `/catalog`
 * @type express.Router
 */
module.exports = router
