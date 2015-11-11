var getPrimaryAttributeValue = require('./get-primary-attribute-value');
var functionCallExpression = require('./function-call-expression');

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
                functionCallExpression('enterScope', [blockParamsIdentifier]),
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
                functionCallExpression('exitScope'),
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

module.exports = blockDeclaration;
