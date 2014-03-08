module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;
  var uuid = require('node-uuid');

  var ResetTokenSchema = new Schema({
    email: {
      type: 'String',
      required: true
    },
    token: {
      type: 'String',
      default: function(){
        return uuid.v4();
      }
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '1h',
      required: true
    }
  });

  var ResetTokenModel = mongoose.model('ResetToken', ResetTokenSchema);

  return { model: ResetTokenModel };
};