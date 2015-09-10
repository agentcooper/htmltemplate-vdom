var assert = require('assert');

var fs = require('fs');

var path = require('path');

var htmltemplateVdom = require('../');

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

describe('template => VDOM => HTML', function() {
    tests
    .filter(function(name) {
        return (
            name.indexOf('.') === -1
        );
    })
    .forEach(function(name) {
        describe(name, function() {
            var template = fs.readFileSync(
                path.join(__dirname, name, 'template.tmpl'),
                'utf8'
            );

            it('vdom', function() {
                var expected = fs.readFileSync(
                    path.join(__dirname, name, 'template.js'),
                    'utf8'
                );

                var renderFunctionString
                    = htmltemplateVdom.compile.fromString(template);

                assert.equal(renderFunctionString, expected);
            });

            if (existsSync(path.join(__dirname, name, 'output.html'))) {
                it('html', function() {
                    var h = require('hyperscript');

                    var env = require(path.join(__dirname, name, 'env.js'));

                    var expected = fs.readFileSync(
                        path.join(__dirname, name, 'output.html'),
                        'utf8'
                    );

                    var actual
                        = htmltemplateVdom.render(template, env, h).outerHTML;

                    assert.equal(trimNewLines(actual), trimNewLines(expected));
                });
            }
        });
    });
});
