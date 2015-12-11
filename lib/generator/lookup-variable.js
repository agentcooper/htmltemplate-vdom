var property = require('./property');

var LOOKUP_VALUE_IDENTIFIER = {
    type: 'Identifier',
    name: 'lookupValue'
};

var LOOKUP_VALUE_WITH_FALLBACK_IDENTIFIER = {
    type: 'Identifier',
    name: 'lookupValueWithFallback'
};

function lookupVariable(name, parameters, type) {
    type = type || 'TMPL_VAR';

    var lookupFunction = LOOKUP_VALUE_WITH_FALLBACK_IDENTIFIER;

    if (type === 'TMPL_V') {
        lookupFunction = LOOKUP_VALUE_IDENTIFIER;
    }

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
        callee: lookupFunction,
        arguments: lookupArguments
    };
}

module.exports = lookupVariable;
