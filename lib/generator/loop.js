var functionCallExpression = require('./function-call-expression');

var ITEM_IDENTIFIER = identifier('item');
var ACCUMULATOR_IDENTIFIER = identifier('acc');

var EMPTY_ARRAY = {
    type: 'ArrayExpression',
    elements: []
};

module.exports = function(arr, body, iterationVariable) {
    var localScopeExpression = ITEM_IDENTIFIER;

    if (iterationVariable) {
        localScopeExpression = {
            type: 'CallExpression',
            callee: identifier('keyValue'),
            arguments: [
                {
                    type: 'Literal',
                    value: iterationVariable
                },
                ITEM_IDENTIFIER
            ]
        };
    }

    return {
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
            computed: false,
            object: {
                type: 'LogicalExpression',
                operator: '||',
                left: arr,
                right: EMPTY_ARRAY
            },
            property: identifier('reduce')
        },
        arguments: [
            {
                type: 'FunctionExpression',
                id: null,
                params: [
                    ACCUMULATOR_IDENTIFIER,
                    ITEM_IDENTIFIER
                ],
                body: {
                    type: 'BlockStatement',
                    body: [
                        functionCallExpression('enterScope', [localScopeExpression]),
                        {
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'MemberExpression',
                                    computed: false,
                                    object: {
                                        type: 'MemberExpression',
                                        computed: false,
                                        object: ACCUMULATOR_IDENTIFIER,
                                        property: identifier('push')
                                    },
                                    property: identifier('apply')
                                },
                                arguments: [
                                    ACCUMULATOR_IDENTIFIER,
                                    {
                                        type: 'ArrayExpression',
                                        elements: body
                                    }
                                ]
                            }
                        },
                        functionCallExpression('exitScope'),
                        {
                            type: 'ReturnStatement',
                            argument: ACCUMULATOR_IDENTIFIER
                        }
                    ]
                },
                generator: false,
                expression: false
            },
            EMPTY_ARRAY
        ]
    };
}

function identifier(name) {
    return {
        type: 'Identifier',
        name: name
    };
}