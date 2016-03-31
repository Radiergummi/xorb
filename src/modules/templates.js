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
  
  var templatesModule = {};
  
  templatesModule.configure = function() {};
  
  // load the module
  app.loadModule('templates', templatesModule, function() {
  
    // mount all endpoints
    app.mountModuleEndpoint('templates', 'templates');
    app.mountModuleEndpoint('loadTemplate', 'templates', 'loadTemplate');
    app.mountModuleEndpoint('render', 'templates', 'render');
    app.mountModuleEndpoint('getPage', 'templates', 'getPage');
  });
})();
