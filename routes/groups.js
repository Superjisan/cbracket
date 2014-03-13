/*
 * GET home page.
 */

var mongoose = require('mongoose');
var mailer = require('../modules/mailer');
var fs = require('fs');
var path = require('path');
var async = require('async');
var models = require('../models/connect');
var userModule = require('../modules/user');
var groupsModule = require('../modules/groups');
var passport = require('passport');

exports.index = function(req, res){
  res.render('groups/index', {user: req.user});
};

exports.invite = function(req, res){
  if (!req.user) {
    return res.render('groups/invite', { error_flash: 'You must be logged in.' });
  }

  var locals = { user: req.user, bootstrapData: {}};
  userModule.getGroups(req.user._id, function(err, groups){
    console.log('groups', groups);
    locals.bootstrapData.groups = groups;
    res.render('groups/invite', locals);
  });
};

exports.create = function(req, res) {
  if (!req.user) {
    return res.send(400, { msg: 'You must be logged in.' });
  }

  if (!req.body.name) {
    return res.send(400, { msg: 'Name is required' });
  }

  groupsModule.create(req.user._id, { name: req.body.name}, function(err){
    if (err) {
      return res.send(400);
    }

    return res.send(200, { msg: 'Your group has been created.' });
  });
};

exports.sendInvite = function(req, res) {
  var user = req.user;
  var groupId;
  var email;

  if (!user) {
    return res.send(400, { msg: 'You must be logged in.' });
  }

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
      groupsModule.getGroupInviteToken(token, function(err, inviteToken){
        if (err) {
         if (err.code === 'invalidToken') {
           locals.error_flash = "This token is invalid.";
         }
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
    function verifyToken(done){
      groupsModule.getGroupInviteToken(token, function(err, inviteToken){
        if (!err && !inviteToken) {
          err = new Error('This token is invalid');
          err.code = 'invalidToken';
        }
        done(err, inviteToken);
      });
    },
    function updateToken(inviteToken, done) {
      console.log('updateToken');
      inviteToken.set('accepted', true);
      inviteToken.save(function(err){
        done(err, inviteToken);
      });
    },
    function updateAccount(inviteToken, done) {
      console.log('updateAccount');
      groupsModule.addUser(inviteToken, function(err, userModel){
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
        groupsModule.addUser(inviteToken, function(err, userModel){
          if (err) {
            return done(err);
          }
          req.login(userModel, function(err){
            done(err);
          });
        });
      });
    }
  ], function(err, inviteToken) {
    console.log('acceptInvite', err);
    var msg = 'An error occured. Please try again at a later time';
    if (err) {
      console.log('acceptInvite', err);
      msg = err.code === 'invalidToken' ? err.message : msg;
      return res.send(400, { msg: msg });
    }

    return res.send(200, { msg: 'You are now in the "' + inviteToken.group.name + '" group.' });
  });

};

exports.managePage = function(req, res) {
  if (!req.user) {
    return res.render('groups/manage', {error_flash:'You must be signed in to view this page.'});
  }

  async.parallel({
    getBrackets: function(done){
      done();
    },
    getGroups: function(done){
      models.User.findOne({ _id: req.user._id }, {groups:'*'}, function(err){
        done(err);
      });
    }
  }, function(err, data) {
    res.render('groups/manage', data);
  });
}

exports.manage = function(req, res) {
  if (!req.body.group || !req.body.bracket) {
    return res.send(400, { msg: "A group and braket must be chosen" });
  }
  var group = req.body.group;
  var bracket = req.body.bracket;

  groupsModule.assignBracket(bracket._id, group._id, function(err){
    if (err) {
      return res.send(400, { msg: "Error assigning bracket." });
    }

    res.send(200, { msg: "The bracket has been assigned" })
  });
}