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
var app = app || (function () {
      // constructor
      function App() {
      }


      // pseudo "destructor"
      App.prototype.destroy = function () {
        _ns = {
          current: []
        };

        _modules = {};

        _mountPoints.map(function (mountpoint) {
          delete app.__proto__[ mountpoint ];
        });

        _mountPoints = [];
      };


      /**
       * the configuration store
       *
       * @private
       * @var {object}
       */
      var _options = {
        basePath: window.location.origin
      };

      /**
       * the namespace container
       *
       * @private
       * @var {object}
       */
      var _ns = {
        current: []
      };

      /**
       * the modules container
       *
       * @private
       * @var {object}
       */
      var _modules = {};

      /**
       * the current browser path
       *
       * @private
       * @var {string}
       */
      var _currentPath = null;


      /**
       * all mountpoints currently used by modules
       *
       * @private
       * @var {Array}
       */
      var _mountPoints = [];


      /**
       * determines the current namespace by trying to match the current pathname
       * on the registered namespaces in the app. Before this function is called,
       * obviously app.ns should be populated with any relevant namespaces.
       *
       * @private
       * @var {function}
       */
      var _buildNamespace = function () {
        _ns.current = [];

        for (var namespace in _ns) {
          if (! _ns.hasOwnProperty(namespace)) {
            continue;
          }

          // test if the current namespace matches the path
          if (_currentPath.substring(0, namespace.length) === namespace) {
            if (Array.isArray(_ns[ namespace ])) {
              for (var cb = 0; cb < _ns[ namespace ].length; cb ++) {
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
       *
       * @private
       * @var {function}
       */
      var _run = function () {
        var i = - 1,
            errors = [];

        // push a final callback to the stack which ends the loop
        _ns.current.push(function () {

          // if we have any errors, throw the first one.
          // TODO: Maybe this should be catched somewhere higher up.
          if (errors.length) {
            throw errors[ 0 ];
          }
        });

        function runNext(error, data) {
          // if we have any errors, collect them
          if (error) {
            errors.push(error)
          }

          data = data || null;

          // add 1 to callback counter
          i ++;

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
      App.prototype.http = (function () {
        var _loadedScripts = [],
            _getLoadedScripts = function () {
              var scriptTags = document.querySelectorAll('script[src]');

              for (var i = 0; i < scriptTags.length; i ++) {
                _loadedScripts.push(scriptTags[ i ].src);
              }
            },
            HTTP = function () {
            },
            _adapter = {},
            _buildURL;


        /**
         * method to create a new fetch request and return the results as a promise
         *
         * @protected
         * @param {object} request
         * @returns {Promise}
         */
        _adapter.receive = function (request) {
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
            return responsePromise.then(function (response) {
              if (! response.ok) {
                console.error('[app/http] The server responded with a status ' + response.status + ': ' + response.statusText);
              }

              return response;
            }, function (error) {
              console.error('[app/http] ' + error.message);
              console.error(error);
            }).then(request.callback);
          }

          /**
           * if we have no callback, assume the promise handling occurs outside of the
           * HTTP API by applying a then() call to it
           */
          return responsePromise.then(function (response) {
            if (! response.ok) {
              console.error('[app/http] The server responded with a status ' + response.status + ': ' + response.statusText);
            }

            return response;
          }, function (error) {
            console.error('[app/http] ' + error.message);
            console.error(error);
          });
        };


        /**
         * method to create a new fetch request with a data body and return the
         * results as a promise
         *
         * @protected
         * @param request
         * @returns {Promise}
         */
        _adapter.transmit = function (request) {

          /**
           * if we received an object as the POST body data, stringify it and set the according
           * Content-Type
           */
          if (typeof request.data === 'object') {
            request.data = JSON.stringify(request.data);
            request.headers[ 'Content-Type' ] = 'application/json';
          }

          /**
           * fetch the request
           */
          var responsePromise = fetch(new Request(
              _buildURL(request.url, request.params),
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
            return responsePromise.then(function (response) {
              if (! response.ok) {
                console.error('[app/http] The server responded with a status ' + response.status + ': ' + response.statusText);
              }

              return response;
            }, function (error) {
              console.error('[app/http] ' + error.message);
              console.error(error);
            }).then(request.callback);
          }

          /**
           * if we have no callback, assume the promise handling occurs outside of the
           * HTTP API by applying a then() call to it
           */
          return responsePromise.then(function (response) {
            if (! response.ok) {
              console.error('[app/http] The server responded with a status ' + response.status + ': ' + response.statusText);
            }

            return response;
          }, function (error) {
            console.error('[app/http] ' + error.message);
            console.error(error);
          });
        };


        /**
         * creates the request URL by assembling any parameters into a query string
         * and appends it
         *
         * @private
         * @param url
         * @param params
         * @returns {*}
         */
        _buildURL = function (url, params) {

          // check for relative links
          if (! /^https?:\/\//i.test(url)) {

            // if we have a relative link, append the basepath to it and insert a slash if necessary
            url = _options.basePath + ((_options.basePath.charAt(_options.basePath.length - 1) !== '/' && url.charAt(0) !== '/') ? '/' : '') + url;
          }

          // if we have query parameters, append them to the URL string
          if (params) {
            var queryParameters = [];

            for (var key in params) {
              if (! params.hasOwnProperty(key)) continue;

              queryParameters.push(key + '=' + encodeURIComponent(params[ key ].toString()));
            }

            // trim trailing &
            return url + '?' + queryParameters.join('&');
          }

          return url;
        };


        /**
         * Proxy object to catch nonexistent methods. That way, each request method can implemented
         * as a virtual method.
         *
         * @type {Object}
         */
        HTTP.prototype = Object.create(new Proxy({}, {
          get: function (receiver, method) {
            method = method.toUpperCase();

            /**
             * filter the request methods for valid ones
             */
            switch (method) {
              case 'GET':
              case 'HEAD':
              case 'DELETE':
              case 'POST':
              case 'PUT':
              case 'PATCH':
                return function (urlOrRequestData) {
                  var request = {};

                  switch (typeof urlOrRequestData) {
                    case 'object':
                      request = urlOrRequestData;
                      break;

                    case 'string':
                      request.url = urlOrRequestData
                  }

                  request.method = method;

                  return app.http.request(request);
                };
                break;

              default:
                return function () {
                  console.error('[app/http] The request method ' + method + ' is not supported.');
                }
            }
          }
        }));


        HTTP.prototype.request = function (requestData) {
          var request = {};

          request.url = requestData.url;
          request.method = (requestData.hasOwnProperty('method') ? requestData.method : 'GET');
          request.data = (requestData.hasOwnProperty('data') ? requestData.data : undefined);
          request.params = (requestData.hasOwnProperty('params') ? requestData.params : null);
          request.headers = (requestData.hasOwnProperty('headers') ? requestData.headers : {});
          request.callback = (requestData.hasOwnProperty('callback') ? requestData.callback : null);
          return (request.data === undefined
                  ? _adapter.receive(request)
                  : _adapter.transmit(request)
          );
        };


        /**
         * GET request for a JSON resource that is parsed and handed to the callback
         *
         * @public
         * @param {string} url  URL to resource to GET
         * @returns {Promise}
         */
        HTTP.prototype.getJSON = function (url) {
          return this.get(url).then(function (response) {
            return response.json();
          });
        };


        /**
         * GET request for a BLOB resource that is treated as binary content (eg. images)
         *
         * @public
         * @param {string} url  URL to resource to GET
         * @returns {Promise}
         */
        HTTP.prototype.getBlob = function (url) {
          return this.get(url).then(function (response) {
            return response.blob();
          });
        };


        /**
         * get a script and append it to the document. Existing scripts will be removed,
         * appended a no-cache timestamp and reloaded. This method is used internally to
         * download modules automatically.
         *
         * @public
         * @param {string}   path        the path to the script to load
         * @param {function} [callback]  an optional callback to execute once the script
         *                               has been loaded. If an error occurs (think 404)
         *                               the callback is supplied an error argument as
         *                               its first parameter.
         * @returns {Promise}
         */
        HTTP.prototype.getScript = function (path, callback) {
          return new Promise(function (resolve, reject) {
            callback = callback || function () {
                };

            // if this is not an absolute link, attach our base path
            if (! /^https?:\/\//i.test(path)) {
              path = _options.basePath + ((path.charAt(0) !== '/' && _options.basePath.charAt(_options.basePath.length - 1) !== '/') ? '/' : '') + path;
            }
            // update the loaded scripts index
            _getLoadedScripts();

            /**
             * check if the script to load already has an associated script tag.
             * if so, remove it and append it again,
             */
            if (_loadedScripts.indexOf(path.split('?')[ 0 ]) !== - 1) {

              // remove the script from the DOM
              document.querySelector('script[src^="' + path + '"]').remove();

              // update the script path with the current timestamp to circumvent caching
              path = path + '?d=' + Date.now();
            }

            var scriptTag = document.createElement('script');
            scriptTag.src = path;

            // run the callback if there was an error loading the script, supplement a new Error
            scriptTag.onerror = function () {
              var loadError = new Error('Script could not be fetched: ' + path);
              console.error('[app/http] ' + loadError.message);

              return reject(loadError);
            };

            // run the callback once the script has been loaded
            scriptTag.onload = scriptTag.onreadystatechange = function () {
              if (! this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                return resolve(scriptTag);
              }
            };

            // append the script the the document
            document.getElementsByTagName('head')[ 0 ].appendChild(scriptTag);

            // update the loaded scripts index again (we made changes)
            _getLoadedScripts();
          });
        };

        // return an instance of the HTTP class
        return new HTTP();
      })();


      /**
       * mounts a module and stores it in the apps modules object for later use.
       * an optional initialization function can be supplied to setup the module
       * if necessary.
       *
       * @public
       * @param {string}   name      the module name
       * @param {object}   instance  the  module instance
       * @param {function} [init]    an optional module initialization function
       *
       * @returns {object}           the loaded module
       */
      App.prototype.registerModule = function (name, instance, init) {
        if (! _modules.hasOwnProperty(name)) {
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
       * @public
       * @param {string} mountpoint  the mount point name
       * @param {string} module      the module instance to mount
       * @param {string} [property]  the module property to mount. optional.
       * @returns {*}
       */
      App.prototype.mountModuleEndpoint = function (mountpoint, module, property) {
        if (! _modules.hasOwnProperty(module)) {
          return console.error('[init] ' + module + ' could not be mounted at ' + mountpoint + ': There is no module registered by that name.');
        }

        if (property && ! _modules[ module ].hasOwnProperty(property)) {
          return console.error('[init] ' + module + '.' + property + ' could not be mounted at ' + mountpoint + ': The module has no property by that name.');
        }

        if (! App.prototype.hasOwnProperty(mountpoint)) {
          _mountPoints.push(mountpoint);

          if (! property) {
            return App.prototype[ mountpoint ] = function () {
              return _modules[ module ].apply(_modules[ module ], arguments);
            }
          }

          if (typeof _modules[ module ][ property ] !== 'function') {
            return App.prototype[ mountpoint ] = _modules[ module ][ property ];
          }

          return App.prototype[ mountpoint ] = function () {
            return _modules[ module ][ property ].apply(_modules[ module ], arguments);
          }
        }

        return console.error('[init] ' + module + ' could not be mounted at ' + (property ? 'app.' : '') + mountpoint + ': The mount point is already in use.');
      };


      /**
       * retrieves a module by name
       *
       * @param {string} name  the module name
       * @returns {*}
       */
      App.prototype.module = function (name) {
        return _modules[ name ];
      };


      /**
       * retrieves a list of all registered modules
       *
       * @returns {Array}
       */
      App.prototype.modules = function () {
        return Object.keys(_modules);
      };


      /**
       * registers a namespace action on the router. The namespace represents a URI
       * fragment, starting from the left. Callbacks can be an array containing
       * multiple callbacks or a single function.
       *
       * @public
       * @param {string}         namespace  the namespace to mount the action on
       * @param {Array|function} callbacks  the callback(s) to execute on this
       *                                    mount point
       * @returns {undefined}
       */
      App.prototype.namespace = function (namespace, callbacks) {
        if (! _ns.hasOwnProperty(namespace)) {
          _ns[ namespace ] = [];
        }

        var existingNamespaceIsArray = (_ns[ namespace ] instanceof Array),
            callbacksIsArray = (callbacks instanceof Array);

        // push the single callback into the existing namespace stack
        if (existingNamespaceIsArray && ! callbacksIsArray) {
          _ns[ namespace ].push(callbacks);
        }

        // push each callback into the existing namespace stack
        if (existingNamespaceIsArray && callbacksIsArray) {
          for (var cb = 0; cb < callbacks.length; cb ++) {
            _ns[ namespace ].push(callbacks[ cb ]);
          }
        }

        // merge the two functions into an array
        if (! existingNamespaceIsArray && ! callbacksIsArray) {
          var existingCallback = _ns[ namespace ];
          _ns[ namespace ] = [
            existingCallback,
            callbacks
          ];
        }

        // create an array, push the existing callback into it and append all callbacks
        if (! existingNamespaceIsArray && callbacksIsArray) {
          var existingCallback = _ns[ namespace ];
          _ns[ namespace ] = [
            existingCallback
          ];

          for (var cb = 0; cb < callbacks.length; cb ++) {
            _ns[ namespace ].push(callbacks[ cb ]);
          }
        }
      };


      /**
       * retrieves a list of all registered namespaces
       *
       * @returns {Array}
       */
      App.prototype.namespaces = function () {
        return Object.keys(_ns);
      };


      /**
       * initializes the app
       *
       * @public
       * @param {object}   [options]   configuration options to start the app with
       * @param {function} [callback]  an optional callback to execute once everything is ready
       * @returns {App}
       */
      App.prototype.init = function (options, callback) {
        options = options || {};
        callback = callback || function () {
            };

        // merge options
        for (var option in options) {
          if (! options.hasOwnProperty(option)) continue;

          _options[ option ] = options[ option ];
        }

        // the current application path
        _currentPath = window.location.pathname;
        _buildNamespace();

        // if we have any modules to load, do so now
        var moduleLoaders = _options.modules.map(function (moduleName) {
          return app.http.getScript('/src/modules/' + moduleName + '.js');
        });

        // once all modules have loaded, attach the ready listener
        Promise.all(moduleLoaders).then(function (scripts) {
          if (document.readyState !== 'complete') {

            // run the app once the DOM has finished loading
            document.onreadystatechange = function () {
              _run();
              app.ready = true;
              callback.call(window);
            };
          } else {
            _run();
            app.ready = true;
            callback.call(window);
          }
        }, function (error) {
          console.error('[app/init] ' + error.message);
        });
      };

      // return the core app object
      return new App();
    })();
