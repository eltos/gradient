module.exports = function(config) {
  config.set({
    // Frameworks to use
    frameworks: ['jasmine'],

    // List of files / patterns to load in the browser
    files: [
      // Load source files in order of dependency
      '../src/util.js',
      '../src/gradient.js',
      '../src/codegenerators.js',

      // Load test files
      '*.test.js',

      // Serve reference files but don't execute them as scripts
      { pattern: 'ref/*', watched: true, served: true, included: false },

    ],

    // Test results reporter to use
    reporters: ['progress'],

    // Web server port
    port: 9876,

    // Enable colors in the output
    colors: true,

    // Level of logging
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers
    browsers: ['FirefoxHeadless'],

    // Continuous Integration mode
    // if true, Karma starts browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}