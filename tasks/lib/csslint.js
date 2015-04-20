var csslint = require( 'csslint' ).CSSLint;
var stripJsonComments = require( 'strip-json-comments' );
var ruleset = {};
var verbose;
var externalOptions = {};
var combinedResult = {};
var options;
var path = require('path');
var _ = require('lodash');
var chalk = require('chalk');
var absoluteFilePaths;
var grunt;

function init( passedGrunt, cssLintOptions ) {

	grunt = passedGrunt;
	verbose = grunt.verbose;
	options = cssLintOptions;
	absoluteFilePaths = options.absoluteFilePathsForFormatters || false;

	// Read CSSLint options from a specified csslintrc file.
	if (options.csslintrc) {
		var contents = grunt.file.read( options.csslintrc );
		externalOptions = JSON.parse( stripJsonComments( contents ) );
		// delete csslintrc option to not confuse csslint if a future release
		// implements a rule or options on its own
		delete options.csslintrc;
	}

	// merge external options with options specified in gruntfile
	options = _.assign( options, externalOptions );

	// if we have disabled explicitly unspecified rules
	var defaultDisabled = options['*'] === false;
	delete options['*'];

	csslint.getRules().forEach(function( rule ) {
		if ( options[ rule.id ] || ! defaultDisabled ) {
			ruleset[ rule.id ] = 1;
		}
	});

	for ( var rule in options ) {
		if ( !options[ rule ] ) {
			delete ruleset[rule];
		} else {
			ruleset[ rule ] = options[ rule ];
		}
	}

	return plugin;
}

function process( css, filepath ) {
	var message = 'Linting ' + chalk.cyan(filepath) + '...';
		errors = 0;

	result = csslint.verify( css, ruleset );
	verbose.write( message );
	if (result.messages.length) {
		verbose.or.write( message );
		grunt.log.error();
	} else {
		verbose.ok();
	}

	// store combined result for later use with formatters
	combinedResult[filepath] = result;

	result.messages.forEach(function( message ) {
		var offenderMessage;
		if (typeof message.line !== 'undefined') {
			offenderMessage =
			chalk.yellow('L' + message.line) +
			chalk.red(':') +
			chalk.yellow('C' + message.col);
		} else {
			offenderMessage = chalk.yellow('GENERAL');
		}

		if (!options.quiet || (options.quiet && message.type === 'error')) {
			grunt.log.writeln(chalk.red('[') + offenderMessage + chalk.red(']'));
			grunt.log[ message.type === 'error' ? 'error' : 'writeln' ](
				message.type.toUpperCase() + ': ' +
				message.message + ' ' +
				message.rule.desc +
				' (' + message.rule.id + ')' +
				' Browsers: ' + message.rule.browsers
			);
		}

		if ( message.type === 'error' ) {
			errors++;
		}
	});
	return errors;
}

function output() {
	// formatted output
    if (options.formatters && Array.isArray( options.formatters )) {
      options.formatters.forEach(function ( formatterDefinition ) {
        if (formatterDefinition.id && formatterDefinition.dest) {
          var formatter = csslint.getFormatter( formatterDefinition.id );
          if (formatter) {
            var output = formatter.startFormat();
            _.each( combinedResult, function ( result, filename ) {
              if (absoluteFilePaths) {
                filename = path.resolve(filename);
              }
              output += formatter.formatResults( result, filename, {});
            });
            output += formatter.endFormat();
            grunt.file.write( formatterDefinition.dest, output );
          }
        }
      });
    }
}
plugin = {
	init: init,
	process: process,
	output: output
};
module.exports = plugin;
