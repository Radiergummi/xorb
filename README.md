# xorb [![Build status](https://travis-ci.org/Radiergummi/xorb.svg)](https://travis-ci.org/Radiergummi/xorb)
JS client-side framework for a clean, modern and fast app programming approach  
**Note: Build fails due to Travis/PhantomJS not providing a proper `window.location` object. All tests pass on real clients.**

## Contents
1. [About](#about)
2. [Usage](#usage)
 1. [Namespaces](#namespaces)
 2. [Modules](#modules)
 3. [HTTP requests](#http-requests)
3. [API and general structure](#api-and-general-structure)
 1. [`app` internal properties](#app-internal-properties)
  1. [`_ns`](#-ns)
  2. [`_modules`](#-modules)
  3. [`_currentPath`](#-currentPath)
  4. [`_history`](#-history)
 2. [Namespace API](#namespace-api)
 3. [Module API](#modules-api)
  1. [Creating a module](#creating-a-module)
 4. [HTTP API](#http-api)
4. [Contributing](#contributing)


## About
Xorb is a client-side framework which solves multiple problems:

- Namespace pollution: Xorb exposes only one global variable: `app`.
- Loading the appropriate code and dependencies for certain routes: Xorb lets you register actions for routes, which is only called when a matching route is being navigated to. 
- Easy module/dependency integration: Xorb supports loading custom modules which are available throughout the app.
- Completely modular: Beneath the core script `app.js`, I wrote some standard modules - an event emitter for in-app IPC, a basic DOM modification library and a socket.io wrapper. They also serve as examples for module creation. You can find the module docs [here](src/modules).

I created Xorb in an attempt to streamline client-side code. Considering my clean and concise server-side JS code on the one hand and the messy, problem-solving centered jQuery scripts on the other, I started to work on a simple, yet powerful and extensible solution to use in my NodeJS projects.  


## Usage
To use Xorb, include `app.js` in your HTML file:

````html
<script src="/js/app.js"></script>
<script>
  // initialize the app and run your code
  app.init();
</script>
````

### Namespaces
This will prepare the Xorb API so you can start defining your app namespaces. A namespace is a URI fragment, many popular serverside frameworks refer to it as *routes*. The main namespace every page shares is `/`: Every URI starts with a slash.  
An important thing to note here is that namespace actions will be applied to **every** matching URI. Consider the following page:

    /forum/category/23/foo+bar

Our forum app has the following namespaces defined: `/`, `/forum` and `/forum/category`. For our page, Xorb will determine every of said namespaces as matching. That means, as long as you use a clear URI scheme for your app, Xorb allows you to write specific code for certain pages as well as shared code for different areas of your app.  
To register a certain namespace with the app, look at the following code:

````javascript
app.namespace('/', function() {
	document.querySelector('body').innerText = 'Hello World!';
});
````

The content of the callback function will now be executed on any matching page. You can also provide multiple callbacks, seperate or at once:

````javascript
app.namespace('/', [
	function(app, error, next) {
	  console.log('This is the first callback. It does not use the next()-function.');
	},
	function(app, error, next) {
	  console.log('This is the second callback. It sends data to the next one.');
	  next(null, 'foobar');
	},
	function(app, error, next, data) {
	  console.log('This is the third callback. It received data from the previous one: ' + data);
	  console.log('It will not send anything to the next one, though...');
	},
	function(app, error, next, data) {
	  console.log('This is the fourth callback. It expects to receive data from the previous one.');
	  
	  if (! data) {
	    return next(new Error('No data received from callback three'));
	  }
	},
	function(app, error, next) {
	  console.log('This is the fifth and last callback. The previous one threw an error, it is still being executed.');
	}
]);
````

As you can see, the chain created an error but is still executed. After the last callback has finished, though, it *will* throw an error. How you handle these is up to you - either use try-catch blocks, only logs errors, setup an error handler module (I will create one soon, I think) or just don't use errors at all.  
What is more important, though: You can specify as many callbacks for a certain namespace as you like. The callback chain will be assembled for each one independently from the others. That means: You won't be able to pass data from '/' to '/foo'.

### Modules
When I say modules, I mean encapsulated objects serving some purpose. That can be jQuery, a function or a fully-fledged custom module of your choice. You don't need to make any changes to these pieces of code to make them work with Xorb. You'll need to write a quick import wrapper for them, though:

````javascript
app.registerModule('jQuery', $, function() {
  app.mountModuleEndpoint('$', 'jQuery');
});
````

What does this code do? It loads an object named `$` into `app.modules.jQuery` and executes a callback function once that is done. The callback makes the `$` object available as `app.$`. So to call a jQuery method later on, just use `app.$('selector').addClass('test')`.  
Or, to take existing events module as an example:  

````javascript
app.registerModule('events', eventModule, function() {
  
  // register event endpoints
  app.mountModuleEndpoint('on', 'events', 'on');
  app.mountModuleEndpoint('off', 'events', 'off');
  app.mountModuleEndpoint('emit', 'events', 'emit');
});
````

This will make the three main event methods, `on`, `off` and `emit`, available as direct descendant properties of `app` so you can use `app.on('test-event', function(event) { /* ... */ })`.  
While you *can* mount modules to specific endpoints, you don't have to. It's completely sufficient to load modules with `app.registerModule('dom', domModule);`. 

### HTTP requests
Xorb includes a wrapper for AJAX/Fetch calls. This serves the main purpose of unifying the access to server resources from modules or namespace actions. The HTTP API is using promises, which makes working with responses really easy:

````javascript

// perform a GET request
app.http.get('/templates/user/edit')

  // render the downloaded template
  .then(app.render)
	
  // insert the rendered template into the DOM
  .then(function(renderedTemplate) {
    app.dom.el('.edit-user').innerHTML = renderedTemplate;
  });
````

*Note: This shows the `app.render` method which is a part of the templates module that I'll be uploading soon - it's still being worked on and will return promises, too.*


## API and general structure
While Xorb *does* have a few important methods, what's more important here is to understand the way a Xorb app works. The main feature is to force you to write better code by making you separate it into route related fragments. 

### `app` internal properties
#### `_ns`
The app namespace. Every namespace you create will be inserted here, with its name as the key. Additionally, a key named `app.ns.current` will be created that holds all namespace callbacks for the current path: That is what will be run after the app is initialized. To check which namespaces are loaded, you can use `app.namespaces()` which returns a list.

#### `_modules`
The module container. Holds all loaded module instances with the specified name as the key. To check which modules are loaded, you can use `app.modules()` which returns a list. To get a specific module instance, you can use `app.module('mySpecialModulesName')` which returns the instance.

#### `_currentPath`
The current browser page path (equivalent to `window.location.href`). Will change soon to enable the use of regular expressions (for example `^` or `$`) and placeholders like `:variable` known from other frameworks.

#### `_history`
I plan on integrating history.js to provide support for AJAX requests and browser history modification. 


### Namespace API
#### `app.namespace({string} namespace, {Array|function} callbacks)`
**namespace**: The namespace (route) to register the action for  
**callbacks**: Either an array of callbacks or a single function  

If callbacks are registered, they will be executed in the order they have been registered when the namespace execution starts later on. Callbacks have to be structured like so:  

##### `function({object} app, {object} error, {function} next, {*} data)`
**app**: The `app` itself. Currently useless as the app is visible in the global namespace, this may change to better encapsulation soon.  
**error**: A possible previous error object. This will throw an exception once the namespace callbacks have finished.  
**next**: The next callback. Allows to return prematurely and pass data to the next callback.  
**data**: A possible data variable passed by the previous callback. Only present if the previous callback used `next(null, data)`.
You do not have to use any of these.  

### Modules API
#### `app.registerModule({string} name, {object} instance, {function} [init])`
**name**: the name the module should be available as within the app (eg. `app.modules.<module name>`).  
**instance**: the module object to load  
**init**: an option function to run code after the module has been loaded, the perfect place for `app.mountModuleEndpoint()`.

#### `app.mountModuleEndpoint({string} mountPoint, {string} module, {string} [property])`
**mountPoint**: the exposed property below `app` the module is available on (eg. `app.mySpecialModule` or `app.mySpecialModuleMethod()`)  
**module**: the module to mount  
**property**: the module property to mount. Optional - if omitted, the whole module will be mounted.  

#### Creating a module
To create a module and make its usage easy, you should create a file named `src/modules/<module name>.js` and include it **after** `app.js`. Within the file, create a new self-executing anonymous function so the module will integrate itself on load:  

````javascript
(function(app) {
  if (! app) {
    return console.error('[modules/mySpecialModule] app.js has not been loaded yet');
  }
  
  // create your module object or hand over your module object
  var mySpecialModule = {};
  
  // ... your module code
  
  /**
   * the important part: writing your loadModule statement. the third 
   * parameter, the init function, enables you to execute code once your
   * module has been loaded. Here, you could mount module endpoints as 
   * described in the code, or setup your basic plugin options etc.
   * The init function is optional.
   */
  app.registerModule('mySpecialModuleName', mySpecialModule, function() {
  
    /**
     * optionally expose the whole module at app.myExposedModule that points
     * to app.modules.mySpecialModule
     */
    app.mountModuleEndpoint('myExposedModule', 'mySpecialModule');
    
    /**
     * optionally expose a single method or property at app.myExposedMethod
     * that points to app.modules.mySpecialModule.myInternalMethodName
     */
    app.mountModuleEndpoint('myExposedMethod', 'mySpecialModule', 'myInternalMethodName');
  });
})(window.app);
````
  
  
So, to give another jQuery example, the following would completely activate jQuery in Xorb:

````javascript
(function(app, jQuery) {
  if (! app) {
    return console.error('[modules/jQuery] app.js has not been loaded yet');
  }
  
  app.registerModule('jQuery', jQuery, function() {
    app.mountModuleEndpoint('$', 'jQuery');
  });
})(window.app, $);
````

### HTTP API
#### `app.http.get({string|object} url|request, {function} [callback], {object} [params], {object} [headers])`
**url**: the URL to get. If this is an object, all request parameters will be pulled from it, instead. So it should look like `{ url: 'http://foo.bar' }`.  
**callback**: the response callback to execute once data is received. Can be omitted, which results in `app.http.get` returning the response promise itself.  
**params**: An object containing URL parameters to attach to the URL as an object. Each of its properties will be added as URL-encoded strings (`?foo=bar&baz=test`).  
**headers**: An optional object of headers to attach to the request: `{ 'Content-Type': 'text/plain' }`  

Equivalent methods exist for `DELETE` and `HEAD`.


#### `app.http.getJSON({string|object} url|request, {function} [callback], {object} [params], {object} [headers])`
**url**: the URL to get. If this is an object, all request parameters will be pulled from it, instead. So it should look like `{ url: 'http://foo.bar' }`.  
**callback**: the response callback to execute once data is received. Can be omitted, which results in `app.http.get` returning the response promise itself.  
**params**: An object containing URL parameters to attach to the URL as an object. Each of its properties will be added as URL-encoded strings (`?foo=bar&baz=test`).  
**headers**: An optional object of headers to attach to the request: `{ 'Content-Type': 'text/plain' }`  

Variant of the `get` function that parses the response text as JSON before it is returned.


#### `app.http.post({string|object} url|request, {object} data, {function} [callback], {object} [headers])`
**url**: the URL to post to. If this is an object, all request parameters will be pulled from it, instead. So it should look like `{ url: 'http://foo.bar' }`.  
**data**: POST body data to send to the server. If this is an object, it will be `JSON.stringify`-ed automatically.  
**callback**: the response callback to execute once data is received. Can be omitted, which results in `app.http.get` returning the response promise itself.  
**headers**: An optional object of headers to attach to the request: `{ 'Content-Type': 'text/plain' }`  

Equivalent methods exist for `PUT` and `PATCH`.



## Contributing
Xorb is still being actively worked on and has no stable releases yet. If you'd like to contribute to this project, please don't hesitate to open an issue or a pull request. I'd be glad to hear opinions on Xorb.
