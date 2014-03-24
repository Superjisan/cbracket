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

/*
var teamSchema = new Schema({
  name: String,
  total_games: Number,
  wins: Number,
  losses: Number,
  seed: Number,
  win_pct: Number,
  pts_for: Number,
  pts_against: Number,
  pts_game: Number,
  pts_allowed: Number,
  score_margin: Number
});

*/

var refreshData = false;
var refreshNonGritty = false;
off_columns = ['name','conf','games_played','pts_game','field_goals_made','field_goals_attempted','field_goal_pct','free_throws_made','free_throws_attempted','free_throw_pct','threes_made','threes_attempted','three_point_pct'];
def_columns = ['name','conf','games_played','total_reb','off_reb','def_reb','reb_per_game','total_steals','steals_per_game','total_blocks','blocks_per_game'];
ato_columns = ['name','conf','games_played','total_assists','assists_per_game','turnovers','turnovers_per_game'];
gritty_columns= ['cbs_rank','name','w-l-record','win_pct','rpi'];
teamData = {};

var offenseUrl = {columns: off_columns, filename: "./data/offensedata.html", url:'http://www.cbssports.com/collegebasketball/stats/teamsort/sortableTable/NCAAB/SCORING/regularseason/yearly?&_1:col_1=1&print_rows=9999'};
var defenseUrl = {columns: def_columns, filename: "./data/defensedata.html", url:'http://www.cbssports.com/collegebasketball/stats/teamsort/sortableTable/NCAAB/DEFENSIVE/regularseason/yearly?&_1:col_1=1&print_rows=9999'};
var assistsUrl = {columns: ato_columns, filename: "./data/assistsdata.html", url:'http://www.cbssports.com/collegebasketball/stats/teamsort/sortableTable/NCAAB/ASTTO/regularseason/yearly?&_1:col_1=1&print_rows=9999'};
var grittyUrl = {columns: gritty_columns, filename: "./data/grittydata.html", url:'http://www.cbssports.com/collegebasketball/bracketology/nitty-gritty-report?&_2:col_1=2&_3:col_1=1&_3:col_2=1'};

var officialSeedByName = [
  "Florida",
  "Virginia",
  "Arizona",
  "Wichita State",

  "Kansas",
  "Villanova",
  "Wisconsin",
  "Michigan",

  "Syracuse",
  "Iowa State",
  "Creighton",
  "Duke",

  "UCLA",
  "Michigan State",
  "San Diego State",
  "Louisville",

  "Virginia Commonwealth",
  "Cincinnati",
  "Oklahoma",
  "Saint Louis",

  "Ohio State",
  "North Carolina",
  "Baylor",
  "Massachusetts",

  "New Mexico",
  "Connecticut",
  "Oregon",
  "Texas",

  "Colorado",
  "Memphis",
  "Gonzaga",
  "Kentucky",

  "Pittsburgh",
  "George Washington",
  "Oklahoma State",
  "Kansas State",

  "Stanford",
  "Saint Joseph's",
  "Brigham Young",
  "Arizona State",

  "Dayton",
  "Providence",
  "Nebraska",
  "Tennessee",

  "Stephen F. Austin",
  "Harvard",
  "North Dakota State",
  "North Carolina State",

  "Tulsa",
  "Delaware",
  "New Mexico State",
  "Manhattan",

  "Western Michigan",
  "North Carolina Central",
  "Louisiana-Lafayette",
  "Mercer",

  "Eastern Kentucky",
  "Wisconsin-Milwaukee",
  "American",
  "Wofford",

  "Albany",
  "Coastal Carolina",
  "Weber State",
  "Cal Poly"
];

var htmlScrape = function(dataInfoObj, html) {
  var $ = cheerio.load(html);
	$('tr').next().next().nextAll().each(function(i, tr) {
		var alltds = $(this).find('td');
		if (alltds.length > 4) {

      var name = $(this).children().first().text();
  		if (!teamData[name]) {
  		  teamData[name] = {};
  		}
  		
      alltds.each(function(index,td) {
        stat_name = dataInfoObj.columns[index];
        if (!teamData[name][stat_name])
          teamData[name][stat_name] = $(td).text()
      });
    }
	});
  
};

var grittyScrapeHtml = function(dataInfoObj, html) {
  console.log("scrapping gritty html");
  var $ = cheerio.load(html);
	$('table.data').first().find('tr.row1,tr.row2').each(function(i, tr) {
    var name = $(this).children().next().first().text();
  
    $(this).find('td').each(function(index, td) {
      if (stat_name = dataInfoObj.columns[index]) {
        if (!teamData[name][stat_name]) {
          if (stat_name == 'w-l-record') {
            var winlosses = $(td).text().split('-');
            teamData[name]['wins'] = winlosses[0];
            teamData[name]['losses'] = winlosses[1];
          } else {
            teamData[name][stat_name] = $(td).text();
          }
        }
      }
    });
  });
  // console.log("done -scrapping gritty html");
  
};

var liveDataScrape = function(dataInfoObj, callback) {
  console.log('refreshing data');
  request(dataInfoObj.url, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      fs.writeFile(dataInfoObj.filename, html, {}, function(err){
        htmlScrape(dataInfoObj, html);
        callback();
      });
    } else {
      console.log('error scraping normal cbs stats');
      console.log(error);
      callback();
    }
    
  });
};

var fileScrape = function(dataInfoObj, callback) {
  fs.readFile(dataInfoObj.filename, function (error, html) {
    console.log('Read a local data file: '+dataInfoObj.filename);
    htmlScrape(dataInfoObj, html);
    callback();
  });
};


  async.series({
      offense: function(callback){
        if (refreshData && refreshNonGritty) {
          liveDataScrape(offenseUrl, callback);
        } else {
          fileScrape(offenseUrl, callback);
        }
      },
      defense: function(callback){
        if (refreshData && refreshNonGritty) {
          liveDataScrape(defenseUrl, callback);
        } else {
          fileScrape(defenseUrl, callback);
        }
      },
      assists: function(callback){
        if (refreshData && refreshNonGritty) {
          liveDataScrape(assistsUrl, callback);
        } else {
          fileScrape(assistsUrl, callback);
        }
      },
      
      gritty: function(callback) {
        if (refreshData) {
          request(grittyUrl.url, function (error, response, html) {
            fs.writeFile(grittyUrl.filename, html, {}, function (){
              console.log('refereshed data: gritty');
              
              if (!error && response.statusCode == 200) {
                grittyScrapeHtml(grittyUrl, html);
              } else {
                console.log('error scraping Gritty stats');
                console.log(error);
              }
              console.log('gritty callback about to fire');
              
              callback();
            });
          });
        } else {
          fs.readFile(grittyUrl.filename,  "utf-8",function(err, html) {
            if (err) {
              console.log(err);
            } else {
              grittyScrapeHtml(grittyUrl, html);
            }
            callback();
          });
        }
      }
  },
  function(err, results) {
    console.log('done with all async stuff');
    db.once('open', function() {
      db.db.dropCollection('teams', function(err) {
        if (err) console.log(err);
        
        console.log('Dropped teams, now re-adding Teams');
        var sid = 1;
        
        var q = async.queue(function (task, callback) {
            task.run(task.team, callback);
        }, 1);
        
        // assign a callback
        q.drain = function() {
            console.log('teams added: '+ (sid-1));
            process.exit();
        }
        
        for (key in teamData) {
          if (teamData.hasOwnProperty(key)) {
            var theteam = teamData[key];
            theteam.year = '2014';
            theteam.sid = sid;
            
            var teamArrayIndex = officialSeedByName.indexOf(theteam.name);
            if (teamArrayIndex>=0) {
              theteam.seed = Math.ceil((teamArrayIndex+1)/4);
              theteam.official_rank = teamArrayIndex+1;
            } else {
              theteam.official_rank = 999;
            }
            
            sid++;
            // console.log("saving team: " + theteam.name);

            var newteam = theteam;
            q.push({team: newteam, run: function(team, callback){
              var teamObj = models.Team.create(team, function(err, savedteam) {
                if (err) {console.log(err);}
                // console.log("saved team: " + team.name);
                callback();
              });
            }});
          }
        }
      });
    });
    // process.exit();
      // results is now equals to: {one: 1, two: 2}
  });




