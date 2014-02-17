
/*
 * GET home page.
 */

var mailer = require('../modules/mailer');

exports.index = function(req, res){
  var Bracket = require('../modules/bracket');
  var bracket = new Bracket();
  
  bracket.getTeams().addBack(function(err,teams) {
    var html = bracket.generateBracketHtml(teams);
    var theuser;
    if (req.user) {
      theuser = req.user
    }
    res.render('index', { 
      user: theuser, 
      bracket_html: function() {return html;}, 
      teams_json: function() {return JSON.stringify(teams.slice(0,70));},
      error_flash: req.flash('error'),
      success_flash: req.flash('success')
    });
  });
};
