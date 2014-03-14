var async = require('async');
var models = require('../models/connect');
var mailer = require('../modules/mailer');

function GroupModule() {}


GroupModule.prototype = {

  create: function(groupData, bracketId, cb) {
    if (typeof bracketId === 'function') {
      cb = bracketId;
      bracketId = null;
    }

    async.waterfall([
      function createGroup(done){
        models.Group.create(groupData, done);
      },
      function saveGroupToUser(group, done){
        var update;

        group = group.toObject();

        if (bracketId) {
          group.bracket = bracketId;
        }

        update = { $push: {groups: group } };
        models.User.findOneAndUpdate({ _id: groupData.owner}, update, done);
      },
    ], function(err){
      if (err) {
        console.log(err);
      }
      cb(err);
    });
  },

  inviteByEmail: function(user, groupId, email, secureLink, cb) {
    if (typeof secureLink === 'function') {
      cb = secureLink;
      secureLink = true;
    }

    console.log(user, groupId, email);

    async.waterfall([
      function getGroup(done) {
        models.Group.findOne({_id: groupId}, done);
      },
      function createInviteToken(group, done){
        models.InviteToken.create({
          sender: user.name.first,
          email: email,
          group: { name: group.name, _id: group._id, user: group.user }
        }, done);
      },
      function sendEmail(inviteToken, done){
        var link = (secureLink ? 'https' : 'http') + "://" + process.env.APP_HOST + "/groups/invite/" + inviteToken.token;

        console.log('sendEmail', email, inviteToken.sender, inviteToken.group.name, link);
        mailer.sendGroupInviteEmail(email, inviteToken.sender, inviteToken.group.name, link, done);
      }
    ], function(err){
        if (err) {
          console.log('inviteByEmail', err);
        }
        cb(err);
    });
  },

  verifyGroupInviteToken: function(token, cb) {
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
  },

  acceptInviteToken: function(token, cb) {
    if (!token) {
      var err = new Error("no token provided");
      err.code = 'invalidToken';
      console.log(err);
      return cb(err);
    }

    var update = { $set: {'accepted': true} };
    models.InviteToken.findOneAndUpdate({ token: token }, update, function(err, inviteToken){
      if (!err && !inviteToken) {
        err = new Error("token not found");
        err.code = 'invalidToken';
      }
      if (err) {
        console.log(err);
      }
      cb(err, inviteToken);
    });
  },

  addUserFromInvite: function(inviteToken, cb) {
    var update = { $push: {groups: inviteToken.group.toObject() } };
    models.User.findOneAndUpdate({ email: inviteToken.email }, update, function(err, userModel){
      cb(err, userModel);
    });
  },

  assignBracket: function(userId, bracketId, groupId, cb) {
    var update = { $set: {'groups.$.bracket': bracketId} };
    models.User.findOneAndUpdate({_id: userId, 'groups._id': groupId }, update, function(err){
      if (err) {
        console.log('assignBracket', err);
      }
      cb(err);
    });
  }
};

module.exports = new GroupModule();