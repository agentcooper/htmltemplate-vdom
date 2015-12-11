'use strict';

var runtime = require('htmltemplate-vdom/lib/client/runtime');
var renderer = require('../dist/index.tmpl.js');

var externals = require('./externals');
var blocks = require('./blocks');

var actions = require('./actions');
var state = require('./state');

var render = renderer(runtime.h, {
	externals: externals,
	blocks: blocks
});

var loop = runtime.mainLoop(state, render);

actions.subscribe(loop.update);
document.body.appendChild(loop.target);
