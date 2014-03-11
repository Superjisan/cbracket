var models = require('./models/connect');
var teams = require('./modules/teams');

/*
var teamSchema = new Schema({
  name: String,
  total_games: Number,
  wins: Number,
  losses: Number,
  seed: Number,
  win_pct: Number,
  pts_for: Number,
  pts_against: Number,
  pts_game: Number,
  pts_allowed: Number,
  score_margin: Number
});

*/
db.once('open', function() {
  db.db.dropCollection('teams', function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('Dropped teams, now re-adding Teams');
    }
    global.allteams = [];
    teams.eachRow(function(row,index){
      if (index>0) {
        var obj = {
          sid: index,
          year: 2013,
          name: row[2],
          total_games: row[3],
          wins: row[4],
          losses: row[5],
          seed: Math.ceil(row[1]/4),
          win_pct: row[6].slice(0,row[6].length-1)*1/100,
          pts_for: row[7],
          pts_against: row[8],
          pts_game: row[9],
          pts_allowed: row[10],
          score_margin: row[11]
        };
        global.allteams.push(obj);
        var team = new models.Team(obj);
        team.save();
      }
    }, function () {
      console.log("Teams added: "+global.allteams.length);
      process.exit()
    });
  });
})

