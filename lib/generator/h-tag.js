var traverse = require('traverse');

var property = require('./property');
var perlExpression = require('./perl-expression');
var lookupVariable = require('./lookup-variable');

// List of attributes that can be used both as a property and as an attribute.
var HOMOGRAPHIC_ATTRIBUTES = [
    'checked',
    'class',
    'disabled',
    'href',
    'id',
    'name',
    'type',
    'value',
    'placeholder'
];

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
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
            object: lookupVariable(functionName),
            property: {
                type: 'Identifier',
                name: 'bind'
            }
        },
        arguments: [
            {
                type: 'Literal',
                value: null
            }
        ].concat(functionArguments)
    };
}

function hAttributes(node, transform) {
    var useCompactPropertiesDefinition = node.attributes.every(function(attr) {
        return HOMOGRAPHIC_ATTRIBUTES.indexOf(attr.name) !== -1;
    });

    if (useCompactPropertiesDefinition) {
        return node.attributes.map(function(attr) {
            var attributeName = attr.name === 'class' ? 'className' : attr.name;

            return property(
                attributeName,
                parseAttribute(attr, transform)
            );
        });
    }

    var eventHandlers = node.attributes.filter(isEventHandlerAttribute);

    var ordinaryAttributes = node.attributes
        .filter(function(attr) {
            return !isEventHandlerAttribute(attr);
        });

    var attributes = eventHandlers
        .map(function(attr) {
            return property(
                attr.name,
                buildTmplCall(attr, transform)
            );
        });

    if (ordinaryAttributes.length > 0) {
        attributes.push(
            property('attributes', {
                type: 'ObjectExpression',
                properties: ordinaryAttributes
                    .map(function(attr) {
                        return property(
                            attr.name,
                            parseAttribute(attr, transform)
                        );
                    })
            })
        );
    }

    return attributes;
};

function isLiteral(el) {
    return el.type === 'Literal';
}

function isEventHandlerAttribute(attr) {
    return attr.name.indexOf('on') === 0;
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
    var attributes = hAttributes(node, transform);
    var content = Array.isArray(node.content) ? transform(node.content) : null;

    var hasContent = (
        Array.isArray(content) &&
        content.length > 0
    );

    var hTagArguments = [
        {
            type: 'Literal',
            value: node.name
        }
    ];

    if (attributes.length > 0) {
        hTagArguments.push({
            type: 'ObjectExpression',
            properties: attributes
        });
    } else if (hasContent) {
        hTagArguments.push({
            type: 'Literal',
            value: null
        });
    }

    if (hasContent) {
        hTagArguments.push({
            type: 'ArrayExpression',
            elements: content
        });
    }

    return {
        type: 'CallExpression',
        callee: {
            type: 'Identifier',
            name: 'h'
        },
        arguments: hTagArguments
    };
}
