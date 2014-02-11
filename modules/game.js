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
  this.domId=domId;
}

Game.prototype.playGame = function () {
  
};

Game.prototype.renderGame = function () {
};

module.exports = Game;