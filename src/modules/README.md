# Modules
Xorb is being accompanied by some default modules. These are described in the following chapters. See 
[here](#building-modules) on how to create your own modules.  

## DOM

## Events

## Templates
Xorbs template module allows you to render templates using one of several engines and provides an additional method to
the HTTP API which retrieves and renders template files from the server. Besides, it caches downloaded templates for 
later use.

### Rendering templates
The module exposes one main method: `render()`. It returns a promise, so to render and insert a template into your page,
you can do like so:  

````javascript
app.render('template rendering is {{status}}.', {
    status: 'working'
  }).then(function(content) {
    document.querySelector('.target-container').innerText = content;
  });
  
  /* results in:
    <div class="target-container">template rendering is working.</div>
  */
````

### Fetching templates directly from the server
To retrieve your stored template files, you could use the HTTP API (which would be easy enough), or the `getTemplate`
method provided by the module. It will be added to the `app.http` object for your convenience. Using it is simple:  

````javascript
app.http.getTemplate('exampleTemplate.hbs', function(content) {
    document.querySelector('.target-container').innerText = content;
  }, {
    status: 'working'
  });
  
  /* results in:
    <div class="target-container">template rendering is working.</div>
  */
````



### Template engines
Xorb is template-engine agnostic. Out of the box, it supports [Mustache](https://github.com/janl/mustache.js), 
[Handlebars](https://github.com/wycats/handlebars.js) and [Templates.js](https://github.com/psychobunny/templates.js).  
To use one of these you have to set `templatesModule.option.templateEngine` in `modules/templates.js` to the name of 
your preferred engine. The rest is taken care of automatically.  If you need to implement your own template engine, put 
its JS file into `lib/` and modify `modules/templates.js` to provide a render method to Xorb. Take a look at the 
following example:

````javascript
switch (templatesModule.options.templateEngine) {
  // predefined cases
  
  case 'yourOwnTemplateEnginesName':
  
    // the file path to your engine
    app.http.getScript('/src/lib/yourOwnTemplateEnginesFileName.js', function() {
    
      // the name of the variable your engine exposes
      templatesModule.templateEngine = window.yourOwnTemplateEnginesObjectName;
      
      // the method to render templates. You can do whatever you want, just make 
      // sure this returns a string or a Promise.
      templatesModule.renderMethod = function(engine, template, variables) {
      
        // engine is your template engines instance, template is the string 
        // content of your template file and variables are view variables.
        return engine.render(template, variables);
      };
    }
  break;
}
````

Now, make sure to set `templatesModule.option.templateEngine` to `yourOwnTemplateEnginesName` and you're good to go: 
Xorb will render templates using your engine. 

### API description

#### `render({string} template, {object} variables)`
**template**: The template string to be rendered.  
**variables**: an object containing view variables to resolve in the template.  
  
This method returns a promise.

#### `getTemplate({string} templatePath, {function} callback, {object} variables, {object} [params], {object} [headers])`
**templateUrl**: Path to your template. Is resolved relative to the template directory, if no http(s) is found.  
**callback**: a callback to execute once the rendered content is available.  
**variables**: an object containing view variables to resolve in the template.  
**params**: optional object with URL parameters for this request.  
**headers**: optional object with request headers for this request.  
