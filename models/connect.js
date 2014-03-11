var mongoose = require('mongoose');
// var mongoUri = process.env.MONGOLAB_URI ||
//   process.env.MONGOHQ_URL ||
//   'mongodb://localhost/hackersbracket';
// 
// mongoose.connect(mongoUri);
// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));

// db.once('open', function callback () {
  // console.log('database connected');
  var TeamModule = require('./team')(mongoose);
  var GameModule = require('./game')(mongoose);
  var UserModule = require('./user')(mongoose);
  var BracketModule = require('./bracket')(mongoose);
  var SubModule = require('./subscription')(mongoose);
  var VerifyTokenModule = require('./verifyToken')(mongoose);
  var ResetTokenModule = require('./resetToken')(mongoose);
  var InviteTokenModule = require('./inviteToken')(mongoose);
  module.exports = {
    // connection: db,
    "Team": TeamModule.model,
    "User": UserModule.model,
    "Subscription": SubModule.model,
    "Bracket": BracketModule.model,
    "Game": GameModule.model,
    "VerifyToken": VerifyTokenModule.model,
    "ResetToken": ResetTokenModule.model,
    "InviteToken": InviteTokenModule.model
  };
  
// });

