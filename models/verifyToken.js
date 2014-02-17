module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;
  
  // Verification token model
  var verificationTokenSchema = new Schema({
      _userId: {type: Schema.Types.ObjectId, required: true, ref: 'User'},
      token: {type: String, required: true},
      createdAt: {type: Date, required: true, default: Date.now, expires: '48h'}
  });

  var uuid = require('node-uuid');
  verificationTokenSchema.methods.createVerificationToken = function (done) {
      var verificationToken = this;
      var token = uuid.v4();
      verificationToken.set('token', token);
      verificationToken.save( function (err) {
          if (err) return done(err);
          return done(null, token);
          // console.log("Verification token", verificationToken);
      });
  };
  
  var verificationTokenModel = mongoose.model('VerificationToken', verificationTokenSchema);
  return {model: verificationTokenModel};
};