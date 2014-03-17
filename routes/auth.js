var passport = require('passport');
var models = require('../models/connect');
var mailer = require('../modules/mailer');
var userModule = require('../modules/user');
var url = require('url');
var async = require('async');
var env = process.env;
// var FacebookStrategy = require('passport-facebook').Strategy
// var TwitterStrategy = require('passport-twitter').Strategy

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
    // request came in for register.json
    // probably from the register modal while saving a code bracket
    retjson = true;
  }

  models.User.register(new models.User({
    name: {first: req.body.first_name, last: req.body.last_name},
    nickname: req.body.nickname,
    email : req.body.email
  }), req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      if (retjson) {
        if (err.message.indexOf("User already exists") >= 0) {
          res.setHeader('Content-Type', 'application/json');
          // if the user already exists, then need to show login window to user
          req.flash('success', "This email has already been registered: "+req.body.email+". Please login or click 'Forgot Password.'");
          return res.end(JSON.stringify({show_login:true, error: err}));
        }
      } else {
        req.flash('error', err.message);
        return res.render('register', { user : user,  err: err, error_flash: req.flash('error')});
      }
    } else {
      createTokenAndSendVerifyEmail(req, user);
    }
    var theuser = user;
    if (retjson) {
      req.flash('success', "Your account was successfully created and bracket was saved. Please check your Inbox (and Spam folder) for the email verification link!");
    } else {
      req.flash('success', "Your account was successfully created. Next, please check your Inbox (and Spam folder) for the email verification link!");
    }
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
        var flashmsg = "Your email is verified. Welcome " + user.display_name + ".";
        if (!req.user) {
          flashmsg += " You can <a href='/login'>login now</a>.";
        }

        req.flash('success', flashmsg);
        return res.render('index', { success_flash: req.flash('success'), homepage: true });
      }
    });
  }
};

exports.resend_verify = function(req,res) {
  if (!req.user) {
    console.log('not logged in while resending');
    req.flash('error', "There is an error with re-sending verification email. Please us send a <a href='bugs@codersbracket.com'>bug report</a> with more info and we will try to help you.");
    res.redirect('/');
  }

  models.VerifyToken.findOneAndRemove({_userId: req.user._id});
  createTokenAndSendVerifyEmail(req, req.user);
  req.flash('success', "Verification email was re-sent. Please check your email!");
  res.redirect('/');

};

exports.login_page = function(req, res) {
  var forwardpath = req.query.forwardpath;
  res.render('login', {
    user: req.user,
    forwardpath: forwardpath,
    error_flash: req.flash('error'),
    success_flash: req.flash('success')
  });
};

exports.login = function(req, res, next) {
  var forwardpath = req.body.forwardpath;

  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      if (!req.user.verified) {
        req.flash('error', "Your account is not verified yet. Check your email for the verification link. <a href='/verify/resend'>Resend Verification Email</a>");
        res.redirect('/');
      }
      // return res.redirect('/users/' + user.username);
      if (forwardpath) {
        res.redirect(forwardpath);
      } else {
        res.redirect('/');
      }
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
};

exports.sendForgotPasswordEmail = function(req, res) {
  if (!req.body.email) {
    console.log("no email provided");
    return res.send(400, { msg: 'Email must be filled' });
  }

  var email = req.body.email;

  userModule.sendForgotPasswordEmail(email, env.SECURE_URL, function(err){
    if (err) {
      return res.send(400, {msg: 'An error occurred while sending the email. Please try again'});
    }

    return res.send(200, {msg: 'Email Sent.'});
  });
};

exports.resetPasswordPage = function(req, res) {
  var locals = {
    bootstrapData: {}
  };

  if (!req.params.token) {
    locals.error_flash = 'No token given.';
  } else {
    locals.bootstrapData.token = req.params.token;
  }

  res.render('reset_password', locals);
};


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
};
