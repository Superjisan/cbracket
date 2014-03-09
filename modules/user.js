var async = require('async');
var models = require('../models/connect');
var mailer = require('../modules/mailer');

function UserModule() {};


UserModule.prototype = {

  sendForgotPasswordEmail: function(email, secureLink, cb) {
    var resetToken = new models.ResetToken({ email: email });
    var link = secureLink ? 'https' : 'http' + "://" + process.env.APP_HOST + "/reset-password/" + resetToken.token;

    async.series([
      function saveToken(done) {
        resetToken.save(function(err){
          if (err) {
            console.log("error saving token", err);
            err = {msg: 'An error occured, please try again'};
          }

          done(err);
        });
      },
      function sendEmail(done) {
        mailer.sendForgotPasswordEmail(email, link, function(err, success){
          if (err || !success) {
            console.log(err);
          }

          done(err);
        });
      }
    ], function(err, result){
      if (err) {
        console.log(err);
      }

      cb(err);
    });
  },

  resetPassword: function(token, password, cb) {
    var invalidTokenErrMsg = "The token provided is invalid.";
    var defaultErr = new Error("We could not reset your password at this time.");

    async.waterfall([
      function validateToken(done){
        models.ResetToken.findOne({token: token}, function(err, tokenModel){
          if (!err && !tokenModel) {
            console.log('invalid token', token, password);
            err = new Error("invalid token");
          }
          done(err, tokenModel);
        });
      },
      function findUser(tokenModel, done) {
        models.User.findOne({ email: tokenModel.email }, done);
      },
      function setPassword(userModel, done) {
        userModel.setPassword(password, function(err){
          userModel.save(done);
        });
      }
    ], function(err){
      if (err) {
        console.log(err);
        err = (err.message === invalidTokenErrMsg) ? err : defaultErr;
      }

      cb(err);
    });
  },

  update: function(userId, updates, password, cb) {
    if (typeof password === 'function') {
      cb = password;
    }

    async.waterfall([
      function getUser(done) {
        models.User.findOne({_id: userId}, done);
      },
      function updateUser(userModel, done) {
        userModel.set(updates);

        if (password) {
          userModel.setPassword(password, function(err){
            done(err, userModel);
          });
        } else {
          done(null, userModel);
        }
      },
      function saveUser(userModel, done) {
        userModel.save(function(err){
          done(err);
        });
      }
    ], function(err){
      if (err) {
        console.log(err);
      }

      cb(err);
    });
  }
};

module.exports = new UserModule;