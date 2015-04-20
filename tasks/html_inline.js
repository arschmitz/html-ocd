/*
 * grunt-html-inline
 * https://github.com/alrschmitz/grunt-html-inine
 *
 * Copyright (c) 2015 Alexander Schmitz
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

// Please see the Grunt documentation for more information regarding task
// creation: http://gruntjs.com/creating-tasks

grunt.registerMultiTask( 'html_inline', 'A grunt plugin for linting html and inline, js and css within it', function() {
	var cheerio = require('cheerio');
	var hadErrors = 0;
	var chalk = require('chalk');
	var csslint = require( "./lib/csslint.js" ).init( grunt, this.options() );
	var jshint = require( "./lib/jshint.js" );
	var jscs = require( "./lib/jscs.js" );
	var jscsErrors = {};
	var html = require( "./lib/html.js" );
	var that = this;

	html( grunt, this, function( passed, done ){
		grunt.log.ok( "Running JSHint on Script tags" );
		jshint( grunt, that, passed, done );
	});
	grunt.log.ok( "Running CSSLint on style tags..." );
	this.filesSrc.forEach(function( filepath ) {
		var file = grunt.file.read( filepath );
		var styles = [];
		var scripts = [];
		var result;
		var dom;

		// skip empty files
		if ( file.length ) {
			var $ = cheerio.load( file );
			$( "style" ).each( function( index ) {
				hadErrors += csslint.process( $( this ).html(), filepath + "[Style tag #" + ( index + 1 ) + "]" );
			});
			$( "script" ).each( function( index ) {
				if ( !$( this ).attr( "src" ) ) {
					jscsErrors[ filepath + "[Script tag #" + ( index + 1 ) + "]" ] = jscs( $( this ).html(), filepath + "[Script tag #" + ( index + 1 ) + "]" );
				}
			});
		}
	});

	grunt.log.ok( "Running JSCS on Script tags");
	for ( var file in jscsErrors ) {
		jscsErrors[ file ].forEach( function( line, index ) {
			console.log( line );
		} );
	};

	if ( hadErrors ) {
		csslint.output();
		return false;
    }
    grunt.log.ok( this.filesSrc.length + grunt.util.pluralize(this.filesSrc.length, ' .css file/ files') + ' lint free.' );
});

};
