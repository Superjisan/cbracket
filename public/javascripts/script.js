
function Game(round, spot, division, bracket_level, team1,team2,domId) {
  this.bracket = null;
  this.round = round;
  this.bracket_level = bracket_level;
  this.division = division;
  this.spot = spot;
  this.team1 = team1;
  this.team2 = team2;
  this.team1_score = 0;
  this.team2_score = 0;
  this.winnerGame = null;
  this.winnerSpot = null;
  if(domId) {
    this.domId=domId;
  } else {
    // domId doesn't exist, build it from convention
    this.domId = "b"+this.bracket_level+"-"+spot;
    if (division<=2) {
      this.domId = this.domId + "-left";
    } else {
      this.domId = this.domId + "-right";
    }
  }
}

Game.prototype.play = function (playFunc) {
  if (!_.isUndefined(this.team1) && !_.isUndefined(this.team2)) {
    this.team1.winner = false;
    this.team2.winner = false;

    this.team1.wins = function() {
      this.winner = true;
    };

    this.team2.wins = function() {
      this.winner = true;
    };
    
    var bracket = this.team1.bracket;
    var game = this;
    
    playFunc(game, this.team1, this.team2);
    return (this.team1.winner)?1:2;
  }
};

Game.prototype.render = function (callback) {
  $("#"+this.domId+" .top").html(this.team1.seed + ". " + this.team1.name);
  $("#"+this.domId+" .bottom").html(this.team2.seed + ". " + this.team2.name);
  
  var self = this;
  var animation_duration = 0;
  if($("#"+self.domId).length) {
    $("#"+self.domId+" .top").fadeTo(animation_duration,1,function() {
      $("#"+self.domId+" .bottom").fadeTo(animation_duration, 1,function() {
        callback();
      });
    });
  } else {
    callback();
  }

};

function Bracket(teams) {
  this.teams = teams;
  this.html = "";
  this.teamOrder = [1,16,8,9,5,12,4,13,6,11,3,14,7,10,2,15];
  this.games = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  };
  this.resetData();
}

Bracket.prototype.resetData = function () {
  this.data = [];
  for (var i=0; i < 6; i++) {
    this.data.push([[],[]]);
  }
};

Bracket.prototype.getHtml = function () {
  return this.html;
};

Bracket.prototype.recordWin = function(game, winner) {
  var winning_team = (winner === 1) ? game.team1 : game.team2;

  // this.data[game.round][game.division+'-'+game.spot] = winning_team.sid;
  var leftRight = (game.division <= 2)?0:1; // left is 0, right is 1
  this.data[game.round][leftRight][game.spot] = winning_team.sid;
  
  var bracket_serial = $('#serialized_bracket');
  bracket_serial.val( bracket_serial.val() + winning_team.sid + "," );
};

Bracket.prototype.play = function(playFunc, finishFunc) {
  this.resetData();
  this.games[0] = [];
  this.games[1] = [];
  this.games[2] = [];
  this.games[3] = [];
  this.games[4] = [];
  
  $('#serialized_bracket').val('');
  
  var startRound=5;
  var game1, game2, winner1, winnerteam1, winner2, winnerteam2, nextGame;
  
  // define queue for game rendering and worker.
  var q = async.queue(function(obj,callback) {
    if(!_.isUndefined(obj.game)) {
      obj.game.render(callback);
    }
    if (!_.isUndefined(obj.finish)) {
      obj.finish();
    }
  },1);
  
  for(var round=startRound; round >= 0; round--) {
    var arr = this.games[round];
  
    for(var i=0; i < arr.length; i+=2) {
      game1 = arr[i];
      game2 = arr[i+1];
      
      winner1 = game1.play(playFunc);
      winnerteam1 = game1['team'+winner1];
      this.recordWin(game1,winner1);
      
      if (game2) {
        winner2 = game2.play(playFunc);
        winnerteam2 = game2['team'+winner2];
        this.recordWin(game2,winner2);
      
        nextGame = new Game(round-1, Math.floor(game1.spot/2), game1.division, game1.bracket_level-1, winnerteam1, winnerteam2);
        nextGame.bracket = this;
      
        if (this.games[round-1]) {
          this.games[round-1].push(nextGame);
        
          if(!_.isUndefined(nextGame.team1) && !_.isUndefined(nextGame.team2)) {
            q.push({game: nextGame});
          }
        } else {
          break;
        }
      } else {
        console.log(winnerteam1.name, " wins tournament!");
      }
    }
  }

  q.push({finish:function () {
    console.log('finish fun');
    finishFunc();
  }});
  
};

Bracket.prototype.toggleSpinner = function(toShow) {
  if (toShow) {
    $('#matrix').fadeOut();
    // $('#matrix_titles').fadeIn();
    // $('#editor_w_buttons').addClass('hide');
    $('#bracket').removeClass('bracket_blur');
  }else {
    // $('#matrix').fadeOut();
    // $('#matrix_titles').fadeOut();
    // $('#editor_w_buttons').removeClass('hide');
  }
};


Bracket.prototype.getSeed = function (gameSpot, firstOrSecondTeam) {
  var offset;
  
  if (_.isUndefined(firstOrSecondTeam) || firstOrSecondTeam === 0) {
    offset = 0;
  } else {
    offset = firstOrSecondTeam - 1;
  }
  
  return this.teamOrder[((gameSpot)%8)*2+offset];
};

Bracket.prototype.getTeam = function (division, spot, firstOrSecondTeam) {
  var getDbIndexFromSeed = function(seed, subseed) {
    return (seed-1)*4+subseed;
  };
  
  var addTwo = 0;
  if (division>2) {
    addTwo = 2;
  }

  var team_bracket_seed = this.getSeed(spot, firstOrSecondTeam);
  // spot is from 0-15
  // sub_seed should be from 0-3
  // we add one to spot to make sure the Math.ceil(spot/8) returns 1 for all values 0-7
  // then we subtract one to make sub_seed 0-3 instead of 1-4
  // the addTwo is what offsets the sub_seed for the right side (division 3,4 of the bracket)
  
  var sub_seed = Math.ceil((spot+1)/8)-1+addTwo;
  var dbIndexForTeamObj = getDbIndexFromSeed(team_bracket_seed, sub_seed);
  return this.teams[dbIndexForTeamObj];
  
};

Bracket.prototype.generateBracketHtml = function () {
  var teams = this.teams;
  var html="";
  var rounds = 5;
  var teamCounter = 0;
  var id=0;
  var teamIndex;
  var teamleft1, teamleft2, teamright1, teamright2, division, round;

  var bracket_html = $('#bracket-box').html();
  
  for (var blevel=4; blevel>=0; blevel--) {
    for (var spot=0; spot<Math.pow(2,blevel); spot++) {
      division = Math.ceil((spot+1)/8);
      round = blevel+1;
      if(blevel===4) {
        teamleft1 = this.getTeam(division, spot);
        teamleft1.seed = this.getSeed(spot);
        
        teamleft2 = this.getTeam(division, spot, 2);
        teamleft2.seed = this.getSeed(spot, 2);
        var game = new Game(round, spot, division, blevel, teamleft1, teamleft2, "b"+blevel+"-"+spot+"-left");
        // this.data[round][division+'-'+teamleft1.seed+'-'+teamleft2.seed] = 0;
        this.games[round].push(game);
      }
      
      html += swig.render(bracket_html, { locals: { round: round, blevel:blevel, spot: spot, side: "left", team1:teamleft1, team2:teamleft2 }});
    }
    for (var spot=0; spot<Math.pow(2,blevel); spot++) {
      round = blevel+1;
      if(blevel===4) {
        division = Math.ceil((spot+1)/8)+2;
        teamright1 = this.getTeam(division, spot);
        teamright1.seed = this.getSeed(spot);
        teamright2 = this.getTeam(division, spot, 2);
        teamright2.seed = this.getSeed(spot, 2);
        var game = new Game(round, spot, division, blevel, teamright1, teamright2, "b"+blevel+"-"+spot+"-right");
        // this.data[round][division+'-'+teamright1.seed+'-'+teamright2.seed] = 0;
        this.games[round].push(game);
      }
      html += swig.render(bracket_html, { locals: { round: round, blevel:blevel, spot: spot, side: "right", team1:teamright1, team2:teamright2 }});
    }
  }
  return html;
};

var setupAceEditor = function () {
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/textmate");
  // editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/javascript");
  editor.setHighlightActiveLine(false);
  editor.setShowPrintMargin(false);
  editor.renderer.setShowGutter(false); 
  editor.commands.addCommands([{
      name: "no_line_number_popup",
      bindKey: {
          win: "Ctrl-L",
          mac: "Command-L"
      },
      exec: function(editor, line) {
          return false;
      },
      readOnly: true
  }]);
  return editor;
};

var setupEvents = function () {
  
  $(function () {
    var getImgBottom = function () {
      var front_buttons_bottom = $('#front_buttons').offset().top + $('#front_buttons').height();
      var image_bottom = $(window).height() - $('#text-editor-animate').height() - front_buttons_bottom - 70;
      return image_bottom;
    };
    
    var image_bottom = getImgBottom();
    $('#text-editor-animate').animate({
      bottom: image_bottom + "px"
    }, 1000);
      
    $(window).resize(function () {
      var image_bottom = getImgBottom()+15;
      $('#text-editor-animate').css('bottom', image_bottom + "px");
    })
  });
  
  
  $('#waitlist_form').submit(function(e){
    var email = $('#email').val();
    if (!!email) {
      $.post('/waitlist', {
        email: email
      }, function(data, textStatus, jqXHR) {
        $('#waitlist_form').fadeOut(400,function() {
          $('#thanks').fadeIn();
        });
      });
    }
    e.preventDefault();
    return false;
  });
};

var setupLayoutEvents = function() {
  $('#fssig').hover(function(e) {
    $('#sig_start_message').animate({
      left: "-204px"
    }, 400);
  }, function(e){
    $('#sig_start_message').animate({
      left: "0px"
    }, 400, function () {
      // $('#sig_start_message').css('left', "10px");
    });
  });
  
  $(function(){
    var path = window.location.pathname;
    $('nav li a[href="'+path+'"]').parents('li').addClass('active');
  });
};

var expandBracket = function () {
  $('#code_editor_col').animate({
    width: "5%"
  }, 600);
  window.setTimeout(function() {
    $('#bracket_col').animate({
      width: "95%"
    }, 600, function() {
      $('.team').css('font-size', '12px');
      $('.b .top').css('top', '-17px');
    });
  }, 400);
};

var showSaveBracketNewUser = function() {
  $('#registerModal').modal();
  // $('#saveBracketModal').modal();
  
};

var setupBracketEvents = function (bracket) {
  $('#startbutton').click(function(e) {
    e.preventDefault();
    $('#bracket').html(html);
    var btn = $(this);
    btn.button('loading')
    bracket.toggleSpinner(true);
    $('#bracket_blur_image').fadeOut();
    var f = eval("("+editor.getValue()+")");
    if (_.isFunction(f)) {
      bracket.play(f, function () {
        bracket.toggleSpinner(false);
        btn.button('reset')
        $('#bracket_status').slideDown();
      });
    } else {
      alert("It seems like your function has an error in it.")
    }
  });
  
  $('#modify_code_btn').click(function(e) {
      var expandEditor = function () {
        $('#bracket_col').animate({
          width: "60%"
        }, 600);
        window.setTimeout(function() {
          $('#code_editor_col').animate({
            width: "40%"
          }, 600, function() {
            $('#editor textarea').focus();
          });
        }, 500);
      };
      expandEditor();
    $('#bracket_status').slideUp(function() {});
  });
  
  var center_msg = function () {
    var bracket_height = $('#bracket').height();
    var bracket_width = $('#bracket').width();
    var init_bracket_msg = $('#matrix');
    var newtop = Math.floor(bracket_height/2 - init_bracket_msg.height()/2);
    var newleft = Math.floor(bracket_width/2 - init_bracket_msg.width()/2);
    
    init_bracket_msg.css('left', newleft + "px");
    init_bracket_msg.css('top', newtop + "px");
  };
  $(center_msg);
  $(window).resize(center_msg);
  
  var save_clicked = function(e) {
    if (!logged_in_user){
      showSaveBracketNewUser();
    }
    e.preventDefault();
  };

  $("#saveBracketNewUser").on("submit", function(event) {
    event.preventDefault();
    // $(this).serialize();
    var first_name = this.first_name.value;
    var last_name = this.last_name.value;
    var email = this.email.value;
    var nickname = this.nickname.value;
    var password = this.password.value;
    
    var params = {
      first_name: first_name,
      last_name: last_name,
      email: email,
      nickname: nickname,
      password: password
    };

    $.post('/register.json', params, function(data, textStatus, xhr) {
      $('#registerModal').modal('hide');
      $('#saveBracketModal').modal();
      // bracket: JSON.stringify(bracket.data);
      
    });
  });
    
  $('#save_bracket_btn').click(save_clicked);
  $('#save_new_user_btn').click(function(e) {
    
  });

  $("#saveBracketForm").on("submit", function(event) {
    event.preventDefault();
    // $(this).serialize();
    var bracket_name = this.bracket_name.value;
    var bracket_data = JSON.stringify(bracket.data);
    
    var params = {
      bracket_data: bracket_data,
      bracket_name: bracket_name
    };

    $.post('/save_bracket', params, function(data, textStatus, xhr) {
      $('#saveBracketModal').modal('hide');
      window.location = "/code_bracket/"+data._id;
    });
  });

};
// var expandEditor = function () {
//   $('#code_editor_col').animate({
//     width: "5%"
//   }, 600);
//   window.setTimeout(function() {
//     $('#bracket_col').animate({
//       width: "95%"
//     }, 600, function() {
//       $('.team').css('font-size', '12px');
//       $('.b .top').css('top', '-17px');
//     });
//   }, 400);
// };
