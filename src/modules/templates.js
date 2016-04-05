'use strict';

/*
 global window,
 document,
 app
 */

(function() {
  if (!app) {
    return console.error('[modules/templates] app.js has not been loaded yet');
  }

  var templatesModule = {
    // the options storage
    options: {
      templateUrl:    '/xorb/test/templates/',
      templateEngine: 'mustache'
    },

    // the template cache
    cache: {},

    templateEngine: null,
    renderMethod: null
  };

  switch (templatesModule.options.templateEngine) {
    case 'mustache':
      app.http.getScript('/src/lib/mustache.js', function(error) {
        if (error) {
          return console.error('[modules/templates] Mustache.js could not be fetched.');
        }

        templatesModule.templateEngine = window.Mustache;
        templatesModule.renderMethod = function(engine, template, variables) {
          return engine.render(template, variables);
        };
      });
      break;

    case 'handlebars':
      app.http.getScript('/src/lib/handlebars.js', function(error) {
        if (error) {
          return console.error('[modules/templates] Handlebars.js could not be fetched.');
        }

        templatesModule.templateEngine = window.Handlebars.noConflict();
        templatesModule.renderMethod = function(engine, template, variables) {
          return engine.compile(template)(variables);
        };
      });
      break;

    case 'templates.js':
      app.http.getScript('/src/lib/templates.js', function(error) {
        if (error) {
          return console.error('[modules/templates] Templates.js could not be fetched.');
        }

        templatesModule.templateEngine = window.templates;
        templatesModule.renderMethod = function(engine, template, variables) {
          console.log('parsing ' + template);
          return engine.parse(template, variables);
        };
      });
  }


  /**
   * define configuration for the templates module
   *
   * @param options
   */
  templatesModule.configure = function(options) {
  };

  
  /**
   * renders a template string and returns a promise
   * 
   * @param {string} template   the template string to render
   * @param {object} variables  the template variables to use
   * @returns {Promise} 
   */
  templatesModule.render = function(template, variables) {
    return new Promise(function(resolve, reject) {
      try {
        return resolve(templatesModule.renderMethod.call(this, templatesModule.templateEngine, template, variables));
      } catch (renderError) {
        return reject(renderError);
      }
    });
  };


  // load the module
  app.registerModule('templates', templatesModule, function() {

    // expose the render method
    app.mountModuleEndpoint('render', 'templates', 'render');

    /**
     * insert the getTemplate method into the HTTP API. The reason why this is not a part
     * of the Xorb core is that users should have the freedom of (not) using the templates
     * module.
     *
     * @param url
     * @param callback
     * @param params
     * @param headers
     * @param templateVariables
     */
    app.http.getTemplate = function(url, callback, templateVariables, params, headers) {

      // if this is not an absolute link, attach our base path
      if (url.substring(0, 7) !== 'http://' || url.substring(0, 8) !== 'https://') {
        url = templatesModule.options.templateUrl + url;
      }

      this.get(url, null, params, headers)
        .then(response => response.text())
        .then(function(response) {
          return app.render(response, templateVariables);
        })
        .then(callback)
        .catch(function(error) {
          console.error('[modules/templates] Could not fetch template: ' + error.message);
        });
    }
  });
})();
