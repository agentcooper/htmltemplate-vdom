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

        assert.equal(vdom.children[0].children.length, 5);
    });
});
