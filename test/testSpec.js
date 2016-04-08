'use strict';

/*
 global describe,
 it,
 expect
 */

describe('Testing Xorb core', function() {
  it('Should be initialized', function() {
    expect(typeof app).to.not.be.an('undefined');
  });

  it('Should register namespaces', function() {
    app.namespace('/test/namespace', function() {
      return true;
    });

    expect(app.namespaces()).to.contain('/test/namespace');
  });

  it('Should register modules', function() {
    app.registerModule('testModule', {
      moduleProperty: 10,
      moduleMethod: function(x) {
        return x + 1;
      }
    });

    expect(app.modules()).to.contain('testModule');
    expect(app.module('testModule').moduleProperty).to.equal(10);
  });

  it('Should mount module properties as endpoints', function() {
    app.mountModuleEndpoint('exposedProperty', 'testModule', 'moduleProperty');

    expect(app.exposedProperty).to.equal(10);
  });

  it('Should mount module methods as endpoints', function() {
    app.mountModuleEndpoint('exposedMethod', 'testModule', 'moduleMethod');

    expect(app.exposedMethod(5)).to.equal(6);
  });
});

describe('Testing the Xorb HTTP API', function() {
  describe('Testing GET requests', function() {
    it('Should GET resources', function() {
      var getPromise = app.http.get('test/fixtures/testfile.json').then(response => response.ok);

      return expect(getPromise).to.eventually.be.true;
    });

    it('Should GET JSON files', function() {
      var JSON = app.http.getJSON('test/fixtures/testfile.json').then(response => response.string);

      return expect(JSON).to.eventually.equal('foo bar, baz!');
    });

    it('Should GET blobs (eg. image files)', function(done) {
      /**
       * Test will take long due to the base64 encoding and comparision.
       * The image download itself is as fast as a usual network transmission.
       */
      var testImageBase64 = 'data:image/png;base64,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',
          imagePromise = app.http.getBlob('/test/fixtures/testImage.png').then(function(blob) {
            var reader = new window.FileReader();

            reader.readAsDataURL(blob);
            reader.onloadend = function() {
              var base64data = reader.result;

              expect(base64data).to.equal(testImageBase64);
              done();
            }
          });
    });
  });
  it('Should do HEAD requests', function() {
    var headPromise = app.http.head('/test/testRunner.html').then(response => response.status);

    return expect(headPromise).to.eventually.equal(200);
  });

  it('Should do DELETE requests', function() {
    var headPromise = app.http.delete('/test/testRunner.html').then(response => response.status);

    return expect(headPromise).to.eventually.equal(405);
  });

  describe('Testing POST requests', function() {
    it('Should do POST requests', function() {
      var headPromise = app.http.post('/test/methodResponder.php').then(response => response.status);

      return expect(headPromise).to.eventually.equal(200);
    });

    it('Should POST objects as JSON', function() {
      var headPromise = app.http.post({
        url: '/test/methodResponder.php',
        data: {
          string: "foo, bar, baz!",
          array: [ 'a', 'b', 'c' ],
          object: {
            foo: "bar",
            baz: 123
          }
        }
      }).then(response => response.text()).then(response => JSON.parse(response)).then(response => response.string);
   
      return expect(headPromise).to.eventually.equal('foo, bar, baz!');
    });
  });

  it('Should do PUT requests', function() {
    var headPromise = app.http.put('/test/methodResponder.php').then(response => response.status);

    return expect(headPromise).to.eventually.equal(200);
  });

  it('Should do PATCH requests', function() {
    var headPromise = app.http.patch('/test/methodResponder.php').then(response => response.status);

    return expect(headPromise).to.eventually.equal(200);
  });

});

describe('Testing the templates module', function() {
  it('Should initialize', function() {
    expect(app.module('templates')).to.not.be.an('undefined');
  });

  it('Should render a string', function() {
    return expect(app.render('rendering is {{status}}', {status: 'working'})).to.eventually.equal('rendering is working');
  });

  it('Should render a template file', function() {
    return expect(app.http.getTemplate(
        window.location.origin + '/test/fixtures/templates/testTemplate.tpl',
        undefined,
        { status: 'working' }
    )).to.eventually.equal('rendering is working');
  });
});

describe('Testing the DOM module', function() {
  it('Should initialize', function() {
    return expect(app.module('dom')).to.not.be.an('undefined');
  });
});
