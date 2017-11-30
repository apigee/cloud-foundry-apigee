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
    APIGEE_MGMT_API_URL | The endpoint URL to the Apigee Edge management API. The Apigee Edge Service Broker uses this URL when making requests to create new Apigee Edge API proxies for managing requests to PCF apps. | `https://api.enterprise.apigee.com/v1`
    APIGEE_PROXY_DOMAIN | The domain name that Cloud Foundry apps use when making calls to your API proxy. This is the domain that clients use to make calls to your APIs. Change this value if your proxy domain is not the default domain for Apigee public cloud. For example, you might have your own API domain -- such as one created with a custom virtual host. Enter the domain name here. | `apigee.net`
    APIGEE_PROXY_HOST_TEMPLATE | ES6 template literal for generated proxy host. The template that describes how the Apigee Edge host name should be generated. <br/> This represents the hostname that clients use to make calls to your APIs. Change this value if your hostname is not created in the default way -- from your Apigee org an environment names. For example, if your APIs use a custom virtual host, you might have just a domain name:<br/>`${domain}`<br />Cloud Foundry apps use this host when making calls to your API proxy. The template generates the host name from values specified when binding the CF app to the service. (Note that without any placeholders, this will be used as a literal value.) | `${org}-${env}.${domain}`
    APIGEE_PROXY_NAME_TEMPLATE | ES6 template literal for generated proxy | `cf-${route}`
    ORG | The Apigee Edge organization with proxies that will handle calls to your app. |
    ENV | The Apigee Edge environment with proxies that will handle calls to your app. |

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
        Do you want to install the plugin broker_plugin? [yN]: y
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

## <a name="instance"></a>Step 3: Install and start the decorator
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

## <a name="instance"></a>Step 4: Install Apigee Edge Microgateway and Cloud Foundry app
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

        Variable | Description
        ---- | ----
        `APIGEE_MICROGATEWAY_CONFIG_DIR` | Location of your Apigee Microgateway configuration directory.
        `APIGEE_MICROGATEWAY_CUST_PLUGINS` | Location of your Apigee Microgateway plugins directory.
        `APIGEE_MICROGATEWAY_PROCESSES` | The number of child processes that Apigee Microgateway should start. If your Microgateway performance is poor, setting this value higher might improve it.
        `APIGEE_MICROGATEWAY_CUSTOM` | “sequence” corresponds to the sequence order in the microgateway yaml file (this will be added on to the end of any current sequence in the microgateway yaml file with duplicates removed).<br/><br/>“policies” correspond to any specific configuration needed by a plugin; for instance, “oauth” has the ‘"allowNoAuthorization": true configuration. These policies will overwrite any existing policies in the microgateway yaml file and add any that do not yet exist.
    - Configure the microgateway yaml file from step 2 to include the necessary plugins. For example if we added a “spikearrest” plugin:
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

1. Ensure that your Cloud Foundry app isn't running on port 8080, nor on the port specified by the PORT environment variable.

1. Push the Cloud Foundry app to your Cloud Foundry container.

    ```bash
    $ cf apigee-push
    ```

    > You'll be prompted for the following:

	Argument | Description
	--- | ---
	Plan type confirmation | Specify whether you're using the microgateway-coresident plan.
	Path to your Java archive | If your app is a Java app, specify the path to its .jar file.
	Path to the configuration directory with Microgateway .yaml file | Location of your Apigee Microgateway configuration directory.
	Path to the configuration directory with custom plugins | Location of your Apigee Microgateway plugins directory.

## <a name="bind"></a>Step 5: Bind the Cloud Foundry app to the Apigee service

In this step, you bind a Cloud Foundry app to the Apigee service instance you 
created. The `apigee-bind-mgc` command creates the proxy for you and binds the app to the service. Certain information (such as the Apigee Microgateway key and secret and chosen plan ID) will be shared with the target application.  

Each bind attempt requires authorization with Apigee Edge, with credentials 
passed as additional parameters to the `apigee-bind-mgc` command. You can pass 
these credentials as arguments of the `apigee-bind-mgc` command or by using a 
bearer token.

1. First, get the URL of the app to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `test-app`, then the resulting FQDN is `test-app.local.pcfdev.io`.

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

    > You may be prompted for your Apigee Edge username and password, and an MFA token. This updates the token in the `~/.sso-cli/valid_token.dat` file (if that subdirectory exists -- otherwise the file is placed in the current working directory). The next step uses this token.

1. Bind the app to the Apigee service instance with the apigee-bind-mgc command.

    > Use the command without arguments to be prompted for argument values. To use  the command with arguments, see the command reference at the end of this  topic. For help on the command, type `cf apigee-bind-mgc -h`. 
	
	```
	cf apigee-bind-mgc
	```

    > You'll be prompted for the following:
	
    Argument  | Description
	--- | ---
	Apigee username | Apigee user name. Not used if you pass a bearer token with the --bearer argument.
    Apigee password | Apigee password. Not used if you pass a bearer token with the --bearer argument.
	Action to take | Required.  proxy to generate an API proxy; bind to bind the service with the proxy; proxy bind to generate the proxy and bind with a single command.
	Apigee environment | Required. The Apigee environment where your proxy should be deployed.
	Apigee organization | Required. The Apigee organization where your proxy should be created.
	Application to bind to | Required. Name of the the Cloud Foundry application to bind to.
	Microgateway key | Required. Your Apigee Edge Microgateway key.
	Microgateway secret | Required. Your Apigee Edge Microgateway secret.
	Service instance name to bind to | Required. Name of the Apigee service to bind to.
	Target application port | Required. Port for your Cloud Foundry app. This may not be 8080 nor the PORT environment variable.
	Target application route | Required. The URL for your Cloud Foundry app. This will be the suffix of the proxy created for you through the bind command
	
	> The command creates an API proxy on the specified Apigee org and environment, then binds the Apigee service to the target app. To do its work, this command authenticates with Apigee Edge using the credentials you specified. You'll be prompted to start the app. If you don't and want to start it later you can start the Cloud Foundry app and microgateway-decorator along with it.
	
	```
	cf start APP_NAME
	```

1. Log into Edge and note that the proxy has been created. Then follow the instructions [here](http://docs.apigee.com/microgateway/latest/setting-and-configuring-edge-microgateway#Part2) to create a product with your newly created proxy. You can now configure standard Apigee Edge policies on that proxy.

### apigee-bind-mgc reference
Use the `apigee-bind-mgc` command to generate an API proxy on Apigee Edge and to bind the Cloud Foundry service to the proxy.

The command requires your Apigee Edge credentials in order to create and bind to an API proxy. You can specify credentials either with a bearer token or by 
giving a username and password at the command line. To use a token, you must 
provide the `--bearer` argument.

To be prompted for argument values (and provide a username and password at 
prompts), use the command without arguments.  

```
cf apigee-bind-mgc
```

To specify arguments on the command line, use the following syntax (be sure to 
use quotes and command expansion, as shown here):

```bash
$ cf apigee-bind-mgc [--app APP\_NAME] [--service SERVICE\_INSTANCE] \
    [--apigee\_org APIGEE\_ORGANIZATION] [--apigee\_env APIGEE\_ENVIRONMENT] \ 
    [--edgemicro\_key EDGEMICRO\_KEY] [--edgemicro\_secret EDGEMICRO\_SECRET] \
    [--target\_app\_route TARGET\_APP\_ROUTE] [--target\_app\_port TARGET\_APP\_PORT] \ 
    [--action ACTION] [--user APIGEE\_USERNAME] [--pass APIGEE\_PASSWORD] \
    [--bearer APIGEE\_BEARER\_TOKEN]
```

Parameters for the `-c` argument specify connection details:

Parameter | Purpose | Allowed Values
---- | ---- | ----
`action` | A value specifying whether to create or bind an API proxy | `proxy` to generate an API proxy; `bind` to bind the service with the proxy; `proxy bind` to generate the proxy and bind with a single command.
`apigee_env` | Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
`apigee_org` | Apigee Edge organization hosting the API proxy to be called | Your organization (must be reachable via the authentication token specified in the bearer parameter).
`app` | Name of the the Cloud Foundry application to bind to. | The app name.
`bearer` | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get_token command. The broker does not store any data; it requires credentials and other parameters for each individual `cf` command. Instead of a `bearer` token, credentials can also be expressed as:<ul><li>`basic`: standard HTTP Base-64 encoded username and password for `Authorization: Basic`. Note that this is *not encrypted* and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)</li><li>username and password in clear text</li></ul>
`edgemicro_key` | The key for your Apigee Edge Microgateway configuration (returned when you configured the Apigee Microgateway). | The configuration key.
`edgemicro_secret` | The secret for your Apigee Edge Microgateway configuration (returned when you configured the Apigee Microgateway). | The configuration secret.
`host` | Optional. The host domain to which API calls are made. Specify a value only if your host domain is not the same as that given by your virtual host. | Your host domain name if different from your virtual host domain. For example: `mycompany.net:9000`
`pass` | Apigee password. Not used if you pass a bearer token with the --bearer argument. | Your password.
`service` | Name of the Apigee service to bind to. | The service name.
`target_app_port` | Port for your Cloud Foundry app. This may not be 8080 nor the PORT environment variable. | The port number.
`target_app_route` | The URL for your Cloud Foundry app. | The app URL.
`user` | Apigee user name. Not used if you pass a bearer token with the --bearer argument. | Your user name.

## Unbinding the service

To unbind the service and proxy, use the apigee-unbind-mgc command.
```bash
$ cf apigee-unbind-mgc [--app APP\_NAME] [--service SERVICE\_INSTANCE]
```

## Uninstalling the service instance and broker

To uninstall the service instance, use the delete-service command.
```bash
$ cf delete-service myapigee
$ cf delete-service-broker apigee-edge
```
