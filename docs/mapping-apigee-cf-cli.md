# Mapping for Apigee and Cloud Foundry integration commands

Apigee integration with Cloud Foundry provides command-line tools that are 
alternatives to tools from Cloud Foundry. This topic maps commands from the two 
sets so that you can choose which you prefer to use.

The CF CLI Apigee plugin commands are designed to simplify the app developer 
experience by reducing the command complexity, prompting you for argument values 
rather than requiring a config text file.

In particular, if you prefer to use the following commands when integrating 
Apigee with your Cloud Foundry app, see the tables below for alternative 
instructions. For more detail about using the Cloud Foundry commands, see the 
sections below.

**Creating/binding a proxy**

Plan | CF CLI Apigee Plugin Command | CF CLI Commands
--- | --- | ---
Org | cf apigee-bind-org | cf bind-route-service
Microgateway | cf apigee-bind-mg | cf bind-route-service
Microgateway-Coresident | cf apigee-bind-mgc | cf bind-service


**Unbinding a proxy**

Plan | CF CLI Apigee Plugin Command | CF CLI Commands
--- | --- | ---
Org | cf apigee-unbind-org | cf unbind-route-service
Microgateway | cf apigee-unbind-mg | cf unbind-route-service
Microgateway-Coresident | cf apigee-unbind-mgc | cf unbind-service

**Pushing an app**

Plan | CF CLI Apigee Plugin Command | CF CLI Commands
--- | --- | ---
Microgateway<br />Microgateway-Coresident | cf apigee-push | cf push

## Org Plan
### Creating and binding an API proxy

Documentation describes the cf apigee-bind-org  command to generate an API proxy 
on Apigee Edge and to bind the Cloud Foundry service to the proxy. This plan is 
for integrating an Apigee Edge public cloud org and a Cloud Foundry app.

For the Cloud Foundry alternative, use the cf bind-route-service command. 

The command this form (be sure to use quotes and command expansion, as shown 
here).

```
cf bind-route-service &lt;your-app-domain&gt; &lt;service-instance&gt; \
[--hostname &lt;hostname&gt;] \
-c '{"org":"&lt;your edge org&gt;","env":"&lt;your edge env&gt;", ["host":"&lt;your host domain&gt;"]
  "bearer":"'&lt;authentication-token-file&gt;'" | "basic":"&lt;encoded-username-password&gt;" 
  | "&lt;username&gt;:&lt;password&gt;", "action":"proxy"|"bind"|"proxy bind", 
   ["protocol":"http"|"https"]}'
```

Parameters for the -c argument specify connection details:

Parameter | Purpose | Allowed Values
--- | --- | ---
org | Apigee Edge organization hosting the API proxy to be called | Your organization (must be reachable via the authentication token specified in the bearer parameter)
env | Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
host | Optional. The host domain to which API calls are made. Specify a value only if your host domain is not the same as that given by your virtual host.  | Your host domain name if different from your virtual host domain. For example: mycompany.net:9000
bearer | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get\_token command. The broker does not store any data; it requires credentials and other parameters for each individual cf command. Instead of a bearer token, credentials can also be expressed as: basic: standard HTTP Base-64 encoded username and password for Authorization: Basic. Note that this is not encrypted and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)username and password in clear text
action | A value specifying whether to create or bind an API proxy | proxy to generate an API proxy; bind to bind the service with the proxy; proxy bind to generate the proxy and bind with a single command.
protocol | The protocol through which the proxy should be accessed by Cloud Foundry | http or https; default is https.

### Unbinding the route service

The unbind command does not accept any parameters

```
cf unbind-route-service local.pcfdev.io myapigee --hostname test-app
```

## Microgateway Plan
### Creating and binding an API proxy

Documentation describes using cf apigee-bind-mg to generate an API proxy on 
Apigee Edge and to bind the Cloud Foundry service to the proxy. This plan is for 
integrating Apigee Microgateway and a Cloud Foundry app in separate Cloud 
Foundry containers.

For the Cloud Foundry alternative, use the cf bind-route-service command. 

Use the bind-route-service command to generate an API proxy on Apigee Edge and 
to bind the Apigee Cloud Foundry service to the proxy. The command this form (be 
sure to use quotes and command expansion, as shown here):

```
cf bind-route-service &lt;your-app-domain&gt; &lt;service-instance&gt; \
[--hostname &lt;hostname&gt;] \
-c '{"org":"&lt;your edge org&gt;","env":"&lt;your edge env&gt;",
  "bearer":"'&lt;authentication-token-file&gt;'" | "basic":"&lt;encoded-username-password&gt;" | "&lt;username&gt;:&lt;password&gt;",
  "action":"proxy"|"bind"|"proxy bind",
  ["protocol":"http"|"https"]}'
```

Parameters for the -c argument specify connection details:

Parameter | Purpose | Allowed Values
--- | --- | ---
org | Apigee Edge organization hosting the API proxy to be called | Your organization (must be reachable via the authentication token specified in the bearer parameter)
env | Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
micro | Route of the application acting as Edge Microgateway. | The url to which cloud foundry forwards requests. This should be the url of the microgateway application you are using.
bearer | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get\_token command. The broker does not store any data; it requires credentials and other parameters for each individual cf command. Instead of a bearer token, credentials can also be expressed as: basic: standard HTTP Base-64 encoded username and password for Authorization: Basic. Note that this is not encrypted and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)username and password in clear text
action | A value specifying whether to create or bind an API proxy | proxy to generate an API proxy; bind to bind the service with the proxy; proxy bind to generate the proxy and bind with a single command.
protocol | The protocol through which the proxy should be accessed by Cloud Foundry | http or https; default is https.

### Unbinding the route service

The unbind command does not accept any parameters:

```
cf unbind-route-service local.pcfdev.io myapigee --hostname test-app
```

### Pushing a Cloud Foundry app

Documentation describes using cf apigee-push for a prompt to specify argument 
values.

For the Cloud Foundry alternative, use:

```
cf push
```

## Microgateway-Coresident Plan
### Creating and binding an API proxy

Documentation describes the cf apigee-bind-mgc command to generate an API proxy 
on Apigee Edge and to bind the Cloud Foundry service to the proxy. This plan is 
for integrating Apigee Microgateway and a Cloud Foundry app in the same Cloud 
Foundry container.

For the Cloud Foundry alternative, use the cf bind-service command. 

The command takes this form (be sure to use quotes and command expansion, as 
shown here). Note that with this command, you must pass a token to authenticate 
with Apigee Edge. See the documentation for more.

```
cf bind-service &lt;cf-app-name&gt; &lt;service name&gt; \
    -c '{"org":&lt;microgateway-org&gt;,"env":&lt;microgateway-env&gt;,
      "bearer":"'$(cat ~/.sso-cli/valid\_token.dat)'", 
      "action":"proxy bind", 
      "target\_app\_route":&lt;cf-app-url(i.e FQDN)&gt;, 
      "edgemicro\_key":&lt;microgateway-config-key&gt;, 
      "edgemicro\_secret":&lt;microgateway-config-secret&gt;, 
      "target\_app\_port":&lt;cf-app-port&gt;}'
```

Parameters for the -c argument specify connection details

Parameter | Purpose | Allowed Values
--- | --- | ---
action | A value specifying whether to create or bind an API proxy | proxy to generate an API proxy; bind to bind the service with the proxy; proxy bind to generate the proxy and bind with a single command.
bearer | Path to a file containing an authentication token valid for your organization | An authentication token, such as one generated with Apigee's get\_token command. The broker does not store any data; it requires credentials and other parameters for each individual cf command. Instead of a bearer token, credentials can also be expressed as:basic: standard HTTP Base-64 encoded username and password for Authorization: Basic. Note that this is not encrypted and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)username and password in clear text
edgemicro\_key | The key for your Apigee Edge Microgateway configuration (returned when you configured the Apigee Microgateway). | The configuration key.
edgemicro\_secret | The secret for your Apigee Edge Microgateway configuration (returned when you configured the Apigee Microgateway). | The configuration secret.
env | Apigee Edge environment to which the API proxy is (or will be) deployed | Your environment.
org | Apigee Edge organization hosting the API proxy to be called | Your organization (must be reachable via the authentication token specified in the bearer parameter).
target\_app\_port | Port for your Cloud Foundry app. This may not be 8080 nor the PORT environment variable. | The port number.
target\_app\_route | The URL for your Cloud Foundry app. | The app URL.

### Unbinding the service

The unbind command does not accept any parameters:

```
cf unbind-service test-app myapigee
```

### Pushing a Cloud Foundry app

Documentation describes using cf apigee-push for a prompt to specify argument 
values.

For the Cloud Foundry alternative, use:

```
cf push
```