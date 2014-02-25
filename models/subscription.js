module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;

  var subSchema = new Schema({
    email: String,
    first_name: String,
    last_name: String,
    zipcode: String,
    team: String
  });

  var Subscription = mongoose.model('Subscription', subSchema);
  return {model: Subscription};
};
