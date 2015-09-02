var assert = require('assert');

var h = require('virtual-dom/h');

var createVdom = require('../lib/create-vdom');

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
