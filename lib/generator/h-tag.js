var property = require('./property');

// class="<TMPL_IF condition>className</TMPL_IF>"
// href="items/<TMPL_VAR id>"
function parseAttribute(item, transform) {
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
            dataAttrs(
                property(attrName, parseAttribute(item))
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
