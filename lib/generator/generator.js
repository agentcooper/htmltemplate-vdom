var escodegen = require('escodegen');

var traverse = require('traverse');

var h = require('virtual-dom/h');

var parser = require('htmltemplate-parser');

var perlExpression = require('./perl-expression');

var NULL_NODE = {
    type: 'Literal',
    value: null,
    raw: 'null'
};

function generator(string, templateRuntime) {
    var ast = parser.parse(string);

    function transform(ast) {
        return traverse(ast).map(handler);
    }

    // class="<TMPL_IF condition>className</TMPL_IF>"
    // href="items/<TMPL_VAR id>"
    function parseAttribute(item) {
        return {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "buildAttribute"
            },
            "arguments": item.content ?
                transform(item.content) :
                [{ "type": "Literal", "value": item.value }]
        };
    }

    function buildTmplCall(item) {
        var functionName = item.content[0].content.replace('(', '');

        var functionArguments = transform(item.content.slice(1, -1));

        return {
            "type": "CallExpression",
            "callee": {
                "type": "MemberExpression",
                "computed": false,
                "object": {
                    "type": "Identifier",
                    "name": "tmpl_call"
                },
                "property": {
                    "type": "Identifier",
                    "name": "bind"
                }
            },
            "arguments": [
                NULL_NODE,
                {
                    "type": "Literal",
                    "value": functionName
                }
            ].concat(functionArguments)
        };
    }

    function handler() {
        if (!this.node) {
            return;
        }

        if (this.node.type === 'Text') {
            return this.update({
                "type": "Literal",
                "value": this.node.content
            }, true);
        }

        if (this.node.type === 'Condition') {
            var otherwise = NULL_NODE;

            if (this.node.otherwise) {
                otherwise = iife(
                    transform(this.node.otherwise.content)
                );
            }

            var ifStatement = this.node.conditions.reduceRight(function(statement, node) {
                var expression = {
                    type: 'ConditionalExpression',
                    test: conditionAsTest(node.condition),
                    consequent: iife(
                        transform(node.content)
                    ),
                    alternate: statement
                };

                return expression;
            }, otherwise);

            return this.update(ifStatement, true);
        }

        if (this.node.name === 'TMPL_LOOP' || this.node.name === 'TMPL_FOR') {
            var propertyName =
                this.node.attributes.length === 1 ?
                    this.node.attributes[0].name : this.node.attributes[1].value;

            return this.update({
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "tmpl_loop"
                },
                "arguments": [
                    {
                        "type": "Literal",
                        "value": propertyName,
                        "raw": "'" + propertyName +"'"
                    },
                    {
                        "type": "FunctionExpression",
                        "id": null,
                        "params": [],
                        "defaults": [],
                        "body": {
                            "type": "BlockStatement",
                            "body": [
                                {
                                    "type": "ReturnStatement",
                                    "argument": {
                                        "type": "ArrayExpression",
                                        "elements": transform(this.node.content)
                                    }
                                }
                            ]
                        },
                        "generator": false,
                        "expression": false
                    }
                ].concat(
                    this.node.name === 'TMPL_FOR' ? {
                        "type": "Literal",
                        "value": this.node.attributes[0].name
                    } : []
                )
            }, true);
        }

        if (this.node.name === 'TMPL_SETVAR') {
            var propertyName = this.node.attributes[0].name;

            var content = transform(this.node.content);

            return this.update({
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "tmpl_setvar"
                },
                "arguments": [
                    {
                        "type": "Literal",
                        "value": propertyName,
                        "raw": "'" + propertyName + "'"
                    },
                    {
                        "type": "ArrayExpression",
                        "elements": content
                    }
                ]
            });
        }

        if (this.node.name === 'TMPL_ASSIGN') {
            var propertyName = this.node.attributes[0].name;

            return this.update({
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "tmpl_setvar"
                },
                "arguments": [
                    {
                        "type": "Literal",
                        "value": propertyName,
                        "raw": "'" + propertyName + "'"
                    },
                    perlExpression(this.node.attributes[1].content)
                ]
            }, true);
        }

        if (this.node.name === 'TMPL_BLOCK') {
            return this.update(
                blockDeclaration(
                    this.node.attributes,
                    transform(this.node.content)
                )
            );
        }

        if (this.node.name === 'TMPL_INLINE') {
            return this.update(
                inlineCall(this.node)
            );
        }

        // not supported, just displaying tag children
        if (this.node.name === 'TMPL_WS') {
            return transform(this.node.content)[0];
        }

        if (this.node.type === 'Tag' && this.node.name === 'TMPL_VAR') {
            var propertyName = this.node.attributes[0].name;

            return this.update({
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "tmpl_var"
                },
                "arguments": [
                    {
                        "type": "Literal",
                        "value": propertyName,
                        "raw": "'" + propertyName + "'"
                    }
                ]
            });
        }

        if (this.node.type === 'HTMLTag') {
            var dataAttrs = [];

            var attrs = this.node.attributes.reduce(function(arr, item) {
                var attrName = item.name;

                if (item.name === 'class') {
                    attrName = 'className';
                }

                if (attrName.indexOf('data') === 0) {
                    dataAttrs.push({
                        "type": "Property",
                        "key": {
                            "type": "Literal",
                            "value": attrName,
                        },
                        "computed": false,
                        "value": parseAttribute(item),
                        "kind": "init",
                        "method": false,
                        "shorthand": false
                    });
                } else {
                    arr.push({
                        "type": "Property",
                        "key": {
                            "type": "Literal",
                            "value": attrName,
                        },
                        "computed": false,
                        "value":
                            attrName.indexOf('on') === 0 ?
                                buildTmplCall(item) :
                                parseAttribute(item),
                        "kind": "init",
                        "method": false,
                        "shorthand": false
                    });
                }

                return arr;
            }, []);

            if (dataAttrs.length > 0) {
                attrs.push({
                    "type": "Property",
                    "key": {
                        "type": "Identifier",
                        "name": "attributes"
                    },
                    "computed": false,
                    "value": {
                        "type": "ObjectExpression",
                        "properties": dataAttrs
                    },
                    "kind": "init",
                    "method": false,
                    "shorthand": false
                });
            }

            return this.update({
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "h"
                },
                "arguments": [
                    {
                        "type": "Literal",
                        "value": this.node.name,
                        "raw": "'" + this.node.name + "'"
                    },
                    {
                        "type": "ObjectExpression",
                        "properties": attrs
                    }
                ].concat(
                    this.node.content ? {
                        "type": "ArrayExpression",
                        "elements": transform(this.node.content)
                    } : []
                )
            }, true);
        }

        if (this.node.type === 'InvalidTag') {
            this.update(NULL_NODE, true);
        }
    }

    var output = returnLastStatement(
        stripTopLevelLiterals(
            transform(ast)
        )
    );

    var program = escodegen.generate({
        type: 'Program',
        body: output
    });

    return templateRuntime.replace('// return body', program);
}

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

function inlineCall(node) {
    var blockName = escapeBlockName(
        getPrimaryAttributeValue(node.attributes)
    );

    var blockParameters = {
        type: 'ObjectExpression',
        properties: node.attributes
            .filter(function(attr) {
                return attr.type === 'PairAttribute';
            })
            .map(function(attr) {
                var value = (
                    attr.value.type === 'Expression' ?
                        perlExpression(attr.value.content) :
                        {
                            type: 'Literal',
                            value: attr.value,
                            raw: raw(attr.value)
                        }
                );

                return {
                    type: 'Property',
                    key: {
                        type: 'Literal',
                        value: attr.name,
                        raw: raw(attr.name)
                    },
                    value: value,
                    kind: 'init',
                    shorthand: false,
                    method: false,
                    computed: false
                };
            })
    };

    return {
        type: 'CallExpression',
        callee: {
            type: 'Identifier',
            name: blockName
        },
        arguments: [blockParameters]
    };
}

function conditionAsTest(conditionNode) {
    if (conditionNode.type === 'SingleAttribute') {
        return lookupVariable(conditionNode.name);
    } else if (conditionNode.type === 'Expression') {
        return perlExpression(conditionNode.content);
    }
}

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
                value: identifier,
                raw: raw(identifier)
            }
        ]
    };
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

function iife(body) {
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
}

function escapeBlockName(blockName) {
    // TODO: More rigorous escaping.
    return 'block_' + blockName;
}

function getPrimaryAttributeValue(attributes) {
    return attributes
        .filter(function(attr) {
            return (
                attr.type === 'SingleAttribute' ||
                (
                    attr.type === 'PairAttribute' &&
                    attr.name === 'name'
                )
            );
        })
        .map(function(attr) {
            return attr.value || attr.name;
        })
        [0];
}

function returnLastStatement(body) {
    var lastCallExpression = body
        .filter(function(expresssion) {
            return expresssion.type === 'CallExpression';
        })
        .pop();

    return body.map(function(statement) {
        if (statement === lastCallExpression) {
            return {
                type: 'ReturnStatement',
                argument: statement
            };
        } else {
            return statement;
        }
    });
}

function stripTopLevelLiterals(body) {
    return body.filter(function(node) {
        return node.type !== 'Literal'
    });
}

function raw(string) {
    return "'" + string + "'";
}

module.exports = generator;
