var compile = require('./compile');

module.exports = function(string, state, h) {
    var exports = {};

    eval(compile.fromString(string));

    return exports.render(state, h);
};
