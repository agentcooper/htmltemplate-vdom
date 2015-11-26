var getPrimaryAttributeValue = require('./get-primary-attribute-value');
var functionCallExpression = require('./function-call-expression');
var escapeBlockName = require('./escape-block-name');

var BLOCK_PARAMS_IDENTIFIER = {
    type: 'Identifier',
    name: 'blockParameters'
};

var BLOCK_RESULT_IDENTIFIER = {
    type: 'Identifier',
    name: 'blockResult'
};

function blockDeclaration(attributes, content) {
    var blockName = escapeBlockName(
        getPrimaryAttributeValue(attributes)
    );

    return {
        type: 'FunctionDeclaration',
        id: {
            type: 'Identifier',
            name: blockName
        },
        params: [BLOCK_PARAMS_IDENTIFIER],
        defaults: [],
        body: {
            type: 'BlockStatement',
            body: [
                functionCallExpression('enterScope', [BLOCK_PARAMS_IDENTIFIER]),
                {
                    type: 'VariableDeclaration',
                    declarations: [
                        {
                            type: 'VariableDeclarator',
                            id: BLOCK_RESULT_IDENTIFIER,
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
                    argument: BLOCK_RESULT_IDENTIFIER
                }
            ]
        }
    };
}

module.exports = blockDeclaration;
