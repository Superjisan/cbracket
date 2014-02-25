var nodemailer = require("nodemailer");
var path = require('path'),
    appDir = path.dirname(require.main.filename);
var swig = require('swig');

var email = function (options, done) {
  var smtpTransport = nodemailer.createTransport("SMTP",{
     service: "Mandrill",
     auth: {
         user: "nimit.maru@gmail.com",
         pass: "MBpcfZTtpPSa_s6DIL7MGw"
     }
  });
  
  if (!done) {
    var done = function () {};
  }
  smtpTransport.sendMail({
     from: "Coders Bracket <mail@codersbracket.com>", // sender address
     to: options.to, // comma separated list of receivers
     subject: options.subject, // Subject line
     html: options.html // plaintext body
  }, function(error, response){
     if(error){
         console.log(error);
         done(error, response);
     }else{
         console.log("Message sent: " + response.message);
         done(null, response);
     }
  });
  
};

var sendTemplateMail = function (emailTemplate, emailData, done) {
  var tpl = swig.compileFile(appDir+"/views/emails/"+emailTemplate+".html", {autoescape: false});
  var html;
  if (html = tpl(emailData)) {
    emailData.html = html;
    email(emailData, done);
  }
};


var sendVerifyEmail = function(user, verify_url, done) {
  sendTemplateMail("verify_email", {
    to: user.email,
    subject: "CodersBracket - Verify your email",
    user: user,
    verify_url: verify_url
  }, done);
};

module.exports = {
  email: email,
  sendVerifyEmail: sendVerifyEmail,
  sendTemplateMail: sendTemplateMail
};