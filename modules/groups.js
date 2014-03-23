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
        models.User.findOneAndUpdate({ _id: groupData.owner}, update, function(err){
          done(err, group);
        });
      },
    ], function(err, group){
      if (err) {
        console.log(err);
      }
      cb(err, group);
    });
  },

  update: function(group, cb) {
    var err;

    if (!group) {
      err = new Error('No group specified');
      return cb(err);
    }

    if (!group.name) {
      err = new Error('No change specified');
      return cb(err);
    }

    var groupUpdate = { $set: {'name': group.name} };
    var membersUpdate = { $set: {'groups.$.name': group.name} };

    async.parallel([
      function updateGroup(done) {
        models.Group.findByIdAndUpdate(group._id, groupUpdate, done);
      },
      function updateMembers(done) {
        models.User.update({'groups._id': group._id}, membersUpdate, {multi:true}, done);
      }
    ], function(err) {
      cb(err);
    });
  },

  inviteByEmail: function(user, groupId, emails, secureLink, cb) {
    if (typeof secureLink === 'function') {
      cb = secureLink;
      secureLink = true;
    } else {
      secureLink = secureLink === "true";
    }

    if (!emails || !emails.length) {
      return cb(null);
    }

    if (!Array.isArray(emails)) {
      emails = [emails];
    }

    if (emails.length === 1 && emails[0] === user.email) {
      var err = new Error();
      err.code = 'selfInvite';
      err.message = "You can't invite yourself to your own group.";
      return cb(err);
    } else {
      emails = emails.filter(function(email, index){
        return email !== user.email;
      });
    }
    //console.log(user, groupId, emails);

    models.Group.findOne({_id: groupId}, function(err, group){

      if (err) {
        console.log("error occured finding group", group);
        return cb(err);
      }

      var q = async.queue(function(data, done){
        models.InviteToken.create(data, function(err, inviteToken){
          var link = (secureLink ? 'https' : 'http') + "://" + process.env.APP_HOST + "/groups/invite/" + inviteToken.token;
          console.log('sendEmail', inviteToken.email, inviteToken.sender, inviteToken.group.name, link);
          mailer.sendGroupInviteEmail(inviteToken.email, inviteToken.sender, inviteToken.group.name, link, done);
        });
      }, 10);

      q.drain = function() {
        cb(null);
      };

      emails.forEach(function(email){
        q.push({
          sender: user.name.first,
          email: email,
          group: { name: group.name, _id: group._id, user: group.user }
        }, function(err) {
          if (err) {
            return console.log('inviteByEmail', err);
          }
        });
      });

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
  },

  getMembers: function(groupId, cb) {
    if (!groupId) {
      var err = new Error('group id is undefined');
      console.log(err);
      return cb(err);
    }

    models.User.find({'groups._id': groupId}, {name:1, groups:1, nickname: 1})
      .select({'groups': { $elemMatch: { _id: groupId } } })
      .populate('groups.bracket', { name: 1, score: 1})
      .sort({'groups.bracket.score': -1})
      .exec(function(err, members){
        
        // function compare(a,b) {
        //   if (a.groups[0].bracket && b.groups[0].bracket) {
        //     if (!a.groups[0].bracket.score) a.groups[0].bracket.score = 0;
        //     if (!b.groups[0].bracket.score) b.groups[0].bracket.score = 0;
        //     
        //     if (a.groups[0].bracket.score < b.groups[0].bracket.score) {
        //        return 1;
        //      } else {
        //       return -1;
        //      }
        //   } else {
        //     return 1;
        //   }
        // }
        // 
        // members.sort(compare);
        cb(err, members);
      });
  }
};

module.exports = new GroupModule();