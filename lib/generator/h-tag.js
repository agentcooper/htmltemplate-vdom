var traverse = require('traverse');

var property = require('./property');
var perlExpression = require('./perl-expression');

function parseAttribute(attr, transform) {
    // For empty attributes, e.g. `checked`, `disabled`.
    if (attr.type === 'SingleAttribute') {
        return {
            type: 'Literal',
            value: true
        };
    }

    if (attr.type === 'PairAttribute') {
        if (attr.content) {
            return concatenate(transform(attr.content));
        }

        if (attr.value.type === 'Expression' && attr.value.content.type === 'ConditionalExpression') {
            var conditionalExpression = attr.value.content;

            return traverse(conditionalExpression).map(function(node) {
                if (this.isLeaf || this.isRoot) {
                    return;
                }

                if (this.parent.node.type === 'ConditionalExpression') {
                    if (this.key === 'test') {
                        this.update(perlExpression(node), true);
                    } else if (this.key === 'consequent') {
                        this.update(concatenate(transform(node)), true);
                    } else if (this.key === 'alternate') {
                        // Only transform if it is not a nested
                        // `ConditionalExpression` node.
                        if (node.type !== 'ConditionalExpression') {
                            this.update(transform(node), true);
                        }
                    }
                }
            });
        }

        return {
            type: 'Literal',
            value: attr.value
        };
    }
}

function buildTmplCall(item, transform) {
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

function hAttributes(node, transform) {
    var dataAttrs = [];

    var attrs = node.attributes.reduce(function(arr, attr) {
        var attrName = attr.name;

        if (attr.name === 'class') {
            attrName = 'className';
        }

        // TODO: Simpler handling of attributes, also more tests.
        if (attrName.indexOf('data') === 0 || attrName === 'for') {
            dataAttrs.push(
                property(attrName, parseAttribute(attr, transform))
            );
        } else {
            arr.push(
                property(
                    attrName,
                    attrName.indexOf('on') === 0 ?
                        buildTmplCall(attr, transform) :
                        parseAttribute(attr, transform)
                )
            );
        }

        return arr;
    }, []);

    if (dataAttrs.length > 0) {
        attrs.push(
            property('attributes', {
                "type": "ObjectExpression",
                "properties": dataAttrs
            })
        );
    }

    return attrs;
};

function isLiteral(el) {
    return el.type === 'Literal';
}

function concatenate(elements) {
    if (elements.length === 1) {
        return elements[0];
    }

    if (elements.every(isLiteral)) {
        return {
            type: 'Literal',
            value: elements.reduce(function(string, el) {
                return string + el.value
            }, '')
        };
    }

    return {
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
            object: {
                type: 'ArrayExpression',
                elements: elements
            },
            property: {
                type: 'Identifier',
                name: 'join'
            },
            computed: false
        },
        arguments: [
            {
                type: 'Literal',
                value: ''
            }
        ]
    };
}

module.exports = function(node, transform) {
    return {
        "type": "CallExpression",
        "callee": {
            "type": "Identifier",
            "name": "h"
        },
        "arguments": [
            {
                "type": "Literal",
                "value": node.name,
                "raw": "'" + node.name + "'"
            },
            {
                "type": "ObjectExpression",
                "properties": hAttributes(node, transform)
            }
        ].concat(
            node.content ? {
                "type": "ArrayExpression",
                "elements": transform(node.content)
            } : []
        )
    };
}
