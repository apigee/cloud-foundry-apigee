# Cloud Foundry Service Broker for Apigee
This directory contains code for a service broker that provides integration between Apigee Edge and Cloud Foundry. Use the following sections to install the Apigee service broker on Cloud Foundry, then set up a binding between a Cloud Foundry app and the Apigee service.

1. [Ensure you have the prerequisites.](#prerequisites)
1. [Install the service broker](#install) to make it available in the marketplace (CF administrator/operator).
2. [Create an instance of the service broker](#instance) for your Cloud Foundry org/space (CF user).
3. [Bind or unbind](#bind) a route service to an app route as needed (CF user).


## <a name="prerequisites"></a>Step 1: Ensure you have the prerequisites

- Route services requires TLS. 

    For SaaS Edge, the environment must have an secure Virtual Host, which is provided by default. Edge Microgateway can be configured with SSL; running it inside Cloud Foundry as an app automatically provides that layer.

- Node.js ([Node v4.x or later](https://nodejs.org/en/))

    Cloud Foundry includes Node.js as a system buildpack, so you can install and run the service broker without
Node installed locally, if necessary.

- Elastic Runtime, any version from 1.7 to 1.11 

    [Route-Services](http://docs.cloudfoundry.org/services/route-services.html) is required by the Apigee service broker, and is available starting in version 1.7 of Elastic Runtime.

- CF CLI

    A recent version of the [CF command line interface](https://github.com/cloudfoundry/cli) that includes required support for route-services operations. Confirmed working with v6.20.0.

- An active Apigee Edge account.

    This broker works with both private cloud (OPDK) and SaaS Edge. If you are not an existing Apigee Edge customer you can register for a free SaaS account at [https://accounts.apigee.com/accounts/sign_up](https://accounts.apigee.com/accounts/sign_up).

- Apigee SSO CLI

    The broker will create the (reverse) proxy on Apigee Edge for the app's route. This requires authenticating with Edge; ideally this is done with an authorization token, generated with scripts in the [Apigee SSO CLI bundle](http://docs.apigee.com/api-services/content/using-oauth2-security-apigee-edge-management-api#installingacurlandgettokenutilities). Plain username and password may also be used if necessary.

With Cloud Foundry, a *service broker* provides a catalog of services, and performs tasks to tie those services with applications and their routes. This broker only supports route services, to use Apigee as a reverse proxy for applications, and follows the standard route service flow.

Some steps are slightly different when [using Microgateway](#microgateway).

## <a name="install"></a>Step 2: Install the Apigee service broker from source

If you're a Cloud Foundry administrator, you can install a service broker as an application (in other words, a broker-app). This is particularly useful when running a Cloud Foundry development environment.

> For Pivotal Cloud Foundry, this broker is also packaged as a *tile* for easy installation by an Operator. See the Apigee docs for more on [installing and configuring the tile](http://docs.apigee.com/api-services/content/install-and-configure-apigee-service-broker).

These instructions assume a local [PCF Dev](https://pivotal.io/pcf-dev) environment, at the domain `local.pcfdev.io`. If you're using another kind of Cloud Foundry host, be sure to adjust URLs accordingly.

1. Clone this github project to get the service broker source you'll need.
    ```bash
    cd <your working directory>
    git clone https://github.com/apigee/pivotal-cf-apigee.git
    cd pivotal-cf-apigee/apigee-cf-service-broker
    ```

1. Load dependencies and test (requires that Node.js is installed).
    ```bash
    npm install
    npm test
    ```

1. Edit the manifest to set required variables and override defaults as appropriate for your environment and Apigee Edge account.

    Item | Purpose | Default (for SaaS Edge)
    ---- | ---- | ----
    APIGEE_DASHBOARD_URL | URL for Apigee Edge management UI | `https://enterprise.apigee.com/platform/#/`
    APIGEE_MGMT_API_URL | Apigee Edge Management API endpoint | `https://api.enterprise.apigee.com/v1`
    APIGEE_PROXY_DOMAIN | Domain for proxy host template | `apigee.net`
    APIGEE_PROXY_HOST_TEMPLATE | ES6 template literal for generated proxy host. (Note that without any placeholders, will be used as-is.) | `${org}-${env}.${domain}`
    APIGEE_PROXY_NAME_TEMPLATE | ES6 template literal for generated proxy | `cf-${route}`

1. Log in to the Cloud Foundry instance where you'll be installing the Apigee service broker.

    ```bash
    cf login -a <your.endpoint> -u <username> -o <organization> -s <space>
    ```

1. Deploy the Apigee service broker from the source in this repository.
    ```bash
    cf push
    ```
    Make a note of the broker app's URL, which you'll use to create the service broker later. Here's an example:
    ```
    urls: apigee-cf-service-broker.local.pcfdev.io
    ```

1. Choose a user name and password and store them as environment variables for the broker app. Then restage the broker app to load those variables.

    Communication with the broker is protected with a user name and password (to prevent unauthorized access to the broker app from other sources). These credentials are specified when the broker is created, and then used for each call. However, validating those credentials is the responsibility of the broker app, which does not have those credentials provided by the runtime.
   
    ```bash
    cf set-env apigee-cf-service-broker SECURITY_USER_NAME <pick a username>
    cf set-env apigee-cf-service-broker SECURITY_USER_PASSWORD <pick a password>
    cf restage apigee-cf-service-broker
    ```

1. Use the credentials you just established, along with the URL for the broker app, to create the service broker in Cloud Foundry.
    ```bash
    cf create-service-broker apigee-edge <security user name> <security user password> https://apigee-cf-service-broker.local.pcfdev.io
    ```

1. Publish the service broker in your Cloud Foundry marketplace.
    ```bash
    cf enable-service-access apigee-edge
    cf marketplace
    cf marketplace -s apigee-edge
    ```

The Apigee service broker should now be available for you to create instances and bind to an Apigee-hosted proxy.

>**Note:** Once you have the service broker installed, you might be interested in using the sample app included in this repository to try it out. To do this, you'd replace the following steps with those in a [tutorial in the Apigee documentation](http://docs.apigee.com/api-services/content/creating-edge-api-proxy-manage-client-calls-your-cloud-foundry-application).

## <a name="instance"></a>Step 3: Create an instance of the Apigee service

You create a service instance so you can bind a Cloud Foundry app's path to it.

A CF service typically offers several variations, known as *service plans*. For this broker, they are:

Service plan | Purpose | Required `bind-route-service` parameter
---- | ---- | ----
`org` | Apigee public or private cloud |  <br> `action`: `"proxy"` or `"bind"`
`microgateway` | Apigee Edge Microgateway | `micro`: FQDN of microgateway <br> `action`: `"proxy"` or `"bind"`

The service instance is created for the CF org/space by specifying the desired service plan and a name for the instance. For example, for the service name `myapigee` using the `org` plan:
```bash
cf create-service apigee-edge org myapigee
cf service myapigee
```

## <a name="bind"></a>Step 4: Bind the CF app's route to the Apigee service

In this step, you bind a Cloud Foundry app's route (its address in Cloud Foundry) to the Apigee service instance you created. That way, requests to the app will be forwarded first to an Edge proxy. The `bind-route-service` command creates the proxy for you and binds the route to it.

Each bind attempt requires authorization with Edge, passed as additional parameters to the `cf` bind command.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `test-app`, then the resulting FQDN is `test-app.local.pcfdev.io`.

1. Get or update the authorization token using the Apigee SSO CLI script.
    ```bash
    get_token
    ```
    You may be prompted for your Apigee Edge username and password, and an MFA token. This updates the token in the `~/.sso-cli/valid_token.dat` file (if that subdirectory exists -- otherwise the file is placed in the current working directory)

1. Bind the app's route to the Apigee service instance with the domain and hostname.

    Use the [`bind-route-service`](#bind-route-service-reference) command. The following example does two things: it creates an API proxy on the `myorg` org and `test` environment, then binds the Apigee route service to the proxy. The protocol parameter specifies the protocol through which the proxy's target endpoint will be called. To do its works, this command authenticates with Apigee Edge using the token in the specified .dat file:
    ```bash
    cf bind-route-service local.pcfdev.io myapigee --hostname test-app \
    -c '{"org":"myorg","env":"test",
      "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
      "action":"proxy bind",
      "protocol":"https"}'
    ```

1. Log into Edge and note that the proxy has been created, and that requests to your app are being routed through Edge. 

    You will find a proxy whose name matches the pattern specified by the APIGEE_PROXY_NAME_TEMPLATE variable you specified in the manifest. The proxy has been deployed to the environment you specified when you created your service instance. 

    In the Edge management console, begin tracing the proxy, then send requests to your app. Trace will show the traffic routing through the proxy. 
 
    You can now configure standard Apigee Edge policies on that proxy.

## <a name="microgateway"></a>Microgateway

To use Edge Microgateway, select the `microgateway` service plan when creating the service instance.

```bash
cf create-service apigee-edge microgateway myapigee
```

The proxy must be created as a separate step, and then loaded by Microgateway instances before binding. You can create the proxy manually, but to have the broker do it, specify "action":"proxy". Also specify the Microgateway's FQDN as micro.

In this example, the Microgateway is also installed as an app with the hostname edgemicro-app:

Use the [`bind-route-service`](#bind-route-service-reference) command. The following example creates an API proxy on the `myorg` org and `test` environment. The protocol parameter specifies the protocol through which the proxy's target endpoint will be called. To do its works, this command authenticates with Apigee Edge using the token in the specified .dat file:

```bash
cf bind-route-service local.pcfdev.io myapigee --hostname test-app \
    -c '{"org":"myorg","env":"test",
       "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
       "micro":"edgemicro-app.local.pcfdev.io",
       "action":"proxy",
       "protocol":"https"}'
```

Cloud Foundry will report an error during the binding, since the bind was not attempted. But the message returned should indicate that the proxy was created, which you can check with the Edge management UI or API. The proxies created by the bind for Microgateway have an additional edgemicro_ at the beginning of their name, a general requirement unrelated to Cloud Foundry and service brokers.

Wait for the configuration to reload on the Edge Microgateway instance(s) before binding. You might have to wait 5 to 10 minutes. When it has reloaded, the console will list the proxy you just created.

To bind, make the same call with "action":"bind"

```bash
cf bind-route-service local.pcfdev.io myapigee --hostname test-app \
   -c '{"org":"<your edge org>","env":"<your edge env>",
       "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
       "micro":"edgemicro-app.local.pcfdev.io",
       "action":"bind"}'
```

The proxies created by the bind for Microgateway have an additional `edgemicro_` at the beginning of their name, a general requirement unrelated to Cloud Foundry and service brokers. Another general requirement is that the proxy is part of a published API Product; a change you must make manually.

## Unbinding the route service

The unbind command does not accept any parameters
```bash
cf unbind-route-service local.pcfdev.io myapigee --hostname test-app
```

## Uninstalling the service instance and broker
```bash
cf delete-service myapigee
cf delete-service-broker apigee-edge
```

## bind-route-service reference
Use the `bind-route-service` command to generate an API proxy on Apigee Edge and to bind the Apigee Cloud Foundry service to the proxy. The command this form (be sure to use quotes and command expansion, as shown here):
    
```bash
cf bind-route-service <your-app-domain> <service-instance> [--hostname <hostname>] \
-c '{"org":"<your edge org>","env":"<your edge env>",
  "bearer":"'<authentication-token-file>'" | "basic":"<encoded-username-password>" | "<username>:<password>",
  "action":"proxy"|"bind"|"proxy bind",
  ["protocol":"http"|"https"]}'
```

Parameters for the `-c` argument specify connection details:

Parameter | Purpose | Allowed Values
---- | ---- | ----
`org` | Apigee Edge organization hosting the API proxy to be called |  Your organization (must be reachable via the authentication token specified in he `bearer` parameter)
`env` | Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
`bearer` | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get_token command. The broker does not store any data; it requires credentials and other parameters for each individual `cf` command. Instead of a `bearer` token, credentials can also be expressed as:<ul><li>`basic`: standard HTTP Base-64 encoded username and password for `Authorization: Basic`. Note that this is *not encrypted* and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)</li><li>username and password in clear text</li></ul>
`action` | A value specifying whether to create or bind an API proxy | `proxy` to generate an API proxy; `bind` to bind the service with the proxy; `proxy bind` to generate the proxy and bind with a single command.
`protocol` | The protocol through which the proxy's target endpoint should be accessed by Cloud Foundry | `http` or `https`; default is `https`.
