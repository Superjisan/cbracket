var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/hackersbracket');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// db.once('open', function callback () {
// console.log('database connected');
var Team = require('./team')(mongoose);
var Game = require('./game')(mongoose);
// });

module.exports = {connection: db, "Team": Team, "Game": Game}