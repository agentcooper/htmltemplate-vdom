var assert = require('assert');

var fs = require('fs');

var path = require('path');

var generator = require('../lib/generator/generator');

var templateRuntime = fs.readFileSync(
    path.resolve(__dirname, '../lib/generator/template-runtime.txt'),
    'utf8'
);

var tests = fs.readdirSync(__dirname);

function existsSync(filePath){
    try {
        fs.statSync(filePath);
    } catch(err) {
        if (err.code == 'ENOENT') {
            return false;
        }
    }
    return true;
};

function trimNewLines(text) {
    return text.trim().split('\n').map(function(line) {
        return line.trim();
    }).join('\n');
}

describe('template => JS function', function() {
    tests
    .filter(function(name) {
        return (
            name.indexOf('.') === -1
        );
    })
    .forEach(function(name) {
        var tmpl = fs.readFileSync(
            path.join(__dirname, name, 'template.tmpl'),
            'utf8'
        );

        var expected = fs.readFileSync(
            path.join(__dirname, name, 'template.js'),
            'utf8'
        );

        var renderFunctionString = generator(tmpl, templateRuntime);

        it(name, function() {
            assert.equal(renderFunctionString, expected);
        });

        if (existsSync(path.join(__dirname, name, 'output.html'))) {
            it(name + ', html output', function() {
                var h = require('hyperscript');

                var env = require(path.join(__dirname, name, 'env.js'));

                var expected = fs.readFileSync(
                    path.join(__dirname, name, 'output.html'),
                    'utf8'
                );

                var renderFunction = eval('(' + renderFunctionString + ')');

                var actual = renderFunction(env, h).outerHTML;

                assert.equal(trimNewLines(actual), trimNewLines(expected));
            });
        }
    });
});
