
/*
 * GET home page.
 */

var mongoose = require('mongoose');
var mailer = require('../modules/mailer');
var fs = require('fs');
var path = require('path');
var userModule = require('../modules/user');

exports.index = function(req, res){
  // console.log(req.user);
  res.render('index', {
    homepage: true,
    user: req.user,
    error_flash: req.flash('error'),
    success_flash: req.flash('success')
  });
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
      theuser = req.user;
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

  var isValidObjectID = function (str) {
    // coerce to string so the function can be generically used to test both strings and native objectIds created by the driver
    str = str + '';
    var len = str.length, valid = false;
    if (len == 12 || len == 24) {
      valid = /^[0-9a-fA-F]+$/.test(str);
    }
    return valid;
  };

  var theuser;
  if (req.user) {
    theuser = req.user;
  }
  var id = req.params.id;
  if (!!id && isValidObjectID(id)) {
    models.Bracket.find({_id: new mongoose.Types.ObjectId(id)}, function (err, data) {
      if (data.length === 0) {
        res.render('error', {title: "Bracket Not Found", message: "Are you sure this is a valid bracket? Please visit the <a href='/code_bracket'>create bracket page</a> to build a new one.<br><br>You can always <a href='/contact'>contact us</a> if you'd like help."});
      } else {
        var Bracket = require('../modules/bracket');
        var bracket = new Bracket();
        bracket.getTeams().addBack(function(err,teams) {
          var sorted_teams = teams.slice(0,128).sort(function(t1,t2) {
            return t1.name.localeCompare(t2.name);
          });
          var selectedteams = teams.slice(0,128);
          res.render('view_code_bracket', {
            bracket: data[0],
            user: theuser,
            teams: selectedteams,
            sorted_teams: sorted_teams,
            error_flash: req.flash('error'),
            success_flash: req.flash('success')
          });
        });
      }
    });
  } else {
    res.render('error');
  }
};

exports.save_bracket = function(req,res) {
  var bracket_code, bracket_data, bracket_winner,bracket_name, is_new_user;
  if (!!req.body.is_new_user) {
    is_new_user = req.body.is_new_user;
  }
  if (!!req.body.bracket_code) {
    bracket_code = req.body.bracket_code;
  }
  if (!!req.body.bracket_data) {
    bracket_data = req.body.bracket_data;
  }
  if (!!req.body.bracket_winner) {
    console.log(req.body.bracket_winner);
    bracket_winner = req.body.bracket_winner;
  }
  if (!!req.body.bracket_name) {
    bracket_name = req.body.bracket_name;
  } else {
    bracket_name = "";
  }

  if (!!bracket_data && !!req.user) {
    models.Bracket.create({
      name: bracket_name,
      data: bracket_data,
      code: bracket_code,
      user_id: req.user._id
    }, function(err,obj) {
      if (err) {
        console.error(err.message);
      }

      if (is_new_user == "no") {
        // new users already have a success flash message from the 
        // successful registration
        req.flash('success', "Your bracket '"+obj.name+",' was saved!");
      }
      
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
    });
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

exports.teamsbysid = function(req,res) {
  models.Team.find(function(err,teams) {
    var teamsBySid = {};

    teams.forEach(function(team) {
      teamsBySid[team.sid] = team;
    });

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end(JSON.stringify(teamsBySid));
  });
};

exports.mybrackets = function(req,res) {
  var user = req.user;
  models.Bracket.find({user_id: user._id}, function (err, brackets) {
    if (err) {
      res.render('error', {title:"There was an error finding your brackets"});
    } else {
      res.render('mybrackets', {brackets:brackets, user: user});
    }
  });

};

exports.account = function(req, res) {
  var locals = {bootstrapData:{}};

  if (!req.user) {
    locals.bootstrapData.errorFlash = "Please <a href='/login'>Login</a> to view this page";
  } else {
    locals.user = req.user;
    locals.bootstrapData.user = {
      name: req.user.name,
      email: req.user.email,
      nickname: req.user.nickname
    };
  }

  res.render('my_account.html', locals);
};

exports.updateAccount = function(req, res) {
  if (!req.user) {
    return res.send(400, { msg: "Please <a href='/login'>Login</a> to view this page"});
  }
  if (!req.body.user) {
    return res.send(400, { msg: "No updates recieved"});
  }

  var updates = req.body.user;
  var password = req.body.password;

  console.log(req.user, updates, password);

  userModule.update(req.user._id, updates, password, function(err){
    if (err) {
      console.log(err);
      return res.send(400);
    }

    function done(err) {
      if (err) {
        res.send(400);
      } else {
        res.send(200);
      }
    }

    // Update session if user changed email
    if (updates.email !== req.user.email) {
      req.user.email = updates.email;
      req.login(req.user, function(err){
        done(err);
      });
    } else {
      done();
    }
  });
};
