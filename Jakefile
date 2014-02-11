desc('Seed the DB with teams');
task('dbseed', function (params) {
  var cmds = [
    'node seed.js'
  ];
  jake.exec(cmds, {printStdout: true}, function () {
    console.log('DB has been seeded.');
    complete();
  });
});
