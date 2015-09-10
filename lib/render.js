var generator = require('./generator/generator');

var templateRuntime = require('raw!./generator/template-runtime.txt');

module.exports = function(string, state, h) {
    var renderFunctionString = generator.fromString(string, templateRuntime);

    var renderFunction = eval('(' + renderFunctionString + ')');

    return renderFunction(state, h);
}
