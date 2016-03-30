# xorb
JS client-side framework for a clean, modern and fast app programming approach

## About
Xorb is a client-side framework which solves multiple problems:

- Namespace pollution: Xorb exposes only one global variable: `app`.
- Loading the appropriate code and dependencies for certain routes: Xorb lets you register actions for routes, which is only called when a matching route is being navigated to. 
- Easy module/dependency integration: Xorb supports loading custom modules which are available throughout the app.
- Completely modular: Beneath the core script `app.js`, I wrote some standard modules - an event emitter for in-app IPC, a basic DOM modification library and a socket.io wrapper. They also serve as examples for module creation.

I created Xorb in an attempt to streamline client-side code. Considering my clean and concise server-side JS code on the one hand and the messy, problem-solving centered jQuery scripts on the other, I started to work on a simple, yet powerful and extensible solution to use in my NodeJS projects.  

## Usage
To use Xorb, include `app.js` in your HTML file:

````html
<script src="/js/app.js"></script>
<script>
  /**
   * namespace and module definitions here
   */

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
app.registerNamespaceAction('/', function() {
	document.querySelector('body').innerText = 'Hello World!';
});
````

The content of the callback function will now be executed on any matching page. You can also provide multiple callbacks, seperate or at once:

````javascript
app.registerNamespaceAction('/', [
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
When I say modules, I mean encapsuled objects serving some purpose. That can be jQuery, a function or a fully-fledged custom module of your choice. You don't need to make any changes to these pieces of code to make them work with Xorb. You'll need to write a quick import wrapper for them, though:

````javascript
app.loadModule('jQuery', $, function() {
  app.mountModuleEndpoint('$', 'jQuery');
});
````

What does this code do? It loads an object named `$` into `app.modules.jQuery` and executes a callback function once that is done. The callback makes the `$` object available as `app.$`. So to call a jQuery method later on, just use `app.$('selector').addClass('test')`.  
Or, to take existing events module as an example:  

````javascript
app.loadModule('events', eventModule, function() {
  
  // register event endpoints
  app.mountModuleEndpoint('on', 'events', 'on');
  app.mountModuleEndpoint('off', 'events', 'off');
  app.mountModuleEndpoint('emit', 'events', 'emit');
});
````

This will make the three main event methods, `on`, `off` and `emit`, available as direct descendant properties of `app` so you can use `app.on('test-event', function(event) { /* ... */ })`.
