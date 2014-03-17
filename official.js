var models = require('./models/connect');
// var teams = require('./modules/teams');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var fs = require('fs');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/hackersbracket';

mongoose.connect(mongoUri);
db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

models.Team.find({},'name cbs_rank', {sort: {cbs_rank:1}}, function(err, data) {
  // console.log(data);
  teams = data.slice(1,280);
  
  var i =0;
  teams.forEach(function(team){
    i++;
    console.log("\""+team.name+"\",");
  });
  process.exit();
});