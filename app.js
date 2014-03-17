
/**
 * Module dependencies.
 */

var express = require('express');
var swig = require('swig');
require('./filters')(swig);
var routes = require('./routes');
var user = require('./routes/user');
var auth = require('./routes/auth');
var groups = require('./routes/groups');
var http = require('http');
var flash = require('connect-flash');
var MongoStore = require('connect-mongo')(express);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var path = require('path');
var sass = require('node-sass');
var teams = require("./modules/teams");
// var name = require("./modules/name_interpolation.js")
var env = process.env;

env.DB_NAME = 'hackersbracket';

app = express();
app.engine('html', swig.renderFile);

// all environments
app.set('env', env.NODE_ENV);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({uploadDir:path.join(__dirname, 'public-src')}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('fullstackrox!!'));
app.use(express.session({
  cookie: {
    maxAge: 3600000
  },
  store: new MongoStore({ url: process.env.MONGOHQ_MASTER_HOST || 'mongodb://localhost/hackersbracket' })
}));
// app.use(express.cookieSession({ secret: 'tobo!', cookie: { maxAge: new Date(Date.now() +     3600000), }}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public-src', express.static(__dirname + '/public-src'));

// development only
if ('development' == app.get('env')) {
  env.APP_HOST = '127.0.0.1:3000';
  env.SECURE_URL = false;
  swig.setDefaults({ cache: false });
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
} else {
  env.APP_HOST = 'www.codersbracket.com';
}

if ('production' == app.get('env')) {
  env.SECURE_URL = true;

  app.use(express.errorHandler());

  // SSL redirect
  /* At the top, with other redirect methods before other routes */
  app.get('*', function(req,res,next){
    if(req.headers['x-forwarded-proto']!='https') {
      res.redirect('https://www.codersbracket.com'+req.url);
    } else {
      next(); /* Continue to other routes if we're not redirecting */
    }
  });

}

function ensureAuthenticated(req, res, next) {
 if (req.isAuthenticated()) { return next(); }
 res.redirect('/login?forwardpath='+req.originalUrl)  //Or whatever your main page is
};

// passport config
app.get('/', routes.index);
app.get('/code_bracket', routes.code_bracket);
app.get('/code_bracket/:id', routes.view_code_bracket);
app.post('/save_bracket', routes.save_bracket);
app.post('/waitlist', routes.subscribe);
app.get('/teamsbysid.js', routes.teamsbysid);
app.get('/donate', ensureAuthenticated, user.donate_page);
app.post('/donate', user.donate)
//static pages
app.get('/contest/timeline', routes.timeline);
app.get('/contest/rules', routes.contest_rules);
app.get('/contest/prizes', routes.contest_prizes);
app.get('/contact', routes.contact);
app.get('/about', routes.about);



//logged in pages
app.get('/mybrackets', ensureAuthenticated, routes.mybrackets);

//authentication routes
app.get('/verify/resend', ensureAuthenticated, auth.resend_verify);
app.get('/verify/:token', auth.verify_email);
app.get('/register', auth.register_page);
app.post('/register', auth.register);
app.post('/register.json', auth.register);
app.get('/login', auth.login_page);
app.post('/login', auth.login);
app.get('/logout', auth.logout);
app.get('/forgot-password', auth.forgotPassword);
app.post('/forgot-password', auth.sendForgotPasswordEmail);
app.get('/reset-password', auth.resetPasswordPage);
app.get('/reset-password/:token', auth.resetPasswordPage);
app.post('/reset-password', auth.resetPassword);
app.get('/account', ensureAuthenticated, routes.account);
app.post('/account', ensureAuthenticated, routes.updateAccount);
app.get('/groups', ensureAuthenticated, groups.getIndex);
app.get('/groups/create', ensureAuthenticated, groups.getCreate);
app.post('/groups', ensureAuthenticated, groups.create);
app.put('/groups', ensureAuthenticated, groups.update);
app.post('/groups/invite', ensureAuthenticated, groups.postInvite);
app.get('/groups/invite/:token', groups.viewInvite);
app.post('/groups/invite/:token', groups.acceptInvite);
app.post('/groups/manage', ensureAuthenticated, groups.postManage);
app.get('/groups/:id/settings', ensureAuthenticated, groups.settings);
app.get('/groups/:id', ensureAuthenticated, groups.view);
// global.allteams = [];


var mongoose = require('mongoose');
var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/hackersbracket';

mongoose.connect(mongoUri);
db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

models = {};

db.once('open', function callback () {
  models = require('./models/connect');
  passport.use(models.User.createStrategy());
  passport.serializeUser(function(user, done) {
          done(null, user.id);
      });

      // Deserialize the user object based on a pre-serialized token
      // which is the user id
  passport.deserializeUser(function(id, done) {
    models.User.findOne({
        _id: id
    }, '-salt -hashed_password', function(err, user) {
        done(err, user);
    });
  });

    var FACEBOOK_APP_ID = "558806480893968";
    var FACEBOOK_APP_SECRET = "76c52123d1fa888874221542716e7596";

    passport.use(new FacebookStrategy({
            clientID: FACEBOOK_APP_ID,
            clientSecret: FACEBOOK_APP_SECRET,
            callbackURL: "http://"+env.APP_HOST+"/auth/facebook/callback"

        },
        function(accessToken, refreshToken, profile, done) {
            models.User.findOne({
                'facebook.id': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    // console.log(profile._json.email)
                    var user = new models.User({
                        name: {
                          first: profile.name.givenName,
                          last: profile.name.familyName
                        },
                        email: profile.emails[0].value,
                        nickname: profile.username,
                        facebook: profile._json,
                        provider: 'facebook'
                    });
                    user.save(function(err) {
                        // console.log(profile)
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    user.facebook = profile._json;
                    user.save(function(err){
                      // console.log(profile)
                      if(err) console.log(err);
                      return done(err, user);
                    })
                }
            });
        }
    ));

    var TWITTER_APP_ID = "TNICPd2moidR2ZK2kLpjWA"
    var TWITTER_APP_SECRET = 'w4kMt5iJPyWgCEfP7Du8mKnFNuDAj2LrSflfHqBES8'

    passport.use(new TwitterStrategy({
            consumerKey: TWITTER_APP_ID,
            consumerSecret: TWITTER_APP_SECRET,
            callbackURL: "http://"+env.APP_HOST+"/auth/twitter/callback"
        },
        function(token, tokenSecret, profile, done) {
            models.User.findOne({
                'twitter.id_str': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    var nameSplit = profile.displayName.split(' ');
                    var firstName = (!!nameSplit[0]) ? nameSplit[0]: "";
                    var lastName = (!!nameSplit[1]) ? nameSplit[1]: "";

                    var user = new models.User({
                          // first: name.firstName(profile.displayName),
                          // last: name.lastName(profile.displayName)
                        name: {
                          first: firstName,
                          last: lastName
                        },

                        nickname: profile.username,
                        // twitter: profile._json,
                        provider: 'twitter'
                    });
                    user.save(function(err) {
                        // console.log(user)
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    // user.twitter = profile._json;
                    user.save(function(err){
                      if(err) console.log(err);
                      console.log(user)
                      return done(err, user);
                    })
                }
            });
        }
    ));
});

app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['email', 'user_about_me'],
        failureRedirect: '/register'
    }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        failureRedirect: '/register'
    }), function(req, res){
        req.user = JSON.stringify(req.user);
        res.redirect('/');
});

app.get('/auth/twitter', passport.authenticate('twitter', {
        failureRedirect: '/register'
    }));
app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        failureRedirect: '/register'
    }), function(req, res){
        req.user = JSON.stringify(req.user);
        res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));

});
