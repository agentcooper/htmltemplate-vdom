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
                modifyLookupChain('push', blockParamsIdentifier),
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
                modifyLookupChain('pop', blockParamsIdentifier),
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

function modifyLookupChain(method, identifier) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'Identifier',
                    name: 'lookupChain'
                },
                property: {
                    type: 'Identifier',
                    name: method
                }
            },
            arguments: [identifier]
        }
    };
}

module.exports = blockDeclaration;
