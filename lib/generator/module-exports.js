function moduleExports(body) {
    var returnValue = body
        .filter(function(expresssion) {
            return expresssion.type === 'CallExpression';
        })
        .pop();

    return [{
        type: 'ReturnStatement',
        argument: {
            type: 'FunctionExpression',
            id: null,
            params: [
                {
                    type: 'Identifier',
                    name: 'h'
                },
                {
                  type: 'Identifier',
                  name: 'options'
                }
            ],
            defaults: [],
            body: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ExpressionStatement',
                        expression: {
                        type: 'AssignmentExpression',
                            operator: '=',
                            left: {
                                type: 'Identifier',
                                name: 'options'
                            },
                            right: {
                                type: 'LogicalExpression',
                                operator: '||',
                                left: {
                                    type: 'Identifier',
                                    name: 'options'
                                },
                                right: {
                                    type: 'ObjectExpression',
                                    properties: []
                                }
                            }
                        }
                    },
                    {
                        type: 'VariableDeclaration',
                        declarations: [
                            {
                                type: 'VariableDeclarator',
                                id: {
                                    type: 'Identifier',
                                    name: 'blocks'
                                },
                                init: {
                                    type: 'LogicalExpression',
                                    operator: '||',
                                    left: {
                                        type: 'MemberExpression',
                                        computed: false,
                                        object: {
                                            type: 'Identifier',
                                            name: 'options'
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: 'blocks'
                                        }
                                    },
                                    right: {
                                        type: 'ObjectExpression',
                                        properties: []
                                    }
                                }
                            }
                        ],
                        kind: 'var'
                    },
                    {
                        type: 'VariableDeclaration',
                        declarations: [
                            {
                                type: 'VariableDeclarator',
                                id: {
                                    type: 'Identifier',
                                    name: 'externals'
                                },
                                init: {
                                    type: 'LogicalExpression',
                                    operator: '||',
                                    left: {
                                        type: 'MemberExpression',
                                        computed: false,
                                        object: {
                                            type: 'Identifier',
                                            name: 'options'
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: 'externals'
                                        }
                                    },
                                    right: {
                                        type: 'ObjectExpression',
                                        properties: []
                                    }
                                }
                            }
                        ],
                        kind: 'var'
                    },
                    {
                        type: 'VariableDeclaration',
                        declarations: [
                            {
                                type: 'VariableDeclarator',
                                id: {
                                    type: 'Identifier',
                                    name: 'lookupValueWithFallback'
                                },
                                init: {
                                    type: 'FunctionExpression',
                                    id: null,
                                    params: [
                                        {
                                            type: 'Identifier',
                                            name: 'propertyName'
                                        },
                                        {
                                            type: 'Identifier',
                                            name: 'params'
                                        }
                                    ],
                                    body: {
                                        type: 'BlockStatement',
                                        body: [
                                            {
                                                type: 'ReturnStatement',
                                                argument: {
                                                    type: 'CallExpression',
                                                    callee: {
                                                        type: 'Identifier',
                                                        name: 'lookupValue'
                                                    },
                                                    arguments: [
                                                        {
                                                            type: 'Identifier',
                                                            name: 'propertyName'
                                                        },
                                                        {
                                                            type: 'Identifier',
                                                            name: 'params'
                                                        },
                                                        {
                                                            type: 'MemberExpression',
                                                            object: {
                                                                type: 'Identifier',
                                                                name: 'options'
                                                            },
                                                            property: {
                                                                type: 'Identifier',
                                                                name: 'resolveLookup'
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    generator: false,
                                    expression: false
                                }
                            }
                        ],
                        kind: 'var'
                    }
                ].concat(
                    body.map(function(statement) {
                        if (statement !== returnValue) {
                            return statement;
                        }

                        return {
                            type: 'ReturnStatement',
                            argument: {
                                type: 'FunctionExpression',
                                id: null,
                                params: [
                                    {
                                        type: 'Identifier',
                                        name: 'state'
                                    }
                                ],
                                defaults: [],
                                body: {
                                    type: 'BlockStatement',
                                    body: [
                                        {
                                            type: 'ExpressionStatement',
                                            expression: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'Identifier',
                                                    name: 'enterScope'
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'state'
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            type: 'VariableDeclaration',
                                            declarations: [
                                                {
                                                    type: 'VariableDeclarator',
                                                    id: {
                                                        type: 'Identifier',
                                                        name: 'returnValue'
                                                    },
                                                    init: returnValue
                                                }
                                            ],
                                            kind: 'var'
                                        },
                                        {
                                            type: 'ExpressionStatement',
                                            expression: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'Identifier',
                                                    name: 'exitScope'
                                                },
                                                arguments: []
                                            }
                                        },
                                        {
                                            type: 'ReturnStatement',
                                            argument: {
                                                type: 'Identifier',
                                                name: 'returnValue'
                                            }
                                        }
                                    ]
                                },
                                generator: false,
                                expression: false
                            }
                        };
                    })
                )
            },
            generator: false,
            expression: false
        }
    }];
}

module.exports = moduleExports;
