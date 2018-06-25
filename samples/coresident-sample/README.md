# Sample App for Apigee-Pivotal Integration with "microgateway-coresident" plan

These instructions install a sample app that is accessible via the "microgateway-coresident" plan.

These instructions assume the Service Broker is already installed. You can check this by running `cf marketplace` and checking to make sure that `apigee-edge` is an offering.

Throughout these instructions you will see `org = myorg` and `env = test` as well as a domain of `local.pcfdev.io`. Be sure to change these values as necessary to match your configurations.

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
$ mkdir .../cloud-foundry-apigee/samples/coresident-sample/config
$ cp ~/.edgemicro/myorg-test-config.yaml .../cloud-foundry-apigee/samples/coresident-sample/config
```
* If you want to use the provided custom plugin with ouath, you can follow one of two steps:
  1. Edit the application manifest to include the `APIGEE_MICROGATEWAY_CUSTOM` environment variable:
      ```yaml
      env:
        ...
        APIGEE_MICROGATEWAY_PLUGINS: plugins
        APIGEE_MICROGATEWAY_CUSTOM: |
                                    {"policies":
                                      {
                                      "oauth":
                                        {
                                          "allowNoAuthorization": false,
                                          "allowInvalidAuthorization": false,
                                          "verify_api_key_url": "https://myorg-test.apigee.net/edgemicro-auth/verifyApiKey"
                                        }
                                      },
                                    "sequence": ["oauth", "response-override"]
                                    }
      ```
  1. Configure the microgateway yaml file from step 2 to include the "response-override" plugin:
      ```yaml
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
    * If you are **not** using the "response-override" plugin:
    ```yaml
    env:
        # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        # APIGEE_MICROGATEWAY_CUST_PLUGINS: plugins
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        # APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * If you are using the "response-override" plugin:
    ```yaml
    env:
         # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        APIGEE_MICROGATEWAY_CUST_PLUGINS: plugins
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        #  APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * If you are including the Node.js tar in the `lib` directory:
    ```yaml
    env:
         # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        APIGEE_MICROGATEWAY_NODEJS_FILENAME: node-v6.11.3-linux-x64.tar.gz
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        #  APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * If you want to use a Node.js tar from a location accessible via http or https other than https://nodejs.org:
    ```yaml
    env:
         # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        APIGEE_MICROGATEWAY_NODEJS_URL: https://mycustomdomain.com/mynoderoot/versions/node-v6.11.3-linux-x64.tar.gz
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        #  APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * If you want to select a specific Node.js version from https://nodejs.org:
    ```yaml
    env:
         # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        APIGEE_MICROGATEWAY_NODEJS_VERSION: 6.11.3
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        #  APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * If you want to use the default Node.js version of 8.11.3 from https://nodejs.org:
    ```yaml
    env:
         # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        #  APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * If you don't include `APIGEE_MICROGATEWAY_VERSION`, then it will use the most current version in the repository.
    * If you want to use specific version of Edge Microgateway, then include this environment variable.  This will execute a git clone on the https://github.com/apigee-internal/microgateway repository.
    ```yaml
    env:
        # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_VERSION: 2.5.19
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        # APIGEE_MICROGATEWAY_NODEJS_LOCAL_INSTALL: false
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        #  APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```
    * If you want to use specific version of Edge Microgateway and install locally then clone the repository into the `lib` directory in the `microgateway_decorator` folder.  In this case, the decorator will use the locally cloned repository instead of cloning from github.com.
    ```yaml
    env:
        # APIGEE_MICROGATEWAY_PROXY: edgemicro_cf-test.local.pcfdev.io
        APIGEE_MICROGATEWAY_VERSION: 2.5.19
        APIGEE_MICROGATEWAY_CONFIG_DIR: config
        # APIGEE_MICROGATEWAY_NODEJS_LOCAL_INSTALL: false
        # APIGEE_MICROGATEWAY_PROCESSES: 2
        #  APIGEE_MICROGATEWAY_CUSTOM: | {...} --> uncomment if applicable
    ```


## Step 3: Install the Plugin:

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


## Step 4 Bind the App:
  . Push the Cloud Foundry app to your Cloud Foundry container.

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

Now, you bind a Cloud Foundry app to the Apigee service instance you
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
  * Log into Edge and note that the proxy has been created. Then follow the instructions [here](http://docs.apigee.com/microgateway/latest/setting-and-configuring-edge-microgateway#Part2) to create a product with your newly created proxy. You can now configure standard Apigee Edge policies on that proxy.

## Step 4 Test the App:

  * If you turned off authorization. e.g:
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

  * If you did **not** turn off authorization. e.g:
    ```
    ...
    oauth:
    allowNoAuthorization: false
    allowInvalidAuthorization: false
    verify_api_key_url: 'https://myorg-test.apigee.net/edgemicro-auth/verifyApiKey'
    ...
    ```
    * Get an edgemicro token:
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
