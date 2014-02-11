var fs = require('fs');
var csv = require('csv');


module.exports = {
    eachRow: function (callback, finallycall) {
      csv()
      .from.path('/Users/nimit/Work/HackerBracket/random/2013-NCAA-Regular-Season-Game-Results.csv', { delimiter: ',', escape: '"' })
      // .to.stream(fs.createWriteStream(__dirname+'/sample.out'))
      .transform( function(row){
        row.unshift(row.pop());
        return row;
      })
      .on('record', function(row,index){
        callback(row,index);
        // console.log('#'+index+' '+JSON.stringify(row));
      })
      .on('end', function() {
        finallycall();
        
      })
      .on('close', function(count){
        // when writing to a file, use the 'close' event
        // the 'end' event may fire before the file has been written
        // console.log('Number of lines: '+count);
      })
      .on('error', function(error){
        console.log(error.message);
      });
    }
};
// node samples/sample.js


// opts is optional
// var opts = ;

