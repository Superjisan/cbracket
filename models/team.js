module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;

  var teamSchema = new Schema({
    name: String,
    conf: String,
    year: Number,
    sid: Number,
    seed: Number,
    games_played: Number,
    pts_game: Number,
    field_goals_made: Number,
    field_goals_attempted: Number,
    field_goal_pct: Number,
    free_throws_made: Number,
    free_throws_attempted: Number,
    free_throw_pct: Number,
    threes_made: Number,
    threes_attempted: Number,
    three_point_pct: Number,
    total_reb: Number,
    off_reb: Number,
    def_reb: Number,
    reb_per_game: Number,
    total_steals: Number,
    steals_per_game: Number,
    total_blocks: Number,
    blocks_per_game: Number,
    total_assists: Number,
    assists_per_game: Number,
    turnovers: Number,
    turnovers_per_game: Number,
    cbs_rank: Number,
    official_rank: Number,
    wins: Number,
    losses: Number,
    win_pct: Number,
    rpi: Number
  });

  var Team = mongoose.model('Team', teamSchema);
  return {model: Team};
};



/*

  {
  sid: Number,
  year: Number,
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
}
*/