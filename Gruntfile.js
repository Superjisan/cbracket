module.exports = function(grunt) {
  var appSrc = [
    './public-src/javascripts/app/main.js',
    './public-src/javascripts/app/directives/equals.js',
    './public-src/javascripts/app/controllers/ForgotPasswordCtrl.js',
    './public-src/javascripts/app/controllers/ResetPasswordCtrl.js',
    './public-src/javascripts/app/controllers/MyAccountCtrl.js',
    './public-src/javascripts/app/controllers/CreateGroupCtrl.js',
    './public-src/javascripts/app/controllers/GroupInviteCtrl.js',
    './public-src/javascripts/app/controllers/ViewGroupInviteCtrl.js'
  ];

  var scriptSrc = [
    './public-src/javascripts/app/modules/teamsbysid2013.js',
    './public-src/javascripts/app/modules/bracket.js',
    './public-src/javascripts/app/modules/game.js',
    './public-src/javascripts/app/script.js',
  ];

  var libSrc = [
    './public-src/javascripts/lib/async.js',
    './public-src/javascripts/lib/jquery.elastic.source.js',
    './public-src/javascripts/lib/guiders.js',
    './public-src/javascripts/lib/jquery.fittext.js',
    './public-src/javascripts/lib/swig.min.js'
  ];

  grunt.initConfig({
    jshint: {
      all: {
        src: [
          './models/**/*.js',
          './modules/**/*.js',
          './routes/**/*.js',
          './public-src/javascripts/app/**/*.js'
        ]
      },

      options: {
        "smarttabs": true,
        "force":true,
        "debug": true,
        "devel": true,
        "undef": false,
        "laxcomma": true,
        "laxbreak": false,
        "jquery": true,
        "loopfunc": true,
        "sub": true,
        "-W065": true,
        "-W084": true
      }
    },

    uglify: {
      options: {
          mangle: false
      },
      app: {
        files: {
          './public/javascripts/app.js': appSrc
        }
      },
      script: {
        files: {
          './public/javascripts/script.js': scriptSrc
        }
      },
      libs: {
        files: {
          './public/javascripts/libs.js': libSrc
        }
      }
    },

    concat: {
      app: {
        src: appSrc ,
        dest: './public/javascripts/app.js'
      },
      script: {
        src: scriptSrc,
        dest: './public/javascripts/script.js'
      },
      lib: {
        src: libSrc,
        dest: './public/javascripts/libs.js'
      }
    },

    sass: {
      styles: {
        files: [{
          expand: true,
          cwd: './public-src/stylesheets/stylesheets',
          src: ['**/**.scss'],
          dest: './public/stylesheets',
          ext: '.css'
        }]
      }
    },

    watch: {
      scripts: {
        files: [
          './models/**/*.js',
          './modules/**/*.js',
          './routes/**/*.js',
          './public-src/javascripts/**/*.js'
        ],
        tasks: ['jshint', 'concat'],
        options: {
          nospawn: true
        }
      },
      css: {
        files: [
          './public-src/stylesheets/**/*.scss'
        ],
        tasks: ['sass']
      }
    }

  });

  var tasks;

  if (process.env.NODE_ENV === 'development') {
    tasks = ['jshint', 'concat', 'sass', 'watch'];
  } else {
    tasks = ['jshint', 'concat', 'sass'];
  }

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  // grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.registerTask('heroku:production', tasks);
  grunt.registerTask('default', tasks);
}