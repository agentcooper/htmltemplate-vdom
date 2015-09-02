var assert = require('assert');

var fs = require('fs');

var path = require('path');

var h = require('virtual-dom/h');

var generator = require('../lib/generator/generator');

var templateRuntime = fs.readFileSync(
    path.resolve(__dirname, '../lib/generator/template-runtime.txt')
).toString();

function createVdom(string, state, h) {
    var renderFunctionString = generator(string, templateRuntime);

    var renderFunction = eval('(' + renderFunctionString + ')');

    return renderFunction(state, h);
}

describe('htmltemplate-vdom', function() {
    it('TMPL_IF', function() {
        var template = '<div>1<TMPL_IF something>2</TMPL_IF><TMPL_IF other>3</TMPL_IF></div>';

        var vdom = createVdom(template, {
            something: true
        }, h);

        assert.equal(vdom.children.length, 2);
    });

    it('TMPL_LOOP', function() {
        var template = '<div><TMPL_LOOP items>item</TMPL_LOOP></div>';

        var vdom = createVdom(template, {
            items: ['a', 'b', 'c', 'd', 'e']
        }, h);

        assert.equal(vdom.children.length, 5);
    });

    it('Nested TMPL_LOOP', function() {
        var template = '<div><TMPL_LOOP items><span><TMPL_LOOP inner><TMPL_VAR title></TMPL_LOOP></span></TMPL_LOOP></div>';

        var vdom = createVdom(template, {
            items: [
                { inner: [{ title: 'a1' }, { title: 'b1' }] },
                { inner: [{ title: 'a2' }, { title: 'b2' }] },
                { inner: [{ title: 'a3' }, { title: 'b3' }] }
            ]
        }, h);

        var outer = vdom.children;

        assert.equal(outer.length, 3);
        assert.equal(outer[0].children.length, 2);
    });
});
