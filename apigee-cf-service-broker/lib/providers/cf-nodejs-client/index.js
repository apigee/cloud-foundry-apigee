'use strict';

var used = [],
    exports = module.exports = {};

/**
 * Library Version
 * @type {String}
 */
exports.version = '0.13.0';

/**
 * Support for Apps
 * @type {[type]}
 */
var Apps = require('./model/cloudcontroller/Apps');
exports.Apps = Apps;

/**
 * Support for Buildpacks
 * @type {[type]}
 */
var BuildPacks = require('./model/cloudcontroller/BuildPacks');
exports.BuildPacks = BuildPacks;

/**
 * Support for Cloud Controller
 * @type {[type]}
 */
var CloudController = require('./model/cloudcontroller/CloudController');
exports.CloudController = CloudController;


/**
 * Support for Domains
 * @type {[type]}
 */
var Domains = require('./model/cloudcontroller/Domains');
exports.Domains = Domains;

/**
 * Support for Events
 * @type {[type]}
 */
var Events = require('./model/cloudcontroller/Events');
exports.Events = Events;

/**
 * Support for Jobs
 * @type {[type]}
 */
var Jobs = require('./model/cloudcontroller/Jobs');
exports.Jobs = Jobs;

/**
 * Support for Logs
 * @type {[type]}
 */
var Logs = require('./model/metrics/Logs');
exports.Logs = Logs;

/**
 * Support for Organizations
 * @type {[type]}
 */
var Organizations = require('./model/cloudcontroller/Organizations');
exports.Organizations = Organizations;

/**
 * Support for Organizations Quota
 * @type {[type]}
 */
var OrganizationsQuota = require('./model/cloudcontroller/OrganizationsQuota');
exports.OrganizationsQuota = OrganizationsQuota;

/**
 * Support for Routes
 * @type {[type]}
 */
var Routes = require('./model/cloudcontroller/Routes');
exports.Routes = Routes;

/**
 * Support for Services
 * @type {[type]}
 */
var Services = require('./model/cloudcontroller/Services');
exports.Services = Services;

/**
 * Support for ServiceBindings
 * @type {[type]}
 */
var ServiceBindings = require('./model/cloudcontroller/ServiceBindings');
exports.ServiceBindings = ServiceBindings;

/**
 * Support for ServiceInstances
 * @type {[type]}
 */
var ServiceInstances = require('./model/cloudcontroller/ServiceInstances');
exports.ServiceInstances = ServiceInstances;

/**
 * Support for ServicePlans
 * @type {[type]}
 */
var ServicePlans = require('./model/cloudcontroller/ServicePlans');
exports.ServicePlans = ServicePlans;

/**
 * Support for Spaces
 * @type {[type]}
 */
var Spaces = require('./model/cloudcontroller/Spaces');
exports.Spaces = Spaces;

/**
 * Support for Spaces Quota
 * @type {[type]}
 */
var SpacesQuota = require('./model/cloudcontroller/SpacesQuota');
exports.SpacesQuota = SpacesQuota;

/**
 * Support for Stacks
 * @type {[type]}
 */
var Stacks = require('./model/cloudcontroller/Stacks');
exports.Stacks = Stacks;

/**
 * Support for User Provided Services
 * @type {[type]}
 */
var UserProvidedServices = require('./model/cloudcontroller/UserProvidedServices');
exports.UserProvidedServices = UserProvidedServices;

/**
 * Support for Users
 * @type {[type]}
 */
var Users = require('./model/cloudcontroller/Users');
exports.Users = Users;

/**
 * Support for Users UAA
 * @type {[type]}
 */
var UsersUAA = require('./model/uaa/UsersUAA');
exports.UsersUAA = UsersUAA;

/**
 * Support for Network policies
 * @type {[type]}
 */
var Networking = require('./model/cloudcontroller/Networking');
exports.Networking = Networking;
