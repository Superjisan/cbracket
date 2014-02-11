module.exports = function(mongoose) {
  var Schema = mongoose.Schema;

  var gameSchema = new Schema({
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

  var Game = mongoose.model('Game', gameSchema);
  return Game;
};
