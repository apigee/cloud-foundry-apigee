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
var yaml = require('js-yaml')
const os = require('os')

var run = function(){
    console.log("Starting Decorator")
    micro_data = getMicroData()
    validateMicroData(micro_data, function(err){
        if (err){
            console.error(err)
            return
        }
        else{
            configureMicro(micro_data, function(err){
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
                    return
                }
            })
        }
    })
}

var parseCustom = function(config_string){
    var config_obj = {}
    try{
        config_obj = JSON.parse(config_string)
    }
    catch(e){
        config_obj.error = 'Error parsing "APIGEE_MICROGATEWAY_CUSTOM": ' + e
    }
    return config_obj
}

var combineExisting = function(first, second){
    var combined = []
    if (first.length > 0 && second.length > 0){
        combined = Array.from(new Set(first.concat(second)))
    }
    else if (first.length > 0){
        combined = first
    }
    else if (second.length > 0){
        combined = second
    }
    return combined
}

var getMicroData = function(){
    var micro_data = {
        required: {
            APIGEE_MICROGATEWAY_ORG: '',
            APIGEE_MICROGATEWAY_ENV: '',
            APIGEE_MICROGATEWAY_CONFIG_DIR: os.homedir() + "/" + process.env.APIGEE_MICROGATEWAY_CONFIG_DIR || '',
            APIGEE_MICROGATEWAY_PROXY: process.env.APIGEE_MICROGATEWAY_PROXY || '',
            APIGEE_MICROGATEWAY_KEY: '',
            APIGEE_MICROGATEWAY_SECRET: ''
        },
        optional: {
            APIGEE_MICROGATEWAY_CUSTOM: process.env.APIGEE_MICROGATEWAY_CUSTOM ? parseCustom(process.env.APIGEE_MICROGATEWAY_CUSTOM) : {},
            APIGEE_MICROGATEWAY_PROCESSES: process.env.APIGEE_MICROGATEWAY_PROCESSES ? process.env.APIGEE_MICROGATEWAY_PROCESSES : ""
        }
    }
    var vcap_services = parse({})(process.env.VCAP_SERVICES)
    Object.keys(vcap_services).forEach(function(service) {
        var service_instances = vcap_services[service]
        for(var i = 0; i < service_instances.length; i++){
            var instance = service_instances[i]
            var plan = instance.plan || ''
            if (plan.indexOf("microgateway-coresident") > -1){
                micro_data.required.APIGEE_MICROGATEWAY_KEY = instance.credentials.edgemicro_key || ''
                micro_data.required.APIGEE_MICROGATEWAY_SECRET = instance.credentials.edgemicro_secret || ''
                micro_data.required.APIGEE_MICROGATEWAY_ORG = instance.credentials.apigee_org || ''
                micro_data.required.APIGEE_MICROGATEWAY_ENV = instance.credentials.apigee_env || ''
                if (micro_data.required.APIGEE_MICROGATEWAY_PROXY.length == 0) {
                    micro_data.required.APIGEE_MICROGATEWAY_PROXY = instance.credentials.apigee_proxy || ''
                }
            }
        }
    })
    return micro_data
}

var validateMicroData = function(micro_data, callback){
    var required = micro_data.required
    var optional = micro_data.optional
    var empty = []
    Object.keys(required).forEach(function(key) {
        if (required[key].trim().length == 0){
            empty.push(key)
        }
    })
    if (empty.length){
        callback('The following items (required) were not configured: ' + empty.toString())
    }
    else if (optional.APIGEE_MICROGATEWAY_CUSTOM.error){
        callback(optional.APIGEE_MICROGATEWAY_CUSTOM.error)
    }
    else{
        callback(null)
    }
}

var configureMicro = function(micro_data, callback){
    var required = micro_data.required
    var optional = micro_data.optional
    if (Object.getOwnPropertyNames(optional.APIGEE_MICROGATEWAY_CUSTOM).length == 0){
        callback(null)
    }
    else {
        var config_file = required.APIGEE_MICROGATEWAY_CONFIG_DIR + "/" + required.APIGEE_MICROGATEWAY_ORG + "-" + required.APIGEE_MICROGATEWAY_ENV + "-config.yaml"
        try{
            var config_obj = yaml.safeLoad(fs.readFileSync(config_file, "utf8"))
        }
        catch (e){
            callback(e)
        }

        config_obj.edgemicro = config_obj.edgemicro ? config_obj.edgemicro : {}
        
        var existing_seq = (config_obj.edgemicro.plugins && config_obj.edgemicro.plugins.sequence) ? config_obj.edgemicro.plugins.sequence : []
        var custom_seq = optional.APIGEE_MICROGATEWAY_CUSTOM.sequence ? optional.APIGEE_MICROGATEWAY_CUSTOM.sequence : []
        
        config_obj.edgemicro.proxies = [micro_data.required.APIGEE_MICROGATEWAY_PROXY]
        config_obj.edgemicro.plugins = {
            dir: "../plugins",
            sequence: combineExisting(existing_seq, custom_seq)
        }
        
        var policies = optional.APIGEE_MICROGATEWAY_CUSTOM.policies ? optional.APIGEE_MICROGATEWAY_CUSTOM.policies : {}
        Object.keys(policies).forEach(function(policy) {
            config_obj[policy] = policies[policy]
        })
        
        
        var new_yaml = yaml.safeDump(config_obj)
        fs.writeFile(config_file, new_yaml, function(err) {
            if(err) {
                callback(err);
            }
            else{
                callback(null)
            }
        })
    }

}

var startMicro = function(micro_data, callback){
    console.log("Starting Apigee Microgateway...")
    process.env.EDGEMICRO_ENV = micro_data.required.APIGEE_MICROGATEWAY_ENV
    process.env.EDGEMICRO_ORG = micro_data.required.APIGEE_MICROGATEWAY_ORG
    process.env.EDGEMICRO_SECRET = micro_data.required.APIGEE_MICROGATEWAY_SECRET
    process.env.EDGEMICRO_KEY = micro_data.required.APIGEE_MICROGATEWAY_KEY
    process.env.EDGEMICRO_CONFIG_DIR = micro_data.required.APIGEE_MICROGATEWAY_CONFIG_DIR
    process.env.EDGEMICRO_DECORATOR = true
    if (micro_data.optional.hasOwnProperty("APIGEE_MICROGATEWAY_PROCESSES").length > 0){
        process.env.EDGEMICRO_PROCESSES = micro_data.optional.APIGEE_MICROGATEWAY_PROCESSES
    }

    if (process.env.MICROGATEWAY_NODEJS === undefined) {
        callback("The MICROGATEWAY_NODEJS var is not set. This should be the path to the node binary being used for edgemicro")
    }

    if (process.env.MICROGATEWAY_SOURCE_DIR === undefined) {
        callback("The MICROGATEWAY_SOURCE_DIR var is not set. This should be the path to the edgemicro source code")
    }

    const start = spawn(process.env.MICROGATEWAY_NODEJS, [process.env.MICROGATEWAY_SOURCE_DIR + "/app.js"])

    start.stdout.on('data', function(data){
        console.log(data.toString())
    })

    start.stderr.on('data', function(data){
        var output = data.toString()
        console.error("Error starting Apigee Microgateway: " + output)
        if(output.indexOf("error") > -1 || output.indexOf("ERROR") > -1 || output.indexOf("not found") > -1){
            start.kill()
            if(start.killed){
                console.error("Apigee Microgateway process killed")
            }
            else{
                console.error("Could not kill Apigee Microgateway, stopping parent process")
                process.exit(1)
            }
        }
    })
    start.on('exit', function (code){
        console.error("Apigee Microgateway exited with code: " + code)
        callback("Apigee Microgateway exited unexpectantly")
    })
}

module.exports = {
    run: run
}
require('make-runnable')