'use strict';

/*
 global window,
 document,
 app
 */
 
(function() {
  // check if the app itself is defined at all
  if (! app) {
    return console.error('[modules/dom] app.js has not been loaded yet');
  }
  
  // create the module object
  var domModule = {};
  

  /**
   * registers an event for dom elements
   *
   */
  domModule.on = function(eventName, selector, callback) {
    domModule.node(selector).addEventListener(eventName, callback);
  };


  /**
   * removes an event from an element
   */
  domModule.off = function(eventName, selector, callback) {
    domModule.node(selector).removeEventListener(eventName, callback);
  };


  domModule.isDomElement = function(element) {
    if (typeof element !== 'object') {
      return false;
    }

    return element instanceof HTMLElement;
  };


  /**
   * tries to resolve a given selector to a DOM node, basically a really simple
   * abstraction to the different element getters.
   */
  domModule.findBySelector = function(selector) {
    // check for ID
    if (selector.charAt(0) === '#') {
      return document.getElementById(selector.slice(1));
    }

    // check for class
    if (selector.charAt(0) === '.') {
      return document.getElementsByClassName(selector.slice(1));
    }

    // check for everything else
    return document.querySelectorAll(selector);
  };

  /**
   * shorthand for the findBySelector method
   */
  domModule.el = function(selector) {
    return domModule.findBySelector(selector);
  };


  /**
   * shorthand for the findBySelector method to retrieve a single element
   * @param selector
   */
  domModule.singleNode = function(selector) {
    var results = domModule.el(selector);

    if (results instanceof NodeList) {
      return results[ 0 ];
    }

    return results;
  };


  domModule.each = function(elementList, callback, context) {
    context = context || window;

    switch (typeof elementList) {
      case 'string':
        elementList = domModule.el(elementList);
        break;

      case 'object':
        if (Array.isArray(elementList)) {
          if (! domModule.isDomElement(elementList[ 0 ])) {
            return false;
          }
        }
        break;
      default:
        return false;
    }

    for (var element = 0; element < elementList.length; element++) {
      /**
       * execute the callback in the given context with the following arguments:
       *  1. the current element
       *  2. the current index
       *  3. the original element list
       */
      callback.call(context, elementList[ element ], element, elementList);
    }
  };


  domModule.firstOfClass = function(selector) {
    var elements = domModule.el(selector);

    return (typeof elements[ 0 ] !== 'undefined'
        ? elements[ 0 ]
        : undefined
    );
  };
  
  
  domModule.lastOfClass = function(selector) {
    var elements = domModule.el(selector);

    return (typeof elements[ elements.length - 1 ] !== 'undefined'
        ? elements[ elements.length - 1 ]
        : undefined
    );
  };
  
    
  // register the module in the app
  app.loadModule('dom', domModule, function() {

    // register event endpoints
    app.mountModuleEndpoint('dom', 'dom');
  });
})();
