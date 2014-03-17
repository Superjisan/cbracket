var models = require('../../../../models/connect');
var mongoose = require('mongoose');
var async = require('async');
var fs = require('fs');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/hackersbracket';

mongoose.connect(mongoUri);
db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


// function getTeamsBySid() {
  var teamsbysid = {};
  models.Team.find({},null,{sort:{sid:1}}, function(err, teams) {
    teams.forEach(function(team) {
      teamsbysid[team.sid] = team;
    });
    console.log(teamsbysid);
    var start = "var teamsbysid = " + JSON.stringify(teamsbysid, null, " ") + ";";
    fs.writeFile('teamsbysid14.js', start, function () {
      console.log('written');
    });
  });
  
