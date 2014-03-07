var passport = require('passport');
var models = require('../models/connect');
var mailer = require('../modules/mailer');
var userModule = require('../modules/user');
var url = require('url');
var async = require('async');

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
  var retjson = false;
  var url_parts = url.parse(req.url);
  if (url_parts.path.indexOf('json')>=0) {
    retjson = true;
  }

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
    var theuser = user;
    req.flash('success', "Your account was successfully created. Next, please check your Inbox (and Spam folder) for the email verification link!");
    passport.authenticate('local')(req, res, function () {
      if (retjson) {
        res.setHeader('Content-Type', 'application/json');
        delete theuser['salt'];
        delete theuser['hash'];
        res.end(JSON.stringify({user:theuser}));
      } else {
        res.redirect('/');
      }
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
      res.redirect('/');
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      // return res.redirect('/users/' + user.username);
      res.redirect('/');
    });
  })(req, res, next);
  // res.redirect('/');
};

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

exports.forgotPassword = function(req, res) {
  res.render('forgot_password');
}

exports.sendForgotPasswordEmail = function(req, res) {
  if (!req.body.email) {
    console.log("no email provided");
    return res.send(400, { msg: 'Email must be filled' });
  }

  var email = req.body.email;

  userModule.sendForgotPasswordEmail(email, false, function(err){
    if (err) {
      return res.send(400, {msg: 'An error occurred while sending the email. Please try again'});
    }

    return res.send(200, {msg: 'Email Sent.'});
  });
}

exports.resetPasswordPage = function(req, res) {
  var locals = {};

  if (!req.params.token) {
    locals.error_flash = 'No token given.';
  } else {
    locals.token = req.params.token;
  }

  res.render('reset_password', locals);
}

exports.resetPassword = function(req, res) {
  console.log(req.body, req.query);
  if (!req.body.token || !req.body.password) {
    return res.send(400, { msg: 'Required fields missing.' });
  }

  var token = req.body.token;
  var password = req.body.password;

  userModule.resetPassword(token, password, function(err){
    if (err) {
      return res.send(400, { msg: err.message });
    }

    return res.send(200, { msg: 'Your password has been reset.' });
  });
}