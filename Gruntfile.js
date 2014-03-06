module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      all: {
        src: [
          './models/**/*.js',
          './modules/**/*.js',
          './routes/**/*.js',
          './public/javascripts/**/*.js'
        ]
      },

      options: {
          "smarttabs": true,
          "debug": true,
          "devel": true,
          "undef": false,
          "laxcomma": true,
          "laxbreak": false,
          "jquery": true,
          "loopfunc": true,
          "sub": true,
          "-W065": true
      }
    },

    uglify: {
      options: {
          mangle: false
      },
      app: {
        // public js files
        // usage --> 'dest.js': ['src1.js', 'src2.js', '..etc.js']
        files: {

        }
      }
    },

    concat: {
      app: {
        // public js src files
        src: [
        ],
        dest: './public/javascripts/script.min.js'
      }
    },

    watch: {
      scripts: {
        files: [
          './models/**/*.js',
          './modules/**/*.js',
          './routes/**/*.js',
          './public/javascripts/**/*.js'
        ],
        tasks: ['jshint'],
        options: {
          nospawn: true
        }
      },
      css: {
        files: [
          './assets/stylesheets/**/*.scss'
        ],
        tasks: ['sass']
      }
    }

  });

  var tasks;

  if (process.env.NODE_ENV === 'development') {
    tasks = ['jshint', 'concat', 'sass', 'watch'];
  } else {
    tasks = ['jshint', 'uglify', 'concat', 'sass'];
  }

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.registerTask('default', tasks);
}