var createElement = require('virtual-dom/create-element');

var createVdom = require('../');

var template = document.querySelector('#tmpl').innerHTML.trim();

var vdom = createVdom(template, window.env);

var rootNode = createElement(vdom);

document.body.appendChild(rootNode);

console.log(vdom);
