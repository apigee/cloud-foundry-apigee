'use strict';
var debug = require('debug')

module.exports.init = function(config, logger, stats) {

  return {
   
    ondata_response: function(req, res, data, next) {
      debug('***** plugin ondata_response');
      next(null, null);
    },
    
    onend_response: function(req, res, data, next) {
      debug('***** plugin onend_response');
      next(null, "Hello, World!\n\n");
    }
  };
}