var fs = require('fs');

var path = require('path');

var escodegen = require('escodegen');

var traverse = require('traverse');

var parser = require('htmltemplate-parser');

var perlExpression = require('./perl-expression');

var ifStatement = require('./if-statement');

var inlineCall = require('./inline-call');

var blockDeclaration = require('./block-declaration');

var getPrimaryAttributeValue = require('./get-primary-attribute-value');

var lookupVariable = require('./lookup-variable');

var property = require('./property');

var NULL_NODE = {
    type: 'Literal',
    value: null,
    raw: 'null'
};

var templateRuntime = fs.readFileSync(
    path.resolve(__dirname, 'template-runtime.txt'),
    'utf8'
);

function generator(ast, options) {
    options = options || {};

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
                    "type": "Identifier",
                    "name": "state"
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
                "value": this.node.content
            }, true);
        }

        if (this.node.type === 'Condition') {
            var otherwise = NULL_NODE;

            return this.update(ifStatement(this, transform), true);
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

            return this.update(lookupVariable(propertyName));
        }

        if (this.node.type === 'HTMLTag') {
            var dataAttrs = [];

            var attrs = this.node.attributes.reduce(function(arr, item) {
                var attrName = item.name;

                if (item.name === 'class') {
                    attrName = 'className';
                }

                if (attrName.indexOf('data') === 0) {
                    dataAttrs(
                        property(attrName, parseAttribute(item))
                    );
                } else {
                    arr.push(
                        property(
                            attrName,
                            attrName.indexOf('on') === 0 ?
                                buildTmplCall(item) :
                                parseAttribute(item)
                        )
                    );
                }

                return arr;
            }, []);

            if (options.hooks) {
                attrs.push(
                    property('user-hook', {
                        "type": "Identifier",
                        "name": "userHook"
                    })
                );
            }

            if (dataAttrs.length > 0) {
                attrs.push(
                    property('attributes', {
                        "type": "ObjectExpression",
                        "properties": dataAttrs
                    })
                );
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

module.exports = {
    fromString: function(string, options) {
        var ast = parser.parse(string);

        return generator(ast, options);
    },

    fromAST: function(ast, options) {
        return generator(ast, options);
    }
};
