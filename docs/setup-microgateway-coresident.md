# Setting Up Microgateway and a Cloud Foundry App in a Single Container ("microgateway-coresident" plan)
Using code in this directory, you can install an Apigee service broker that manages connections between your Cloud Foundry app and Apigee Microgateway running in the same Cloud Foundry container.

Use the following sections to install the Apigee service broker on Cloud Foundry, then set up a binding between a Cloud Foundry app and the Apigee service.

1. [Ensure you have the prerequisites.](apigee-service-broker-prerequisites.md)
1. [Install the service broker](#install) to make it available in the marketplace (CF administrator/operator).
2. [Create an instance of the service broker](#instance) for your Cloud Foundry org/space (CF user).
3. [Bind or unbind](#bind) a service to an app as needed (CF user).


## <a name="install"></a>Step 1: Install the Apigee service broker from source

If you're a Cloud Foundry administrator, you can install a service broker as an application (in other words, a broker app). This is particularly useful when running a Cloud Foundry development environment.

> For Pivotal Cloud Foundry users, this broker is also packaged as a *tile* for easy  installation by an Operator. See the Apigee docs for more on [installing and configuring the tile](http://docs.apigee.com/api-services/content/install-and-configure-apigee-service-broker).

These instructions assume a local [PCF Dev](https://pivotal.io/pcf-dev) environment, at the domain `local.pcfdev.io`. If you're using another kind of Cloud Foundry host, be sure to adjust URLs accordingly.

1. From a command prompt, log in to the Cloud Foundry instance where you'll be installing the Apigee service broker.

    ```bash
    $ cf login -a <your.endpoint> -u <username> -o <organization> -s <space>
    ```

1. Clone this github project to get the service broker source you'll need.

    ```bash
    $ cd <your working directory>
    $ git clone https://github.com/apigee/cloud-foundry-apigee.git
    $ cd cloud-foundry-apigee/apigee-cf-service-broker
    ```

1. Load dependencies and test (requires that Node.js is installed).

    ```bash
    $ npm install
    $ npm test
    ```

1. In the apigee-cf-service-broker directory, edit the manifest.yml file to set required variables (``org`` and ``env``) and override defaults as appropriate for your environment and Apigee Edge account.


    Item | Purpose | Default (for SaaS Edge)
    ---- | ---- | ----
    APIGEE_DASHBOARD_URL | URL for Apigee Edge management UI | `https://enterprise.apigee.com/platform/#/`
    APIGEE_MGMT_API_URL | Apigee Edge Management API endpoint | `https://api.enterprise.apigee.com/v1`
    APIGEE_PROXY_DOMAIN | Domain for proxy host template | `apigee.net`
    APIGEE_PROXY_HOST_TEMPLATE | ES6 template literal for generated proxy host. (Note that without any placeholders, will be used as-is.) | `${org}-${env}.${domain}`
    APIGEE_PROXY_NAME_TEMPLATE | ES6 template literal for generated proxy | `cf-${route}`
    ORG | The Apigee Edge organization with proxies that will handle calls to your app. |
    ENV | The Apigee Edge environment that with proxies that will handle calls to your app. |

   > **Note:** Cloud Foundry does not allow ``${...}`` syntax to be present in the environment variable section. So when changing `APIGEE_PROXY_HOST_TEMPLATE` or `APIGEE_PROXY_NAME_TEMPLATE`, be sure to not use ``${...}`` in your changes.

    ```yaml
      env:
        APIGEE_CONFIGURATIONS: |
                            [{“org”:”your-apigee-org1”,
                            “env”:”your-apigee-env1”,
                            “apigee_proxy_domain”:”apigee.net”,...},
                            <repeat the preceding for multiple orgs and envs>]
    ```

1. Deploy the Apigee service broker from the source in this repository.

    ```bash
    $ cf push
    ```
    Make a note of the broker app's URL, which you'll use to create the service broker later. Here's an example:

    ```
    urls: apigee-cf-service-broker.local.pcfdev.io
    ```

1. Choose a user name and password and store them as environment variables for the broker app. Then restage the broker app to load those variables.

    Communication with the broker is protected with a user name and password (to prevent unauthorized access to the broker app from other sources). These credentials are specified when the broker is created, and then used for each call. However, validating those credentials is the responsibility of the broker app, which does not have those credentials provided by the runtime.

    ```bash
    $ cf set-env apigee-cf-service-broker SECURITY_USER_NAME <pick a username>
    $ cf set-env apigee-cf-service-broker SECURITY_USER_PASSWORD <pick a password>
    $ cf restage apigee-cf-service-broker
    ```

1. Use the credentials you just established, along with the URL for the broker app, to create the service broker in Cloud Foundry.

    ```bash
    $ cf create-service-broker apigee-edge <security-user-name> <security-user-password> https://apigee-cf-service-broker.local.pcfdev.io
    ```

1. Publish the service broker in your Cloud Foundry marketplace.

    ```bash
    $ cf enable-service-access apigee-edge
    $ cf marketplace
    $ cf marketplace -s apigee-edge
    ```

## <a name="instance"></a>Step 2: Install and start the decorator
In this step, you install the Apigee Edge Microgateway decorator buildpack that allows you to embed Edge Microgateway in the same container as your Cloud Foundry app.

1. Clone the meta-buildpack from the Cloud Foundry repository:

    ```bash
    $ git clone https://github.com/cf-platform-eng/meta-buildpack.git
    ```

1. Upload the meta-buildpack to Cloud Foundry:

    ```bash
    $ cd meta-buildpack
    $ ./upload    
    ```

1. Upload the microgateway-decorator buildpack to Cloud Foundry (located in the apigee-cf-service-broker directory):

    ```bash
    $ cd microgateway_decorator
    $ ./upload        
    ```

1. Create an instance of the “microgateway-coresident” service:

    ```bash
    $ cf create-service apigee-edge microgateway-coresident <service-name> -c '{"org":<org from service-broker configuration>, "env":<env from service-broker configuration>}'        
    ```
>**Note:** Once you have the service broker installed, you might be interested in using the sample app included in this repository to try it out. To do this, you'd replace the following steps with those in this [tutorial](../samples/coresident-sample).

## <a name="instance"></a>Step 3: Install Apigee Edge Microgateway and Cloud Foundry app
Here, you install Apigee Edge Microgateway and your Cloud Foundry app to the same Cloud Foundry container.

1. [Install and configure Apigee Edge Microgateway.](http://docs.apigee.com/microgateway/latest/installing-edge-microgateway)

1. Locate and make any desired changes to the configuration YAML file created in your Apigee Edge Microgateway installation, typically in the .edgemicro directory.

1. Copy the configuration file to the following directory in your Cloud Foundry app: `<application-folder>/<config-directory>`.

1. If you have custom plugins:

    1. Configure the microgateway yaml file from step 2 to include the necessary plugins. For example if we added a “response-override” plugin:

        ```yaml
        ...
        plugins:
          dir: ../plugins
          sequence:
            - oauth
            - response-override
        ...
        ```
    1. Copy the custom plugins into the following directory in your Cloud Foundry app: `<application-folder>/<plugin-directory>`.

1. Edit the application manifest as follows:

    1. Edit the following env values so that they correspond to your Apigee Edge Microgateway configuration:

        ```yaml
        env:
          EDGEMICRO_CONFIG_DIR: '/app/<config-directory>'
          EDGEMICRO_ENV: 'your-microgateway-env-name'
          EDGEMICRO_ORG: 'your-microgateway-org-name'
        ```
    1. Remove the following or any other ``buildpack`` tags from the manifest:  

        ```yaml
        buildpack: nodejs_buildpack
        ```
    1. If you have custom buildpacks, add the following line to the “env” section:

       ```yaml
        env:
          ...
          EDGEMICRO_CUST_PLUGINS: '<plugin-directory>'
        ```

1. Ensure that your Cloud Foundry app isn't running on port 8080, nor on the port specified by the PORT environment variable.

1. Push the Cloud Foundry app to your Cloud Foundry container.

    ```bash
    $ cf push <cf-app-name> --no-start
    ```

## <a name="bind"></a>Step 4: Bind the Cloud Foundry app to the Apigee service

In this step, you bind a Cloud Foundry app to the Apigee service instance you created. The `bind-service` command creates the proxy for you and binds the app to the service. By using “bind-service”, certain information (i.e edgemicro key and secret and chosen plan ID) will be shared with the target application. In addition, since “bind-route-service” is not being used, traffic won’t be routed anywhere but the target application container.

Each bind attempt requires authorization with Apigee Edge, Apigee passed as additional parameters to the `cf` bind command.

1. First, get the URL of the app to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `test-app`, then the resulting FQDN is `test-app.local.pcfdev.io`.

    ```bash
    $ cf routes
    ```

1. Get or update the authorization token using the Apigee SSO CLI script.

    ```bash
    $ get_token
    ```
    You may be prompted for your Apigee Edge username and password, and an MFA token. This updates the token in the `~/.sso-cli/valid_token.dat` file (if that subdirectory exists -- otherwise the file is placed in the current working directory). The next step uses this token.

1. Bind the app to the Apigee service instance.

    Use the [`bind-service`](http://cli.cloudfoundry.org/en-US/cf/bind-service.html) with [JSON](#bind-service-reference) that specifies specifics command.

    The following example does two things: it creates an API proxy on the specified org and environment, then binds the Apigee service to the target app. The protocol parameter specifies the protocol through which the proxy's target endpoint will be called. To do its works, this command authenticates with Apigee Edge using the token in the specified .dat file:

    ```bash
    $ cf bind-service <cf-app-name> <service name> \
    -c '{"org":<microgateway-org>,"env":<microgateway-env>,
      "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
      "action":"proxy bind",
      "protocol":"http",
      "target_app_route":<cf-app-url(i.e FQDN)>,
      "edgemicro_key":<microgateway-config-key>,
      "edgemicro_secret":<microgateway-config-secret>,
      "target_app_port":<cf-app-port>}'
    ```

1. Start the Cloud Foundry app and microgateway-decorator along with it.

   ```bash
   $ cf start <app name>
   ```

1. Log into Edge and note that the proxy has been created. Then follow the instructions [here](http://docs.apigee.com/microgateway/latest/setting-and-configuring-edge-microgateway#Part2) to create a product with your newly created proxy. You can now configure standard Apigee Edge policies on that proxy.

### bind-service reference
Use the `bind-service` command to generate an API proxy on Apigee Edge and to bind the Cloud Foundry service to the proxy. The command takes this form (be sure to use quotes and command expansion, as shown here):

```bash
$ cf bind-service <cf-app-name> <service name> \
    -c '{"org":<microgateway-org>,"env":<microgateway-env>,
      "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
      "action":"proxy bind",
      "protocol":"http",
      "target_app_route":<cf-app-url(i.e FQDN)>,
      "edgemicro_key":<microgateway-config-key>,
      "edgemicro_secret":<microgateway-config-secret>,
      "target_app_port":<cf-app-port>}'
```

Parameters for the `-c` argument specify connection details:

Parameter | Purpose | Allowed Values
---- | ---- | ----
`action` | A value specifying whether to create or bind an API proxy | `proxy` to generate an API proxy; `bind` to bind the service with the proxy; `proxy bind` to generate the proxy and bind with a single command.
`bearer` | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get_token command. The broker does not store any data; it requires credentials and other parameters for each individual `cf` command. Instead of a `bearer` token, credentials can also be expressed as:<ul><li>`basic`: standard HTTP Base-64 encoded username and password for `Authorization: Basic`. Note that this is *not encrypted* and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)</li><li>username and password in clear text</li></ul>
`edgemicro_key` | The key for your Apigee Edge Microgateway configuration (returned when you configured the Apigee Microgateway). | The configuration key.
`edgemicro_secret` | The secret for your Apigee Edge Microgateway configuration (returned when you configured the Apigee Microgateway). | The configuration secret.
`env` | Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
`org` | Apigee Edge organization hosting the API proxy to be called |  Your organization (must be reachable via the authentication token specified in he `bearer` parameter).
`protocol` | The protocol through which the proxy's target endpoint should be accessed by Cloud Foundry. | `http` or `https`; default is `https`.
`target_app_port` | Port for your Cloud Foundry app. This may not be 8080 nor the PORT environment variable. | The port number.
`target_app_route` | The URL for your Cloud Foundry app. | The app URL.

## Unbinding the service

The unbind command does not accept any parameters
```bash
$ cf unbind-service test-app myapigee
```

## Uninstalling the service instance and broker
```bash
$ cf delete-service myapigee
$ cf delete-service-broker apigee-edge
```
