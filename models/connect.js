var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/hackersbracket');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// db.once('open', function callback () {
// console.log('database connected');
var TeamModule = require('./team')(mongoose);
var GameModule = require('./game')(mongoose);
var UserModule = require('./user')(mongoose);
var VerifyTokenModule = require('./verifyToken')(mongoose);
// });

module.exports = {
  connection: db,
  "Team": TeamModule.model,
  "User": UserModule.model,
  "Game": GameModule.model,
  "VerifyToken": VerifyTokenModule.model
};