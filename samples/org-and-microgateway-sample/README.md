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

### Step 3 - Bind the Service to the App:

In this step, you bind a Cloud Foundry app's route (its address in Cloud Foundry) to the Apigee service instance you created. That way, requests to the app will be forwarded first to an Edge proxy. The `bind-route-service` command creates the proxy for you and binds the route to it.

Each bind attempt requires authorization with Edge, passed as additional parameters to the `cf` bind command.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `sample`, then the resulting FQDN is `sample.local.pcfdev.io`.

1. Get or update the authorization token using the [Apigee SSO Cli](http://docs.apigee.com/api-services/content/using-oauth2-security-apigee-edge-management-api#howtogetoauth2tokens) script.
    ```bash
    $ get_token
    ```
    You may be prompted for your Apigee Edge username and password, and an MFA token. This updates the token in the `~/.sso-cli/valid_token.dat` file (if that subdirectory exists -- otherwise the file is placed in the current working directory)

1. Bind the app's route to the Apigee service instance with the domain and hostname.

    Use the [`bind-route-service`](#bind-route-service-reference) command. The following example does two things: it creates an API proxy on the `myorg` org and `test` environment, then binds the Apigee route service to the proxy. The protocol parameter specifies the protocol through which the proxy will be called. To do its works, this command authenticates with Apigee Edge using the token in the specified .dat file:

    ```bash
    $ cf bind-route-service local.pcfdev.io apigee-edge --hostname sample \
    -c '{"org":"myorg","env":"test",
      "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
      "action":"proxy bind",
      "protocol":"http"}'
    ```

    You should see output such as the following:

    ```
    Binding route sample.local.pcfdev.io to service instance apigee-edge in org apigee / space dev as admin...
    OK
    ```

### Step 4 - Test the Bind:

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

### Step 3 - Push the Applications:

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

### Step 4 - Bind the Cloud Foundry app's route to the Apigee service

In this step, you bind a Cloud Foundry app's route (its address in Cloud Foundry) to the Apigee service instance you created. That way, requests to the app will be forwarded first to an Edge proxy. The `bind-route-service` command creates the proxy for you and binds the route to it.

Each bind attempt requires authorization with Edge, passed as additional parameters to the `cf` bind command.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `sample`, then the resulting FQDN is `sample.local.pcfdev.io`.

1. Get or update the authorization token using the [Apigee SSO Cli](http://docs.apigee.com/api-services/content/using-oauth2-security-apigee-edge-management-api#howtogetoauth2tokens) script.
    ```bash
    $ get_token
    ```
    You may be prompted for your Apigee Edge username and password, and an MFA token. This updates the token in the `~/.sso-cli/valid_token.dat` file (if that subdirectory exists -- otherwise the file is placed in the current working directory)

1. Bind the app's route to the Apigee service instance with the domain and hostname.

    The proxy must be created as a separate step, and then loaded by Microgateway instances before binding. You can create the proxy manually, but to have the broker do it, specify "action":"proxy". Also specify the Microgateway's FQDN as micro.

    In this example, Apigee Edge Microgateway is also installed as an app with the hostname edgemicro-app:

    Use the [`bind-route-service`](#bind-route-service-reference) command. The following example creates an API proxy on the `myorg` org and `test` environment. The protocol parameter specifies the protocol through which the proxy will be called. To do its works, this command authenticates with Apigee Edge using the token in the specified .dat file:

    ```bash
    $ cf bind-route-service local.pcfdev.io micro --hostname sample \
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
    $ cf bind-route-service local.pcfdev.io micro --hostname sample \
    -c '{"org":"myorg","env":"test",
       "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
       "micro":"edgemicro-app.local.pcfdev.io",
       "action":"bind"}'
    ```

    The proxies created by the bind for Microgateway have an additional `edgemicro_` at the beginning of their name, a general requirement unrelated to Cloud Foundry and service brokers. Another general requirement is that the proxy is part of a published API Product; a change you must make manually by following the instructions [here](http://docs.apigee.com/microgateway/latest/setting-and-configuring-edge-microgateway#Part2) to create a product with your newly created proxy.

### Step 5 - Test the Bind:

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
        
        