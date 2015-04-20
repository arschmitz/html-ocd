var Checker = require('jscs');
var loadConfigFile = require('jscs/lib/cli-config');
var assign = require('object-assign');
var path = require('path');
var tildify = require('tildify');

module.exports = function( content, filePath, options ) {
	options = options || '.jscsrc';

	if (typeof options === 'string') {
		options = {configPath: options};
	}

	options = assign({esnext: false}, options);

	var out = [];
	var checker = new Checker({esnext: !!options.esnext});

	checker.registerDefaultRules();

	var configPath = options.configPath;
	delete options.esnext;
	delete options.configPath;

	if (configPath) {
		if (typeof options === 'object' && Object.keys(options).length) {
			throw new Error('configPath option is not compatible with code style options');
		}

		try {
			checker.configure(loadConfigFile.load(configPath));
		} catch (err) {
			err.message = 'Unable to load JSCS config file at ' + tildify(path.resolve(configPath)) + '\n' + err.message;
			throw err;
		}
	} else {
		checker.configure(options);
	}

	var errors = checker.checkString( content, filePath );
	var errorList = errors.getErrorList();

	var file = {}

	file.jscs = {
		success: true,
		errorCount: 0,
		errors: []
	};

	if (errorList.length > 0) {
		file.jscs.success = false;
		file.jscs.errorCount = errorList.length;
		file.jscs.errors = errorList;
	}

	errorList.forEach(function (err) {
		out.push(errors.explainError(err, true));
	});

	return out;
}
