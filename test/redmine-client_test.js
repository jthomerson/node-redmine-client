'use strict';

var redmine = require('../lib/redmine-client.js');

/*
   ======== A Handy Little Nodeunit Reference ========
   https://github.com/caolan/nodeunit

   Test methods:
      test.expect(numAssertions)
      test.done()
   Test assertions:
      test.ok(value, [message])
      test.equal(actual, expected, [message])
      test.notEqual(actual, expected, [message])
      test.deepEqual(actual, expected, [message])
      test.notDeepEqual(actual, expected, [message])
      test.strictEqual(actual, expected, [message])
      test.notStrictEqual(actual, expected, [message])
      test.throws(block, [error], [message])
      test.doesNotThrow(block, [error], [message])
      test.ifError(value)
*/

exports['Redmine'] = {
   setUp: function(done) {
      // setup here
      done();
   },
   'constructor config': function(test) {
      test.expect(5);
      test.throws(
         function() {
            new redmine();
         },
         Error,
         'Error thrown for missing host and apiKey in config'
      );
      test.throws(
         function() {
            new redmine({});
         },
         Error,
         'Error thrown for missing host and apiKey in config'
      );
      test.throws(
         function() {
            new redmine({ apiKey: 'test' });
         },
         Error,
         'Error thrown for missing host in config'
      );
      test.throws(
         function() {
            new redmine({ host: 'test' });
         },
         Error,
         'Error thrown for missing apiKey in config'
      );
      var rm = new redmine({ host: 'test', apiKey: 'test' });
      test.equal(true, rm !== null, 'redmine with proper config works');
      test.done();
   },
};
