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

function chainTogether(method, params, fieldName, deferred, all, offset) {
   params.limit = 100;
   params.offset = offset;

   method(params).then(function(resp) {
      var these = resp[fieldName],
          combined = all.concat(these);

      // console.log('received: ' + these.length + '; combined len: ' + combined.length + '; total: ' + resp.total_count);
      if (combined.length < resp.total_count) {
         chainTogether(method, params, fieldName, deferred, combined, offset + these.length);
      } else {
         resp[fieldName] = combined;
         resp.offset = 0;
         resp.limit = combined.length;
         // console.log('chainTogether found ' + combined.length + ' total ' + fieldName);
         deferred.resolve(resp);
      }
   });

   return deferred.promise;
}

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
             path + (params ? ('?' + querystring.stringify(params)) : '');
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

   getIssueURL: function(issueID) {
      return this.createURL('/issues/' + issueID);
   },

   getGroup: function(gid, params) {
      params = !params ? { include: 'users' } : params;
      return this.request('GET', '/groups/' + gid + '.json', params);
   },

   getGroups: function(params) {
      return this.request('GET', '/groups.json', params);
   },

   getIssue: function(issueID, params) {
      return this.request('GET', '/issues/' + issueID + '.json', params);
   },

   getAllIssues: function(params) {
      var deferred = Q.defer(),
          self = this,
          all = [];

      return chainTogether(function(params) {
         return self.getIssues(params);
      }, params, 'issues', deferred, all, 0);
   },

   getIssues: function(params) {
      return this.request('GET', '/issues.json', params);
   }

};


module.exports = Redmine;
