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
         } else if (doc) {
            // we have seen it before, so it can not be a 'newissue' event
            if (doc.updated_on !== iss.updated_on) {
               self.redmine.emit('updatedissue', iss);
            }
         } else {
            // We have not seen it, but that does not necessarily mean it is
            // a brand new issue. If there were issues that existed before
            // we started tracking them in our DB, they could be updates
            if (iss.created_on === iss.updated_on) {
               // This is a new issue becase the updated date is exactly the
               // same as the created date. Note that there is a race condition
               // that *could* happen here if an issue is both created and then
               // updated between our polls. Then an issue would get an updated
               // event even though we'd never sent a "newissue" event. There
               // are ways we could code against this, but the side effects are
               // not bad enough to warrant the extra complexity.
               self.redmine.emit('newissue', iss);
            } else {
               // This is essentially the "fallback" catch block for an issue
               // that was updated, but we have not seen it before so it did
               // not go into our normal "updated" block above
               self.redmine.emit('updatedissue', iss);
            }
         }
         self.issues.save(iss);
      });
   }

};


module.exports = Poller;
