var property = require('./property');

var LOOKUP_VALUE_IDENTIFIER = {
    type: 'Identifier',
    name: 'lookupValue'
};

var LOOKUP_VALUE_WITH_FALLBACK_IDENTIFIER = {
    type: 'Identifier',
    name: 'lookupValueWithFallback'
};

var RESOLVE_LOOKUP_IDENTIFIER = {
    type: 'Identifier',
    name: 'resolveLookup'
};

var LOOKUP_WITH_FALLBACK = 'LOOKUP_WITH_FALLBACK';
var LOOKUP_WITHOUT_FALLBACK = 'LOOKUP_WITHOUT_FALLBACK';
var LOOKUP_IN_FALLBACK = 'LOOKUP_IN_FALLBACK';

function lookupVariable(name, parameters, type) {
    var lookupFunction;

    if (type === LOOKUP_WITH_FALLBACK) {
        lookupFunction = LOOKUP_VALUE_WITH_FALLBACK_IDENTIFIER;
    } else if (type === LOOKUP_IN_FALLBACK) {
        lookupFunction = RESOLVE_LOOKUP_IDENTIFIER;
    } else {
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

lookupVariable.LOOKUP_WITH_FALLBACK = LOOKUP_WITH_FALLBACK;
lookupVariable.LOOKUP_WITHOUT_FALLBACK = LOOKUP_WITHOUT_FALLBACK;
lookupVariable.LOOKUP_IN_FALLBACK = LOOKUP_IN_FALLBACK;

module.exports = lookupVariable;
