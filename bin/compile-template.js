var path = require('path');

var fs = require('fs');

var generator = require('../lib/generator/generator');

var argv = require('yargs')
    .usage('Usage: compile-template.js --path tmpl.inc')
    .demand(['path'])
    .argv;

var templatePath = path.resolve(__dirname, argv.path);

var template = fs.readFileSync(templatePath).toString().trim();

var templateRuntime = fs.readFileSync(
    path.resolve(__dirname, '../lib/generator/template-runtime.txt')
).toString();

var renderFunction = generator(template, templateRuntime);

console.log(renderFunction);
