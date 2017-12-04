# Sample App for Apigee-Pivotal Integration with "org" and "microgateway" Plans

These instructions install a sample app that is accessible via the "org" and "microgateway" plans.

These instructions assume the Service Broker is already installed. You can check this by running `cf marketplace` and checking to make sure that `apigee-edge` is an offering.

Throughout these instructions you will see `org = myorg` and `env = test` as well as a domain of `local.pcfdev.io`. Be sure to change these values as necessary to match your configurations.

## Org Plan:

### Step 1 - Create the Service:

  ```bash
  $ cf create-service apigee-edge org apigee-edge -c \
    '{"org":"myorg", "env":"test"}'
  ```

  with output:

  ```
  Creating service instance apigee-edge in org apigee / space dev as admin...
  OK
  ```

### Step 2 - Push the Sample App:

```bash
$ cf push
```
### Step 3: Install the Plugin

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

### Step 4: Bind the CF app's route to the Apigee service:

In this step, you bind a Cloud Foundry app's route (its address in Cloud Foundry) to the Apigee service instance you created. That way, requests to the app will be forwarded first to an Edge proxy. The `apigee-bind-org` command creates the proxy for you and binds the route to it.

Each bind attempt requires authorization with Edge, passed as additional parameters to the `cf` bind command.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `sample`, then the resulting FQDN is `sample.local.pcfdev.io`.

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

### Step 5 - Test the Bind:

1. Using cURL, send a request to the app you just pushed.

```bash
$ curl sample.local.pcfdev.io
```
The console will display the app's response.

```bash
{"hello":"hello from cf app"}
```

1. Log into Edge and note that the proxy has been created, and that requests to your app are being routed through Edge.

    You will find a proxy whose name matches the pattern specified by the APIGEE_PROXY_NAME_TEMPLATE variable you specified in the manifest. The proxy has been deployed to the environment you specified when you created your service instance.

    In the Edge management console, begin tracing the proxy, then send requests to your app. Trace will show the traffic routing through the proxy.

    You can now configure standard Apigee Edge policies on that proxy.


## Microgateway Plan:

### Step 1 - Create the Service:
  ```bash
  $ cf create-service apigee-edge microgateway micro -c \
    '{"org":"myorg", "env":"test"}'
  ```

### Step 2 - Configure Edmgemicro:
  * Make sure Node is installed
  ```
  $ node -v
  ```
  * Install Edgmicro:
  ```
  $ npm install edgemicro -g
  ```
  * Initialize Edgemicro:
  ```
  $ edgemicro init
  ```
  * Configure Edgemicro:
  ```
  $ edgemicro configure -o myorg -e test -u [username]
  ```
  Note the key and secret returned. You will need these later.
  
### Step 3: Install the Plugin

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

### Step 4 - Push the Applications:

1. Clone the Apigee Microgateway Repo:

   ```bash
   $ git clone https://github.com/https://github.com/apigee-internal/microgateway.git
   $ cd microgateway
   $ git checkout tags/v.2.5.4
   ```

1. Copy the configuration file to the following directory in the microgateway directory: `microgateway/config`.

1. Edit the microgateway `manifest.yml` as follows:

   1. Edit the following env values so that they correspond to your Apigee Edge Microgateway configuration:

        ```yaml
        env:
          EDGEMICRO_KEY: 'microgateway-key'
          EDGEMICRO_SECRET: 'microgateway-secret'
          EDGEMICRO_CONFIG_DIR: '/app/config'
          EDGEMICRO_ENV: 'myorg'
          EDGEMICRO_ORG: 'test'
        ```
1. Push Apigee Microgateway as its own app:

    ```bash
    $ cf push
    ```

1. Change to your application's directory and push your app:
    ```bash
    $ cd .../cloud-foundry-apigee/samples/org-and-microgateway-sample
    $ cf push
    ```

### Step 5 - Bind the Cloud Foundry app's route to the Apigee service

In this step, you bind a Cloud Foundry app to the Apigee service instance you 
created. The `apigee-bind-mg` command creates the proxy for you and binds the app to the service.   

Each bind attempt requires authorization with Apigee Edge, with credentials 
passed as additional parameters to the `apigee-bind-mg` command. You can pass 
these credentials as arguments of the `apigee-bind-mg` command or by using a 
bearer token.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `sample`, then the resulting FQDN is `sample.local.pcfdev.io`.

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

### Step 6 - Test the Bind:

  1. In a separate terminal instance run:
      ```bash
      $ cf logs edgemicro-app
      ```
  1. Using cURL, send a request to the app you just pushed.
    1. If you turned off authorization in the microgateway file. e.g:
       ```yaml
       ...
       oauth:
       allowNoAuthorization: true
       allowInvalidAuthorization: true
       verify_api_key_url: 'https://myorg-myenv.apigee.net/edgemicro-auth/verifyApiKey'
       ...
       ```
       
   + Then Run:
       ```bash
        $ curl sample.local.pcfdev.io
        ```

  4. If you did not turn off authorization in the microgateway file. e.g:
       ```
        ...
        oauth:
        allowNoAuthorization: false
        allowInvalidAuthorization: false
        verify_api_key_url: 'https://myorg-myenv.apigee.net/edgemicro-auth/verifyApiKey'
        ...
        ```
  + Run:
      ```
      $ edgemicro token get -o <org> -e <env> -i <product key> -s <product secret>
      $ curl sample.local.pcfdev.io -H "Authorization: Bearer <token from previous step>"
      ```

  5. The console will display the app's response.
  ```bash
  {"hello":"hello from cf app"}
  ```
  6. Note that a request came into the `edgemicro-app` container.
