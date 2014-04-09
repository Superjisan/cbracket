
/*
 * GET home page.
 */

var mongoose = require('mongoose');
var mailer = require('../modules/mailer');
var fs = require('fs');
var path = require('path');
var async = require('async');
var userModule = require('../modules/user');
var groupsModule = require('../modules/groups');
var ObjectId = mongoose.Types.ObjectId;

function noCacheFix(res) {
  // see here: http://stackoverflow.com/questions/18811286/nodejs-express-cache-and-304-status-code
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", 0);
}

exports.index = function(req, res){
  noCacheFix(res);
  res.render('index', {
    homepage: true,
    user: req.user ? req.user : false,
    error_flash: req.flash('error'),
    success_flash: req.flash('success')
  });
};

exports.contact = function(req, res){
  noCacheFix(res);
  res.render('contact');
};

exports.about = function(req, res){
  noCacheFix(res);
  res.render('about');
};

exports.timeline = function (req,res) {
  noCacheFix(res);
  res.render('timeline');
};

exports.contest_rules = function (req,res) {
  noCacheFix(res);
  res.render('contest_rules');
};

exports.contest_prizes = function (req,res) {
  noCacheFix(res);
  res.render('contest_prizes');
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
  var theuser;

  if (req.user) {
    theuser = req.user;
  }

  async.parallel({
    teams: function(done){
      bracket.getTeams().addBack(function(err,teams) {
       // var html = bracket.generateBracketHtml(teams);
        var sorted_teams = teams.slice(0,128).sort(function(t1,t2) {
          return t1.name.localeCompare(t2.name);
        });
        var selectedteams = teams.slice(0,128);

        var shortenfilter = function(team){
          team.name = team.name.replace("State","St.");
          team.name = team.name.replace("Virginia Commonwealth","VCU");
          if (team.name == "North Carolina") {
            team.name = "UNC";
          } else {
            team.name = team.name.replace("North Carolina","NC");
          }
          team.name = team.name.replace("Saint","St.");
          team.name = team.name.replace("Milwaukee","Mil");
          return team;
        };
        var filteredteams = selectedteams.map(shortenfilter);
        var sortedfilteredteams = sorted_teams.map(shortenfilter);
        done(err, {sorted:sortedfilteredteams, selected: filteredteams});
      });
    },
    groups: function(done) {
      if (!theuser) {
        return done(null);
      }
      models.User.findOne({_id: req.user._id }, {groups:1}, function(err, user){
        var groups;
        if (user) {
          groups = user.groups.map(function(group){
            return {name: group.name, _id: group._id.toString()};
          });
        }
        done(err, groups);
      });
    },
    brackets: function(done) {
      if (!theuser) {
        return done(null,[]);
      }
      models.Bracket.find({user_id: req.user._id }, function(err, brackets){
        done(err, brackets);
      });
    },

  }, function(err, data){
    res.render('code_bracket', {
      user: theuser,
      sorted_teams: data.teams.sorted,
      teams: data.teams.selected,
      groups: data.groups,
      brackets: data.brackets,
      error_flash: req.flash('error'),
      success_flash: req.flash('success')
    });
  });
};

var selectAndSortTeams = function(teams) {
  var sorted_teams = teams.slice(0,128).sort(function(t1,t2) {
    return t1.name.localeCompare(t2.name);
  });
  var selectedteams = teams.slice(0,128);

  var shortenfilter = function(team){
    team.name = team.name.replace("State","St.");
    team.name = team.name.replace("Virginia Commonwealth","VCU");
    if (team.name == "North Carolina") {
      team.name = "UNC";
    } else {
      team.name = team.name.replace("North Carolina","NC");
    }
    team.name = team.name.replace("Saint","St.");
    team.name = team.name.replace("Milwaukee","Mil");
    return team;
  };
  var filteredteams = selectedteams.map(shortenfilter);
  var sortedfilteredteams = sorted_teams.map(shortenfilter);
  return {selected: filteredteams, sorted: sortedfilteredteams};
};

exports.view_code_bracket = function(req,res) {
  noCacheFix(res);

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
    models.Bracket.find({_id: new mongoose.Types.ObjectId(id)}).populate('user_id').exec(function (err, data) {
      if (data.length === 0) {
        res.render('error', {title: "Bracket Not Found", message: "Are you sure this is a valid bracket? Please visit the <a href='/code_bracket'>create bracket page</a> to build a new one.<br><br>You can always <a href='/contact'>contact us</a> if you'd like help."});
      } else {
        var Bracket = require('../modules/bracket');
        var bracket = new Bracket();
        bracket.getTeams().addBack(function(err,teams) {
          var selectedandsorted = selectAndSortTeams(teams);
          
          models.MasterBracket.findOne({}, function(err,master) {
            res.render('view_code_bracket', {
              bracket: data[0],
              master: master.data[0],
              user: theuser,
              teams: selectedandsorted.selected,
              sorted_teams: selectedandsorted.sorted,
              error_flash: req.flash('error'),
              success_flash: req.flash('success')
            });
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
    // console.log(req.body.bracket_winner);
    bracket_winner = req.body.bracket_winner;
    bracket_winner.sid = bracket_winner.sid*1;
  }
  if (!!req.body.bracket_name) {
    bracket_name = req.body.bracket_name;
  } else {
    bracket_name = "";
  }

  if (!bracket_data || !req.user) {
    return res.send(400);
  }

  async.waterfall([
    function createBracket(done){
      models.Bracket.create({
        name: bracket_name,
        data: bracket_data,
        code: bracket_code,
        user_id: req.user._id,
        winner: bracket_winner
      }, function(err, bracket) {
        if (err) {
          console.error(err.message);
        }

        if (is_new_user == "no") {
          // new users already have a success flash message from the
          // successful registration
          req.flash('success', "Your bracket '"+bracket.name+",' was saved!");
        }

        done(err, bracket);
      });
    },
    function assignBracketToGroup(bracket, done){
      if (!req.body.groupId) {
        return done(null, bracket);
      }

      groupsModule.assignBracket(req.user._id, bracket._id, req.body.groupId, function(err){
        done(err, bracket);
      });
    }
  ], function(err, bracket){
    if (err) {
      console.log(err);
      return res.send(400);
    }
    // console.log('-----------------');
    // console.log(bracket);
    res.send(200, {bracket: bracket});
  });
};

exports.email_everyone = function(req,res) {
  models.User.find({}, function(err,users){
    var i = users.length;
    var user;
    console.log('req test: '+req.params.test);
    
    async.each(users, function(user, callback) {
      if (user.email !== '') {
        test_str= '';
        if ((!!req.query.test && user.email == "nimit.maru@gmail.com" && (test_str = "TEST")) || !req.query.test) {
          models.Bracket.find({user_id: user._id.toString()}).sort({score: -1}).limit(5).exec(function(err, brackets) {
            if (brackets && brackets.length>0) {
              var bracket = brackets[0];
              // uncomment when you want to send
              mailer.sendTemplateMail('sweet16', {
                to: user.email,
                subject: "Coder's Bracket - The Sweet Sixteen starts TODAY!" + test_str,
                top_bracket_id: bracket._id.toString(),
                brackets: brackets
              }, callback);
            } else {
              callback(null,null);
            }
            
          });
          
        } else {
          callback(null,null);
        }
      }
      
    }, function() {
      res.send(200, "emails sent: "+users.length);
      // console.log('done!');

    });
    
    // while(i--) {
    //   user = users[i];
    // }
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

exports.score_brackets = function(req,res) {
  var calculatePoints = function(master, bracket) {
    var round=6, p=0, pts=0;
    var br, mr; // bracket round, master round
    var round_scores = [0,0,0,0,0,0];
    while(round--) {
      br = bracket[round];
      mr = master[round];
      var pts_per_pick = 10*Math.pow(2,p++);
      var i = br[0].length;
      var round_pts = 0;
      while(i--) {
        var side = 2;
        while (side--) {
          // side 1 is right side, side 0 is left side
          if (br[side][i] && mr[side][i] && (br[side][i] === mr[side][i])) {
            pts+=pts_per_pick;
            round_pts+=pts_per_pick;
          }
        }
      }
      round_scores[round] = round_pts;
    }
    return {pts: pts, round_scores: round_scores};
  };
  
  models.MasterBracket.findOne({}, function(err,master) {
    var master_data = JSON.parse(master.data[0]);
    var byscore = {};
    var ptiles = {};
    
    models.Bracket.find({}, function(err, brackets) {
      var i = brackets.length;
      var bracket, ptsobj;
      
      //calculate the bracket scores
      while(i--) {
        bracket = brackets[i];
        if (bracket && bracket.data[0] && master_data) {
          bracket_data = JSON.parse(bracket.data[0]);
          ptsobj = calculatePoints(master_data, bracket_data);
          bracket.round_scores = ptsobj.round_scores;
          bracket.score = ptsobj.pts;
          byscore[ptsobj.pts] = ++byscore[ptsobj.pts] || 1;
        } else {
          bracket.score = 0;
        }
      }
      
      // calculate the precentiles
      
      var i = brackets.length;
      while(i--) {
        bracket = brackets[i];
        if (bracket && bracket.data[0] && master_data) {
          if (!(ptile = ptiles[bracket.score])) {
            var max = 1920;
            var numBetter=0;
            while (max-=10) {
              if (max > bracket.score) {
                if (byscore[max]) {
                  numBetter += byscore[max];
                }
              } else {
                ptile = ((brackets.length - numBetter)*100/brackets.length).toFixed(1);
                ptiles[bracket.score] = ptile;
                break;
              }
            }
          }
          bracket.ptile = ptile;
          bracket.save(function(err, b) {
            console.log('Save bracket '+b._id.toString()+' with points: ', b.score);
            if (err) console.log(err);
          });
        }
      }
      res.end('{"response": ""}');
    });
  });
  
};

exports.iowa_to_tenn = function(req,res) {
  models.Bracket.find({}, function(err, brackets) {
    var i = brackets.length;
    var bracket, ptsobj;
    
    var bracketfindReplace = function(data,find,replacewith) {
      var round = 6;
      while(round--) {
        var side=2;
        while(side--) {
          console.log(round, side);
          // console.log(data);
          if (data[round][side].length > 0) {
            var game = data[round][side].length;
            while(game--) {
              if (data[round][side][game] === find) {
                data[round][side][game] = replacewith;
              }
            }
          }
        }
      }
      return data;
    };
    
    while(i--) {
      bracket = brackets[i];
      if (bracket && bracket.data.length) {
        bracket.data = JSON.stringify(bracketfindReplace(JSON.parse(bracket.data), 126, 293));
        bracket.save(function (err,data) {
          if(err)console.log(err);
          if (i===0) {
          }
        });
      }
    }
    res.end('{"response": ""}');
    
  });
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

exports.submit_master = function(req,res) {
  var code = req.body.code;
  models.MasterBracket.findOne({}, function(err,bracket) {
    if (bracket) {
      bracket.data = code;
      bracket.save(function(err, bracket) {
        if(err) console.log(err);
        res.send(200);
      });
    } else {
      models.MasterBracket.create({data: code}, function(err) {
        res.send(200);
      });
    }
  });
};

exports.admin_stats = function(req,res) {
  async.parallel({
    master_bracket: function(done){
      models.MasterBracket.findOne({}, function(err, bracket){
        done(null, bracket);
      });
    },
    
    bracket_count: function(done){
      models.Bracket.count({}, function(err, count){
        done(null, count);
      });
    },
    
    user_count: function(done){
      models.User.count({}, function( err, count){
        done(null, count);
      });
    },

    invites_count: function(done){
      models.InviteToken.count({}, function( err, count){
        done(null, count);
      });
    },
    
    group_count: function(done){
      models.Group.count({}, function( err, count){
        done(null, count);
      });
    }
  }, function(err, data) {
    res.render('admin_stats', {stats: {
        bracket_count: data.bracket_count,
        user_count: data.user_count,
        group_count: data.group_count,
        invites_count: data.invites_count
      },
      master_bracket: data.master_bracket
    });
  });  
};


function objectIdWithTimestamp(timestamp) {
    // Convert string date to Date object (otherwise assume timestamp is a date)
    if (typeof(timestamp) == 'string') {
        timestamp = new Date(timestamp);
    }

    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);

    // Create an ObjectId with that hex timestamp
    var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId
}

exports.standings = function(req,res) {
  /*
  db.brackets.find({ _id: { $lt: objectIdWithTimestamp('2014/03/20 12:10') } }, {name:1,score:1, _id:0}).sort({score:-1}).limit(10)
  find({ _id: { $lt: objectIdWithTimestamp('2014/03/20 12:16') } })
  */
  async.parallel({
    brackets: function(done) {
      models.Bracket.find({ _id: { $lt: objectIdWithTimestamp('2014/03/20 16:16') } }).sort({score: -1}).populate("user_id").limit(100).exec(function(err, brackets) {
        done(null, brackets);
      })
    }
  }, function(err, data) {
    var bracketsranked = [];
    var br;
    
    if (data.brackets) {
      for(var i=0; i<data.brackets.length; i++) {
        br = data.brackets[i];
        br.rank = i+1;
        if (data.brackets[i-1]) {
          prev_br = data.brackets[i-1];
          if (br.score === prev_br.score) {
            br.rank = prev_br.rank;
          }
        }
        
        // if (br.code) {
        //   br.code_lines = br.code.match(/\n/g).length;
        // }
        
        bracketsranked.push(br);
        
      }
    }
    res.render('standings', {brackets: bracketsranked})
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
    return res.send(400, { msg: "Please login to view this page"});
  }
  if (!req.body.user) {
    return res.send(400, { msg: "No updates recieved"});
  }

  var updates = req.body.user;
  var password = req.body.password;

  userModule.update(req.user._id, updates, password, function(err){
    var msg = '';

    if (err) {
      msg = err.code === 11001 ? "A user with email " + updates.email + " already exists" : null;
      return res.send(400, { msg: msg });
    }

    function done(err) {
      if (err) {
        res.send(400);
      } else {
        res.send(200, { msg: 'Your updates have been made successfully.'});
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
