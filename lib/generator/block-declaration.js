var getPrimaryAttributeValue = require('./get-primary-attribute-value');

function blockDeclaration(attributes, content) {
    var blockName = escapeBlockName(
        getPrimaryAttributeValue(attributes)
    );

    var blockParamsIdentifier = {
        type: 'Identifier',
        name: 'blockParameters'
    };

    var blockResultIdentifier = {
        type: 'Identifier',
        name: 'blockResult'
    };

    return {
        type: 'FunctionDeclaration',
        id: {
            type: 'Identifier',
            name: blockName
        },
        params: [blockParamsIdentifier],
        defaults: [],
        body: {
            type: 'BlockStatement',
            body: [
                functionCall('enterScope', [blockParamsIdentifier]),
                {
                    type: 'VariableDeclaration',
                    declarations: [
                        {
                            type: 'VariableDeclarator',
                            id: blockResultIdentifier,
                            init: {
                                type: 'ArrayExpression',
                                elements: content
                            }
                        }
                    ],
                    kind: 'var'
                },
                functionCall('exitScope'),
                {
                    type: 'ReturnStatement',
                    argument: blockResultIdentifier
                }
            ]
        }
    };
}

function escapeBlockName(blockName) {
    // TODO: More rigorous escaping.
    return 'block_' + blockName;
}

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

module.exports = blockDeclaration;
