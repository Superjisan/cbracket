
/*
 * GET home page.
 */

var mailer = require('../modules/mailer');
var fs = require('fs');
var path = require('path');

exports.index = function(req, res){
  res.render('index', {homepage: true, user: req.user});
};

exports.contact = function(req, res){
  res.render('contact');
};

exports.timeline = function (req,res) {
  res.render('timeline');
};

exports.show_page = function (req,res) {
  var name = req.params.catch_all;
  // console.log(path.relative(__dirname, "views/"+name+'.html'));
  // console.log(__dirname);
  // 
  fs.exists(path.resolve(__dirname, "../views/"+name+'.html'), function(exists) {
    if (exists) {
      res.render(name);
    } else {
      res.render('error');
    }
  });
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
    var sorted_teams = teams.slice(0,128).sort(function(t1,t2) {
      return t1.name.localeCompare(t2.name);
    });
    var selectedteams = teams.slice(0,128);
    res.render('code_bracket', { 
      user: theuser, 
      sorted_teams: sorted_teams,
      teams: selectedteams,
      bracket_html: function() {return html;}, 
      error_flash: req.flash('error'),
      success_flash: req.flash('success')
    });
  });
};
exports.view_code_bracket = function(req,res) {
  var id = req.params.id;
  console.log('view code bracket: ',id);
};

exports.save_bracket = function(req,res) {
  console.log(req.body);
  
  if (!!req.body.bracket_data) {
    var bracket_data = req.body.bracket_data;
  }
  if (!!req.body.bracket_name) {
    var bracket_name = req.body.bracket_name;
  } else {
    var bracket_name = "";
  }
  
  if (!!bracket_data && !!req.user) {
    models.Bracket.create({
      name: bracket_name,
      data: bracket_data,
      user_id: req.user._id
    }, function(err,obj) {
      if (err) {
        console.error(err.message);
      }
      console.log("saving bracket data: "+obj);
      req.flash('success', "Your bracket '"+obj.name+",' was saved!");
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify({bracket:obj}));
      
      // res.redirect('code_bracket/'+obj._id.toString());
      // res.render('view_bracket', { 
      //   user: theuser, 
      //   sorted_teams: sorted_teams,
      //   teams: selectedteams,
      //   bracket_html: function() {return html;}, 
      //   error_flash: req.flash('error'),
      //   success_flash: req.flash('success')
      // });
    })
  }
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

