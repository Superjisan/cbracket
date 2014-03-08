var Game = require('./game');

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

Bracket.prototype.getTeams = function () {
  var models = require('../models/connect.js');
  return models.Team.find().exec(); //promise
};

Bracket.prototype.generateBracketHtml = function (teams) {

  var html="";
  var rounds = 5;
  var teamOrder = [1,16,8,9,5,12,4,13,6,11,3,14,7,10,2,15];
  var teamCounter = 0;
  var id=0;
  var teamIndex;
  var getDbIndexFromSeed = function(seed, subseed) {
    // console.log('seed:'+seed+" subseed:"+subseed);
    return (seed-1)*4+subseed;
  };

  console.log("number of teams: " + teams.length);
  var teamleft1, teamleft2, teamright1, teamright2, game;

  for (var i=4; i>=0; i--) {
    for (var j=0; j<Math.pow(2,i); j++) {
      if(i===4) {
        teamleft1 = teams[getDbIndexFromSeed(teamOrder[(j%8)*2], Math.ceil(j/8))];
        teamleft1.seed = teamOrder[(j%8)*2];
        // console.log("teamleft1: ", teamOrder[(j%8)*2]);

        teamleft2 = teams[getDbIndexFromSeed(teamOrder[(j%8)*2+1], Math.ceil(j/8))];
        teamleft2.seed = teamOrder[(j%8)*2+1];
        // console.log("teamleft2: ", teamOrder[(j%8)*2+1]);

        teamright1 = teams[getDbIndexFromSeed(teamOrder[(j%8)*2], Math.ceil(j/8)+2)];
        teamright1.seed = teamOrder[(j%8)*2];
        // console.log("teamright1: ", teamOrder[(j%8)*2]);

        teamright2 = teams[getDbIndexFromSeed(teamOrder[(j%8)*2+1], Math.ceil(j/8)+2)];
        teamright2.seed = teamOrder[(j%8)*2+1];
        // console.log("teamright2: ", teamOrder[(j%8)*2+1]);
      }

      if (i===4) {
        html += "<div class='b bleft b"+i+"' id='b"+i+"-"+j+"-left'><div class='team top'>"+teamleft1.seed+". "+teamleft1.name+"</div><div class='team bottom'>"+teamleft2.seed+". "+teamleft2.name+"</div></div>";
        game = new Game(i, j%(Math.pow(2,i-1)), Math.ceil(j/8), teamleft1, teamleft2,"b"+i+"-"+j+"-left");
        this.games[i].push(game);

        html += "<div class='b bright b"+i+"' id='b"+i+"-"+j+"-right'><div class='team top'>"+teamright1.seed+". "+teamright1.name+"</div><div class='team bottom'>"+teamright2.seed+". "+teamright2.name+"</div></div>";
        game = new Game(i, j%(Math.pow(2,i-1)), Math.ceil(j/8)+2, teamright1, teamleft2,"b"+i+"-"+j+"-right");
        this.games[i].push(game);
      } else {
        html += "<div class='b bleft b"+i+"' id='b"+i+"-"+j+"-left'><div class='team top'></div><div class='team bottom'>b"+i+"-"+j+"</div></div>";
        html += "<div class='b bright b"+i+"' id='b"+i+"-"+j+"-right'><div class='team top'></div><div class='team bottom'>b"+i+"-"+j+"</div></div>";
      }

    }
  }

  // debugger;
  // console.log(this.games);
  return html;
};

module.exports = Bracket;
