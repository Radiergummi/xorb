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

  var engineReadyPromise,
      templatesModule = {
        // the options storage
        options: {
          templateUrl:    'templates/',
          templateEngine: 'mustache'
        },

        // the template cache
        cache: {},

        templateEngine: null,
        renderMethod: null
      };

  switch (templatesModule.options.templateEngine) {
    case 'mustache':
      engineReadyPromise = app.http.getScript('/src/lib/mustache.js').then(function() {
        templatesModule.templateEngine = window.Mustache;
        templatesModule.renderMethod = function(engine, template, variables) {
          return engine.render(template, variables);
        };
      }, function(error) {
        return console.error('[modules/templates] Mustache.js could not be fetched.');
      });
      break;

    case 'handlebars':
      engineReadyPromise = app.http.getScript('/src/lib/handlebars.js').then(function() {
        templatesModule.templateEngine = window.Handlebars.noConflict();
        templatesModule.renderMethod = function(engine, template, variables) {
          return engine.compile(template)(variables);
        };
      }, function(error) {
        return console.error('[modules/templates] Handlebars.js could not be fetched.');
      });
      break;

    case 'templates.js':
      engineReadyPromise = app.http.getScript('/src/lib/templates.js').then(function() {
        templatesModule.templateEngine = window.templates;
        templatesModule.renderMethod = function(engine, template, variables) {
          return engine.parse(template, variables);
        };
      }, function(error) {
        return console.error('[modules/templates] Templates.js could not be fetched.');
      });
    default:
      engineReadyPromise = new Promise(function(resolve, reject) {
        reject('There is no engine available by that name');
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


  engineReadyPromise.then(function() {
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
        if (! /^https?:\/\//i.test(url)) {
          url = templatesModule.options.templateUrl + url;
        }

        var renderedTemplate = this.get(url, null, params, headers)
          .then(response => response.text(), function(error) {
            console.error('[modules/templates] Could not fetch template: ' + error.message);
          })
          .then(function(response) {
            return app.render(response, templateVariables);
          });

        if (callback) {
          return renderedTemplate.then(callback);
        }

        return renderedTemplate;
      }
    });
  });
})();
