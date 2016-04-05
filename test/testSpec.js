'use strict';

/*
 global describe,
 it,
 expect
 */

describe('Testing Xorb', function() {
  it('Should initialize', function() {

    app.init({
      basePath: window.location.origin + '/xorb',
      modules: [
        'events',
        'dom',
        'templates'
      ]
    });

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
  it('Should GET resources', function() {
    app.http.get('fixtures/testfile.json').then(function(response) {
      return expect(response.ok).to.be.true;
    });
  });

  it('Should GET JSON files', function() {
    app.http.getJSON('fixtures/testfile.json').then(function(response) {
      return expect(response.string).to.equal('foo bar, baz!');
    });
  });
});

describe('Testing the templates module', function() {
  it('Should initialize', function() {
    app.getScript('../src/modules/templates.js', function() {
      return expect(app.templates).to.exist;
    });
  });
});
