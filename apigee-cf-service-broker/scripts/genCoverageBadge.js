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

var badger = require('istanbul-cobertura-badger')
var path = require('path')
var logger = require('../helpers/logger')
var opts = {
  destinationDir: path.resolve(__dirname, '..', 'test'), // REQUIRED PARAMETER!
  istanbulReportFile: path.resolve(__dirname, '..', 'coverage', 'cobertura-coverage.xml'),
  thresholds: {
    // overall percent >= excellent, green badge
    excellent: 90,
    // overall percent < excellent and >= good, yellow badge
    good: 65
    // overall percent < good, red badge
  }
}

console.log(opts)

// Load the badge for the report$
badger(opts, function parsingResults (err, badgeStatus) {
  if (err) {
    logger.ERR_CODE_COVERAGE_BADGE(err)
  } else {
    logger.log.info('Badge successfully generated')
  }
})
