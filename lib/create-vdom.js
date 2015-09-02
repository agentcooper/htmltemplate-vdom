var generator = require('./generator/generator');

module.exports = function(string, state, h) {
    var renderFunctionString = generator(string);

    var renderFunction = eval('(' + renderFunctionString + ')');

    return renderFunction(state, h);
}
