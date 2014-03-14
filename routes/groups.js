/*
 * GET home page.
 */

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

exports.index = function(req, res){
  var locals = {user: req.user, bootstrapData: {}};
  models.Bracket.find({user_id: req.user._id}, function(err, brackets){
    brackets = brackets.map(function(bracket){
      return {name: bracket.name, _id: bracket._id.toString()};
    });
    locals.bootstrapData.brackets = brackets;
    res.render('groups/index', locals);
  });
};

exports.getInvite = function(req, res){
  if (!req.user) {
    return res.render('groups/invite', { error_flash: 'You must be logged in.' });
  }

  var locals = { user: req.user, bootstrapData: {}};

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

  groupsModule.create({owner: req.user._id,  name: req.body.name}, req.body.bracket._id, function(err){
    if (err) {
      return res.send(400);
    }

    return res.send(200, { msg: 'Your group has been created.' });
  });
};

exports.postInvite = function(req, res) {
  var user = req.user;
  var groupId;
  var email;

  if (!req.body.email) {
    return res.send(400, { msg: 'No email was given.' });
  }

  if (!req.body.group) {
    return res.send(400, { msg: 'No group was chosen.' });
  }

  groupId = req.body.group._id;
  email = req.body.email;

  if (email === req.user.email) {
    return res.send(400, { msg: "You can't invite yourself to your own group." });
  }

  groupsModule.inviteByEmail(req.user, groupId, email, false, function(err){
    console.log('sendInvite', err);
    if (err) {
      res.send(400);
    } else {
      res.send(200, { msg: "Your invitation was sent to " + email + ". Why not invite more friends?"});
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

        locals.group = inviteToken.group.name;
        locals.sender = inviteToken.sender;
        locals.email = inviteToken.email;
        locals.bootstrapData.token = inviteToken.token;

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

exports.getManage = function(req, res) {
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
      models.User.findOne({_id: req.user._id }, {groups:1}, function(err, user){
        var groups;
        if (user) {
          groups = user.groups.map(function(group){
            return {name: group.name, _id: group._id.toString()};
          });
        }
        done(err, groups);
      });
    }
  }, function(err, data) {
    locals.bootstrapData = data;
    res.render('groups/manage', locals);
  });
};

exports.postManage = function(req, res) {
  if (!req.body.group || !req.body.bracket) {
    return res.send(400, { msg: "A group and braket must be chosen" });
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