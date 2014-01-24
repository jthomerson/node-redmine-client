/*
 * redmine-client
 * https://github.com/jthomerson/redmine-client
 *
 * Copyright (c) 2014 Jeremy Thomerson
 * Licensed under the MIT license.
 */

var request     = require('request'),
    Q           = require('q'),
    querystring = require('querystring');

function Redmine(config) {
   if (!config || !config.host || !config.apiKey) {
      throw new Error("ERROR: you must define both your host and your apiKey in the Redmine config");
   }
   this.config = config;
}

Redmine.prototype = {

   createURL: function(path, params) {
      if (path.slice(0, 1) !== '/') {
         path = '/' + path;
      }
      return (this.config.https ? 'https' : 'http') + '://' +
             this.config.host +
             path + '?' + querystring.stringify(params);
   },

   request: function(method, path, params) {
      var options = {
            url: this.createURL(path, params),
            method: method,
            headers: {
               'X-Redmine-API-Key': this.config.apiKey
            }
         },
         deferred = Q.defer();

      if (this.config.user && this.config.pass) {
         options.auth = { user: this.config.user, pass: this.config.pass };
      }

      request(options, function(err, res, body) {
         if (err) {
            deferred.fail(err);
         }
         deferred.resolve(JSON.parse(body));
      });

      return deferred.promise;
   },

   getGroup: function(gid, params) {
      params = !params ? { include: 'users' } : params;
      return this.request('GET', '/groups/' + gid + '.json', params);
   },

   getGroups: function(params) {
      return this.request('GET', '/groups.json', params);
   },

   getIssues: function(params) {
      return this.request('GET', '/issues.json', params);
   }

};


module.exports = Redmine;
