/*
 * redmine-client
 * https://github.com/jthomerson/redmine-client
 *
 * Copyright (c) 2014 Jeremy Thomerson
 * Licensed under the MIT license.
 */

var DB = require('tingodb')().Db;

function Poller(redmine) {
   this.running = false;
   this.redmine = redmine;
   this.db = new DB(redmine.config.polling.dbPath, {});
   this.issues = this.db.collection('issues');
}

Poller.prototype = {

   run: function() {
      if (this.running) {
         return;
      }
      this.running = true;
      this.poll();
      setInterval(
         (function(self) {
            return function() {
               self.poll();
            };
         })(this),
         this.redmine.config.polling.everySeconds * 1000
      );
   },

   poll: function() {
      console.log('Polling Redmine');
      var self = this;
      this.redmine.getAllIssues({ updated_on: '>=' + this.redmine.util.daysAgo(1).dateFormat(), limit: 10 }).then(function(issuesResp) {
         self.issuesRetrieved(issuesResp);
      });
   },

   issuesRetrieved: function(issuesResp) {
      console.log('poller got issues: ' + issuesResp.total_count + ' (' + issuesResp.limit + ')');
      if (issuesResp.limit < issuesResp.total_count) {
         console.log('need to get more issues');
      }

      var map = {};
      for (var i = 0; i < issuesResp.issues.length; i++) {
         if (map[issuesResp.issues[i].id]) {
            console.log('already had issue: ' + issuesResp.issues[i].id);
         }
         map[issuesResp.issues[i].id] = true;
         this.emitIssueIfNecessary(issuesResp.issues[i]);
      }
   },

   emitIssueIfNecessary: function(iss) {
      var self = this;
      // do this for DB:
      iss._id = iss.id;

      self.issues.findOne({ id: iss.id }, function(err, doc) {
         if (err) {
            console.log('ERROR: data retrieval error trying to find issue ' + iss.id + ' in local DB: ' + err);
            return;
         }

         if (doc) {
            // console.log('found iss: ' + iss.id + ' already in DB');
            // see if the updated_on has changed in the retrieved doc
            if (doc.updated_on !== iss.updated_on) {
               self.issues.save(iss);
               self.redmine.emit('updatedissue', iss);
            }
         } else {
            // console.log('new iss: ' + iss.id + ' not in DB');
            self.issues.save(iss);
            self.redmine.emit('newissue', iss);
         }
      });
   }

};


module.exports = Poller;
