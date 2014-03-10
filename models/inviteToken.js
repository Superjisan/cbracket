module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;
  var uuid = require('node-uuid');

  var InviteTokenSchema = new Schema({
    email: {
      type: 'String',
      required: true
    },
    accepted: {
      type: Boolean,
      default: false
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
      required: true
    }
  });

  var InviteTokenModel = mongoose.model('InviteToken', InviteTokenSchema);

  return { model: InviteTokenModel };
};