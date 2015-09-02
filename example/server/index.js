var path = require('path');

var h = require('virtual-dom/h');

var createVdom = require('../../lib/create-vdom');

var env = {
    title: 'List',
    people: [
        {
            name: 'John',
            inner: [{ title: 'a1' }, { title: 'b1' }],
            active: true
        },
        {
            name: 'Mary',
            inner: [{ title: 'a2' }, { title: 'b2' }]
        }
    ]
};

var templatePath = path.resolve(__dirname, 'tmpl.inc');

var template = require('fs').readFileSync(templatePath).toString().trim();

var vdom = createVdom(template, env, h);

console.log(vdom);
