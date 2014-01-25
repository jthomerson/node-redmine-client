/*
 * redmine-client
 * https://github.com/jthomerson/redmine-client
 *
 * Copyright (c) 2014 Jeremy Thomerson
 * Licensed under the MIT license.
 */

var MILLIS = {};
MILLIS.SECOND = 1000;
MILLIS.MINUTE = 60 * MILLIS.SECOND;
MILLIS.HOUR = 60 * MILLIS.MINUTE;
MILLIS.DAY = 24 * MILLIS.HOUR;


function zeropad(v) {
   return v < 10 ? ('0' + v) : v;
}

function RedmineDate(date) {
   this.date = date;
}

RedmineDate.prototype = {

   dateAndTimeFormat: function() {
      // NOTE: although this is the documented format, it does not appear
      // to work and causes an error to be returned by the API
      var f = this.dateFormat() +
              'T' + zeropad(this.date.getUTCHours()) +
              ':' + zeropad(this.date.getUTCMinutes()) +
              ':' + zeropad(this.date.getUTCSeconds()) +
              'Z';
      return f;
   },

   dateFormat: function() {
      return this.date.getUTCFullYear() + '-' +
             zeropad(this.date.getUTCMonth() + 1) + '-' +
             zeropad(this.date.getUTCDate());
   }

};

function RedmineUtil(redmine) {
   this.redmine = redmine;
}

RedmineUtil.prototype = {

   daysAgo: function(adjust) {
      var d = new Date();
      d.setTime(d.getTime() - (adjust * MILLIS.DAY));
      return new RedmineDate(d);
   },

};


module.exports = RedmineUtil;
