var escodegen = require('escodegen');

var traverse = require('traverse');

var h = require('virtual-dom/h');

var parser = require('../htmltemplate-parser');

var templateRuntime = require('./template-runtime');

function generator(string) {
    var ast = parser.parse(string);

    // class="<TMPL_IF condition>className</TMPL_IF>"
    // href="items/<TMPL_VAR id>"
    function parseAttribute(value) {
        return {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "buildAttribute"
            },
            "arguments": traverse(parser.parse(value)).map(handler)
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

            return this.update(
                {
                    "type": "CallExpression",
                    "callee": {
                        "type": "Identifier",
                        "name": "tmpl_if"
                    },
                    "arguments": [
                        {
                            "type": "Literal",
                            "value": condition.name,
                            "raw": "'" + condition.name + "'"
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
                                        "argument": traverse(ifTrue).map(handler)[0]
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
                                        "argument": traverse(ifFalse).map(handler)[0]
                                    }
                                ]
                            },
                            "generator": false,
                            "expression": false
                        } : null
                    ].filter(Boolean)
                },
                true
            );
        }

        if (this.node.type === 'Tag' && this.node.name === 'TMPL_LOOP') {
            var propertyName = this.node.attributes[0].name;

            return this.update(
                {
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
                                            "elements": traverse(this.node.content).map(handler)
                                        }
                                    }
                                ]
                            },
                            "generator": false,
                            "expression": false
                        }
                    ]
                },
                true
            );
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

        if (this.node.type === 'Tag') {
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
                        "value": parseAttribute(item.value),
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
                        "value": parseAttribute(item.value),
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

            return this.update(
                {
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
                            "elements": traverse(this.node.content).map(handler)
                        } : []
                    )
                },
                true
            );
        }
    }

    var output = traverse(ast).map(handler);

    var body = escodegen.generate(output[0]);

    return templateRuntime.toString().replace('// body', body);
}

module.exports = generator;
