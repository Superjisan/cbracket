// var Game = require('./game')

function Game(round, spot, division, team1,team2,domId) {
  this.bracket = null;
  this.round = round;
  this.division = division;
  this.spot = spot;
  // console.log("round: ", round, " spot: ", spot);
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
  if (playFunc(this.team1, this.team2)) {
    return 1;
  } else {
    return 2;
  }
};

Game.prototype.render = function (callback) {
  $("#"+this.domId+" .top").html(this.team1.seed + ". " + this.team1.name);
  $("#"+this.domId+" .bottom").html(this.team2.seed + ". " + this.team2.name);
  
  var self = this;
  $("#"+self.domId+" .top").fadeTo(30,1,function() {
    $("#"+self.domId+" .bottom").fadeTo(30, 1,function() {
      callback();
    });
  });
  
  // var x = $("#"+this.domId+" > .bottom").fadeOut();
  // console.log(x);
  
  // .animate({color: "#00f"}).complete(function () {
  //       console.log(' in complete');
  //       
    
  // })
  // $("#"+this.domId+" > .top").slideUp();
  
};

function Bracket(round, spot, team1,team2) {
  this.html = "";
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

Bracket.prototype.play = function(playFunc) {
  this.games[0] = [];
  this.games[1] = [];
  this.games[2] = [];
  this.games[3] = [];
  
  var startRound=4;
  var game1, game2, winner1, winnerteam1, winner2, winnerteam2, nextGame;
  
  var q = async.queue(function(game,callback) {
    game.game.render(callback);
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

      
      if (this.games[round-1]) {
        this.games[round-1].push(nextGame);
        q.push({game: nextGame}, function(err){
          console.log("finished");
        });
      } else {
        break;
      }
    }
  }
};

Bracket.prototype.generateBracketHtml = function (teams) {

  var html="";
  var rounds = 5;
  var teamOrder = [1,16,8,9,5,12,4,13,6,11,3,14,7,10,2,15];
  var teamCounter = 0;
  var id=0;
  var teamIndex;
  var getDbIndexFromSeed = function(seed, subseed) {
    console.log('seed:'+seed+" subseed:"+subseed);
    return (seed-1)*4+subseed;
  };
  
  console.log("number of teams: " + teams.length);
  var teamleft1, teamleft2, teamright1, teamright2;
  
  for (var i=4; i>=0; i--) {
    for (var j=0; j<Math.pow(2,i); j++) {
      if(i===4) {
        teamleft1 = teams[getDbIndexFromSeed(teamOrder[(j%8)*2], Math.ceil(j/8))];
        teamleft1.seed = teamOrder[((j)%8)*2];
        
        teamleft2 = teams[getDbIndexFromSeed(teamOrder[(j%8)*2+1], Math.ceil(j/8))];
        teamleft2.seed = teamOrder[((j)%8)*2+1];

        html += "<div class='b bleft b"+i+" first_round' id='b"+i+"-"+j+"-left'><div class='team top'>"+teamleft1.seed+". "+teamleft1.name+"</div><div class='team bottom'>"+teamleft2.seed+". "+teamleft2.name+"</div></div>";
        var game = new Game(i, j, Math.ceil((j+1)/8), teamleft1, teamleft2, "b"+i+"-"+j+"-left");

        this.games[i].push(game);
      } else {
        html += "<div class='b bleft b"+i+"' id='b"+i+"-"+j+"-left'><div class='team top'></div><div class='team bottom'></div></div>";
      }
    }
    
    for (var j=0; j<Math.pow(2,i); j++) {
      if(i===4) {
        teamright1 = teams[getDbIndexFromSeed(teamOrder[(j%8)*2], Math.ceil(j/8)+2)];
        teamright1.seed = teamOrder[(j%8)*2];
        // console.log("teamright1: ", teamOrder[(j%8)*2]);
        
        teamright2 = teams[getDbIndexFromSeed(teamOrder[(j%8)*2+1], Math.ceil(j/8)+2)];
        teamright2.seed = teamOrder[(j%8)*2+1];
        // console.log("teamright2: ", teamOrder[(j%8)*2+1]);
        
        html += "<div class='b bright b"+i+" first_round' id='b"+i+"-"+j+"-right'><div class='team top'>"+teamright1.seed+". "+teamright1.name+"</div><div class='team bottom'>"+teamright2.seed+". "+teamright2.name+"</div></div>";
        var game = new Game(i, j, Math.ceil((j+1)/8)+2, teamright1, teamright2,"b"+i+"-"+j+"-right");
        // var game = new Game(i, j%(Math.pow(2,i-1)), Math.ceil((j+1)/8)+2, teamright1, teamright2,"b"+i+"-"+j+"-right");
        // if (game.team2.name =="Belmont") { debugger; }
        this.games[i].push(game);
      } else {
        html += "<div class='b bright b"+i+"' id='b"+i+"-"+j+"-right'><div class='team top'></div><div class='team bottom'></div></div>";
        // html += "<div class='b bright b"+i+"' id='b"+i+"-"+j+"-right'><div class='team top'></div><div class='team bottom'>b"+i+"-"+j+"</div></div>";
      }
    }
  }
  return html;
};
