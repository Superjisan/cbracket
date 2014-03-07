
/**
 * Module dependencies.
 */

var express = require('express');
var swig = require('swig');
require('./filters')(swig);
var routes = require('./routes');
var user = require('./routes/user');
var auth = require('./routes/auth');
var http = require('http');
var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var path = require('path');
var sass = require('node-sass');
var teams = require("./modules/teams");
app = express();
app.engine('html', swig.renderFile);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('fullstackrox!!'));
app.use(express.session());

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);
app.use(
    sass.middleware({
        src: __dirname + '/assets', //where the sass files are
        dest: __dirname + '/public', //where css should go
        debug: true // obvious
    })
);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  swig.setDefaults({ cache: false });
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

if ('production' == app.get('env')) {
  app.use(express.errorHandler());
}

// passport config
models = require('./models/connect');
// passport.use(new LocalStrategy(models.User.authenticate()));
passport.use(models.User.createStrategy());
passport.serializeUser(models.User.serializeUser());
passport.deserializeUser(models.User.deserializeUser());

app.get('/', routes.index);
app.get('/code_bracket', routes.code_bracket);
app.get('/code_bracket/:id', routes.view_code_bracket);
app.post('/save_bracket', routes.save_bracket);
app.post('/waitlist', routes.subscribe);
app.get('/teamsbysid.js', routes.teamsbysid);

//static pages
app.get('/contest/timeline', routes.timeline);
app.get('/contact', routes.contact);


function ensureAuthenticated(req, res, next) {
 if (req.isAuthenticated()) { return next(); }
 res.redirect('/login?forwardpath='+req.originalUrl)  //Or whatever your main page is 
};

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
app.get('/reset-password/:token', auth.resetPassword);
// global.allteams = [];

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));

});
