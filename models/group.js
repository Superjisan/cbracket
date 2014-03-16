module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;
  var ObjectId = Schema.Types.ObjectId;

  var groupSchema = new Schema({
    name: {
      type: String,
      required: true
    },
    password: String,
    owner: {
      type: ObjectId,
      required: true,
      ref: 'User'
    }
  });

  return {model: mongoose.model('Group', groupSchema)};
};
