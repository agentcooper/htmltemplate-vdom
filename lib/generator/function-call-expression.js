function functionCall(functionName, args) {
    if (!Array.isArray(args)) {
        args = [];
    }

    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {
                type: 'Identifier',
                name: functionName
            },
            arguments: args
        }
    };
}

module.exports = functionCall;
