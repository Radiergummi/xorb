
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

  it('Should delay for 3 seconds', function() {
    setTimeout(function() {
      resume();
    }, 3000);

    function resume() {
      expect(app).to.not.be.an('undefined');
    }
  });
});

describe('Testing the Xorb HTTP API', function() {
  it('Should GET resources', function() {
    app.http.get('test/fixtures/testfile.json').then(function(response) {
      return expect(response.ok).to.be.true;
    });
  });

  it('Should GET JSON files', function() {
    app.http.getJSON('test/fixtures/testfile.json').then(function(response) {
      return expect(response.string).to.equal('foo bar, baz!');
    });
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
      window.location.origin + '/xorb/test/fixtures/templates/testTemplate.tpl',
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
