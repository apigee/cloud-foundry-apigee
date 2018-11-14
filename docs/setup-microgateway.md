# Setting Up Microgateway and a Cloud Foundry App in Separate Containers ("microgateway" plan)
Using code in this directory, you can install an Apigee service broker that manages connections between your Cloud Foundry app and Apigee Microgateway running in a separate Cloud Foundry container.

> This section describes how to set up Apigee Edge Microgateway and your Cloud Foundry app in separate containers. To set them up in a single container, be sure to see [Setting Up Microgateway and a Cloud Foundry App in a Single Container](setup-microgateway-coresident.md).

Use the following sections to install the Apigee service broker on Cloud Foundry, then set up a binding between a Cloud Foundry app and the Apigee service.

1. [Ensure you have the prerequisites.](apigee-service-broker-prerequisites.md)
1. [Install the service broker](#install) to make it available in the marketplace (CF administrator/operator).
2. [Create an instance of the service broker](#instance) for your Cloud Foundry org/space (CF user).
3. [Bind or unbind](#bind) a route service to an app route as needed (CF user).

## <a name="install"></a>Step 1: Install the Apigee service broker from source

If you're a Cloud Foundry administrator, you can install a service broker as an application (in other words, a broker app). This is particularly useful when running a Cloud Foundry development environment.

> For Pivotal Cloud Foundry users, this broker is also packaged as a *tile* for easy  installation by an Operator. See the Apigee docs for more on [installing and configuring the tile](http://docs.apigee.com/api-services/content/install-and-configure-apigee-service-broker).

These instructions assume a local [PCF Dev](https://pivotal.io/pcf-dev) environment, at the domain `local.pcfdev.io`. If you're using another kind of Cloud Foundry host, be sure to adjust URLs accordingly.

1. From a command prompt, log in to the Cloud Foundry instance where you'll be installing the Apigee service broker.

    ```bash
    $ cf login -a <your.endpoint> -u <username> -o <organization> -s <space>
    ```

2. Clone this github project to get the service broker source you'll need.

    ```bash
    $ cd <your working directory>
    $ git clone https://github.com/apigee/cloud-foundry-apigee.git
    $ cd cloud-foundry-apigee/apigee-cf-service-broker
    ```

3. Load dependencies and test (requires that Node.js is installed).

    ```bash
    $ npm install
    $ npm test
    ```

4. In the apigee-cf-service-broker directory, edit the manifest.yml file to set required variables (`org` and `env`) and override defaults as appropriate for your environment and Apigee Edge account.


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
    $ cf create-service-broker apigee-edge <security-user-name> <security-user-password> https://apigee-cf-service-broker.local.pcfdev.io
    ```

8. Publish the service broker in your Cloud Foundry marketplace.

    ```bash
    $ cf enable-service-access apigee-edge
    $ cf marketplace
    $ cf marketplace -s apigee-edge
    ```
9. Create an instance of the “microgateway” service:

    ```bash
    $ cf create-service apigee-edge microgateway <service-name> -c \
        '{"org":<org from service-broker configuration>, "env":<env from service-broker configuration>}'
    ```

>**Note:** Once you have the service broker installed, you might be interested in using the sample app included in this repository to try it out. To do this, you'd replace the following steps with those in this [tutorial](../samples/org-and-microgateway-sample).

## <a name="instance"></a>Step 2: Install Apigee Edge Microgateway and Cloud Foundry app
Here, you install Apigee Edge Microgateway and your Cloud Foundry app to the same Cloud Foundry container.

1. [Install and configure Apigee Edge Microgateway.](http://docs.apigee.com/microgateway/latest/installing-edge-microgateway)

1. Clone the Apigee Microgateway Repo:
  
   ```bash
   $ git clone https://github.com/https://github.com/apigee-internal/microgateway.git
   $ cd microgateway
   $ git checkout tags/v.2.5.4
   ```

1. Copy the configuration file to the following directory in your Cloud Foundry app: `<microgateway-repo-directory>/<config-directory>`.

1. Edit the configuration file (e.g <org>-<env>-config.yaml) to have the `cloud-foundry-route-service` plugin. For instance:

    ```yaml
    edgemicro:
        port: 8000
        max_connections: 1000
        ...
        plugins:
            sequence:
            - oauth
            - cloud-foundry-route-service
    ```

1. Edit the microgateway `manifest.yml` as follows:

   1. Edit the following env values so that they correspond to your Apigee Edge Microgateway configuration:

        ```yaml
        env:
          EDGEMICRO_KEY: 'microgateway-key'
          EDGEMICRO_SECRET: 'microgateway-secret'
          EDGEMICRO_CONFIG_DIR: '/app/<config-directory>'
          EDGEMICRO_ENV: 'your-microgateway-env-name'
          EDGEMICRO_ORG: 'your-microgateway-org-name'
        ```
1. Push Apigee Microgateway as its own app:

    ```bash
    $ cf push
    ```

1. Change to your application's directory and push your app:
    ```bash
    $ cd <app-directory>
    $ cf push
    ```

## <a name="bind"></a>Step 3: Bind the Cloud Foundry app's route to the Apigee service

In this step, you bind a Cloud Foundry app's route (its address in Cloud Foundry) to the Apigee service instance you created. That way, requests to the app will be forwarded first to an Apigee Edge Microgateway proxy. The `bind-route-service` command creates the proxy for you and binds the route to it.

Each bind attempt requires authorization with Apigee Edge, with credentials passed as additional parameters to the `cf` bind command.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `test-app`, then the resulting FQDN is `test-app.local.pcfdev.io`.

    ```bash
    $ cf routes
    ```

1. Get or update the authorization token using the Apigee SSO CLI script.

    ```bash
    $ get_token
    ```
    You may be prompted for your Apigee Edge username and password, and an MFA token. This updates the token in the `~/.sso-cli/valid_token.dat` file (if that subdirectory exists -- otherwise the file is placed in the current working directory). The next step uses this token.

1. Bind the app's route to the Apigee service instance with the domain and hostname.

    The proxy must be created as a separate step, and then loaded by Microgateway instances before binding. You can create the proxy manually, but to have the broker do it, specify "action":"proxy". Also specify the Microgateway's FQDN as micro.

    In this example, Apigee Edge Microgateway is also installed as an app with the hostname edgemicro-app:

    Use the [`bind-route-service`](#bind-route-service-reference) command. The following example creates an API proxy on the `myorg` org and `test` environment. The protocol parameter specifies the protocol through which the proxy will be called. To do its works, this command authenticates with Apigee Edge using the token in the specified .dat file:

    ```bash
    $ cf bind-route-service local.pcfdev.io myapigee --hostname test-app \
    -c '{"org":"myorg","env":"test",
       "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
       "micro":"edgemicro-app.local.pcfdev.io",
       "action":"proxy",
       "protocol":"http"}'
    ```

    Cloud Foundry will report an error during the binding, since the bind was not attempted. But the message returned should indicate that the proxy was created, which you can check with the Edge management UI or API. The proxies created by the bind for Microgateway have an additional edgemicro_ at the beginning of their name, a general requirement unrelated to Cloud Foundry and service brokers.

    Wait for the configuration to reload on the Edge Microgateway instance(s) before binding. You might have to wait 5 to 10 minutes. When it has reloaded, the console will list the proxy you just created.

    To bind, make the same call with "action":"bind"

    ```bash
    $ cf bind-route-service local.pcfdev.io myapigee --hostname test-app \
    -c '{"org":"<your edge org>","env":"<your edge env>",
       "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
       "micro":"edgemicro-app.local.pcfdev.io",
       "action":"bind"}'
    ```

    The proxies created by the bind for Microgateway have an additional `edgemicro_` at the beginning of their name, a general requirement unrelated to Cloud Foundry and service brokers. Another general requirement is that the proxy is part of a published API Product; a change you must make manually by following the instructions [here](http://docs.apigee.com/microgateway/latest/setting-and-configuring-edge-microgateway#Part2) to create a product with your newly created proxy.

## bind-route-service reference
Use the `bind-route-service` command to generate an API proxy on Apigee Edge and to bind the Apigee Cloud Foundry service to the proxy. The command this form (be sure to use quotes and command expansion, as shown here):

```bash
$ cf bind-route-service <your-app-domain> <service-instance> [--hostname <hostname>] \
-c '{"org":"<your edge org>","env":"<your edge env>",
  "bearer":"<authentication-token-file>" | "basic":"<encoded-username-password>" | "<username>:<password>",
  "micro":"<application-route>"
  "action":"proxy"|"bind"|"proxy bind",
  ["protocol":"http"|"https"]}'
```

Parameters for the `-c` argument specify connection details:

Parameter | Purpose | Allowed Values
---- | ---- | ----
`org` | Apigee Edge organization hosting the API proxy to be called |  Your organization (must be reachable via the authentication token specified in the `bearer` parameter)
`env` | Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
`bearer` | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get_token command. The broker does not store any data; it requires credentials and other parameters for each individual `cf` command. Instead of a `bearer` token, credentials can also be expressed as:<ul><li>`basic`: standard HTTP Base-64 encoded username and password for `Authorization: Basic`. Note that this is *not encrypted* and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)</li><li>username and password in clear text</li></ul>
`micro` | Required. Route of the application acting as Edge Microgateway. | Application route.
`action` | A value specifying whether to create or bind an API proxy | `proxy` to generate an API proxy; `bind` to bind the service with the proxy; `proxy bind` to generate the proxy and bind with a single command.
`protocol` | The protocol through which the proxy should be accessed by Cloud Foundry | `http` or `https`; default is `https`.

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
