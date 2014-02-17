var passport = require('passport');
var models = require('../models/connect');
var mailer = require('../modules/mailer');

exports.register_page = function(req, res) {
    res.render('register', { });
};

var createTokenAndSendVerifyEmail = function(req, user) {
  var verificationToken = new models.VerifyToken({_userId: user._id});
 
  verificationToken.createVerificationToken(function (err, token) {
      if (err) return console.log("Couldn't create verification token", err);
      var verify_url = req.protocol + "://" + req.get('host') + "/verify/" + token;
      
      mailer.sendVerifyEmail(user, verify_url, function (error, success) {
          if (error) {
              console.error("Unable to send email: " + error.message);
              return;
          }
          // console.info("Sent to verify email for delivery to: "+user.email);
      });
  });
};

exports.register = function(req, res) {
  models.User.register(new models.User({ 
    name: {first: req.body.first_name, last: req.body.last_name}, 
    nickname: req.body.nickname,
    email : req.body.email 
  }), req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      req.flash('error', err.message);
      return res.render('register', { user : user,  err: err, error_flash: req.flash('error')});
    } else {
      createTokenAndSendVerifyEmail(req, user);
    }
    
    req.flash('success', "Your account was successfully created. Next, please check your Inbox (and Spam folder) for the email verification link.");
    passport.authenticate('local')(req, res, function () {
      res.redirect('/');
    });
  });
};

exports.verify_email = function(req,res) {
  var token = req.params.token;
  if (token) {
    models.User.verifyUser(token, function (err, user) {
      if (err) {
        req.flash('error', err.message);
        return res.render('index', { error_flash: req.flash('error')});
      } else {
        req.flash('success', "Your email is verified. Welcome " + user.display_name + "!");
        return res.render('index', { success_flash: req.flash('success')});
      }
    })
  }
};

exports.resend_verify = function(req,res) {
  if (!req.user) {
    req.flash('error', "There is an error with re-sending verification email. Please us send a <a href='bugs@codersbracket.com'>bug report</a> with more info and we will try to help you.")
    res.redirect('/');
  }
  
  models.VerifyToken.findOneAndRemove({_userId: req.user._id});
  createTokenAndSendVerifyEmail(req, req.user);
};

exports.login_page = function(req, res) {
    res.render('login', { user : req.user });
};

exports.login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    if (!user.verified) { 
      req.flash('error', "Your account is not verified yet. Check your email for the verification link. <a href='/verify/resend'>Resend Verification Email</a>");
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/users/' + user.username);
    });
  })(req, res, next);
  res.redirect('/');
};

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

