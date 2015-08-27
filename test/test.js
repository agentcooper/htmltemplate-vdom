var assert = require('assert');

var createVdom = require('../lib/create-vdom');

describe('htmltemplate-vdom', function() {
    it('TMPL_IF', function() {
        var template = '1<TMPL_IF something>2</TMPL_IF><TMPL_IF other>3</TMPL_IF>';

        var vdom = createVdom(template, {
            something: true
        });

        assert.equal(vdom.children.length, 2);
    });

    it('TMPL_LOOP', function() {
        var template = '<TMPL_LOOP items>item</TMPL_LOOP>';

        var vdom = createVdom(template, {
            items: ['a', 'b', 'c', 'd', 'e']
        });

        assert.equal(vdom.children.length, 5);
    });

    it('Nested TMPL_LOOP', function() {
        var template = '<TMPL_LOOP items><span><TMPL_LOOP inner><TMPL_VAR title></TMPL_LOOP></span></TMPL_LOOP>';

        var vdom = createVdom(template, {
            items: [
                { inner: [{ title: 'a1' }, { title: 'b1' }] },
                { inner: [{ title: 'a2' }, { title: 'b2' }] },
                { inner: [{ title: 'a3' }, { title: 'b3' }] }
            ]
        });

        var outer = vdom.children;

        assert.equal(outer.length, 3);
        assert.equal(outer[0].children.length, 2);
    });
});
