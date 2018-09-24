# Setting Up Microgateway and a Cloud Foundry App in a Single Container ("microgateway-coresident" plan)
Using code in this directory, you can install an Apigee service broker that manages connections between your Cloud Foundry app and Apigee Microgateway running in the same Cloud Foundry container.

Use the following sections to install the Apigee service broker on Cloud Foundry, then set up a binding between a Cloud Foundry app and the Apigee service.

1. [Ensure you have the prerequisites.](apigee-service-broker-prerequisites.md)
1. [Install the service broker](#install) to make it available in the marketplace (CF administrator/operator).
1. [Create an instance of the service broker](#instance) for your Cloud Foundry org/space (CF user).
1. [Bind or unbind](#bind) a service to an app as needed (CF user).

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

4. In the apigee-cf-service-broker directory, edit the manifest.yml file to set required variables (``org`` and ``env``) and override defaults as appropriate for your environment and Apigee Edge account.

    Item | Purpose | Default (for SaaS Edge)
    ---- | ---- | ----
    APIGEE_DASHBOARD_URL | URL for Apigee Edge management UI | `https://enterprise.apigee.com/platform/#/`
    APIGEE_MGMT_API_URL | The endpoint URL to the Apigee Edge management API. The Apigee Edge Service Broker uses this URL when making requests to create new Apigee Edge API proxies for managing requests to PCF apps. | `https://api.enterprise.apigee.com/v1`
    APIGEE_PROXY_DOMAIN | The domain name that Cloud Foundry apps use when making calls to your API proxy. This is the domain that clients use to make calls to your APIs. Change this value if your proxy domain is not the default domain for Apigee public cloud. For example, you might have your own API domain -- such as one created with a custom virtual host. Enter the domain name here. | `apigee.net`
    APIGEE_PROXY_HOST_TEMPLATE | ES6 template literal for generated proxy host. The template that describes how the Apigee Edge host name should be generated. <br/> This represents the hostname that clients use to make calls to your APIs. Change this value if your hostname is not created in the default way -- from your Apigee org an environment names. For example, if your APIs use a custom virtual host, you might have just a domain name:<br/>`${domain}`<br />Cloud Foundry apps use this host when making calls to your API proxy. The template generates the host name from values specified when binding the CF app to the service. (Note that without any placeholders, this will be used as a literal value.) | `${org}-${env}.${domain}`
    APIGEE_PROXY_NAME_TEMPLATE | ES6 template literal for generated proxy | `cf-${route}`
    ORG | The Apigee Edge organization with proxies that will handle calls to your app. |
    ENV | The Apigee Edge environment with proxies that will handle calls to your app. |

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

## <a name="instance"></a>Step 2: Install the decorator
In this step, you install the Apigee Edge Microgateway decorator buildpack that allows you to embed Edge Microgateway in the same container as your Cloud Foundry app.

1. Clone the microgateway_decorator from the Cloud Foundry repository:

    ```bash
    $ git clone https://github.com/apigee/microgateway_decorator.git
    ```

    * If you plan on using the decorator with Java, download the `microgateway_decorator` from [v3.0.0 of the service broker](https://github.com/apigee/cloud-foundry-apigee/tree/v3.0.0). **Note** This version of the decorator uses the [meta-buildpack](https://github.com/cf-platform-eng/meta-buildpack), which is being deprecated.


2. Upload the microgateway_decorator to Cloud Foundry:

    ```bash
    $ cd microgateway_decorator
    $ ./upload    
    ```

3. Create an instance of the “microgateway-coresident” service:

    ```bash
    $ cf create-service apigee-edge microgateway-coresident <service-name> -c '{"org":<org from service-broker configuration>, "env":<env from service-broker configuration>}'        
    ```
>**Note:** Once you have the service broker installed, you might be interested in using the sample app included in this repository to try it out. To do this, you'd replace the following steps with those in this [tutorial](../samples/coresident-sample).

## <a name="instance"></a>Step 3: Install Apigee Edge Microgateway and Cloud Foundry app
Here, you install Apigee Edge Microgateway and your Cloud Foundry app to the same Cloud Foundry container.

1. [Install and configure Apigee Edge Microgateway.](http://docs.apigee.com/microgateway/latest/installing-edge-microgateway)

1. Locate and make any desired changes to the configuration YAML file created in your Apigee Edge Microgateway installation, typically in the .edgemicro directory.

1. Copy the configuration file to the following directory in your Cloud Foundry app: `<application-folder>/<config-directory>`.

1. Complete plugin configuration in one of two ways:
    - Configure the plugins via the app manifest to include the APIGEE_MICROGATEWAY_CUSTOM environment variable. For example:
	
        ```yaml
        env:
        ...
  	    APIGEE_MICROGATEWAY_CONFIG_DIR: config
  	    APIGEE_MICROGATEWAY_CUST_PLUGINS: plugins
  	    APIGEE_MICROGATEWAY_PROCESSES: 2
        APIGEE_MICROGATEWAY_CUSTOM: |
                                      {"policies":
                                      {
                                      "oauth":
                                          {
                                          "allowNoAuthorization": false, 
                                          "allowInvalidAuthorization": false
                                          },
                                      "spikearrest": 
                                          {
                                          "timeUnit": "minute", 
                                          "allow": 10
                                          }
                                      },
                                      "sequence": ["oauth", "spikearrest"]
                                      }
        ```

        To support Cloud Foundry application health check, make sure your `applications` block includes the `health-check-type` and `health-check-http-endpoint` properties:
        
        ```yaml
        health-check-type: http
        health-check-http-endpoint: /healthcheck
        ```        

        Also, the `sequence` property must include a reference to the `healthcheck` plugin, as shown here.

        ```yaml
        "sequence": ["healthcheck", "oauth", "spikearrest"]
        ```

        For more on health check, see [Using Application Health Checks](https://docs.cloudfoundry.org/devguide/deploy-apps/healthchecks.html).
 
        The following describes the manifest properties:

        Variable | Description
        ---- | ----
        `APIGEE_MICROGATEWAY_CONFIG_DIR` | Location of your Apigee Microgateway configuration directory.
        `APIGEE_MICROGATEWAY_CUST_PLUGINS` | Location of your Microgateway plugins directory.
        `APIGEE_MICROGATEWAY_PROCESSES` | The number of child processes that Microgateway should start. If your Microgateway performance is poor, setting this value higher might improve it.
        `APIGEE_MICROGATEWAY_CUSTOM` | “sequence” corresponds to the sequence order in the Microgateway YAML file (this will be added to the end of any current sequence in the Microgateway YAML file with duplicates removed).<br/><br/>“policies” correspond to any specific configuration needed by a plugin; for instance, “oauth” has the "allowNoAuthorization": true configuration. These policies will overwrite any existing policies in the Microgateway YAML file and add any that do not yet exist.
        `APIGEE_MICROGATEWAY_NODEJS_FILENAME` | Name of a Node.js .tar file in the `lib/` directory, which is located in the `microgateway_decorator` buildpack.  In this case, the local install will be used to run the Microgateway instead of downloading Node.js.
        `APIGEE_MICROGATEWAY_NODEJS_URL` | A custom URL from which to download the Node.js used to run Microgateway.
        `APIGEE_MICROGATEWAY_NODEJS_VERSION` | The version of Node.js used to run Microgateway. This is downloaded from https://nodejs.org.
        `APIGEE_MICROGATEWAY_VERSION` | The version of Microgateway to use.
        
    - Configure the Microgateway YAML file from step 2 to include the necessary plugins. For example if we added a “spikearrest” plugin:

        ```yaml
        ...
        plugins:
            dir: ../plugins
            sequence:
              - oauth
              - spikearrest
        spikearrest:
          timeUnit: minute
          allow: 10
        oauth:
          allowNoAuthorization: false
          allowInvalidAuthorization: false
        ```

1. Copy any custom plugins’ root folders (with custom plugin specific package.json and index.js in the respective root folder) into the following directory in your Cloud Foundry app: `<application-folder>/<plugin-directory>`. 
    1. Remove the following or any other ``buildpack`` tags from the manifest:  
        ```yaml
        buildpack: nodejs_buildpack
        ```
    1. If you have custom buildpacks, add the following line to the “env” section:
	
        ```yaml
        env:
          ...
          APIGEE_MICROGATEWAY_CUST_PLUGINS: '<plugin-directory>'
        ```

1. To use a custom Node.js version to run Microgateway, configure the decorator in one of the following ways:

    **Note**: This feature is only available for version >= 3.1.* of the `microgateway_decorator`
    
    * To use a Node.js tar.gz from a location accessible via http or https other than https://nodejs.org:
    ```yaml
    env:
        # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        APIGEE_MICROGATEWAY_NODEJS_URL: https://mycustomdomain.com/mynoderoot/versions/node-v8.11.3-linux-x64.tar.gz
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        # APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * To select a specific Node.js version from https://nodejs.org:
    ```yaml
    env:
        # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        APIGEE_MICROGATEWAY_NODEJS_VERSION: 8.11.3
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        # APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * To use the default Node.js version of 8.11.3 from https://nodejs.org:
    ```yaml
    env:
        # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        # APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * To use a specific version of Node.js used from the decorator, then include the Node.js .tar file in the `lib/` directory which is located in the `microgateway_decorator` buildpack. In this case, the local install will be used to run Microgateway instead of downloading Nodejs.
    ```yaml
    env:
        # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        APIGEE_MICROGATEWAY_NODEJS_FILENAME: node-v6.11.3-linux-x64.tar.gz
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        # APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
2. To use a custom Microgateway version, configure the decorator in one of the following ways. If you don't include `APIGEE_MICROGATEWAY_VERSION`, then it will use version 2.5.8 in the Github repository.

    **Note**: This feature is only available for version >= 3.1.* of the `microgateway_decorator`
    
    * To use a specific version of Edge Microgateway, include this environment variable. This will execute a `git clone` on the https://github.com/apigee-internal/microgateway repository.
    ```yaml
    env:
        # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_VERSION: 2.5.19
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        # APIGEE_MICROGATEWAY_NODEJS_LOCAL_INSTALL: false
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        # APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * To use specific version of Edge Microgateway installed from the decorator, then clone the repository into the `lib/` directory which is located in the `microgateway_decorator` buildpack.  In this case, the decorator will use the locally cloned repository instead of cloning from github.com.
    ```yaml
    env:
        # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_VERSION: 2.5.19
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        # APIGEE_MICROGATEWAY_NODEJS_LOCAL_INSTALL: false
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        # APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```

3. Ensure that your Cloud Foundry app isn't running on port 8080, nor on the port specified by the PORT environment variable.

4. Push the Cloud Foundry app to your Cloud Foundry container.

    ```bash
    $ cf push <cf-app-name> --no-start
    ```

## <a name="bind"></a>Step 4: Bind the Cloud Foundry app to the Apigee service

In this step, you bind a Cloud Foundry app to the Apigee service instance you created. The `bind-service` command creates the proxy for you and binds the app to the service. By using `bind-service`, certain information (such as edgemicro key and secret and chosen plan ID) will be shared with the target application. In addition, since `bind-route-service` is not being used, traffic won’t be routed anywhere but the target application container.

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

    Use the [`bind-service`](http://cli.cloudfoundry.org/en-US/cf/bind-service.html) command with [JSON](#bind-service-reference) that specifies parameters.

    The following example does two things: it creates an API proxy on the specified org and environment, then binds the Apigee service to the target app. The protocol parameter specifies the protocol through which the proxy's target endpoint will be called. This command authenticates with Apigee Edge using the token in the specified .dat file:

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
   $ cf v3-push <cf-app-name> -b microgateway_decorator -b <language buildpack (e.g nodejs_builpdack)>
   ```

   * If you are using the v3.0.0 decorator with Java, run:
  
     ```bash
     cf start <cf-app-name>
     ```

2. Log into Edge and note that the proxy has been created. Then follow the instructions in  [Apigee Microgateway documentation](http://docs.apigee.com/microgateway/latest/setting-and-configuring-edge-microgateway#Part2) to create a product with your newly created proxy. You can now configure standard Apigee Edge policies on that proxy.

### bind-service reference
Use the `bind-service` command to generate an API proxy on Apigee Edge and to bind the Cloud Foundry service to the proxy. The command takes the following form (be sure to use quotes and command expansion, as shown here):

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
`org` | Apigee Edge organization hosting the API proxy to be called | Your organization (must be reachable via the authentication token specified in he `bearer` parameter).
`protocol` | The protocol through which the proxy's target endpoint should be accessed by Cloud Foundry. | `http` or `https`; default is `https`.
`target_app_port` | Port for your Cloud Foundry app. This may not be 8080 nor the PORT environment variable. | The port number.
`target_app_route` | The URL for your Cloud Foundry app. | The app URL.

## Unbinding the service

The `unbind-service` command accepts two parameters.
```bash
$ cf unbind-service <cf-app-name> <service name>
```

## Uninstalling the service instance and broker
```bash
$ cf delete-service <service name>
$ cf delete-service-broker apigee-edge
```
