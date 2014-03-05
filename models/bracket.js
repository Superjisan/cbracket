module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;

  var bracketSchema = new Schema({
    name: String,
    data: { type : Array , "default" : [] },
    round_scores: { type : Array , "default" : [0,0,0,0,0,0] },
    score: { type : Number , "default" : 0 },
    code: String,
    user_id: {type: Schema.Types.ObjectId, required: true, ref: 'User'}
  });

  return {model: mongoose.model('Bracket', bracketSchema)};
};
