var fs = require('fs');

var path = require('path');

var h = require('hyperscript');

var htmltemplateVdom = require('../../');

var state = {
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

var template = fs.readFileSync(
    path.resolve(__dirname, 'tmpl.inc'),
    'utf-8'
).trim();

var html = htmltemplateVdom.render(template, state, h).outerHTML;

console.log(html);
