var async = require('async');
var models = require('../models/connect');
var mailer = require('../modules/mailer');

function GroupModule() {};


GroupModule.prototype = {

  inviteByEmail: function(userId, groupId, email) {
    async.waterfall([
      function findUser(done) {
        models.User.findOne({_id: userId, "groups.id": groupId}, done);
      },
      function sendEmail(userModel){
        console.log(userModel);
      }
    ], function(err){

    });
  }

};

module.exports = new GroupModule;