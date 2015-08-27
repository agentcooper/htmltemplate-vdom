var mainLoop = require('main-loop');

module.exports = {
    createVdom: require('./create-vdom'),

    loop: function(state, render) {
        var loop = mainLoop(state, render, {
            create: require('virtual-dom/create-element'),
            diff: require('virtual-dom/diff'),
            patch: require('virtual-dom/patch')
        });

        return loop;
    }
};
