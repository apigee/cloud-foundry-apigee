# Setting up Apigee Edge to proxy a Cloud Foundry app ("org" plan)
Using code in this directory, you can install an Apigee Edge service broker that manages connections between your Cloud Foundry app and Apigee Edge.

Use the following sections to install the Apigee service broker on Cloud Foundry, then set up a binding between a Cloud Foundry app and the Apigee service.

1. [Ensure you have the prerequisites.](apigee-service-broker-prerequisites.md)
1. [Install the service broker](#install) to make it available in the marketplace (CF administrator/operator).
1. [Create an instance of the service broker](#instance) for your Cloud Foundry org/space (CF user).
1. [Bind or unbind](#bind) a route service to an app route as needed (CF user).

## <a name="install"></a>Step 1: Install the Apigee service broker from source

If you're a Cloud Foundry administrator, you can install a service broker as an application (in other words, a broker-app). This is particularly useful when running a Cloud Foundry development environment.

> For Pivotal Cloud Foundry, this broker is also packaged as a *tile* for easy installation by an Operator. See the Apigee docs for more on [installing and configuring the tile](http://docs.apigee.com/api-services/content/install-and-configure-apigee-service-broker).

These instructions assume a local [PCF Dev](https://pivotal.io/pcf-dev) environment, at the domain `local.pcfdev.io`. If you're using another kind of Cloud Foundry host, be sure to adjust URLs accordingly.

1. Clone this github project to get the service broker source you'll need.
    ```bash
    $ cd <your working directory>
    $ git clone https://github.com/apigee/cloud-foundry-apigee.git
    $ cd cloud-foundry-apigee/apigee-cf-service-broker
    ```

2. Load dependencies and test (requires that Node.js is installed).
    ```bash
    $ npm install
    $ npm test
    ```

3. In the apigee-cf-service-broker directory, edit the manifest.yml file to set required variables (``org`` and ``env``) and override defaults as appropriate for your environment and Apigee Edge account.


    Item | Purpose | Default (for SaaS Edge)
    ---- | ---- | ----
    APIGEE_DASHBOARD_URL | URL for Apigee Edge management UI | `https://enterprise.apigee.com/platform/#/`
    APIGEE_MGMT_API_URL | Apigee Edge Management API endpoint | `https://api.enterprise.apigee.com/v1`
    APIGEE_PROXY_DOMAIN | Domain for proxy host template | `apigee.net`
    APIGEE_PROXY_HOST_TEMPLATE | ES6 template literal for generated proxy host. The template that describes how the Apigee Edge host name should be generated. <br/> This represents the hostname that clients use to make calls to your APIs. Change this value if your hostname is not created in the default way -- from your Apigee org an environment names. For example, if your APIs use a custom virtual host, you might have just a domain name:<br/>`${domain}`<br />Pivotal Cloud Foundry apps use this host when making calls to your API proxy. The template generates the host name from values specified when binding the PCF app to the service(Note that without any placeholders, will be used as-is.) | `${org}-${env}.${domain}`
    APIGEE_PROXY_NAME_TEMPLATE | ES6 template literal for generated proxy | `cf-${route}`
    ORG | The Apigee Edge organization with proxies that will handle calls to your app. |
    ENV | The Apigee Edge environment that with proxies that will handle calls to your app. |

    If you've got an HTTP(S) proxy server, you can also specify the server's URL, as shown in the example here.

   > **Note:** Cloud Foundry does not allow ``${...}`` syntax to be present in the environment variable section. So when changing `APIGEE_PROXY_HOST_TEMPLATE` or `APIGEE_PROXY_NAME_TEMPLATE`, be sure to not use ``${...}`` in your changes.

    ```yaml
      env:
        APIGEE_CONFIGURATIONS: |
                            [{“org”:”your-apigee-org1”,
                            “env”:”your-apigee-env1”,
                            “apigee_proxy_domain”:”apigee.net”,...},
                            <repeat the preceding for multiple orgs and envs>]
        HTTP_PROXY:”your HTTP proxy server URL”
        HTTPS_PROXY:”your HTTPS proxy server URL”
    ```

4. Log in to the Cloud Foundry instance where you'll be installing the Apigee service broker.

    ```bash
    $ cf login -a <your.endpoint> -u <username> -o <organization> -s <space>
    ```

5. Deploy the Apigee service broker from the source in this repository.

    ```bash
    $ cf push
    ```
    Make a note of the broker app's URL, which you'll use to create the service broker later. Here's an example:

    ```
    urls: apigee-cf-service-broker.local.pcfdev.io
    ```

6. Choose a user name and password and store them as environment variables for the broker app. Then restage the broker app to load those variables.

    Communication with the broker is protected with a user name and password (to prevent unauthorized access to the broker app from other sources). These credentials are specified when the broker is created, and then used for each call. However, validating those credentials is the responsibility of the broker app, which does not have those credentials provided by the runtime.

    ```bash
    $ cf set-env apigee-cf-service-broker SECURITY_USER_NAME <pick a username>
    $ cf set-env apigee-cf-service-broker SECURITY_USER_PASSWORD <pick a password>
    $ cf restage apigee-cf-service-broker
    ```

7. Use the credentials you just established, along with the URL for the broker app, to create the service broker in Cloud Foundry.
    ```bash
    $ cf create-service-broker apigee-edge <security user name> <security user password> https://apigee-cf-service-broker.local.pcfdev.io
    ```

8. Publish the service broker in your Cloud Foundry marketplace.
    ```bash
    $ cf enable-service-access apigee-edge
    $ cf marketplace
    $ cf marketplace -s apigee-edge
    ```

The Apigee service broker should now be available for you to create instances and bind to an Apigee-hosted proxy.

## <a name="instance"></a>Step 2: Create an instance of the Apigee service

You create a service instance so you can bind a Cloud Foundry app's path to it.

The service instance is created for the Cloud Foundry org/space by specifying the desired service plan and a name for the instance. For example, for the service name `myapigee` using the `org` plan:

```bash
$ cf create-service apigee-edge org <instance name> -c \
    '{"org":"<your-org-name>", "env":"<your-env-name>"}'
$ cf service <instance-name>
```

>**Note:** Once you have the service broker installed, you might be interested in using the sample app included in this repository to try it out. To do this, you'd replace the following steps with those in this [tutorial](../samples/org-and-microgateway-sample).

## <a name="bind"></a>Step 3: Bind the CF app's route to the Apigee service

In this step, you bind a Cloud Foundry app's route (its address in Cloud Foundry) to the Apigee service instance you created. That way, requests to the app will be forwarded first to an Edge proxy. The `bind-route-service` command creates the proxy for you and binds the route to it.

Each bind attempt requires authorization with Edge, passed as additional parameters to the `cf` bind command.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `test-app`, then the resulting FQDN is `test-app.local.pcfdev.io`.

1. Get or update the authorization token using the Apigee SSO CLI script.
    ```bash
    $ get_token
    ```
    You may be prompted for your Apigee Edge username and password, and an MFA token. This updates the token in the `~/.sso-cli/valid_token.dat` file (if that subdirectory exists -- otherwise the file is placed in the current working directory).

1. Bind the app's route to the Apigee service instance with the domain and hostname.

    Use the [`bind-route-service`](#bind-route-service-reference) command. The following example does two things: it creates an API proxy on the `myorg` org and `test` environment, then binds the Apigee route service to the proxy. The protocol parameter specifies the protocol through which the proxy will be called. To do its works, this command authenticates with Apigee Edge using the token in the specified .dat file:
    ```bash
    $ cf bind-route-service local.pcfdev.io myapigee --hostname test-app \
    -c '{"org":"myorg","env":"test",
      "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
      "action":"proxy bind",
      "protocol":"https"}'
    ```

1. Log into Edge and note that the proxy has been created, and that requests to your app are being routed through Edge.

    You will find a proxy whose name matches the pattern specified by the APIGEE_PROXY_NAME_TEMPLATE variable you specified with your org and env mapping in the manifest. The proxy has been deployed to the environment you specified when you created your service instance.

    In the Edge management console, begin tracing the proxy, then send requests to your app. Trace will show the traffic routing through the proxy.

    You can now configure standard Apigee Edge policies on that proxy.

### bind-route-service reference
Use the `bind-route-service` command to generate an API proxy on Apigee Edge and to bind the Apigee Cloud Foundry service to the proxy. The command this form (be sure to use quotes and command expansion, as shown here):

```bash
$ cf bind-route-service <your-app-domain> <service-instance> [--hostname <hostname>] \
-c '{"org":"<your edge org>","env":"<your edge env>",
  "bearer":"'<authentication-token-file>'" | "basic":"<encoded-username-password>" | "<username>:<password>",
  "action":"proxy"|"bind"|"proxy bind",
  ["protocol":"http"|"https"]}'
```

Parameters for the `-c` argument specify connection details:

Parameter | Purpose | Allowed Values
---- | ---- | ----
`org` | Apigee Edge organization hosting the API proxy to be called |  Your organization (must be reachable via the authentication token specified in the `bearer` parameter)
`env` | Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
`bearer` | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get_token command. The broker does not store any data; it requires credentials and other parameters for each individual `cf` command. Instead of a `bearer` token, credentials can also be expressed as:<ul><li>`basic`: standard HTTP Base-64 encoded username and password for `Authorization: Basic`. Note that this is *not encrypted* and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)</li><li>username and password in clear text</li></ul>
`action` | A value specifying whether to create or bind an API proxy | `proxy` to generate an API proxy; `bind` to bind the service with the proxy; `proxy bind` to generate the proxy and bind with a single command.
`protocol` | The protocol through which the proxy should be accessed by Cloud Foundry | `http` or `https`; default is `https`.
`host` | The host domain to which API calls are made. Specify a value only if your host domain is not the same as that given by your virtual host. | Your host domain name if different from your virtual host domain. For example: mycompany.net:9000

## Unbinding the route service

The unbind command does not accept any parameters

```bash
$ cf unbind-route-service <your-app-domain> <service-instance> --hostname <cf-app>
```

## Uninstalling the service instance and broker
```bash
$ cf delete-service <service-instance>
$ cf delete-service-broker apigee-edge
```