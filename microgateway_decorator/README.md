# Microgateway Decorator Buildpack

## Overview
This is an intermediate buildpack for Cloud Foundry that provides integration with the [Apigee Service Broker](https://github.com/apigee/cloud-foundry-apigee). 

When using the [Apigee Service Broker](https://github.com/apigee/cloud-foundry-apigee), this buildpack allows you to use the [Apigee Coresident Plan](https://github.com/apigee/cloud-foundry-apigee/blob/master/docs/setup-microgateway-coresident.md) to secure cloud foundry applications.

## Uploading
To upload this buildpack run the `upload` script: `./upload`

## Use
*Note*: Due to limitations with the [Java Buildpack](https://github.com/cloudfoundry/java-buildpack/issues/563), this decorator will not work with Java applications.

*Note*: This buildpack requires the `Apigee Service Broker` to be installed in your Cloud Foundry deployment. To do this follow the instructions [here](https://github.com/apigee/cloud-foundry-apigee) 

When this buildpack is present in your Cloud Foundry deployment, all you will have to do to secure your applications is bind your Cloud Foundry application to the Apigee Coresident Service instance. Your application will then automatically be secured by [Apigee Microgateway](https://github.com/apigee-internal/microgateway).

For example:
```bash
cf push my-app --no-start
cf bind-service my-app <coresident plan instance> -c '{"..."}'
cf v3-push my-app -b microgateway_decorator -b nodejs_buildpack
```

For more detailed examples/instructions, follow the steps [here](https://github.com/apigee/cloud-foundry-apigee/blob/master/docs/setup-microgateway-coresident.md).
