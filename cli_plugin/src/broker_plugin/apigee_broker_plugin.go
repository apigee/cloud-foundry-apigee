/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package main

import (
	"bufio"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"syscall"

	"code.cloudfoundry.org/cli/plugin"
	"golang.org/x/crypto/ssh/terminal"
)

// ApigeeBrokerPlugin is the struct implementing the interface defined by the core CLI
type ApigeeBrokerPlugin struct{}

// UserInput is used to keep track of flag values and properties
type UserInput struct {
	value         *string
	requiredInput bool
	hiddenInput   bool
}

/* Cloud Foundry Required Methods */

func main() {
	plugin.Start(new(ApigeeBrokerPlugin))
}

//GetMetadata is required by the CLI struct and returns command information such that the
//cf cli can relate information back to the user
func (c *ApigeeBrokerPlugin) GetMetadata() plugin.PluginMetadata {
	return plugin.PluginMetadata{
		Name: "Apigee-Broker-Plugin",
		Version: plugin.VersionType{
			Major: 0,
			Minor: 1,
			Build: 1,
		},
		Commands: []plugin.Command{
			{
				Name:     "apigee-bind-mgc",
				Alias:    "abc",
				HelpText: "Binds and starts up an application with the microgateway-coresident plan",
				UsageDetails: plugin.Usage{
					Usage: "cf apigee-bind-mgc --app APP_NAME --service SERVICE_INSTANCE --apigee_org APIGEE_ORGANIZATION\n   --apigee_env APIGEE_ENVIRONMENT --edgemicro_key EDGEMICRO_KEY --edgemicro_secret EDGEMICRO_SECRET\n   --target_app_route TARGET_APP_ROUTE --target_app_port TARGET_APP_PORT --action ACTION\n   (--user APIGEE_USERNAME --pass APIGEE_PASSWORD | --bearer APIGEE_BEARER_TOKEN)",
					Options: map[string]string{
						"-app":              "Name of application to bind to [required]",
						"-service":          "Service instance name to bind to [required]",
						"-apigee_org":       "Apigee organization [required]",
						"-apigee_env":       "Apigee environment [required]",
						"-edgemicro_key":    "Microgateway key [required]",
						"-edgemicro_secret": "Microgateway secret [required]",
						"-target_app_route": "Target application route [required]",
						"-target_app_port":  "Target application port [required]",
						"-action":           "Action to take (\"bind\", \"proxy bind\", or \"proxy\") [required]",
						"-user":             "Apigee user name",
						"-pass":             "Apigee password",
						"-bearer":           "Apigee bearer token",
					},
				},
			},
			{
				Name:     "apigee-bind-mg",
				Alias:    "abm",
				HelpText: "Binds an application with the microgateway plan",
				UsageDetails: plugin.Usage{
					Usage: "cf apigee-bind-mg --app APP_NAME --service SERVICE_INSTANCE\n   --apigee_org APIGEE_ORGANIZATION --apigee_env APIGEE_ENVIRONMENT \n   --micro MICROGATEWAY_APP_ROUTE --domain APP_DOMAIN --action ACTION [--protocol TARGET_APP_PROTOCOL]\n   (--user APIGEE_USERNAME --pass APIGEE_PASSWORD | --bearer APIGEE_BEARER_TOKEN)",
					Options: map[string]string{
						"-app":        "Hostname of application to bind to [required]",
						"-service":    "Service instance name to bind to [required]",
						"-apigee_org": "Apigee organization [required]",
						"-apigee_env": "Apigee environment [required]",
						"-action":     "Action to take (\"bind\", \"proxy bind\", or \"proxy\") [required]",
						"-protocol":   "Target application protocol [optional]",
						"-micro":      "Route of application acting as microgateway [required]",
						"-user":       "Apigee user name",
						"-pass":       "Apigee password",
						"-bearer":     "Apigee bearer token",
						"-domain":     "Domain of application to bind to [required]",
					},
				},
			},
			{
				Name:     "apigee-bind-org",
				Alias:    "abo",
				HelpText: "Binds an application with the org plan",
				UsageDetails: plugin.Usage{
					Usage: "cf apigee-bind-org --app APP_NAME --service SERVICE_INSTANCE\n   --apigee_org APIGEE_ORGANIZATION --apigee_env APIGEE_ENVIRONMENT\n   --domain APP_DOMAIN --action ACTION [--protocol TARGET_APP_PROTOCOL]\n   (--user APIGEE_USERNAME --pass APIGEE_PASSWORD | --bearer APIGEE_BEARER_TOKEN)",
					Options: map[string]string{
						"-app":        "Hostname of application to bind to [required]",
						"-service":    "Service instance name to bind to [required]",
						"-apigee_org": "Apigee organization [required]",
						"-apigee_env": "Apigee environment [required]",
						"-action":     "Action to take (\"bind\", \"proxy bind\", or \"proxy\") [required]",
						"-protocol":   "Target application protocol [optional]",
						"-user":       "Apigee user name",
						"-pass":       "Apigee password",
						"-bearer":     "Apigee bearer token",
						"-domain":     "Domain of application to bind to [required]",
						"-host":       "The host domain to which API calls are made. Specify a value only if your Apigee proxy domain is not the same as that given by your virtual host [optional]",
					},
				},
			},
			{
				Name:     "apigee-unbind-mgc",
				Alias:    "auc",
				HelpText: "Unbinds an application from the microgateway-coresident plan",
				UsageDetails: plugin.Usage{
					Usage: "cf apigee-unbind-mgc --app APP_NAME --service SERVICE_INSTANCE",
					Options: map[string]string{
						"-app":     "Hostname of application to unbind from [required]",
						"-service": "Service instance name to bind to [required]",
					},
				},
			},
			{
				Name:     "apigee-unbind-org",
				Alias:    "auo",
				HelpText: "Unbinds an application from the org plan",
				UsageDetails: plugin.Usage{
					Usage: "cf apigee-unbind-org --app APP_NAME --domain DOMAIN --service SERVICE_INSTANCE",
					Options: map[string]string{
						"-app":     "Hostname of application to unbind from [required]",
						"-service": "Service instance name to bind to [required]",
						"-domain":  "Domain of application to unbind from [required]",
					},
				},
			},
			{
				Name:     "apigee-unbind-mg",
				Alias:    "aum",
				HelpText: "Unbinds an application from the microgateway plan",
				UsageDetails: plugin.Usage{
					Usage: "cf apigee-unbind-mg --app APP_NAME --domain DOMAIN --service SERVICE_INSTANCE",
					Options: map[string]string{
						"-app":     "Name of application to unbind from [required]",
						"-service": "Service instance name to bind to [required]",
						"-domain":  "Domain of application to unbind from [required]",
					},
				},
			},
			{
				Name:     "apigee-push",
				Alias:    "ap",
				HelpText: "To push an application meant to be used with the microgateway-coresident plan. This will be pushed with as \"--no-start\" application. To obtain more information use --help",
				UsageDetails: plugin.Usage{
					Usage: "cf apigee-push [--app APP_NAME] [--archive ARCHIVE] [--config CONFIG_DIR] [--plugins PLUGINS-DIR]",
					Options: map[string]string{
						"-config":  "Path to configuration directory that contains a microgateway yaml [required]",
						"-plugins": "Path to configuration directory that contains custom plugins [optional]",
						"-archive": "For a Java application, this is the path to a Java application's archive",
						"-app":     "Name of application that will be pushed [optional]",
					},
				},
			},
		},
	}
}

// Run is the entry point when the core CLI is invoking a command defined
// by a plugin.
func (c *ApigeeBrokerPlugin) Run(cliConnection plugin.CliConnection, args []string) {
	switch args[0] {
	case "apigee-bind-mgc":
		c.ApigeeBindServiceCommand(cliConnection, args)
	case "apigee-bind-mg":
		c.ApigeeBindRouteCommand(cliConnection, args, true)
	case "apigee-bind-org":
		c.ApigeeBindRouteCommand(cliConnection, args, false)
	case "apigee-push":
		c.ApigeePushCommand(cliConnection, args)
	case "apigee-unbind-org":
		c.ApigeeUnbindCommand(cliConnection, args, true)
	case "apigee-unbind-mg":
		c.ApigeeUnbindCommand(cliConnection, args, true)
	case "apigee-unbind-mgc":
		c.ApigeeUnbindCommand(cliConnection, args, false)
	}
}

//ApigeeBindRouteCommand is responsible for binding an app to either the org or microgateway plans
func (c *ApigeeBrokerPlugin) ApigeeBindRouteCommand(cliConnection plugin.CliConnection, args []string, isMicroPlan bool) {
	flags := flag.NewFlagSet("apigee-route-bind", flag.ExitOnError)
	generalConfig := map[string]UserInput{
		"service": UserInput{
			value:         flags.String("service", "", "Service instance name to bind to [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"apigee_org": UserInput{
			value:         flags.String("apigee_org", "", "Apigee organization [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"apigee_env": UserInput{
			value:         flags.String("apigee_env", "", "Apigee environment [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"protocol": UserInput{
			value:         flags.String("protocol", "", "Target application protocol [optional]: "),
			requiredInput: false,
			hiddenInput:   false,
		},
		"action": UserInput{
			value:         flags.String("action", "", "Action to take (\"bind\", \"proxy bind\", or \"proxy\") [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"domain": UserInput{
			value:         flags.String("domain", "", "Domain of application to bind to [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"app": UserInput{
			value:         flags.String("app", "", "Application to bind to [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
	}

	if isMicroPlan {
		generalConfig["micro"] = UserInput{
			value:         flags.String("micro", "", "Route of application acting as microgateway [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		}
	} else {
		generalConfig["host"] = UserInput{
			value:         flags.String("host", "", "The host domain to which API calls are made. Specify a value only if your Apigee proxy domain is not the same as that given by your virtual host [optional]: "),
			requiredInput: false,
			hiddenInput:   false,
		}
	}
	authConfig := map[string]UserInput{
		"bearer": UserInput{
			value:         flags.String("bearer", "", "Apigee authentication token: "),
			requiredInput: false,
			hiddenInput:   true,
		},
		"pass": UserInput{
			value:         flags.String("pass", "", "Apigee password: "),
			requiredInput: true,
			hiddenInput:   true,
		},
		"user": UserInput{
			value:         flags.String("user", "", "Apigee username: "),
			requiredInput: true,
			hiddenInput:   true,
		},
	}

	// Parse from [1] since [0] is command name
	err := flags.Parse(args[1:])
	if err != nil {
		fmt.Println("Error: Couldn't parse arguments: ", err)
		os.Exit(1)
	}

	// Check to make sure there are no extra arguments
	if flags.NArg() > 0 {
		fmt.Println("Error: Unknown extra arguments")
		os.Exit(1)
	}

	//Get consistent argument ordering for user prompt (based on lexigraphical order)
	generalKeyOrdering := make([]string, 0)
	visitor := func(f *flag.Flag) {
		if _, ok := authConfig[f.Name]; !ok {
			generalKeyOrdering = append(generalKeyOrdering, f.Name)
		}
	}
	flags.VisitAll(visitor)

	err = c.ValidateAuth(authConfig, flags)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	err = c.ValidateGeneral(generalConfig, generalKeyOrdering, flags)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	jsonString := fmt.Sprintf(`{"org":"%s", "env":"%s", "action":"%s", "protocol":"%s"`,
		*generalConfig["apigee_org"].value,
		*generalConfig["apigee_env"].value,
		*generalConfig["action"].value,
		*generalConfig["protocol"].value,
	)

	if isMicroPlan {
		jsonString = fmt.Sprintf(`%s, "micro":"%s"`, jsonString, *generalConfig["micro"].value)
	} else if *generalConfig["host"].value != "" {
		jsonString = fmt.Sprintf(`%s, "host":"%s"`, jsonString, *generalConfig["host"].value)
	}

	if *authConfig["bearer"].value != "" {
		jsonString = fmt.Sprintf(`%s, "bearer":"%s"}`, jsonString, *authConfig["bearer"].value)
	} else {
		jsonString = fmt.Sprintf(`%s, "user":"%s", "pass":"%s"}`, jsonString, *authConfig["user"].value, *authConfig["pass"].value)
	}

	commandArgs := []string{"bind-route-service", *generalConfig["domain"].value, *generalConfig["service"].value, "--hostname", *generalConfig["app"].value, "-c", jsonString}
	_, err = cliConnection.CliCommand(commandArgs...)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

}

//ApigeeBindServiceCommand is responsible for binding an app to a service instance of the coresident plan
func (c *ApigeeBrokerPlugin) ApigeeBindServiceCommand(cliConnection plugin.CliConnection, args []string) {
	flags := flag.NewFlagSet("apigee-bind", flag.ExitOnError)
	generalConfig := map[string]UserInput{
		"service": UserInput{
			value:         flags.String("service", "", "Service instance name to bind to [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"apigee_org": UserInput{
			value:         flags.String("apigee_org", "", "Apigee organization [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"apigee_env": UserInput{
			value:         flags.String("apigee_env", "", "Apigee environment [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"edgemicro_key": UserInput{
			value:         flags.String("edgemicro_key", "", "Microgateway key [required]: "),
			requiredInput: true,
			hiddenInput:   true,
		},
		"edgemicro_secret": UserInput{
			value:         flags.String("edgemicro_secret", "", "Microgateway secret [required]: "),
			requiredInput: true,
			hiddenInput:   true,
		},
		"target_app_route": UserInput{
			value:         flags.String("target_app_route", "", "Target application route [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"target_app_port": UserInput{
			value:         flags.String("target_app_port", "", "Target application port [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"action": UserInput{
			value:         flags.String("action", "", "Action to take (\"bind\", \"proxy bind\", or \"proxy\") [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"app": UserInput{
			value:         flags.String("app", "", "Application to bind to [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
	}

	authConfig := map[string]UserInput{
		"bearer": UserInput{
			value:         flags.String("bearer", "", "Apigee authentication token: "),
			requiredInput: false,
			hiddenInput:   true,
		},
		"pass": UserInput{
			value:         flags.String("pass", "", "Apigee password: "),
			requiredInput: true,
			hiddenInput:   true,
		},
		"user": UserInput{
			value:         flags.String("user", "", "Apigee username: "),
			requiredInput: true,
			hiddenInput:   true,
		},
	}

	//Parse from [1] since [0] is command name
	err := flags.Parse(args[1:])
	if err != nil {
		fmt.Println("Error: Couldn't parse arguments: ", err)
		os.Exit(1)
	}

	// Check to make sure there are no extra arguments
	if flags.NArg() > 0 {
		fmt.Println("Error: Unknown extra arguments")
		os.Exit(1)
	}

	// Get consistent argument ordering for user prompt (based on lexigraphical order)
	generalKeyOrdering := make([]string, 0)
	visitor := func(f *flag.Flag) {
		if _, ok := authConfig[f.Name]; !ok {
			generalKeyOrdering = append(generalKeyOrdering, f.Name)
		}
	}
	flags.VisitAll(visitor)

	err = c.ValidateAuth(authConfig, flags)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	err = c.ValidateGeneral(generalConfig, generalKeyOrdering, flags)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	jsonString := fmt.Sprintf(`{"org":"%s", "env":"%s", "action":"%s", "target_app_route":"%s", "target_app_port":"%s", "edgemicro_key":"%s", "edgemicro_secret":"%s"`,
		*generalConfig["apigee_org"].value,
		*generalConfig["apigee_env"].value,
		*generalConfig["action"].value,
		*generalConfig["target_app_route"].value,
		*generalConfig["target_app_port"].value,
		*generalConfig["edgemicro_key"].value,
		*generalConfig["edgemicro_secret"].value,
	)

	if *authConfig["bearer"].value != "" {
		jsonString = fmt.Sprintf(`%s, "bearer":"%s"}`, jsonString, *authConfig["bearer"].value)
	} else {
		jsonString = fmt.Sprintf(`%s, "user":"%s", "pass":"%s"}`, jsonString, *authConfig["user"].value, *authConfig["pass"].value)
	}

	commandArgs := []string{"bind-service", *generalConfig["app"].value, *generalConfig["service"].value, "-c", jsonString}
	_, err = cliConnection.CliCommand(commandArgs...)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	reader := bufio.NewReader(os.Stdin)
	var start string
	fmt.Print("Would you like to start your application now? [y/n] ")
	tmp, _ := reader.ReadString('\n')
	start = strings.TrimSpace(tmp)
	if strings.ToLower(start) == "yes" || strings.ToLower(start) == "y" {
		_, err = cliConnection.CliCommand("start", *generalConfig["app"].value)
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
	}

}

//ApigeeUnbindCommand is responsible for unbinding an application from an apigee plan based service broker
func (c *ApigeeBrokerPlugin) ApigeeUnbindCommand(cliConnection plugin.CliConnection, args []string, isRoutePlan bool) {
	flags := flag.NewFlagSet("apigee-route-bind", flag.ExitOnError)
	generalConfig := map[string]UserInput{
		"service": UserInput{
			value:         flags.String("service", "", "Service instance name to unbind from [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
		"app": UserInput{
			value:         flags.String("app", "", "Name of application to unbind from [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		},
	}

	if isRoutePlan {
		generalConfig["domain"] = UserInput{
			value:         flags.String("domain", "", "Domain of application to unbind from [required]: "),
			requiredInput: true,
			hiddenInput:   false,
		}
	}

	// Parse from [1] since [0] is command name
	err := flags.Parse(args[1:])
	if err != nil {
		fmt.Println("Error: Couldn't parse arguments: ", err)
		os.Exit(1)
	}

	// Check to make sure there are no extra arguments
	if flags.NArg() > 0 {
		fmt.Println("Error: Unknown extra arguments")
		os.Exit(1)
	}

	//Get consistent argument ordering for user prompt (based on lexigraphical order)
	generalKeyOrdering := make([]string, 0)
	visitor := func(f *flag.Flag) {
		generalKeyOrdering = append(generalKeyOrdering, f.Name)
	}
	flags.VisitAll(visitor)

	err = c.ValidateGeneral(generalConfig, generalKeyOrdering, flags)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	commandArgs := make([]string, 0)
	if isRoutePlan {
		commandArgs = append(commandArgs, "unbind-route-service", *generalConfig["domain"].value, *generalConfig["service"].value, "--hostname", *generalConfig["app"].value)
	} else {
		commandArgs = append(commandArgs, "unbind-service", *generalConfig["app"].value, *generalConfig["service"].value)
	}
	_, err = cliConnection.CliCommand(commandArgs...)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

}

//ApigeePushCommand is responsible for pushing an application to cloud foundry. This is especially important for java developers
//as it allows for adding the necessary plugin and config directories to their archive
func (c *ApigeeBrokerPlugin) ApigeePushCommand(cliConnection plugin.CliConnection, args []string) {
	reader := bufio.NewReader(os.Stdin)
	flags := flag.NewFlagSet("apigee-push", flag.ExitOnError)
	config := flags.String("config", "", "Path to configuration directory that contains a microgateway yaml [required]: ")
	plugins := flags.String("plugins", "", "Path to configuration directory that contains custom plugins [optional]: ")
	archive := flags.String("archive", "", "If you are pushing a java application, enter the path to the archive. Otherwise press [Enter]: ")
	app := flags.String("app", "", "Specific name of application to push [optional]: ")

	// Parse from [1] since [0] is command name
	err := flags.Parse(args[1:])
	if err != nil {
		fmt.Println("Error: Couldn't parse arguments: ", err)
		os.Exit(1)
	}

	// Check to make sure there are no extra arguments
	if flags.NArg() > 0 {
		fmt.Println("Error: Unknown extra arguments")
		os.Exit(1)
	}

	var coresResponse string
	pushNoStart := false
	fmt.Print("Do you plan on using this application with the \"microgateway-coresident\" plan? [y/n] ")
	tmp, _ := reader.ReadString('\n')
	coresResponse = strings.ToLower(strings.TrimSpace(tmp))

	// Only give option for archive changes if coresident is the planned course of action
	if coresResponse == "y" || coresResponse == "yes" {
		pushNoStart = true
		if *archive == "" {
			fmt.Print(flags.Lookup("archive").Usage)
			tmp, _ = reader.ReadString('\n')
			*archive = strings.TrimSpace(tmp)
		}
		if *archive != "" {
			if *config == "" {
				fmt.Print(flags.Lookup("config").Usage)
				tmp, _ = reader.ReadString('\n')
				*config = strings.TrimSpace(tmp)
				err = c.CheckEmpty("config", *config)
				if err != nil {
					fmt.Println(err)
					os.Exit(1)
				}
			}
			if *plugins == "" {
				fmt.Print(flags.Lookup("plugins").Usage)
				tmp, _ = reader.ReadString('\n')
				*plugins = strings.TrimSpace(tmp)
			}

			tempDir, err := ioutil.TempDir("", "tmp_archive")
			if err != nil {
				fmt.Println("Error making temp directory: ", err)
				os.Exit(1)
			}
			defer os.RemoveAll(tempDir) // clean up

			err = Extract(tempDir, *archive, *config, *plugins)
			if err != nil {
				fmt.Println(err)
				os.Exit(1)
			}
			destination := filepath.Join(filepath.Dir(*archive), "apigee_"+filepath.Base(*archive))
			*archive, err = Compress(tempDir, destination)
			if err != nil {
				fmt.Println(err)
				os.Exit(1)
			}
		}
	}

	if *app == "" {
		fmt.Print(flags.Lookup("app").Usage)
		tmp, _ = reader.ReadString('\n')
		*app = strings.TrimSpace(tmp)
	}

	commandArgs := make([]string, 1)
	commandArgs[0] = "push"
	if *app != "" {
		commandArgs = append(commandArgs, *app)
	}
	if *archive != "" {
		commandArgs = append(commandArgs, "-p", *archive)
	}
	if pushNoStart {
		commandArgs = append(commandArgs, "--no-start")
	}

	_, err = cliConnection.CliCommand(commandArgs...)

	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

/*Helpers*/

//CheckEmpty checks if a variable is empty and returns an error if so
func (c *ApigeeBrokerPlugin) CheckEmpty(name string, flagValue string) error {
	if flagValue == "" {
		errorMsg := fmt.Sprintf("Did not set the required value for \"%s\". Exiting", name)
		return errors.New(errorMsg)
	}
	return nil
}

//ValidateGeneral prompts the user for information regarding any missing flag values
func (c *ApigeeBrokerPlugin) ValidateGeneral(generalConfig map[string]UserInput, generalKeyOrdering []string, flags *flag.FlagSet) error {
	reader := bufio.NewReader(os.Stdin)
	for _, key := range generalKeyOrdering {
		input := generalConfig[key]
		if *input.value == "" {
			var flagValue string
			if input.hiddenInput {
				fmt.Print(flags.Lookup(key).Usage)
				tmp, err := terminal.ReadPassword(int(syscall.Stdin))
				if err != nil {
					errorMsg := fmt.Sprintf("Error reading in hidden value: %s" + err.Error())
					return errors.New(errorMsg)
				}
				flagValue = string(tmp)
				// Print new line after receiving hidden input
				fmt.Println()
			} else {
				fmt.Print(flags.Lookup(key).Usage)
				flagValue, _ = reader.ReadString('\n')
				flagValue = strings.TrimSpace(flagValue)
			}
			if input.requiredInput {
				err := c.CheckEmpty(key, flagValue)
				if err != nil {
					return err
				}
			}
			*generalConfig[key].value = flagValue
		}
	}
	return nil

}

//ValidateAuth promts the user for necessary authentication values if they have not been provided
func (c *ApigeeBrokerPlugin) ValidateAuth(authConfig map[string]UserInput, flags *flag.FlagSet) error {
	reader := bufio.NewReader(os.Stdin)
	// Check for user an pass first before asking for bearer
	if *authConfig["user"].value == "" || *authConfig["pass"].value == "" {
		if *authConfig["bearer"].value == "" {
			// Due to terminal input buffer size limitations, we can't take in a large token via prompt
			// If user wishes to use bearer, they must provide it in the command itself
			var bearerResponse string
			fmt.Print("Are you using a bearer token to authenticate with Apigee Edge? [y/n] ")
			tmp, _ := reader.ReadString('\n')
			bearerResponse = strings.ToLower(strings.TrimSpace(tmp))
			if bearerResponse == "y" || bearerResponse == "yes" {
				fmt.Print("Note: Authenticating by bearer token requires passing the token through the [--bearer APIGEE_BEARER_TOKEN] option.\nDo you wish exit this prompt and continue authenticating via bearer token? [y/n] ")
				tmp, _ = reader.ReadString('\n')
				bearerResponse = strings.ToLower(strings.TrimSpace(tmp))
				if bearerResponse == "y" || bearerResponse == "yes" {
					errorMsg := "Autenticating through bearer token. Please provide the bearer token via the [--bearer APIGEE_BEARER_TOKEN] option when running this command again."
					return errors.New(errorMsg)
				}
			}
			if bearerResponse == "n" || bearerResponse == "no" {
				fmt.Println("Bearer authentication not selected, authenticating with username and password")
				if *authConfig["user"].value == "" {
					fmt.Print(flags.Lookup("user").Usage)
					tmp, _ := reader.ReadString('\n')
					*authConfig["user"].value = strings.ToLower(strings.TrimSpace(tmp))
					err := c.CheckEmpty("user", *authConfig["user"].value)
					if err != nil {
						return err
					}
				}
				if *authConfig["pass"].value == "" {
					fmt.Print(flags.Lookup("pass").Usage)
					tmp, err := terminal.ReadPassword(int(syscall.Stdin))
					if err != nil {
						errorMsg := fmt.Sprintf("Error reading password: %s", err.Error())
						return errors.New(errorMsg)
					}
					*authConfig["pass"].value = string(tmp)
					err = c.CheckEmpty("pass", *authConfig["pass"].value)
					if err != nil {
						return err
					}
					// Print new line after receiving hidden input
					fmt.Println()
				}
			} else {
				errorMsg := fmt.Sprintf("Option configuration cancelled. Exiting")
				return errors.New(errorMsg)
			}
		}
	}
	return nil
}
