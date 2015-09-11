function lookupVariable(identifier) {
    return {
        type: 'CallExpression',
        callee: {
            type: 'Identifier',
            name: 'lookupValue'
        },
        arguments: [
            {
                type: 'Literal',
                value: identifier
            }
        ]
    };
}

module.exports = lookupVariable;
