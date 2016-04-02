'use strict';

/*
 global window,
 document,
 app
*/

(function() {
  if (! app) {
    return console.error('[modules/templates] app.js has not been loaded yet');
  }
  
  var templatesModule = {
    // the options storage
    options: {},

    // the template cache
    cache: {},

    templateLibrary: null
  };

  var defaultOptions = {
    templateUrl: '/templates/',
    renderMethod: 'render',
    renderSyncMethod: 'renderSync'
  };

  /**
   * define configuration for the templates module
   *
   * @param options
   */
  templatesModule.configure = function(options) {
  };


  templatesModule.render = function(template, variables, callback) {
    this.templateLibrary[this.options.renderMethod](template, variables, function(error, content) {
      if (error) {
        return callback(error);
      }

      return callback(null, content);
    });
  };


  templatesModule.renderSync = function(template, variables) {
    return this.templateLibrary[this.options.renderSyncMethod](template, variables);
  };


  templatesModule.getPage = function() {

  };

  
  // load the module
  app.loadModule('templates', templatesModule, function() {
  
    /* mount all endpoints
    app.mountModuleEndpoint('templates', 'templates');
    app.mountModuleEndpoint('loadTemplate', 'templates', 'loadTemplate');
    app.mountModuleEndpoint('render', 'templates', 'render');
    app.mountModuleEndpoint('getPage', 'templates', 'getPage');

    */
  });
})();
