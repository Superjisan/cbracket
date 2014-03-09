/*
 * GET home page.
 */

var mongoose = require('mongoose');
var mailer = require('../modules/mailer');
var fs = require('fs');
var path = require('path');
var userModule = require('../modules/user');
var groupsModule = require('../modules/groups');

exports.index = function(req, res){
  res.render('groups/index', {user: req.user});
};

exports.invite = function(req, res) {
  var user = req.user;

  if (!user) {
    return res.send(400, { msg: 'You must be logged in.' });
  }

  if (!req.body.email) {
    return res.send(400, { msg: 'No email was given.' });
  }

  return res.send(200, { msg: 'cool' });

  var groupId = 1;

  groupsModule.inviteByEmail(req.user, groupId, email, function(err){

  });
}