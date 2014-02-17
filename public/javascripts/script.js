
function Game(round, spot, division, team1,team2,domId) {
  this.bracket = null;
  this.round = round;
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
    this.domId = "b"+round+"-"+spot;
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
  $("#"+self.domId+" .top").fadeTo(70,1,function() {
    $("#"+self.domId+" .bottom").fadeTo(70, 1,function() {
      callback();
    });
  });

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
    4: []
  };
}

Bracket.prototype.getHtml = function () {
  return this.html;
};

Bracket.prototype.play = function(playFunc, finishFunc) {
  this.games[0] = [];
  this.games[1] = [];
  this.games[2] = [];
  this.games[3] = [];
  
  var startRound=4;
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
      
      winner2 = game2.play(playFunc);
      winnerteam2 = game2['team'+winner2];
      nextGame = new Game(round-1, Math.floor(game1.spot/2), game1.division, winnerteam1, winnerteam2);
      nextGame.bracket = this;
      
      if (this.games[round-1]) {
        this.games[round-1].push(nextGame);
        
        if(!_.isUndefined(nextGame.team1) && !_.isUndefined(nextGame.team2)) {
          q.push({game: nextGame});
        }
      } else {
        break;
      }
    }
  }
  q.push({finish:function () {
    finishFunc();
  }});
  
};

Bracket.prototype.toggleSpinner = function(toShow) {
  if (toShow) {
    $('#matrix').fadeIn();
    $('#matrix_titles').fadeIn();
  }else {
    $('#matrix').fadeOut();
    $('#matrix_titles').fadeOut();
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
  return this.teams[getDbIndexFromSeed(this.getSeed(spot, firstOrSecondTeam), Math.ceil(spot/8)+addTwo)];
  
};

Bracket.prototype.generateBracketHtml = function () {
  var teams = this.teams;
  var html="";
  var rounds = 5;
  var teamCounter = 0;
  var id=0;
  var teamIndex;
  var teamleft1, teamleft2, teamright1, teamright2, division;

  var getDbIndexFromSeed = function(seed, subseed) {
    return (seed-1)*4+subseed;
  };
  
  var bracket_html = $('#bracket-box').html();
  
  for (var i=4; i>=0; i--) {
    for (var j=0; j<Math.pow(2,i); j++) {
      division = Math.ceil((j+1)/8);
      if(i===4) {
        teamleft1 = this.getTeam(division, j);
        teamleft1.seed = this.getSeed(j);
        teamleft2 = this.getTeam(division, j, 2);
        teamleft2.seed = this.getSeed(j, 2);
        var game = new Game(i, j, division, teamleft1, teamleft2, "b"+i+"-"+j+"-left");
        this.games[i].push(game);
      }
      
      html += swig.render(bracket_html, { locals: { round: i, spot: j, side: "left", team1:teamleft1, team2:teamleft2 }});
    }
    
    for (var j=0; j<Math.pow(2,i); j++) {
      if(i===4) {
        division = Math.ceil((j+1)/8)+2;
        teamright1 = this.getTeam(division, j);
        teamright1.seed = this.getSeed(j);
        teamright2 = this.getTeam(division, j, 2);
        teamright2.seed = this.getSeed(j, 2);
        var game = new Game(i, j, division, teamright1, teamright2, "b"+i+"-"+j+"-right");
        this.games[i].push(game);
      }
      html += swig.render(bracket_html, { locals: { round: i, spot: j, side: "right", team1:teamright1, team2:teamright2 }});
    }
  }
  return html;
};

var setupAceEditor = function () {
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.setTheme("ace/theme/clouds");
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
