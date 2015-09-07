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
                transform(this.node.arguments)
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
                "argument": transform(this.node.argument),
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
                transform(this.node.argument)
            ]
        }, true);
    }

    if (this.node.type === 'BinaryExpression') {
        var operator = this.node.operator;

        if (binaryOperatorMap[operator]) {
            return this.update({
                "type": "LogicalExpression",
                "operator": binaryOperatorMap[operator],
                "left": transform(this.node.left),
                "right": transform(this.node.right)
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
                transform(this.node.left),
                transform(this.node.right)
            ]
        }, true);
    }

    if (this.node.type === 'MemberExpression') {
        return this.update({
            "type": "MemberExpression",
            "computed": true,
            "object": transform(this.node.object),
            "property": transform(this.node.property)
        }, true);
    }
}

function transform(ast) {
    return traverse(ast).map(handler);
}

module.exports = transform;
