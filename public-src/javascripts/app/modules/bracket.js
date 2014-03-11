function Bracket(bracketData,teams) {
  this.bracketData = bracketData;
  this.teams = teams;
  this.winner = null;
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

  // TODO: Implement this using document fragments

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
        var finalWinnerTempGame = new Game(round-1, Math.floor(game1.spot/2), game1.division, game1.bracket_level-1, winnerteam1, false);
        finalWinnerTempGame.bracket = this;
        
        // debugger;
        q.push({game: finalWinnerTempGame});
        this.winner = winnerteam1;
        console.log(this.winner.name, " wins tournament!");
      }
    }
  }

  q.push({finish:function () {
    // console.log('finish fun');
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
  var theteam = this.teams[dbIndexForTeamObj];

  if (typeof teamsbysid !== "undefined") {
    retteam = teamsbysid[theteam.sid];
  } else {
    retteam = theteam;
  }
  return retteam;

};

Bracket.prototype.getTeamFromData = function (round, division, spot, firstOrSecondTeam) {
  var bracket = this.bracketData;
  var leftOrRight = (division <= 2) ? 0:1;
  var offset = (typeof firstOrSecondTeam != "undefined") ? firstOrSecondTeam:0;
  var prevspot = Math.max((spot*2 + offset/2),0);
  var sid = bracket[round+1][leftOrRight][prevspot];
  return teamsbysid[sid];
};

Bracket.prototype.generateBracketHtml = function (bracket) {
  var teams = this.teams;
  var html="";
  var rounds = 5;
  var teamCounter = 0;
  var id=0;
  var teamIndex;
  var teamleft1, teamleft2, teamright1, teamright2, division, round;
  var game;
  var bracket_html = $('#bracket-box').html();
  var spot;

  for (var blevel=4; blevel>=0; blevel--) {
    for (spot=0; spot<Math.pow(2,blevel); spot++) {
      division = Math.ceil((spot+1)/8);
      round = blevel+1;

      if(blevel===4) {
        // the initial first round
        teamleft1 = this.getTeam(division, spot);
        if (teamleft1) {
          teamleft1.seed = this.getSeed(spot);
        }
        teamleft2 = this.getTeam(division, spot, 2);
        if (teamleft2) {
          teamleft2.seed = this.getSeed(spot, 2);
        }
        game = new Game(round, spot, division, blevel, teamleft1, teamleft2, "b"+blevel+"-"+spot+"-left");
        this.games[round].push(game);
      } else if (blevel < 4){
        if (this.bracketData) {
          // all rounds after the first round
          teamleft1 = this.getTeamFromData(round, division, spot);
          teamleft2 = this.getTeamFromData(round, division, spot, 2);
          game = new Game(round, spot, division, blevel, teamleft1, teamleft2, "b"+blevel+"-"+spot+"-left");
          this.games[round].push(game);
        }
      }

      html += swig.render(bracket_html, { locals: { round: round, blevel:blevel, spot: spot, side: "left", team1:teamleft1, team2:teamleft2 }});
    }
    for (spot=0; spot<Math.pow(2,blevel); spot++) {
      round = blevel+1;
      if(blevel===4) {
        // the initial first round
        division = Math.ceil((spot+1)/8)+2;
        teamright1 = this.getTeam(division, spot);
        if (teamright1) {
          teamright1.seed = this.getSeed(spot);
        }
        teamright2 = this.getTeam(division, spot, 2);
        if (teamright2) {
          teamright2.seed = this.getSeed(spot, 2);
        }
        game = new Game(round, spot, division, blevel, teamright1, teamright2, "b"+blevel+"-"+spot+"-right");
        this.games[round].push(game);
      } else if (blevel < 4) {
        if (this.bracketData) {
          // all rounds after the first round
          division = Math.ceil((spot+1)/8)+2;
          teamright1 = this.getTeamFromData(round, division, spot);
          teamright2 = this.getTeamFromData(round, division, spot, 2);
          game = new Game(round, spot, division, blevel, teamright1, teamright2, "b"+blevel+"-"+spot+"-right");
          this.games[round].push(game);
        }
      }
      html += swig.render(bracket_html, { locals: { round: round, blevel:blevel, spot: spot, side: "right", team1:teamright1, team2:teamright2 }});
    }
  }
  var final_four_html = $('#final_four_games').html();
  if (this.bracketData) {
    // all rounds after the first round
    round = 0;
    division = 1;
    spot = 0;
    blevel = round-1;
    var finalist1 = this.getTeamFromData(round,division, spot);
    var finalist2 = this.getTeamFromData(round, division+2, spot);
    var winner = teamsbysid[this.winner];
    game = new Game(round, division, spot, blevel, finalist1, finalist2, "b"+blevel+"-"+spot+"-left");
    this.games[0].push(game);
    html += swig.render(final_four_html, { locals: { finalist1: {name: finalist1.name, seed: finalist1.seed}, finalist2:{name: finalist2.name, seed: finalist2.seed}, winner: winner.name }});
  } else {
    html += swig.render(final_four_html, { locals: { finalist1: "", finalist2:"", winner: "" }});
  }
  
  return html;
};



