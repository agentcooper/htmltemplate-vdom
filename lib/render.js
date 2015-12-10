var compile = require('./compile');
var requireFromString = require('./require-from-string');

module.exports = function(string, state, h, options) {
    var renderer = requireFromString(
        compile.fromString(string, options),
        module.paths
    );

    var render = renderer(h, options);

    return render(state);
};
