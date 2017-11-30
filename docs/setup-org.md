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

1. Log in to the Cloud Foundry instance where you'll be installing the Apigee service broker.

    ```bash
    $ cf login -a <your.endpoint> -u <username> -o <organization> -s <space>
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
    $ cf create-service-broker apigee-edge <security user name> <security user password> https://apigee-cf-service-broker.local.pcfdev.io
    ```

1. Publish the service broker in your Cloud Foundry marketplace.
    ```bash
    $ cf enable-service-access apigee-edge
    $ cf marketplace
    $ cf marketplace -s apigee-edge
    ```

The Apigee service broker should now be available for you to create instances and bind to an Apigee-hosted proxy.

## <a name="instance"></a>Step 2: Install the plugin

1. Insure that you have golang installed. If you don't follow the instructions [here](https://golang.org/doc/)

1. Change to the cli_plugin directory.

    ```bash
    cd cli_plugin
    ```

1. Install the Apigee Broker Plugin as follows.
    * Install the necessary libraries 
    ```bash
        export GOPATH=$(pwd)
        mkdir -p "${GOPATH}/src/code.cloudfoundry.org"
        cd "${GOPATH}/src/code.cloudfoundry.org"
        git clone "https://github.com/cloudfoundry/cli"
        cd "${GOPATH}/src” 
        go get golang.org/x/crypto/ssh/terminal
    ```
    * Install the plugin
    ```bash
        cd $GOPATH
        go build apigee-broker-plugin && cf install-plugin apigee-broker-plugin
        Attention: Plugins are binaries written by potentially untrusted authors.
        Install and use plugins at your own risk.
        Do you want to install the plugin apigee-broker-plugin? [yN]: y
        Installing plugin Apigee-Broker-Plugin...
        OK
        Plugin Apigee-Broker-Plugin 0.1.1 successfully installed.
    ```

1. Make sure the plugin is available by running the following command:

    ```bash
    cf -h
    …
    Commands offered by installed plugins:
      apigee-bind-mg,abm      apigee-unbind-mgc,auc    enable-diego
      apigee-bind-mgc,abc     apigee-unbind-org,auo    has-diego-enabled
      apigee-bind-org,abo     dea-apps                 migrate-apps
      apigee-push,ap          diego-apps               dev,pcfdev
      apigee-unbind-mg,aum    disable-diego
    ```

## <a name="instance"></a>Step 3: Create an instance of the Apigee service

You create a service instance so you can bind a Cloud Foundry app's path to it.

The service instance is created for the Cloud Foundry org/space by specifying the desired service plan and a name for the instance. For example, for the service name `myapigee` using the `org` plan:

```bash
$ cf create-service apigee-edge org <instance name> -c \
    '{"org":"<your-org-name>", "env":"<your-env-name>"}'
$ cf service <instance-name>
```

>**Note:** Once you have the service broker installed, you might be interested in using the sample app included in this repository to try it out. To do this, you'd replace the following steps with those in this [tutorial](../samples/org-and-microgateway-sample).

## <a name="bind"></a>Step 4: Bind the CF app's route to the Apigee service

In this step, you bind a Cloud Foundry app's route (its address in Cloud Foundry) to the Apigee service instance you created. That way, requests to the app will be forwarded first to an Edge proxy. The `bind-route-service` command creates the proxy for you and binds the route to it.

Each bind attempt requires authorization with Edge, passed as additional parameters to the `cf` bind command.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `test-app`, then the resulting FQDN is `test-app.local.pcfdev.io`.

1. If you're using a bearer token to authenticate with Apigee Edge, get or    update the token using the Apigee SSO CLI script. (If you're instead using    command-line arguments to authenticate with username and password, specify   the credentials in the next step.)

    ```
    get_token
	```

    > You may be prompted for your Apigee Edge username and password, and an MFA token. This updates the token in the ~/.sso-cli/valid\_token.dat file (if that subdirectory exists – otherwise the file is placed in the current working directory). The next step uses this token.

1. Bind the app to the Apigee service instance with the `apigee-bind-org` command.

    When you use the command without arguments, you'll be prompted for argument values. To use the command with arguments, see the command reference at the end of this topic. For help on the command, type `cf apigee-bind-org -h`. Without arguments, you'll be prompted for the following:

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
	Host | The host domain to which API calls are made. Specify a value only if your host domain is not the same as that given by your virtual host.
    Target application protocol | The application protocol, such as http or https.
    Service instance name to bind to | Required. Name of the Apigee service to bind to.

1. Log into Edge and note that the proxy has been created, and that requests to your app are being routed through Edge.

    You will find a proxy whose name matches the pattern specified by the `APIGEE_PROXY_NAME_TEMPLATE` variable you specified with your org and env mapping in the manifest. The proxy has been deployed to the environment you specified when you created your service instance.

    In the Edge management console, begin tracing the proxy, then send requests to your app. Trace will show the traffic routing through the proxy.

    You can now configure standard Apigee Edge policies on that proxy.

## apigee-bind-org reference

Use the `apigee-bind-org` command to generate an API proxy on Apigee Edge and to bind the Cloud Foundry service to the proxy.

The command requires your Apigee Edge credentials in order to create and bind to an API proxy. You can specify credentials either with a bearer token or by 
giving a username and password at the command line. To use a token, you must 
provide the `--bearer` argument. To be prompted for argument values (and provide a username and password at prompts), use the command without arguments. 

```
cf apigee-bind-org
```

To specify arguments on the command line, use the following syntax (be sure to 
use quotes and command expansion, as shown here):

```bash
$ cf apigee-bind-org [--app APP_NAME] [--service SERVICE_INSTANCE] \
    [--apigee_org APIGEE_ORGANIZATION] [--apigee_env APIGEE_ENVIRONMENT] \ 
    [--protocol TARGET_APP_PROTOCOL] [--domain APP_DOMAIN] [--action ACTION] \
    [--user APIGEE_USERNAME] [--pass APIGEE_PASSWORD] \
    [--bearer APIGEE_BEARER_TOKEN] [--host HOST_NAME]
```

Parameter | Purpose | Allowed Values
---- | ---- | ----
`action` | Required. A value specifying whether to create or bind an API proxy | `proxy` to generate an API proxy; `bind` to bind the service with the proxy; `proxy bind` to generate the proxy and bind with a single command.
`apigee_env` | Required. Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
`apigee_org` | Required. Apigee Edge organization hosting the API proxy to be called |  Your organization (must be reachable via the authentication token specified in the `bearer` parameter)
`app` | Required. Name of the the Cloud Foundry application to bind to. | The app name.
`bearer` | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get_token command. The broker does not store any data; it requires credentials and other parameters for each individual `cf` command. Instead of a `bearer` token, credentials can also be expressed as:<ul><li>`basic`: standard HTTP Base-64 encoded username and password for `Authorization: Basic`. Note that this is *not encrypted* and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)</li><li>username and password in clear text</li></ul>
`domain` | Required. Domain of the application to bind to. | 
`host` | The host domain to which API calls are made. Specify a value only if your host domain is not the same as that given by your virtual host. | Your host domain name if different from your virtual host domain. For example: mycompany.net:9000
`pass` | Apigee password. Not used if you pass a bearer token with the --bearer argument. | Your password.
`protocol` | The protocol through which the proxy should be accessed by Cloud Foundry | `http` or `https`; default is `https`.
`service` | Required. Name of the Apigee service to bind to. | The service name.
`target_app_route` | The URL for your Cloud Foundry app. | The app URL.
`user` | Apigee user name. Not used if you pass a bearer token with the --bearer argument. | Your user name.

## Unbinding the route service

To unbind the service and proxy, use the apigee-unbind-mg command.

```bash
$ cf apigee-unbind-org [--app APP_NAME] [--service SERVICE_INSTANCE] [--domain DOMAIN]
```

## Uninstalling the service instance and broker
To uninstall the service instance, use the delete-service command.

```bash
$ cf delete-service myapigee
$ cf delete-service-broker apigee-edge
```
