var mainLoop = require('main-loop');

module.exports = {
    h: require('virtual-dom/h'),

    mainLoop: function(state, render) {
        var loop = mainLoop(state, render, {
            create: require('virtual-dom/create-element'),
            diff: require('virtual-dom/diff'),
            patch: require('virtual-dom/patch')
        });

        return loop;
    }
};
