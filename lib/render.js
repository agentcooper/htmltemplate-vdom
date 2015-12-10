var compile = require('./compile');

module.exports = function(string, state, h, options) {
    var m = new module.constructor();

    m.paths = module.paths;
    m._compile(
        compile.fromString(string, options),
        options.path
    );

    return m.exports(h, options)(state);
};
