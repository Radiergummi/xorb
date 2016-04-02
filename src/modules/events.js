'use strict';

/*
 global window,
 document,
 app
 */
 
(function() {
  // check if the app itself is defined at all
  if (! app) {
    return console.error('[modules/events] app.js has not been loaded yet');
  }
  
  // create the module object
  var eventModule = {
    events: {}
  };
  
  
  /**
   * on function.
   * adds a callback to an event stack
   *
   * @param {string} type        the event to subscribe to
   * @param {function} callback  the event callback to subscribe
   *
   * @return void
   */
  eventModule.on = function(type, callback) {
    // if there is no callback registered for this event yet, create an array for this event
    if (! this.events.hasOwnProperty(type)) {
      this.events[ type ] = [];
    }

    // push the event callback to the handler stack
    this.events[ type ].push(callback);
  };
  
  
  /**
   * off function.
   * removes a callback from an event stack
   *
   * @param {string} type        the event to unsubscribe from
   * @param {function} callback  the event callback to unsubscribe
   *
   * @return {boolean}           whether the callback was removed or not
   */
  eventModule.off = function(type, callback) {
    // if the event does not exist, return false
    if (! type in this.events) {
      return false;
    }
    
    // if no callback to unsubscribe was given, remove all callbacks
    if (typeof callback === 'undefined') {
      return delete this.events[ type ];
    }

    // iterate over handlers, remove the callback in question
    this.events[ type ] = this.events[ type ].filter(
      function(item) {
        if (item !== callback) {
          return item;
        }
      }
    );

    return true;
  };
  
  
  /**
   * emit function.
   * calls all registered callbacks for an event
   * 
   * @param {string} type       the event to trigger callbacks for
   * @param {*}      [data]     optional data to hand over to the callbacks
   * @param {*}      [context]  optional context to hand over to the callbacks,
   *                            defaults to window
   * 
   * @return {boolean}          whether the event has been fired
   */
  eventModule.emit = function(type, data, context) {
    // use an empty object if no data given
    data = data || {};
    
    // use window as the context if no context given
    context = context || window;

    // the event does not exist.
    if (! this.events.hasOwnProperty(type)) {
      return false;
    }

    // iterate over all callbacks, run them as expected
    for (var i = 0; i < this.events[ type ].length; i++) {
      this.events[ type ][ i ].call(context, type, data);
    }

    return true;
  };


  /**
   * getEvents function.
   * returns all registered events.
   *
   * @return {Array}  the list of events
   */
  eventModule.getEvents = function () {
    var events = [];

    for (var event in this.events) {
      if (! this.events.hasOwnProperty(event)) continue;

      events.push(event);
    }

    return events;
  };
  
  // register the module in the app
  app.loadModule('events', eventModule, function() {

    // register event endpoints
    app.mountModuleEndpoint('on', 'events', 'on');
    app.mountModuleEndpoint('off', 'events', 'off');
    app.mountModuleEndpoint('emit', 'events', 'emit');
  });
  
  // return the module
  return eventModule;
})();
