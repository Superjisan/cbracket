module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var groupSchema = new Schema({
    owner: ObjectId,
    name: String,
    password: String,
    invites: [{
      email: String,
      accepted: Boolean
    }],
    members: [{
      id: ObjectId
    }]
  });

  var Group = mongoose.model('Group', groupSchema);
  return {model: Group};
};
