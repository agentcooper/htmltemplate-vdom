var compile = require('./compile');

module.exports = function(string, state, h, options) {
    var renderFunctionString = compile.fromString(string);

    var renderFunction = eval('(' + renderFunctionString + ')');

    return renderFunction(state, h, options);
};
