var traverse = require('traverse');

var binaryOperatorMap = {
    'and': '&&',
    'or': '||',
    'gt': '>',
    'ge': '>=',
    'lt': '<',
    'le': '<=',

    '&&': '&&',
    '||': '||',

    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',

    '.': '+',
    '+': '+',
    '-': '-',
    '*': '*',
    '/': '/',
    '%': '%'
    // TODO:
    // =~ !~
    // ~~
    // **
    // xor
};

function handler() {
    if (this.node.type === 'CallExpression') {
        return this.update({
            type: 'CallExpression',
            callee: externalFunctionCall({
                type: 'Identifier',
                name: this.node.callee.name
            }),
            arguments: transform(this.node.arguments)
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
                    "value": this.node.name.replace('$', '')
                }
            ]
        }, true);
    }

    if (this.node.type === 'UnaryExpression') {

        // using direct AST
        if (this.node.operator === '-' || this.node.operator === '+') {
            return;
        }

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

        if (operator === 'eq' || operator === 'ne') {
            return this.update({
                "type": "LogicalExpression",
                "operator": (
                    operator === 'eq' ?
                        '===' :
                        '!=='
                ),
                "left": castToString(
                    transform(this.node.left)
                ),
                "right": castToString(
                    transform(this.node.right)
                )
            }, true);
        }

        if (binaryOperatorMap[operator]) {
            return this.update({
                "type": "LogicalExpression",
                "operator": binaryOperatorMap[operator],
                "left": transform(this.node.left),
                "right": transform(this.node.right)
            }, true);
        }

        throw new Error('Operator `' + operator + '` not yet implemented.');
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

function castToString(expression) {
    if (expression.type === 'Literal' && typeof expression.value === 'string') {
        return expression;
    }

    return {
        type: 'CallExpression',
        callee: {
            type: 'Identifier',
            name: 'String'
        },
        arguments: [expression]
    };
}

function externalFunctionCall(identifier) {
    return {
        type: 'MemberExpression',
        object: {
            type: 'MemberExpression',
            object: {
                type: 'Identifier',
                name: 'ht'
            },
            property: {
                type: 'Identifier',
                name: 'x'
            }
        },
        property: identifier,
        computed: false
    };
}

module.exports = transform;
