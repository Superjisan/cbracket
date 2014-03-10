var async = require('async');
var models = require('../models/connect');
var mailer = require('../modules/mailer');

function GroupModule() {};


GroupModule.prototype = {

  create: function(userId, groupData, cb) {
    groupData.ownerId = userId;
    async.waterfall([
      function findUser(done) {
        models.User.findOne({_id: userId}, done);
      },
      function saveGroup(userModel, done) {
        userModel.groups.push(groupData);
        userModel.save(function(err){
          if (err) {
            console.log('saveGroup', err);
          }
          return cb(err);
        });
      }
    ]);
  },

  inviteByEmail: function(userId, groupId, email, secureLink, cb) {
    if (typeof secureLink === 'function') {
      cb = secureLink;
      secureLink = true;
    }

    console.log(userId, groupId, email);

    async.waterfall([
      function findUser(done) {
        models.User.findOne({_id: userId, "groups._id": groupId}, function(err, userModel){
          if (!err && !userModel) {
            err = new Error('user not found');
          }
          done(err, userModel);
        });
      },
      function updateGroups(userModel, done){
        userModel.groups.id(groupId).invites.push({ email: email, accepted: false });
        userModel.save(function(err){
          done(err, userModel);
        });
      },
      function sendEmail(userModel, done) {
        var group = userModel.groups.id(groupId);
        var inviteToken = new models.InviteToken({
          sender: userModel.name.first,
          email: email,
          group: { name: group.name, id: group._id, ownerId: group.ownerId }
        });
        var link = (secureLink ? 'https' : 'http') + "://" + process.env.APP_HOST + "/groups/invite/" + inviteToken.token;

        inviteToken.save(function(err){
          if (err) {
            return done(err);
          }

          console.log('sendEmail', email, userModel.name.first, group.name, link);
          mailer.sendGroupInviteEmail(email, userModel.name.first, group.name, link, done);
        });
      }
    ], function(err){
      if (err) {
        console.log('inviteByEmail', err);
      }
      cb(err);
    });
  },

  getGroupInviteToken: function(token, cb) {
    if (!token) {
      var err = new Error("no token provided");
      err.code = 'invalidToken';
      console.log(err);
      return cb(err);
    }

    models.InviteToken.findOne({ token: token }, function(err, inviteToken){
      if (!err && !inviteToken) {
        err = new Error("token not found");
        err.code = 'invalidToken';
      }

      if (err) {
        console.log(err);
      }

      cb(err, inviteToken);
    });
  }

};

module.exports = new GroupModule;