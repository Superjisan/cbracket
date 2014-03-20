module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;

  var bracketSchema = new Schema({
    data: { type : Array , "default" : [] }
  });

  return {model: mongoose.model('MasterBracket', bracketSchema)};
};
