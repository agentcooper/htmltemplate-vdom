var property = require('./property');

var LOOKUP_VALUE_IDENTIFIER = {
    type: 'Identifier',
    name: 'lookupValue'
};

function lookupVariable(name, parameters) {
    var lookupArguments = [
        {
            type: 'Literal',
            value: name
        }
    ];

    if (parameters) {
        lookupArguments.push({
            type: 'ObjectExpression',
            properties: Object.keys(parameters).map(function(key) {
                return property(key, parameters[key]);
            })
        });
    }

    return {
        type: 'CallExpression',
        callee: LOOKUP_VALUE_IDENTIFIER,
        arguments: lookupArguments
    };
}

module.exports = lookupVariable;
