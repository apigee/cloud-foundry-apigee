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

var parse = require('json-parse')
var fs = require('fs')
var spawn = require('child_process').spawn

var run = function(){
    console.log("Starting Decorator")
    micro_data = getMicroData()
    validateMicroData(micro_data, function(err){
        if (err){
            console.error(err)
            return
        }
        else{
            startMicro(micro_data, function(err){
                if (err){
                    console.error(err)
                    return
                }
            })
        }
    })
}

var getMicroData = function(){
    var micro_data = {
        EDGEMICRO_ORG: process.env.EDGEMICRO_ORG || '',
        EDGEMICRO_ENV: process.env.EDGEMICRO_ENV || '',
        EDGEMICRO_CONFIG_DIR: process.env.EDGEMICRO_CONFIG_DIR || '',
        EDGEMICRO_KEY: '',
        EDGEMICRO_SECRET: ''
    }
    var vcap_services = parse({})(process.env.VCAP_SERVICES)
    Object.keys(vcap_services).forEach(function(service) {
        var service_instances = vcap_services[service]
        for(var i = 0; i < service_instances.length; i++){
            var instance = service_instances[i]
            var plan = instance.plan || ''
            if (plan.indexOf("microgateway-coresident") > -1){
                micro_data.EDGEMICRO_KEY = instance.credentials.edgemicro_key || ''
                micro_data.EDGEMICRO_SECRET = instance.credentials.edgemicro_secret || ''
            }
        }
    })
    return micro_data
}

var validateMicroData = function(micro_data, callback){
    var empty = []
    Object.keys(micro_data).forEach(function(key) {
        if (micro_data[key].trim().length == 0){
            empty.push(key)
        }
    })
    if (empty.length){
        callback('The following items (required) were not configured: ' + empty.toString())
    }
    else{
        callback(null)
    }
}

var startMicro = function(micro_data, callback){
    var path_additions = ["/home/vcap/app/tmp/node/bin", "/home/vcap/app/tmp/edgemicro/cli"]
    process.env.PATH += ":" + path_additions.join(":")
    
    console.log("Starting Edgemicro...")
    const edgemicro_args = ['start', '-o', micro_data.EDGEMICRO_ORG, '-e', micro_data.EDGEMICRO_ENV, '-k', micro_data.EDGEMICRO_KEY, '-s', micro_data.EDGEMICRO_SECRET, '-c', micro_data.EDGEMICRO_CONFIG_DIR]
    const start = spawn("edgemicro", edgemicro_args)

    start.stdout.on('data', function(data){
        console.log(data.toString())
    })

    start.stderr.on('data', function(data){
        var output = data.toString()
        console.error("Error starting edgemicro: " + output)
        if(output.indexOf("error") > -1 || output.indexOf("ERROR") > -1){
            start.kill()
            if(start.killed){
                console.error("Edgemicro process killed")
            }
            else{
                console.error("Could not kill Edgemicro, stopping parent process")
                process.exit(1)
            }
        }
    })
    start.on('exit', function (code){
        console.error("Edgemicro exited with code: " + code)
        callback("Edgemicro exited unexpectantly")
    })
}

module.exports = {
    run: run
}
require('make-runnable')