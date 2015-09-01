var path = require('path');

var generator = require('../lib/generator/generator');

var argv = require('yargs')
	.usage('Usage: compile-template.js --path tmpl.inc')
	.demand(['path'])
	.argv;

var templatePath = path.resolve(__dirname, argv.path);

var template = require('fs').readFileSync(templatePath).toString().trim();

var renderFunction = generator(template);

console.log(renderFunction);
