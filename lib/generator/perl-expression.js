var traverse = require('traverse');

var binaryOperatorMap = {
    'and': '&&',
    'or': '||',

    '&&': '&&',
    '||': '||',

    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',

    '+': '+',
    '-': '-',
    '*': '*',
    "/": "/"
};

function handler() {
    if (this.node.type === 'CallExpression') {
        return this.update({
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "perl_call"
            },
            "arguments": [
                { "type": "Literal", "value": this.node.callee.name }
            ].concat(
                traverse(this.node.arguments).map(handler)
            )
        }, true);
    }

    if (this.node.type === 'Identifier') {
        return this.update({
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "lookupValue"
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": this.node.name
                }
            ]
        }, true);
    }

    // using direct AST for '-'
    if (this.node.type === 'UnaryExpression' && this.node.operator !== '-') {

        if (this.node.operator === 'not' || this.node.operator === '!') {
            return this.update({
                "type": "UnaryExpression",
                "operator": "!",
                "argument": traverse(this.node.argument).map(handler),
                "prefix": true
            }, true);
        }

        return this.update({
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "perl_unary_expr"
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": this.node.operator
                },
                traverse(this.node.argument).map(handler)
            ]
        }, true);
    }

    if (this.node.type === 'BinaryExpression') {
        var operator = this.node.operator;

        if (binaryOperatorMap[operator]) {
            return this.update({
                "type": "LogicalExpression",
                "operator": binaryOperatorMap[operator],
                "left": traverse(this.node.left).map(handler),
                "right": traverse(this.node.right).map(handler)
            }, true);
        }

        return this.update({
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "perl_binary_expr"
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": operator
                },
                traverse(this.node.left).map(handler),
                traverse(this.node.right).map(handler)
            ]
        }, true);
    }

    if (this.node.type === 'MemberExpression') {
        return this.update({
            "type": "MemberExpression",
            "computed": true,
            "object": this.node.object,
            "property": traverse(this.node.property).map(handler)
        });
    }
}

module.exports = function(ast) {
    return traverse(ast).map(handler);
}
