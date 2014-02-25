
/*
 * GET home page.
 */

var mailer = require('../modules/mailer');

exports.index = function(req, res){
  res.render('index');
};


exports.code_bracket = function(req,res) {
  var Bracket = require('../modules/bracket');
  var bracket = new Bracket();
  bracket.getTeams().addBack(function(err,teams) {
    var html = bracket.generateBracketHtml(teams);
    var theuser;
    if (req.user) {
      theuser = req.user
    }
    res.render('code_bracket', { 
      user: theuser, 
      bracket_html: function() {return html;}, 
      teams_json: function() {return JSON.stringify(teams.slice(0,64));},
      error_flash: req.flash('error'),
      success_flash: req.flash('success')
    });
  });
};

exports.subscribe = function (req,res) {
  if (!!req.body.email) {
    var email = req.body.email;
    models.Subscription.create({email: email}, function(err, obj) {
      if (err) {
        res.writeHead(400, {'Content-type': 'application/json'});
        res.end('{"response": "'+err.message+'"}');
      } else {
        res.writeHead(200, {'Content-type': 'application/json'});
        res.end('{"response": "Successful"}');
      }
    });
  } else {
    res.writeHead(400, {'Content-type': 'application/json'});
    res.end('{"response": "'+err.message+'"}');
  }
};