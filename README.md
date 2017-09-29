# Cloud Foundry and Apigee Edge Integration

This repository includes code you can use to integrate Apigee Edge with Cloud Foundry (including Pivotal and open source instances). Using this integration, you can proxy your Cloud Foundry apps with proxies hosted on either [Apigee Edge in the cloud](http://docs.apigee.com/api-services/content/what-apigee-edge) or [Edge Microgateway](http://docs.apigee.com/microgateway/latest/overview-edge-microgateway).

For a sample Cloud Foundry app for testing this integration, see [Sample Code](sample-api).

Generally, this integration requires:

- An Apigee service broker installed on Cloud Foundry. Instances of the service broker route incoming requests to a proxy for management before sending them to the Cloud Foundry app.
- If you're using Edge Microgateway, you'll need an Edge Microgateway plugin that you can install from code in this repository. 

The integrations below are enabled. See the following for suggested processes and best practices.

- **Open source Cloud Foundry** and **Apigee Edge Microgateway**
 1. See [Cloud Foundry Service Broker for Apigee](apigee-cf-service-broker) for 
     - [Prerequisites](apigee-cf-service-broker#step-1-ensure-you-have-the-prerequisites)
     - [Installing the Apigee service broker](apigee-cf-service-broker#step-2-install-the-apigee-service-broker-from-source)
 1. See [Add-ons for Edge Microgateway in Cloud Foundry](microgateway-addons) for adding a required plugin to Edge Microgateway, then adding Edge Microgateway as an app to Cloud Foundry.
 1. See [Cloud Foundry Service Broker for Apigee](apigee-cf-service-broker#microgateway) for creating an Edge Microgateway proxy and binding to a Cloud Foundry route.
 
- **Open source Cloud Foundry** and **Apigee Edge (public and private cloud)**
 1. See [Cloud Foundry Service Broker for Apigee](apigee-cf-service-broker) for 
     - [Prerequisites](apigee-cf-service-broker#step-1-ensure-you-have-the-prerequisites)
     - [Installing the Apigee service broker](apigee-cf-service-broker#step-2-install-the-apigee-service-broker-from-source)
 1. See [Cloud Foundry Service Broker for Apigee](apigee-cf-service-broker#step-3-create-an-instance-of-the-apigee-service) for creating and binding an Edge Microgateway proxy to a Cloud Foundry route. 
 1. See [Cloud Foundry Service Broker for Apigee](apigee-cf-service-broker#step-4-bind-the-cf-apps-route-to-the-apigee-service) for binding to a Cloud Foundry route.

- **Pivotal Cloud Foundry** and **Apigee Edge (public and private cloud)**

 This integration is described in Apigee documentation. See the following links:
 1. See [Getting started with Cloud Foundry integration](http://docs.apigee.com/api-services/content/getting-started-cloud-foundry-integration) for prerequisites.
 1. See [Install and configure the Apigee service broker](http://docs.apigee.com/api-services/content/install-and-configure-apigee-service-broker) for adding an Apigee service broker.
 1. See [Creating an Edge API proxy to manage client calls to your Cloud Foundry application](http://docs.apigee.com/api-services/content/creating-edge-api-proxy-manage-client-calls-your-cloud-foundry-application) for a tutorial on creating and binding an Apigee Edge proxy with a Cloud Foundry route.
 
- **Pivotal Cloud Foundry** and **Apigee Edge Microgateway**
 1. See [Getting started with Cloud Foundry integration](http://docs.apigee.com/api-services/content/getting-started-cloud-foundry-integration) for prerequisites.
 1. See [Installing Edge Microgateway](http://docs.apigee.com/microgateway/latest/installing-edge-microgateway) for installation instructions.
 1. See [Install and configure the Apigee service broker](http://docs.apigee.com/api-services/content/install-and-configure-apigee-service-broker) for adding an Apigee service broker to Cloud Foundry.
 1. See [Add-ons for Edge Microgateway in Cloud Foundry](microgateway-addons) for adding a required plugin to Edge Microgateway, then adding Edge Microgateway as an app to Cloud Foundry.
 1.  See [Cloud Foundry Service Broker for Apigee](apigee-cf-service-broker#microgateway) for creating and binding an Edge Microgateway proxy to a Cloud Foundry route. 
