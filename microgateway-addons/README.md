# Apigee Edge Microgateway for Cloud Foundry

You can run [Apigee Edge Microgateway](http://docs.apigee.com/microgateway/content/edge-microgateway-home) in Cloud Foundry to gain the scalability and management benefits that Cloud Foundry provides for other apps it hosts. This file includes instructions for adding Edge Microgateway as a Cloud Foundry-managed application and adding a plugin needed to bind Cloud Foundry applications to Edge Microgateway proxies.

To do that, with these instructions you turn your Edge Microgateway installation directory into the root directory of a Cloud Foundry app, including a plugin.

When you run Edge Microgateway as a Cloud Foundry app, you shorten the distance between a proxy running on Edge Microgateway and a Cloud Foundry app bound to it. This shortened distance can increase performance.

## Prerequisites
1. Apigee Edge Microgateway is available on GitHub [here](https://github.com/apigee-internal/microgateway). Fork or Clone this project.
```git clone https://github.com/apigee-internal/microgateway```

2. Install npm modules
```
cd microgateway
npm install .
```
*NOTE*: If your cloud foundry instance does not have access to the internet (to download npm modules), please read the instructions [here](http://docs.cloudfoundry.org/buildpacks/node/index.html#yarn_disconnected)

3. [Configure Microgateway](http://docs.apigee.com/microgateway/latest/setting-and-configuring-edge-microgateway): This will produce a configuration yaml file that will be used be used by microgateway to connect to Apigee Edge. The configuration file is of the format: `{orgname}-{env}-config.yaml`

```edgemicro configure -o {org-name} -e {env-name} -u {apigee-username}```

*NOTE*: Apigee Edge on prem users should run `edgemicro private configure`

Copy the {orgname}-{env}-config.yaml file to the microgateway/config folder. Note the microgateway key and secret fields. You'll need it later.

## Deploy Microgateway to Cloud Foundry

1. Add the “cloud-foundry-route-service” plugin to the `{orgname}-{envname}-config.yaml` file if not already added
```
edgemicro:
  port: 8000
  max_connections: 1000
  ...
  plugins:
    sequence:
      - oauth
      - cloud-foundry-route-service
```
*NOTE*: You can add other plugins (including custom ones). The insturctions to add other plugins are found [here](http://docs.apigee.com/microgateway/latest/use-plugins)

2. Review the manifest.yml file
```
---
applications:
- name: edgemicro
  memory: 512M
  instances: 1
  host: edgemicro
  path: .
  buildpack: nodejs_buildpack
  env: 
    EDGEMICRO_KEY: 'bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx2'
    EDGEMICRO_SECRET: 'exxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0'
    EDGEMICRO_CONFIG_DIR: '/app/config'
    EDGEMICRO_ENV: 'env-name'
    EDGEMICRO_ORG: 'org-name'
```
Review and/or update the following fields:
a. Instances (for auto-scaling)
b. Memory (min: 512M)
c. Microgateway environment variables (key, secret, org and env)

3. Deploy the app to cloud foundry
```cf push```

## Bind Microgateway to Service
Please see instructions [here](https://github.com/apigee/pivotal-cf-apigee/tree/master/apigee-cf-service-broker#microgateway) to bind microgateway to your service.
