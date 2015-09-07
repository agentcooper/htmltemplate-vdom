var assert = require('assert');

var fs = require('fs');

var path = require('path');

var generator = require('../lib/generator/generator');

var templateRuntime = fs.readFileSync(
    path.resolve(__dirname, '../lib/generator/template-runtime.txt')
).toString();

var tests = fs.readdirSync(__dirname);

describe('parse: (String) => Object', function() {
    tests
        .filter(function(name) {
            return (
                name.indexOf('.') === -1
            );
        })
        .forEach(function(name) {
            it(name, function() {
                var tmpl = fs.readFileSync(
                    path.join(__dirname, name, 'template.tmpl'),
                    'utf8'
                );

                var expected = fs.readFileSync(
                    path.join(__dirname, name, 'template.js'),
                    'utf8'
                );

                var actual = generator(tmpl, templateRuntime);

                assert.equal(actual, expected);
            });
        });
});
