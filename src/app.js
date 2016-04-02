'use strict';

/*
 global window,
 document,
 fetch,
 Request,
 Headers
 */

/**
 * the global app variable, exposed as window.app
 *
 * @var {object}
 */
var app = app || (function() {
    // constructor
    function App () {
    }

    /**
     * the namespace container
     *
     * @var {object}
     */
    var _ns = {
      current: []
    };

    /**
     * the modules container
     *
     * @var {object}
     */
    var _modules = {};

    var _currentPath = null;


    /**
     * determines the current namespace by trying to match the current pathname
     * on the registered namespaces in the app. Before this function is called,
     * obviously app.ns should be populated with any relevant namespaces.
     */
    var _determineNamespaceCallbacks = function() {
      _ns.current = [];

      for (var namespace in _ns) {
        if (!_ns.hasOwnProperty(namespace)) {
          continue;
        }

        // test if the current namespace matches the path
        if (_currentPath.substring(0, namespace.length) === namespace) {
          if (Array.isArray(_ns[ namespace ])) {
            for (var cb = 0; cb < _ns[ namespace ].length; cb++) {
              _ns.current.push(_ns[ namespace ][ cb ]);
            }
          } else {
            _ns.current.push(_ns[ namespace ]);
          }
        }
      }
    };


    /**
     * runs the app by executing all callbacks in the current namespace
     * stack. the next callback must be called from within the current
     * callback. if any callback returns an error, it is being collected
     * and thrown at the end of execution stack.
     * Callbacks are executed in the order they are registered.
     */
    var _run = function() {
      var i      = -1,
          errors = [];

      // push a final callback to the stack which ends the loop
      _ns.current.push(function() {

        // if we have any errors, throw the first one.
        // TODO: Maybe this should be catched somewhere higher up.
        if (errors.length) {
          throw errors[ 0 ];
        }
      });

      function runNext (error, data) {
        // if we have any errors, collect them
        if (error) {
          errors.push(error)
        }

        data = data || null;

        // add 1 to callback counter
        i++;

        // call the callback in the window scope, using app, error and next as their callbacks
        _ns.current[ i ].call(window, {
          ns:          _ns,
          modules:     _modules,
          currentPath: _currentPath
        }, error, runNext, data);
      }

      while (i < _ns.current.length - 1) {
        runNext();
      }
    };


    /**
     * HTTP API - provides a Fetch abstraction layer for asynchronous communication
     * with the web server. To do so, the Server API creates unified mappings for
     * HTTP methods.
     *
     * @constructor
     */
    App.prototype.http = (function() {
      var HTTP     = function() {
          },
          _adapter = {},
          _buildURL;


      /**
       * method to create a new fetch request and return the results as a promise
       *
       * @param {object} request
       * @returns {Promise}
       */
      _adapter.receive = function(request) {
        /**
         * fetch the request
         */
        var responsePromise = fetch(new Request(
          _buildURL(request.url, request.params),
          {
            method:  request.method.toLowerCase(),
            headers: new Headers(request.headers)
          }
        ));

        /**
         * if we have a callback, run it on the promise object
         */
        if (request.callback) {
          return responsePromise.then(function(response) {
            if (!response.ok) {
              console.error('[app/http] The server responded with a status ' + response.status + ': ' + response.statusText);
            }

            return response;
          }, function(error) {
            console.error('[app/http] ' + error.message);
            console.error(error);
          }).then(request.callback);
        }

        /**
         * if we have no callback, assume the promise handling occurs outside of the
         * HTTP API by applying a then() call to it
         */
        return responsePromise.then(function(response) {
          if (!response.ok) {
            console.error('[app/http] The server responded with a status ' + response.status + ': ' + response.statusText);
          }

          return response;
        }, function(error) {
          console.error('[app/http] ' + error.message);
          console.error(error);
        });      };


      _adapter.transmit = function(request) {
        /**
         * fetch the request
         */
        var responsePromise = fetch(new Request(
          request.url,
          {
            method:  request.method.toLowerCase(),
            headers: new Headers(request.headers),
            body:    request.data
          }
        ));

        /**
         * if we have a callback, run it on the promise object
         */
        if (request.callback) {
          return responsePromise.then(function(response) {
            if (!response.ok) {
              console.error('[app/http] The server responded with a status ' + response.status + ': ' + response.statusText);
            }

            return response;
          }, function(error) {
            console.error('[app/http] ' + error.message);
            console.error(error);
          }).then(request.callback);
        }

        /**
         * if we have no callback, assume the promise handling occurs outside of the
         * HTTP API by applying a then() call to it
         */
        return responsePromise.then(function(response) {
          if (!response.ok) {
            console.error('[app/http] The server responded with a status ' + response.status + ': ' + response.statusText);
          }

          return response;
        }, function(error) {
          console.error('[app/http] ' + error.message);
          console.error(error);
        });
      };


      /**
       * creates the request URL by assembling any parameters into a query string
       * and appends it
       *
       * @param url
       * @param params
       * @returns {*}
       * @private
       */
      _buildURL = function(url, params) {

        // if we have query parameters, append them to the URL string
        if (params) {
          var queryParameters = [];

          for (var key in params) {
            if (!params.hasOwnProperty(key)) continue;

            queryParameters.push(key + '=' + encodeURIComponent(params[ key ].toString()));
          }

          // trim trailing &
          return url + '?' + queryParameters.join('&');
        }

        return url;
      };


      /**
       * GET request to the server. Parameters are expanded and attached to the URL string
       * automatically.
       *
       * @param {object|string}  url         URL to resource to GET
       * @param {function}       [callback]  callback to execute once the response has been received
       * @param {object}         [params]    URL parameters (?foo=bar) to attach to this request
       * @param {object}         [headers]   request headers to use for this request
       */
      HTTP.prototype.get = function(url, callback, params, headers) {
        var request = {};

        request.method = 'GET';

        // if we received an object as the first parameter, assume it is the request configuration
        if (typeof url === 'object') {
          request.url = url.url;
          request.params = (url.hasOwnProperty('params') ? url.params : null);
          request.headers = (url.hasOwnProperty('headers') ? url.headers : {});
          request.callback = (url.hasOwnProperty('callback') ? url.callback : null);
        } else {
          request.url = url;
          request.params = params || null;
          request.headers = headers || {};
          request.callback = callback || null;
        }

        return _adapter.receive(request);
      };


      /**
       * DELETE request to the server. Parameters are expanded and attached to the URL string
       * automatically.
       *
       * @param {string}   url         URL to resource to DELETE
       * @param {function} [callback]  callback to execute once the response has been received
       * @param {object}   [params]    URL parameters (?foo=bar) to attach to this request
       * @param {object}   [headers]   request headers to use for this request
       */
      HTTP.prototype.delete = function(url, callback, params, headers) {
        var request = {};

        request.method = 'DELETE';

        // if we received an object as the first parameter, assume it is the request configuration
        if (typeof url === 'object') {
          request.url = url.url;
          request.params = (url.hasOwnProperty('params') ? url.params : null);
          request.headers = (url.hasOwnProperty('headers') ? url.headers : {});
          request.callback = (url.hasOwnProperty('callback') ? url.callback : null);
        } else {
          request.url = url;
          request.params = params || null;
          request.headers = headers || {};
          request.callback = callback || null;
        }

        return _adapter.receive(request);
      };


      /**
       * HEAD request to the server. Parameters are expanded and attached to the URL string
       * automatically.
       *
       * @param {string}   url         URL to resource to retrieve headers for
       * @param {function} [callback]  callback to execute once the response has been received
       * @param {object}   [params]    URL parameters (?foo=bar) to attach to this request
       * @param {object}   [headers]   request headers to use for this request
       */
      HTTP.prototype.head = function(url, callback, params, headers) {
        var request = {};

        request.method = 'HEAD';

        // if we received an object as the first parameter, assume it is the request configuration
        if (typeof url === 'object') {
          request.url = url.url;
          request.params = (url.hasOwnProperty('params') ? url.params : null);
          request.headers = (url.hasOwnProperty('headers') ? url.headers : {});
          request.callback = (url.hasOwnProperty('callback') ? url.callback : null);
        } else {
          request.url = url;
          request.params = params || null;
          request.headers = headers || {};
          request.callback = callback || null;
        }

        return _adapter.receive(request);
      };


      /**
       * POST request to the server.
       *
       * @param {string}   url         URL to resource to POST
       * @param {object}   data        body data to attach to this request
       * @param {function} [callback]  callback to execute once the response has been received
       * @param {object}   [headers]   request headers to use for this request
       */
      HTTP.prototype.post = function(url, data, callback, headers) {
        var request = {};

        request.method = 'POST';

        // if we received an object as the first parameter, assume it is the request configuration
        if (typeof url === 'object') {
          request.url = url.url;
          request.data = url.data;
          request.params = (url.hasOwnProperty('params') ? url.params : {});
          request.headers = (url.hasOwnProperty('headers') ? url.headers : {});
          request.callback = (url.hasOwnProperty('callback') ? url.callback : null);
        } else {
          request.url = url;
          request.data = data;
          request.headers = headers || {};
          request.callback = callback || null;
        }

        /**
         * if we received an object as the POST body data, stringify it and set the according
         * Content-Type
         */
        if (typeof request.data === 'object') {
          request.data = JSON.stringify(request.data);
          request.headers[ 'Content-Type' ] = 'application/json';
        }

        return _adapter.transmit(request);
      };


      /**
       * PUT request to the server.
       *
       * @param {string}   url         URL to resource to PUT
       * @param {object}   data        body data to attach to this request
       * @param {function} [callback]  callback to execute once the response has been received
       * @param {object}   [headers]   request headers to use for this request
       */
      HTTP.prototype.put = function(url, data, callback, headers) {
        var request = {};

        request.method = 'PUT';

        // if we received an object as the first parameter, assume it is the request configuration
        if (typeof url === 'object') {
          request.url = url.url;
          request.data = url.data;
          request.params = (url.hasOwnProperty('params') ? url.params : {});
          request.headers = (url.hasOwnProperty('headers') ? url.headers : {});
          request.callback = (url.hasOwnProperty('callback') ? url.callback : null);
        } else {
          request.url = url;
          request.data = data;
          request.headers = headers || {};
          request.callback = callback || null;
        }

        /**
         * if we received an object as the PUT body data, stringify it and set the according
         * Content-Type
         */
        if (typeof request.data === 'object') {
          request.data = JSON.stringify(request.data);
          request.headers[ 'Content-Type' ] = 'application/json';
        }

        return _adapter.transmit(request);
      };


      /**
       * PATCH request to the server.
       *
       * @param {string}   url         URL to resource to PATCH
       * @param {object}   data        body data to attach to this request
       * @param {function} [callback]  callback to execute once the response has been received
       * @param {object}   [headers]   request headers to use for this request
       */
      HTTP.prototype.patch = function(url, data, callback, headers) {
        var request = {};

        request.method = 'PATCH';

        // if we received an object as the first parameter, assume it is the request configuration
        if (typeof url === 'object') {
          request.url = url.url;
          request.data = url.data;
          request.params = (url.hasOwnProperty('params') ? url.params : {});
          request.headers = (url.hasOwnProperty('headers') ? url.headers : {});
          request.callback = (url.hasOwnProperty('callback') ? url.callback : null);
        } else {
          request.url = url;
          request.data = data;
          request.headers = headers || {};
          request.callback = callback || null;
        }

        /**
         * if we received an object as the PATCH body data, stringify it and set the according
         * Content-Type
         */
        if (typeof request.data === 'object') {
          request.data = JSON.stringify(request.data);
          request.headers[ 'Content-Type' ] = 'application/json';
        }

        return _adapter.transmit(request);
      };


      /**
       * GET request for a JSON resource that is parsed and handed to the callback
       *
       * @param {object|string}  url         URL to resource to GET
       * @param {function}       [callback]  callback to execute once the response has been received
       * @param {object}         [params]    URL parameters (?foo=bar) to attach to this request
       * @param {object}         [headers]   request headers to use for this request
       *
       * @returns {Promise}
       */
      HTTP.prototype.getJSON = function(url, callback, params, headers) {
        var request = {};

        request.method = 'GET';

        // if we received an object as the first parameter, assume it is the request configuration
        if (typeof url === 'object') {
          request.url = url.url;
          request.params = (url.hasOwnProperty('params') ? url.params : null);
          request.headers = (url.hasOwnProperty('headers') ? url.headers : {});
        } else {
          request.url = url;
          request.params = params || null;
          request.headers = headers || {};
        }

        return _adapter.receive(request).then(function(response) {
          return response.json();
        }).then(callback);
      };


      HTTP.prototype.getBlob = function(url, callback, params, headers) {
        var request = {};

        request.method = 'GET';

        // if we received an object as the first parameter, assume it is the request configuration
        if (typeof url === 'object') {
          request.url = url.url;
          request.params = (url.hasOwnProperty('params') ? url.params : null);
          request.headers = (url.hasOwnProperty('headers') ? url.headers : {});
        } else {
          request.url = url;
          request.params = params || null;
          request.headers = headers || {};
        }

        return _adapter.receive(request).then(function(response) {
          return response.blob();
        }).then(callback);
      };

      // return an instance of the HTTP class
      return new HTTP();
    })();


    /**
     * loads a module and stores it in the apps modules object for later use.
     * an optional initialization function can be supplied to setup the module
     * if necessary.
     *
     * @param {string}   name      the module name
     * @param {object}   instance  the  module instance
     * @param {function} [init]    an optional module initialization function
     *
     * @return {object}            the loaded module
     */
    App.prototype.loadModule = function(name, instance, init) {
      if (!_modules.hasOwnProperty(name)) {
        _modules[ name ] = instance;

        if (init) {
          return init.call(app);
        }
      } else {
        console.error('[init] ' + name + ' could not be loaded: A module of that name is already loaded.');
      }

      return _modules[ name ];
    };


    /**
     * creates a reference to a module method directly within the app, which is useful
     * to avoid having to call long module paths (app.methodName instead of
     * app.modules.example.module.methodName)
     *
     * @param {string} mountpoint  the mount point name
     * @param {string} module      the module instance to mount
     * @param {string} [property]  the module property to mount. optional.
     */
    App.prototype.mountModuleEndpoint = function(mountpoint, module, property) {
      if (!_modules.hasOwnProperty(module)) {
        return console.error('[init] ' + module + ' could not be mounted at ' + mountpoint + ': There is no module registered by that name.');
      }

      if (property && !_modules[ module ].hasOwnProperty(property)) {
        return console.error('[init] ' + module + '.' + property + ' could not be mounted at ' + mountpoint + ': The module has no property by that name.');
      }

      if (!App.prototype.hasOwnProperty(mountpoint)) {
        if (!property) {
          return App.prototype[ mountpoint ] = function() {
            return _modules[ module ].apply(_modules[ module ], arguments);
          }
        }

        return App.prototype[ mountpoint ] = function() {
          return _modules[ module ][ property ].apply(_modules[ module ], arguments);
        }
      }

      return console.error('[init] ' + module + ' could not be mounted at ' + mountpoint + ': A module of that name is already mounted.');
    };


    /**
     * registers a namespace action on the router. The namespace represents a URI
     * fragment, starting from the left. Callbacks can be an array containing
     * multiple callbacks or a single function.
     *
     * @param {string}         namespace
     * @param {Array|function} callbacks  the callback(s) to execute on this
     *                                    mount point
     */
    App.prototype.registerNamespaceAction = function(namespace, callbacks) {
      if (!_ns.hasOwnProperty(namespace)) {
        _ns[ namespace ] = [];
      }

      var existingNamespaceIsArray = (_ns[ namespace ] instanceof Array),
          callbacksIsArray         = (callbacks instanceof Array);

      // push the single callback into the existing namespace stack
      if (existingNamespaceIsArray && !callbacksIsArray) {
        _ns[ namespace ].push(callbacks);
      }

      // push each callback into the existing namespace stack
      if (existingNamespaceIsArray && callbacksIsArray) {
        for (var cb = 0; cb < callbacks.length; cb++) {
          _ns[ namespace ].push(callbacks[ cb ]);
        }
      }

      // merge the two functions into an array
      if (!existingNamespaceIsArray && !callbacksIsArray) {
        var existingCallback = _ns[ namespace ];
        _ns[ namespace ] = [
          existingCallback,
          callbacks
        ];
      }

      // create an array, push the existing callback into it and append all callbacks
      if (!existingNamespaceIsArray && callbacksIsArray) {
        var existingCallback = _ns[ namespace ];
        _ns[ namespace ] = [
          existingCallback
        ];

        for (var cb = 0; cb < callbacks.length; cb++) {
          _ns[ namespace ].push(callbacks[ cb ]);
        }
      }
    };


    /**
     * initializes the app
     */
    App.prototype.init = function() {

      // the current application path
      _currentPath = window.location.pathname;
      _determineNamespaceCallbacks();

      // run the app once the DOM has finished loading
      document.addEventListener('DOMContentLoaded', _run, false);
    };

    return new App();
  })();
