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
  if (this.team1 && this.team2) {
    $("#"+this.domId+" .top").html(this.team1.seed + ". " + this.team1.name);
    $("#"+this.domId+" .bottom").html(this.team2.seed + ". " + this.team2.name);
    var self = this;
    var animation_duration = 30;
    if($("#"+self.domId).length) {
      $("#"+self.domId+" .top").fadeTo(animation_duration,1,function() {
        $("#"+self.domId+" .bottom").fadeTo(animation_duration, 1,function() {
          callback();
        });
      });
    } else if (this.round===0 && this.team1 && this.team2){
      $('#ff-rd1-team1').html(this.team1.name);
      $('#ff-rd1-team2').html(this.team2.name);
      callback();
    }
  } else {
    $('#ff-rd2').html(this.team1.name);
    callback();
  }

};

