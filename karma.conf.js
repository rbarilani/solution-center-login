'use strict';

module.exports = function(config) {

  config.set({

    // Base path, that will be used to resolve files and exclude
    basePath: './',

    // Frameworks to use
    frameworks: ['jasmine'],

    // List of files / patterns to load in the browser
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-jwt/dist/angular-jwt.js',
      'bower_components/ngstorage/ngStorage.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/solution-center-communicator/dist/solutioncenter.communicator.js',

      'src/**/*.js',
      'test/**/*.spec.js'
    ],

    // List of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/**/*.js': ['coverage']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['coverage', 'dots', 'junit'],

    // Web server port
    port: 9876,

    // Level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR
    // || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    plugins: [
      'karma-phantomjs-launcher',
      'karma-jasmine',
      'karma-coverage',
      'karma-failed-reporter',
      'karma-junit-reporter'
    ],

    // optionally, configure the reporter
    coverageReporter: {
      dir : 'test/coverage',
      reporters: [
        // reporters not supporting the `file` property
        { type: 'html', subdir: 'report'}
      ]
    },

    // the default configuration
    junitReporter: {
      outputDir: 'test/coverage/junit'
    }
  });
};
