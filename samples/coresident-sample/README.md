# Sample App for Apigee-Pivotal Integration with "microgateway-coresident" plan

These instructions install a sample app that is accessible via the "microgateway-coresident" plan.

These instructions assume the Service Broker is already installed. You can check this by running `cf marketplace` and checking to make sure that `apigee-edge` is an offering.

## Step 1 - Create the Service:
  ```
  $ cf create-service apigee-edge microgateway-coresident coresident -c \
    '{"org":"myorg", "env":"test"}'
  ```

## Step 2 - Configure Edmgemicro:
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


* Locate and make any desired changes to the configuration YAML file created in your Apigee Edge Microgateway installation, typically in the .edgemicro directory.
* Copy the configuration file to the following directory in your Cloud Foundry app:  
```
$ cp ~/.edgemicro/myorg-test-config.yaml .../cloud-foundry-apigee/samples/coresident-sample/config
```
* If you want to use the provided custom plugin:
  * Configure the microgateway yaml file from step 2 to include the "response-override" plugin:
  ```
  ...
  plugins:
      dir: ../plugins
      sequence:
        - oauth
        - response-override
  ...
  ```

* Edit the application manifest as follows:
  * Edit the following env values so that they correspond to your Apigee Edge Microgateway configuration:
    * If you are not using the "response-override" plugin:
    ```
    env:
        EDGEMICRO_CONFIG_DIR: /app/config
        EDGEMICRO_ENV: test
        EDGEMICRO_ORG: org
        #  EDGEMICRO_CUST_PLUGINS: plugins
    ```
    * If you are using the "response-override" plugin:
    ```
    env:
        EDGEMICRO_CONFIG_DIR: /app/config
        EDGEMICRO_ENV: test
        EDGEMICRO_ORG: org
        EDGEMICRO_CUST_PLUGINS: plugins
    ```

## Step 3 Bind the App:
  * Push the app:
  ```
  $ cf push --no-start
  ```
  * Look at the app url:
  ```
  $ cf apps
  ```
  And note the url under the `urls` section

  * Bind the app:
  ```
  $ cf bind-service sample coresident \
   -c '{"org":"myorg","env":"test",
    "user":"<apigee username>", "pass":"<apigee password>",
    "action":"proxy bind",
    "protocol":"http", "target_app_route":"sample.local.pcfdev.io",
    "edgemicro_key":"<edgemicro_key>", "edgemicro_secret":"<edgemicro_secret>",
     "target_app_port":"8081"}'
  ```
  or if you have the [Apigee SSO Cli](http://docs.apigee.com/api-services/content/using-oauth2-security-apigee-edge-management-api#howtogetoauth2tokens):
  ```
  $ get_token && cf bind-service sample coresident \
   -c '{"org":"myorg","env":"test",
    "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'", "action":"proxy bind",
    "protocol":"http", "target_app_route":"sample.local.pcfdev.io,
    "edgemicro_key":"<edgemicro_key>", "edgemicro_secret":"<edgemicro_secret>",
     "target_app_port":"8081"}'
  ```
  * Start the app:
  ```
  cf start sample
  ```
  * Log into Edge and note that the proxy has been created. Then follow the instructions [here](http://docs.apigee.com/microgateway/latest/setting-and-configuring-edge-microgateway#Part2) to create a product with your newly created proxy. You can now configure standard Apigee Edge policies on that proxy.

## Step 4 Test the App:

  * If you turned off authorization in the microgateway file. e.g:
    ```
    ...
    oauth:
    allowNoAuthorization: true
    allowInvalidAuthorization: true
    verify_api_key_url: 'https://myorg-test.apigee.net/edgemicro-auth/verifyApiKey'
    ...
    ```

    * If you did not use the plugin:
      ```
      $ curl sample.local.pcfdev.io
      {"hello":"hello from cf app"}
      ```

    * If you used the plugin:
      ```
      $ curl sample.local.pcfdev.io
      Hello, World!
      ```

  * If you did **not** turn off authorization in the microgateway file. e.g:
    ```
    ...
    oauth:
    allowNoAuthorization: false
    allowInvalidAuthorization: false
    verify_api_key_url: 'https://myorg-test.apigee.net/edgemicro-auth/verifyApiKey'
    ...
    ```
    * Get edgemicro token:
      ```
       $ edgemicro token get -o <org> -e <env> -i <product key> -s <product secret>
      ```

    * If you did not use the plugin:
      ```
      $ curl sample.local.pcfdev.io -H "Authorization: Bearer <token from previous step>"
      {"hello":"hello from cf app"}
      ```

    * If you used the plugin:
      ```
      $ curl sample.local.pcfdev.io -H "Authorization: Bearer <token from previous step>"
      Hello World!
      ```

## Step 5: Unbinding the service

  * The unbind command does not accept any parameters:
  ```
  $ cf unbind-service sample coresident
  ```
  * Uninstalling the service instance and broker
  ```
  $ cf delete-service coresident
  ```
