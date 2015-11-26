module.exports = function(propertyName, value) {
    return {
        type: 'CallExpression',
        callee: {
            type: 'Identifier',
            name: 'assignLocalVariable'
        },
        arguments: [
            {
                type: 'Literal',
                value: propertyName,
                raw: '"' + propertyName + '"'
            },
            value
        ]
    }
}
