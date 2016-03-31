/**
 * the global app variable, exposed as window.app
 * 
 * @var {object}
 */
var app = app || (function() {
  // constructor
  function App () {}
  
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
      if (! _ns.hasOwnProperty(namespace)) {
        continue;
      }
  
      // test if the current namespace matches the path
      if (_currentPath.substring(0, namespace.length) === namespace) {					
        if (Array.isArray(_ns[namespace])) {
          for (var cb = 0; cb < _ns[namespace].length; cb++) {
            _ns.current.push(_ns[namespace][cb]);
          }
        } else {
          _ns.current.push(_ns[namespace]);
        }
      }
    }
  }
  
  
  /**
   * runs the app by executing all callbacks in the current namespace
   * stack. the next callback must be called from within the current
   * callback. if any callback returns an error, it is being collected
   * and thrown at the end of execution stack.
   * Callbacks are executed in the order they are registered.
   */
  var _run = function() {
    var i = -1,
        errors = [],
        next = null;
    
    // push a final callback to the stack which ends the loop
    _ns.current.push(function(app, error, next) {
      
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
      i++;
      
      // call the callback in the window scope, using app, error and next as their callbacks
      _ns.current[i].call(window, {
        ns: _ns,
        modules: _modules,
        currentPath: _currentPath
      }, error, runNext, data);
    }
    
    while (i < _ns.current.length - 1) {
      runNext();
    }
  };
  
  
  /**
   * loads a module and stores it in the app's modules object for later use.
   * an optional initialization function can be supplied to setup the module
   * if necessary.
   *
   * @param {string} name      the module name
   * @param {object} instance  the  module instance
   * @param {function} [init]  an optional module initialization function
   *
   * @return {object}          the loaded module
   */
  App.prototype.loadModule = function(name, instance, init) {
    if (!_modules.hasOwnProperty(name)) {
     _modules[name] = instance;
    
      if (init) {
        return init.call(app);
      }
    } else {
      console.error('[init] ' + name + ' could not be loaded: A module of that name is already loaded.');
    }
    
    return _modules[name];
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
    if (!_modules.hasOwnProperty([module])) {
      return console.error('[init] ' + module + ' could not be mounted at ' + mountpoint + ': There is no module registered by that name.');
    }
    
    if (property && !_modules[module].hasOwnProperty(property)) {
      return console.error('[init] ' + module + '.' + property + ' could not be mounted at ' + mountpoint + ': The module has no property by that name.');
    }
  
    if (! App.prototype.hasOwnProperty(mountpoint)) {
      if (! property) {
        return App.prototype[mountpoint] = function() {
          return _modules[module].apply(_modules[module], arguments);
        }
      }
      
      return App.prototype[mountpoint] = function() { 
        return _modules[module][property].apply(_modules[module], arguments);
      }
    }
  
    return console.error('[init] ' + module + ' could not be mounted at ' + mountpoint + ': A module of that name is already mounted.');
  };
  
  
  /**
   * registers a namespace action on the router. The namespace represents a URI 
   * fragment, starting from the left. Callbacks can be an array containing
   * multiple callbacks or a single function.
   *
   * @param {string} namespace
   * @param {Array|function} callbacks  the callback(s) to execute on this 
   *                                    mount point
   */
  App.prototype.registerNamespaceAction = function(namespace, callbacks) {
    if (! _ns.hasOwnProperty(namespace)) {
      _ns[namespace] = [];
    }
  
    var existingNamespaceIsArray = (_ns[namespace] instanceof Array),
      callbacksIsArray = (callbacks instanceof Array);
  
    // push the single callback into the existing namespace stack
    if (existingNamespaceIsArray && ! callbacksIsArray) {
      _ns[namespace].push(callbacks);
    }
  
    // push each callback into the existing namespace stack
    if (existingNamespaceIsArray && callbacksIsArray) {
      for (var cb = 0; cb < callbacks.length; cb++) {
        _ns[namespace].push(callbacks[cb]);
      }
    }
  
    // merge the two functions into an array
    if (! existingNamespaceIsArray && ! callbacksIsArray) {
      var existingCallback = _ns[namespace];
      _ns[namespace] = [
        existingCallback,
        callbacks
      ];
    }
  
    // create an array, push the existing callback into it and append all callbacks
    if (! existingNamespaceIsArray && callbacksIsArray) {
      var existingCallback = _ns[namespace];
      _ns[namespace] = [
        existingCallback
      ];
  
      for (var cb = 0; cb < callbacks.length; cb++) {
        _ns[namespace].push(callbacks[cb]);
      }
    }
  }
  
  
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
