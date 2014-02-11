
/*
 * GET home page.
 */
 
exports.index = function(req, res){
  var Bracket = require('../modules/bracket');
  var bracket = new Bracket();
  
  bracket.getTeams().addBack(function(err,teams) {
    var html = bracket.generateBracketHtml(teams);
    res.render('index', { bracket_html: function() {return html;}, teams_json: function() {return JSON.stringify(teams.slice(0,70));} });
  });
};

