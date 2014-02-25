namespace('db', function () {
  desc('Seed the DB with teams');
  task('seed', {async: true}, function (params) {
    var cmds = [
      'node seed.js'
    ];
    jake.exec(cmds, {printStdout: true}, function () {
      console.log('DB has been seeded.');
      complete();
    });
  });
});