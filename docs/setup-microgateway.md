# Setting Up Microgateway and a Cloud Foundry App in Separate Containers ("microgateway" plan)
Using code in this directory, you can install an Apigee service broker that manages connections between your Cloud Foundry app and Apigee Microgateway running in a separate Cloud Foundry container.

> This section describes how to set up Apigee Edge Microgateway and your Cloud Foundry app in separate containers. To set them up in a single container, be sure to see [Setting Up Microgateway and a Cloud Foundry App in a Single Container](setup-microgateway-coresident.md).

Use the following sections to install the Apigee service broker on Cloud Foundry, then set up a binding between a Cloud Foundry app and the Apigee service.

1. [Ensure you have the prerequisites.](apigee-service-broker-prerequisites.md)
1. [Install the service broker](#install) to make it available in the marketplace (CF administrator/operator).
2. [Create an instance of the service broker](#instance) for your Cloud Foundry org/space (CF user).
3. [Bind or unbind](#bind) a route service to an app route as needed (CF user).

> Steps in these instructions use CF CLI with an Apigee plugin. To see corresponding CF CLI commands, see [Mapping for Apigee and Cloud Foundry integration commands](mapping-apigee-cf-cli.md).

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
    APIGEE_PROXY_HOST_TEMPLATE | ES6 template literal for generated proxy host. The template that describes how the Apigee Edge host name should be generated. <br/> This represents the hostname that clients use to make calls to your APIs. Change this value if your hostname is not created in the default way -- from your Apigee org an environment names. For example, if your APIs use a custom virtual host, you might have just a domain name:<br/>`${domain}`<br />Pivotal Cloud Foundry apps use this host when making calls to your API proxy. The template generates the host name from values specified when binding the PCF app to the service(Note that without any placeholders, will be used as-is.) | `${org}-${env}.${domain}`
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
1. Create an instance of the “microgateway” service:

    ```bash
    $ cf create-service apigee-edge microgateway <service-name> -c \
        '{"org":<org from service-broker configuration>, "env":<env from service-broker configuration>}'        
    ```

>**Note:** Once you have the service broker installed, you might be interested in using the sample app included in this repository to try it out. To do this, you'd replace the following steps with those in this [tutorial](../samples/org-and-microgateway-sample).

## <a name="instance"></a>Step 2: Install the plugin

1. Install the Apigee Broker Plugin as follows.
    ```bash
    $ cf install-plugin -r CF-Community "apigee-broker-plugin"                                                                                                                                 
    Searching CF-Community for plugin apigee-broker-plugin...
    Plugin apigee-broker-plugin 0.1.1 found in: CF-Community
    Attention: Plugins are binaries written by potentially untrusted authors.
    Install and use plugins at your own risk.
    Do you want to install the plugin apigee-broker-plugin? [yN]: y
    Starting download of plugin binary from repository CF-Community...
    7.85 MiB / 7.85 MiB [===========================================================================================================================================================================================================================================] 100.00% 11s
    Installing plugin Apigee-Broker-Plugin...
    OK
    Plugin Apigee-Broker-Plugin 0.1.1 successfully installed.
    ```

1. Make sure the plugin is available by running the following command:

    ```bash
    $ cf -h
    …
    Commands offered by installed plugins:
      apigee-bind-mg,abm      apigee-unbind-mgc,auc    enable-diego
      apigee-bind-mgc,abc     apigee-unbind-org,auo    has-diego-enabled
      apigee-bind-org,abo     dea-apps                 migrate-apps
      apigee-push,ap          diego-apps               dev,pcfdev
      apigee-unbind-mg,aum    disable-diego
    ```

## <a name="instance"></a>Step 3: Install Apigee Edge Microgateway and Cloud Foundry app
Here, you install Apigee Edge Microgateway and your Cloud Foundry app to the same Cloud Foundry container.

1. [Install and configure Apigee Edge Microgateway.](http://docs.apigee.com/microgateway/latest/installing-edge-microgateway)

1. Clone the Apigee Microgateway Repo:
  
   ```bash
   $ git clone https://github.com/https://github.com/apigee-internal/microgateway.git
   $ cd microgateway
   $ git checkout tags/v.2.5.4
   ```

1. Copy the configuration file to the following directory in your Cloud Foundry app: `<microgateway-repo-directory>/<config-directory>`.

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
    $ cf apigee-push
    ```

## <a name="bind"></a>Step 4: Bind the Cloud Foundry app's route to the Apigee service

In this step, you bind a Cloud Foundry app to the Apigee service instance you 
created. The `apigee-bind-mg` command creates the proxy for you and binds the app to the service.   

Each bind attempt requires authorization with Apigee Edge, with credentials 
passed as additional parameters to the `apigee-bind-mg` command. You can pass 
these credentials as arguments of the `apigee-bind-mg` command or by using a 
bearer token.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `test-app`, then the resulting FQDN is `test-app.local.pcfdev.io`.

    ```bash
    $ cf routes
    ```

1. If you're using a bearer token to authenticate with Apigee Edge, get or 
   update the token using the Apigee SSO CLI script. (If you're instead using 
   command-line arguments to authenticate with username and password, specify 
   the credentials in the next step.)

    ```bash
    $ get_token
    ```
    You may be prompted for your Apigee Edge username and password, and an MFA token. This updates the token in the `~/.sso-cli/valid_token.dat` file (if that subdirectory exists -- otherwise the file is placed in the current working directory). The next step uses this token.

1. Bind the app to the Apigee service instance with the `apigee-bind-mg` command.

    You'll need to run the command twice: once to create the proxy, then again to  bind the service to the proxy. The proxy must be loaded by Microgateway instances before binding.

    When you use the command without arguments, you'll be prompted for argument values. To use the command with arguments, see the command reference at the end of this topic. For help on the command, type `cf apigee-bind-mg -h`. Without arguments, you'll be prompted for the following:

    Argument | Description
    --- | ---
    Apigee username | Apigee user name. Not used if you pass a bearer token with the `--bearer` argument.
    Apigee password | Apigee password. Not used if you pass a bearer token with the `--bearer` argument.
    Action to take | Required. `proxy` to generate an API proxy; `bind` to bind the service with the proxy; `proxy bind` to generate the proxy and bind with a single command.
    Apigee environment | Required. The Apigee environment where your proxy should be deployed.
    Apigee organization | Required. The Apigee organization where your proxy should be created.
    Application to bind to | Required. Name of the the Cloud Foundry application to bind to.
    Domain to bind to | Required. Domain of the application to bind to.
    Route of the application acting as microgateway | Required. Route of the application acting as Edge Microgateway.
    Target application protocol | Optional. The application protocol, such as http or https.
    Service instance name to bind to | Required. Name of the Apigee service to bind to.

1. First, create the proxy. When prompted for the action to take, enter `proxy`.

    ```
    cf apigee-bind-mg
    ```

    The command creates an API proxy on the specified Apigee org and environment, then binds the Apigee service to the target app. The protocol parameter specifies the protocol through which the proxy's target endpoint will be called. To do its work, this command authenticates with Apigee Edge using the credentials you specified.  

    Cloud Foundry will report an error because the bind was not attempted. But the message returned should indicate that the proxy was created, which you can check with the Edge management UI or API. The proxies created by the bind for Microgateway have an additional edgemicro_ at the beginning of their name, a general requirement unrelated to Cloud Foundry and service brokers.  

    Wait for the configuration to reload on the Edge Microgateway instance(s) before binding. You might have to wait 5 to 10 minutes. When it has reloaded, the console will list the proxy you just created.

1. Next bind the service to the proxy by running the command again. This time, for the action, specify bind for the `action` argument.

    ```
    cf apigee-bind-mg
    ```

    The proxy is part of a published API Product; a change you must make manually by following the instructions [here](http://docs.apigee.com/microgateway/latest/setting-and-configuring-edge-microgateway#Part2) to create a product with your newly created proxy.

## apigee-bind-mg reference

Use the apigee-bind-mg command to generate an API proxy on Apigee Edge and to 
bind the Cloud Foundry service to the proxy.   
The command requires your Apigee Edge credentials in order to create and bind to 
an API proxy. You can specify credentials either with a bearer token or by 
giving a username and password at the command line. To use a token, you must 
provide the --bearer argument.  
To be prompted for argument values (and provide a username and password at 
prompts), use the command without arguments.  
cf apigee-bind-mg

To specify arguments on the command line, use the following syntax (be sure to 
use quotes and command expansion, as shown here):

```bash
$ cf apigee-bind-mg [--app APP_NAME] [--service SERVICE_INSTANCE] \
   [--apigee_org APIGEE_ORGANIZATION] [--apigee_env APIGEE_ENVIRONMENT] \
   [--micro MICROGATEWAY_APP_ROUTE] [--protocol TARGET_APP_PROTOCOL] 
   [--domain APP_DOMAIN] [--action ACTION] \
   [--user APIGEE_USERNAME] [--pass APIGEE_PASSWORD] \
   [--bearer APIGEE_BEARER_TOKEN]
```

Parameter | Purpose | Allowed Values
---- | ---- | ----
`action` | Required. A value specifying whether to create or bind an API proxy | `proxy` to generate an API proxy; `bind` to bind the service with the proxy; `proxy bind` to generate the proxy and bind with a single command.
`apigee_env` | Required. Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
`apigee_org` | Required. Apigee Edge organization hosting the API proxy to be called |  Your organization (must be reachable via the authentication token specified in the `bearer` parameter)
`app` | Required. Name of the the Cloud Foundry application to bind to. | The app name.
`bearer` | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get_token command. The broker does not store any data; it requires credentials and other parameters for each individual `cf` command. Instead of a `bearer` token, credentials can also be expressed as:<ul><li>`basic`: standard HTTP Base-64 encoded username and password for `Authorization: Basic`. Note that this is *not encrypted* and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)</li><li>username and password in clear text</li></ul>
`domain` | Required. Domain of the application to bind to. | 
`micro` | Required. Route of the application acting as Edge Microgateway. | Required.
`pass` | Apigee password. Not used if you pass a bearer token with the --bearer argument. | Your password.
`protocol` | The protocol through which the proxy should be accessed by Cloud Foundry | `http` or `https`; default is `https`.
`service` | Required. Name of the Apigee service to bind to. | The service name.
`user` | Apigee user name. Not used if you pass a bearer token with the --bearer argument. | Your user name.

## Unbinding the route service

To unbind the service and proxy, use the apigee-unbind-mg command.

```bash
$ cf apigee-unbind-mg [--app APP_NAME] [--service SERVICE_INSTANCE] [--domain DOMAIN]
```

## Uninstalling the service instance and broker
To uninstall the service instance, use the delete-service command.

```bash
$ cf delete-service myapigee
$ cf delete-service-broker apigee-edge
```
