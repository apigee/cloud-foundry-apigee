# EOL NOTICE
End of Life for the Apigee Edge Service Broker for Cloud Foundry, effective April 30, 2020.

## What do I need to know?
Google built an Apigee Edge Service Broker to make it easier for developers to manage APIs for apps built on Cloud Foundry. The service broker was developed to enable developers to use Cloud Foundry command-line interface to generate API proxies in Apigee Edge for the enforcement of security (API Key, OAuth), traffic management and other policies governing API traffic to these Cloud Foundry apps.

However, due to the low adoption rate of the Service Broker over a period of time, **we have decided to end support for the Apigee Edge Service Broker, effective April 30, 2020**. The Service Broker may continue to work beyond this date; however, support will no longer be provided.

As an alternative, consider using the patterns described in [this solution paper](https://www.google.com/appserve/mkt/proof/p/AFnwnKXz_mjcoqwyim8JdSRY9Drh3TkGUdFlTScnWUUt3ULSX9iJUvtrP0NE2Q31wVNYrHT1JKH--DAUmca138x4D5M06jtdcVOMAnvbtQt7NEBwDpNw5vuwUcGR-EXvZThO1SsEnZeIaAkoVLsvFuw) for providing API management for your Cloud Foundry apps.

## What do I need to do?
If you are currently using the Service Broker, **you need to take the following actions before April 30, 2020**:

1. **Remove** the Service Broker from Cloud Foundry,
1. **Delete** any service instances that you may have created, and
1. **Rewire** any routes (to API proxies) that may have been created for your apps.

If you have any questions or require assistance, please **contact [Apigee Support](https://www.google.com/appserve/mkt/proof/p/AFnwnKXf75uu4CQ95vYWsWSXPug4ZrksYr4xWJ52V2kcjjam3BTitYhuVVnecXYLhrRz0MBNyPquNBUDtnb50hJ-54TUi9ILhWG4mo1NNQ)**.

Thanks for choosing Apigee.

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
