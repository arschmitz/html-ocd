/*
 * grunt-html
 * https://github.com/jzaefferer/grunt-html
 *
 * Copyright Jörn Zaefferer
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var htmllint = require('grunt-html/lib/htmllint');
var reporters = require('grunt-html/lib/reporters');

module.exports = function( grunt, context,callback ) {
var done = context.async(),
    files = grunt.file.expand( context.filesSrc ),
    options = context.options({
      files: files,
      force: false,
      absoluteFilePathsForReporter: false
    }),
    force = options.force,
    reporterOutput = options.reporterOutput,
    reporter;
  htmllint(options, function(error, result) {
    var passed = true,
      output,
      uniqueFiles;

    try {
      reporter = reporters.selectReporter(options);
    } catch (err) {
      grunt.fatal(err);
    }

    if (error) {
      passed = force;
      grunt.log.error(error);
    } else if (!result.length) {
      grunt.log.ok(files.length + ' ' + grunt.util.pluralize(files.length, 'file/files') + ' lint free.');
    } else {
      passed = force;
      output = reporter(result);
      if (!reporterOutput) {
        grunt.log.writeln(output);
      }
      uniqueFiles = result
        .map(function(elem) {
          return elem.file;
        })
        .filter(function(file, index, resultFiles) {
          return resultFiles.indexOf(file) === index;
        });
      grunt.log.error(files.length + ' ' + grunt.util.pluralize(files.length, 'file/files') + ' checked, ' +
                      result.length + ' ' + grunt.util.pluralize(result.length, 'error/errors') + ' in ' +
                      uniqueFiles.length + ' ' + grunt.util.pluralize(uniqueFiles.length, 'file/files'));
    }

    // Write the output of the reporter if wanted
    if (reporterOutput) {
      reporterOutput = grunt.template.process(reporterOutput);
      var destDir = path.dirname(reporterOutput);
      if (!grunt.file.exists(destDir)) {
        grunt.file.mkdir(destDir);
      }
      grunt.file.write(reporterOutput, output);
      grunt.log.ok('Report "' + reporterOutput + '" created.');
    }
    callback( passed, done );
  });
};
