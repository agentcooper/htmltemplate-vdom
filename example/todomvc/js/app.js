(function (window, render) {
	'use strict';

	var runtime = require('htmltemplate-vdom/lib/client/runtime');

	var externals = require('./externals');
	var blocks = require('./blocks');

	var actions = require('./actions');
	var state = require('./state');

	var loop = runtime.mainLoop(state, function(appState) {
		return render(appState, runtime.h, {
			externals: externals,
			blocks: blocks
		});
	});

	actions.subscribe(loop.update);
	document.body.appendChild(loop.target);

})(window, render);
