var escodegen = require('escodegen');

var traverse = require('traverse');

var h = require('virtual-dom/h');

// var parser = require('htmltemplate-parser');
var parser = require('../../../htmltemplate-parser')

var perlExpression = require('./perl-expression');

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
                {
                    "type": "Literal",
                    "value": null,
                    "raw": "null"
                },
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
                "value": this.node.content,
                "raw": "'" + this.node.content + "'"
            });
        }

        if (this.node.type === 'Condition') {
            var condition = this.node.conditions[0].condition;

            var ifTrue = this.node.conditions[0].content,
                ifFalse = null;

            if (this.node.otherwise) {
                ifFalse = this.node.otherwise.content;
            }

            return this.update({
                "type": "CallExpression",
                "callee": {
                    "type": "Identifier",
                    "name": "tmpl_if"
                },
                "arguments": [
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
                                    "argument": condition.content ?
                                        perlExpression(condition.content)
                                        :
                                        {
                                            "type": "CallExpression",
                                            "callee": {
                                                "type": "Identifier",
                                                "name": "lookupValue"
                                            },
                                            "arguments": [
                                                {
                                                    "type": "Literal",
                                                    "value": condition.name,
                                                    "raw": "'a'"
                                                }
                                            ]
                                        }
                                }
                            ]
                        },
                        "generator": false,
                        "expression": false
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
                                        "elements": transform(ifTrue)
                                    }
                                }
                            ]
                        },
                        "generator": false,
                        "expression": false
                    },
                    ifFalse ? {
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
                                        "elements": transform(ifFalse)
                                    }
                                }
                            ]
                        },
                        "generator": false,
                        "expression": false
                    } : null
                ].filter(Boolean)
            }, true);
        }

        if (this.node.type === 'Tag' && this.node.name === 'TMPL_LOOP') {
            var propertyName = this.node.attributes[0].name;

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
                ]
            }, true);
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
    }

    var output = transform(ast);

    var body = escodegen.generate(output[0]);

    return templateRuntime.replace('// return body', 'return ' + body);
}

module.exports = generator;
