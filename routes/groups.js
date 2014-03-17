/*
 * GET home page.
 */
var _ = require('underscore');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var mailer = require('../modules/mailer');
var fs = require('fs');
var path = require('path');
var async = require('async');
var models = require('../models/connect');
var userModule = require('../modules/user');
var groupsModule = require('../modules/groups');
var passport = require('passport');

exports.getCreate = function(req, res){
  var locals = {user: req.user, bootstrapData: {}};
  models.Bracket.find({user_id: req.user._id}, function(err, brackets){
    brackets = brackets.map(function(bracket){
      return {name: bracket.name, _id: bracket._id.toString()};
    });
    locals.bootstrapData.brackets = brackets;
    res.render('groups/create', locals);
  });
};

exports.getInvite = function(req, res){
  if (!req.user) {
    return res.render('groups/invite', { error_flash: 'You must be logged in.' });
  }

  var locals = { user: req.user, bootstrapData: {}};
  console.log('invite');
  models.User.findOne({_id: req.user._id }, {groups:1}, function(err, user){
    var groups;
    if (user) {
      groups = user.groups.map(function(group){
        return {name: group.name, _id: group._id.toString()};
      });
    }
    locals.bootstrapData.groups = groups;
    res.render('groups/invite', locals);
  });

  /** Use if can only invite ppl to group you created ***
  models.Group.find({user: req.user._id }, {name:1, _id:1}, function(err, groups){
    groups = groups.map(function(group){
      return {name: group.name, _id: group._id.toString()};
    });
    locals.bootstrapData.groups = groups;
    res.render('groups/invite', locals);
  });
  */
};

exports.create = function(req, res) {
  if (!req.body.name) {
    return res.send(400, { msg: 'Name is required' });
  }

  var emails = req.body.emails;

  async.waterfall([
    function createGroup(done) {
      groupsModule.create({owner: req.user._id,  name: req.body.name}, req.body.bracket._id, function(err, group){
        if (err) {
          return done(err);
        }
        console.log('created group: ', group);
        done(err, group);
      });
    },
    function inviteFriends(group, done) {
      if (!emails) {
        return done(null);
      }

      groupsModule.inviteByEmail(req.user, group._id, emails, false, function(err){
        if (err) {
          console.log('sendInvite', err);
        }
        done(err);
      });
    }
  ], function(err){
      var msg = 'Your group has been created';
      if (err && err.code !== 'selfInvite') {
        return res.send(400);
      } else if (!err && emails) {
        msg += ' and your invites have been sent.';
      } else{
        msg += '.';
      }
      return res.send(200, { msg: msg });
  });
};

exports.view = function(req, res) {
  if (!req.params.id) {
    return res.send(400, { msg: 'Groups are required' });
  }

  var locals = {user: req.user};
  var groupId = req.params.id;

  async.parallel({
    group: function(done) {
      models.Group.findById(groupId, 'name', function(err, group) {
        if (!err && !group) {
          err = new Error("group not found");
        }
        done(err, group);
      });
    },
    members: function(done) {
      groupsModule.getMembers(groupId, done);
    }
  }, function(err, data){
    if (err) {
      locals.error_flash = "An error occured";
    } else {
      locals.group = data.group;
      locals.members = data.members;
    }
    res.render('groups/view', locals);
  });
};

exports.settings = function(req, res) {
  if (!req.params.id) {
    return res.send(400, { msg: 'Groups are required' });
  }

  var locals = {user: req.user, bootstrapData:{}};
  var groupId = req.params.id;

  async.parallel({
    group: function(done){
      models.User.findOne({ _id: req.user._id, 'groups._id': groupId }, { groups: 1 })
        .populate('groups.bracket')
        .exec(function(err, user){
          if (!err && !user) {
            err = new Error("group not found");
          }

          if (err) {
            console.log('error viewing group', groupId, err);
          }

          done(err, user && user.groups ? user.groups.id(groupId) : null);
      });
    },
    brackets: function(done){
      models.Bracket.find({user_id: req.user._id}, function(err, brackets){
        brackets = brackets.map(function(bracket){
          return {name: bracket.name, _id: bracket._id.toString()};
        });
        done(err, brackets);
      });
    }
  }, function(err, data) {
      if (err) {
        console.log('error viewing group', groupId, err);
        return res.send(400);
      }

      locals.bootstrapData = data;
      res.render('groups/settings', locals);
  });
}

exports.update = function(req, res) {
  if (!req.body.group || !req.body.group._id) {
    res.send(400, { msg: 'You must choose a group' });
  }

  var group = req.body.group;
  var updateUser;

  if (req.body.bracket) {
    updateUser = { $set: {'groups.$.bracket': req.body.bracket._id} };
  }

  // TODO: Verify that user owns bracket
  async.parallel([
    function updateUserBracket(done){
      if (!updateUser) {
        return done(null);
      }
      models.User.findOneAndUpdate({_id: req.user._id, 'groups._id': group._id}, updateUser, done);
    },
    function updateGroup(done) {
      groupsModule.update(group, done);
    }
  ], function(err){
    if (err) {
      console.log('update group error', err);
      return res.send(400);
    }

    return res.send(200, { msg: 'Your group has been updated.' });
  });
};

exports.postInvite = function(req, res) {
  var user = req.user;
  var groupId;
  var emails;

  if (!req.body.emails) {
    return res.send(400, { msg: 'No email was given.' });
  }

  if (!req.body.group) {
    return res.send(400, { msg: 'No group was chosen.' });
  }

  groupId = req.body.group._id;
  emails = req.body.emails;

  groupsModule.inviteByEmail(req.user, groupId, emails, false, function(err){
    var errorMsg = "An error occured";

    if (err) {
      console.log('sendInvite', err);
      errorMsg = (err.code === 'selfInvite') ? err.message : errorMsg;
      res.send(400, { msg: errorMsg });
    } else {
      res.send(200, { msg: "Your friends have been invited. Why not invite more friends?"});
    }
  });
};

exports.viewInvite = function(req, res) {
  var token = req.params.token;
  var locals = { bootstrapData: {} };

  async.waterfall([
    function verifyToken(done) {
      groupsModule.verifyGroupInviteToken(token, function(err, inviteToken){
        if (err) {
         return done(err);
        }

        if (inviteToken.accepted) {
          locals.error_flash = "You have already accepted this invitation";
        } else {
          locals.group = inviteToken.group.name;
          locals.sender = inviteToken.sender;
          locals.email = inviteToken.email;
          locals.bootstrapData.token = inviteToken.token;
        }

        done(err, inviteToken);
      });
    },
    function checkIfUserExist(inviteToken, done) {
      models.User.findOne({ email: inviteToken.email }, function(err, userModel){
        if (userModel) {
          locals.user = userModel;
        }

        done(err, userModel);
      });
    },
    function loginExistingUser(userModel, done) {
      if (userModel) {
        req.login(userModel, done);
      } else {
        done(null);
      }
    }
  ], function(err){
    res.render('groups/view_invite', locals);
  });
};

exports.acceptInvite = function(req, res) {
  var token = req.params.token;

  async.waterfall([
    function markAccepted(done){
      groupsModule.acceptInviteToken(token, done);
    },
    function updateAccount(inviteToken, done) {
      console.log('updateAccount');
      groupsModule.addUserFromInvite(inviteToken, function(err, userModel){
        done(err, inviteToken, !userModel);
      });
    },
    function createNewAccount(inviteToken, createAccount, done) {
      if (!createAccount) {
        return done(null, inviteToken);
      }

      userModule.register({
        first_name: req.body.user.name.first,
        last_name: req.body.user.name.last,
        nickname: req.body.user.nickname,
        email: inviteToken.email,
        password: req.body.user.password,
        // Since this flow starts with a link from email the user is already email verified
        // Might need to do extra things for mandril later on
        verified: true
      }, function(err) {
        if (err) {
          return done(err);
        }
        groupsModule.addUserFromInvite(inviteToken, function(err, userModel){
          if (err) {
            return done(err);
          }
          req.login(userModel, function(err){
            done(err, inviteToken);
          });
        });
      });
    }
  ], function(err, inviteToken) {
    var msg = 'An error occured. Please try again at a later time';
    if (err) {
      console.log('acceptInvite', err);
      msg = err.code === 'invalidToken' ? err.message : msg;
      return res.send(400, { msg: msg });
    }

    return res.send(200, { msg: 'You are now in the "' + inviteToken.group.name + '" group.' });
  });

};

exports.getIndex = function(req, res) {
  var locals = {user: req.user, bootstrapData:{}};
  async.parallel({
    brackets: function(done){
      models.Bracket.find({user_id: req.user._id}, function(err, brackets){
        brackets = brackets.map(function(bracket){
          return {name: bracket.name, _id: bracket._id.toString()};
        });
        done(err, brackets);
      });
    },
    groups: function(done){
      models.User.findOne({_id: req.user._id }, {groups:1})
        .populate('groups.bracket')
        .exec(function(err, user){
          var groups;
          if (user) {
            groups = user.groups.map(function(group){
              console.log(group);
              return {name: group.name, _id: group._id.toString(), bracket: group.bracket};
            });
          }
          done(err, groups);
      });
    }
  }, function(err, data) {
    locals.bootstrapData = data;
    res.render('groups/index', locals);
  });
};

exports.postManage = function(req, res) {
  if (!req.body.group || !req.body.bracket) {
    return res.send(400, { msg: "A group and bracket must be chosen" });
  }
  var group = req.body.group;
  var bracket = req.body.bracket;

  groupsModule.assignBracket(req.user._id, bracket._id, group._id, function(err){
    if (err) {
      return res.send(400, { msg: "Error assigning bracket." });
    }

    res.send(200, { msg: "The bracket has been assigned" });
  });
};