# Cloud Foundry Service Broker for Apigee

The Apigee Service Broker offers three different plans:
1. The `org` plan: The `org` plan allows for the use of the Apigee public or private cloud to proxy an application.
This plan uses `route-services` to redirect traffic coming into Cloud Foundry to an Edge proxy in the cloud before being directed back down to the target application.
2. The `microgateway` plan: The `microgateway` plan allows a user to launch Apigee Microgateway as a separate application in a Cloud Foundry to proxy an application.
This plan uses `route-services` to redirect traffic coming into Cloud Foundry to the Apigee Microgateway application before being directed to the target application -- reducing the network latency that occurs in the `org` plan.
3. The `microgateway-coresident` plan: The `microgateway-coresident` plan allows a user to launch Apigee Microgateway in the same container as their target application.
This plan does not need to use `route-services` in that traffic will not need to be redirected to a separate container or cloud url. By using the `microgateway-coresident` plan, users will see the lowest latencies (as there are no extra network hops) as well as better scalability in that every new application instance will be started with Apigee Microgateway alongside it.
4. The `portal` plan: The `portal` plan allows for the use of the Apigee public or private cloud to proxy an application, creates proxy, portal, api-product in Apigee edge for the target application
This plan uses `route-services` to redirect traffic coming into Cloud Foundry to an Edge proxy in the cloud before being directed back down to the target application.

## Based on your chosen plan(s), follow the instructions below:

  * For the `org` plan, follow the instructions [here](../docs/setup-org.md)
  * For the `microgateway` plan, follow the instructions [here](../docs/setup-microgateway.md)
  * For the `microgateway-decorator` plan, follow the instructions [here](../docs/setup-microgateway-coresident.md)
  * For the `portal` plan, follow the instructions [here](../docs/setup-portal.md)
