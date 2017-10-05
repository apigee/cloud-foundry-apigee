# Cloud Foundry and Apigee Edge Integration

This repository includes code you can use to integrate Apigee Edge with Cloud Foundry (including Pivotal and open source instances). Using this integration, you can proxy your Cloud Foundry apps with proxies hosted on either [Apigee Edge in the cloud](http://docs.apigee.com/api-services/content/what-apigee-edge) or [Edge Microgateway](http://docs.apigee.com/microgateway/latest/overview-edge-microgateway).

For a sample Cloud Foundry apps for testing this integration, see the provided [samples](samples).

Generally, this integration requires:

- An Apigee account. If you don't have one, you can sign up [here](https://login.apigee.com/sign_up)
- The Apigee Service Broker installed on Cloud Foundry. (Instructions are provided for each plan)
- If you're using Edge Microgateway in Cloud Foundry, you'll need to [install](http://docs.apigee.com/microgateway/latest/installing-edge-microgateway) Edge Microgateway locally

The integrations below are enabled. See the following for suggested processes and best practices.

- **Open source Cloud Foundry** and **Apigee Edge Microgateway**
  1. See [Cloud Foundry Service Broker for Apigee](apigee-cf-service-broker) for
     - Differences between the two microgateway plans: `microgateway` and  `microgateway-coresident`
     - Links to instructions based on your plan choice
  1. For the direct link to the `microgateway` plan instructions, see [setup-microgateway](docs/setup-microgateway.md)
  1. For the direct link to the `microgateway-coresident` plan instructions, see [setup-microgateway-coresident](docs/setup-microgateway-coresident.md)


- **Open source Cloud Foundry** and **Apigee Edge (public and private cloud)**
  1. See [Cloud Foundry Service Broker for Apigee](apigee-cf-service-broker) for
      - Differences between the two microgateway plans (`microgateway` & `microgateway-coresident`) and the `org` plan
      - Links to instructions based on your plan choice
  1. For the direct link to the `org` plan instructions, see [setup-org](docs/setup-org.md)
