module.exports = function(body) {
    var returnNode = body;

    if (Array.isArray(body)) {
        returnNode = {
            type: 'ArrayExpression',
            elements: body
        };
    }

    return {
        type: 'CallExpression',
        callee: {
            type: 'FunctionExpression',
            id: null,
            params: [],
            defaults: [],
            body: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ReturnStatement',
                        argument: returnNode
                    }
                ]
            },
            generator: false,
            expression: false
        },
        arguments: []
    };
};
