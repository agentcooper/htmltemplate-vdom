var compile = require('./compile');

module.exports = function(string, state, h) {
    var renderFunctionString = compile.fromString(string);

    var renderFunction = eval('(' + renderFunctionString + ')');

    return renderFunction(state, h);
};
