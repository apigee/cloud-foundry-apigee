# Prerequisites for Using Apigee Cloud Foundry Service Broker
The following are prequisites for installing and using the Apigee Edge Cloud Foundry service broker.

- Route services requires TLS. 

    For SaaS Edge, the environment must have an secure Virtual Host, which is provided by default. Edge Microgateway can be configured with SSL; running it inside Cloud Foundry as an app automatically provides that layer. However, if using the [microgateway-coresident](https://github.com/stevetraut/pivotal-cf-apigee/blob/master/apigee-cf-service-broker/setup-microgateway-decorator.md) plan, you must set the SSL option in your microgateway config file as described [here](http://docs.apigee.com/microgateway/latest/operation-and-configuration-reference-edge-microgateway#configuringsslontheedgemicrogatewayserver).

- Node.js ([Node v4.x or later](https://nodejs.org/en/))

    Cloud Foundry includes Node.js as a system buildpack, so you can install and run the service broker without Node installed locally, if necessary.

- Elastic Runtime, any version from 1.10 to 1.12 

    [Route-Services](http://docs.cloudfoundry.org/services/route-services.html) is required by the Apigee service broker, and is available starting in version 1.7 of Elastic Runtime.

- CF CLI

    The most recent version of the [CF command line interface](https://github.com/cloudfoundry/cli) that includes required support for route-services operations. Confirmed working with v6.36.1.

- An active Apigee Edge account.

    This broker works with both private cloud (OPDK) and SaaS Edge. If you are not an existing Apigee Edge customer you can register for a free SaaS account at [https://accounts.apigee.com/accounts/sign_up](https://accounts.apigee.com/accounts/sign_up).

- Apigee SSO CLI

    The broker will create the (reverse) proxy on Apigee Edge for the app's route. This requires authenticating with Edge; ideally this is done with an authorization token, generated with scripts in the [Apigee SSO CLI bundle](http://docs.apigee.com/api-services/content/using-oauth2-security-apigee-edge-management-api#installingacurlandgettokenutilities). Plain username and password may also be used if necessary.

With Cloud Foundry, a *service broker* provides a catalog of services, and performs tasks to tie those services with applications and their routes. This broker only supports route services, to use Apigee as a reverse proxy for applications, and follows the standard route service flow.
