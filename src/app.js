/**
 * the global app variable, exposed as window.app
 * 
 * @var {object}
 */
var app = app || {};

/**
 * the namespace container
 * 
 * @var {object}
 */
app.ns = {};

/**
 * the modules container
 *
 * @var {object}
 */
app.modules = {};


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
app.loadModule = function(name, instance, init) {
  if (! app.modules.hasOwnProperty(name)) {
    app.modules[name] = instance;
	
    if (init) {
      return init.call(app);
    }
  } else {
    console.error('[init] ' + name + ' could not be loaded: A module of that name is already loaded.');
  }
  
  return app.modules[name];
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
app.mountModuleEndpoint = function(mountpoint, module, property) {
  if (! app.modules.hasOwnProperty([module])) {
    return console.error('[init] ' + module + ' could not be mounted at ' + mountpoint + ': There is no module registered by that name.');
  }
  
  if (property && ! app.modules[module].hasOwnProperty(property)) {
    return console.error('[init] ' + module + '.' + property + ' could not be mounted at ' + mountpoint + ': The module has no property by that name.');
  }

	if (! app.hasOwnProperty(mountpoint)) {
	  if (! property) {
		  return app[mountpoint] = function() {
        return app.modules[module].apply(app.modules[module], arguments);
      }
	  }
	  
	  return app[mountpoint] = function() { 
      return app.modules[module][property].apply(app.modules[module], arguments);
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
app.registerNamespaceAction = function(namespace, callbacks) {
	if (! app.ns.hasOwnProperty(namespace)) {
		app.ns[namespace] = [];
	}

	var existingNamespaceIsArray = (app.ns[namespace] instanceof Array),
		callbacksIsArray = (callbacks instanceof Array);

	// push the single callback into the existing namespace stack
	if (existingNamespaceIsArray && ! callbacksIsArray) {
		app.ns[namespace].push(callbacks);
	}

	// push each callback into the existing namespace stack
	if (existingNamespaceIsArray && callbacksIsArray) {
		for (var cb = 0; cb < callbacks.length; cb++) {
			app.ns[namespace].push(callbacks[cb]);
		}
	}

	// merge the two functions into an array
	if (! existingNamespaceIsArray && ! callbacksIsArray) {
		var existingCallback = app.ns[namespace];
		app.ns[namespace] = [
			existingCallback,
			callbacks
		];
	}

	// create an array, push the existing callback into it and append all callbacks
	if (! existingNamespaceIsArray && callbacksIsArray) {
		var existingCallback = app.ns[namespace];
		app.ns[namespace] = [
			existingCallback
		];

		for (var cb = 0; cb < callbacks.length; cb++) {
			app.ns[namespace].push(callbacks[cb]);
		}
	}
}


/**
 * determines the current namespace by trying to match the current pathname
 * on the registered namespaces in the app. Before this function is called,
 * obviously app.ns should be populated with any relevant namespaces like
 * so:
 *     app.ns['/'] = function(app, error, next) {};
 *     app.ns['/foo'] = function(app, error, next) {};
 */
app.determineNamespaceCallbacks = function() {
	app.ns.current = [];

	for (var namespace in app.ns) {
		if (! app.ns.hasOwnProperty(namespace)) {
			continue;
		}

		// test if the current namespace matches the path
		if (app.currentPath.substring(0, namespace.length) === namespace) {					
			if (Array.isArray(app.ns[namespace])) {
				for (var cb = 0; cb < app.ns[namespace].length; cb++) {
					app.ns.current.push(app.ns[namespace][cb]);
				}
			} else {
				app.ns.current.push(app.ns[namespace]);
			}
		}
	}
}


/**
 * runs the app by executing all callbacks in the current namespace
 * stack. the next callback can be called from within the current
 * callback to return prematurely and/or to hand over data to the 
 * next callback. if any callback returns an error, it is being 
 * collected and thrown at the end of execution stack.
 * Callbacks are executed in the order they are registered.
 */
app.run = function() {
  var i = -1,
      errors = [],
      next = null;
  
  // push a final callback to the stack which ends the loop
  app.ns.current.push(function(app, error, next) {
    
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
    
    data = data || false;
    
    // add 1 to callback counter
    i++;
    
    // call the callback in the window scope, using app, error and next as their callbacks
    app.ns.current[i].call(window, app, error, runNext, data);
  }
  
  // as long as we have callbacks, execute them
  while (i < app.ns.current.length - 1) {
    runNext();
  }
};

app.init = function() {
  
  // the current application path
  app.currentPath = window.location.pathname;
  app.determineNamespaceCallbacks();
  
  // run the app once the DOM has finished loading
  document.addEventListener('DOMContentLoaded', app.run, false);
};
