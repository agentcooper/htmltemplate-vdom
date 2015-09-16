var property = require('./property');

// class="<TMPL_IF condition>className</TMPL_IF>"
// href="items/<TMPL_VAR id>"
function parseAttribute(item, transform) {
    if (!item.content) {
        return {
            type: 'Literal',
            value: item.value
        };
    }

    var elements = transform(item.content);

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

function hAttributes(node, transform, options) {
    var dataAttrs = [];

    var attrs = node.attributes.reduce(function(arr, item) {
        var attrName = item.name;

        if (item.name === 'class') {
            attrName = 'className';
        }

        if (attrName.indexOf('data') === 0) {
            dataAttrs.push(
                property(attrName, parseAttribute(item, transform))
            );
        } else {
            arr.push(
                property(
                    attrName,
                    attrName.indexOf('on') === 0 ?
                        buildTmplCall(item, transform) :
                        parseAttribute(item, transform)
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

    return attrs;
};

function isLiteral(el) {
    return el.type === 'Literal';
}

module.exports = function(node, transform, options) {
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
                "properties": hAttributes(node, transform, options)
            }
        ].concat(
            node.content ? {
                "type": "ArrayExpression",
                "elements": transform(node.content)
            } : []
        )
    };
}
