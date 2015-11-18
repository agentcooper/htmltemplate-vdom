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
    // ~~
    // **
    // xor
};

function handler() {
    if (this.isLeaf) {
        return;
    }

    if (this.node.type === 'CallExpression') {
        return this.update({
            type: 'CallExpression',
            callee: externalFunctionCall({
                type: 'Literal',
                value: this.node.callee.name
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
        var operator = this.node.operator;

        // using direct AST
        if (operator === '-' || operator === '+' || operator === '!') {
            return;
        }

        if (operator === 'not') {
            return this.update(
                not(transform(this.node.argument)),
                true
            );
        }

        throw new Error('Operator `' + operator + '` not yet implemented.');
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

        if (operator === '=~') {
            return this.update(
                testAgainstRegex(
                    transform(this.node.right),
                    transform(this.node.left)
                ),
                true
            );
        }

        if (operator === '!~') {
            return this.update(
                not(
                    testAgainstRegex(
                        transform(this.node.right),
                        transform(this.node.left)
                    )
                ),
                true
            );
        }

        if (binaryOperatorMap[operator]) {
            return this.update({
                // FIXME: Figure out the difference between logical and
                // binary expression in Esprima and update parser.
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

    if (this.node.type === 'Literal' && this.node.regex) {
        var regex = this.node.regex;

        return this.update({
            type: 'Literal',
            value: new RegExp(regex.pattern, regex.flags),
            regex: {
                pattern: regex.pattern,
                flags: regex.flags
            }
        }, true)
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

function externalFunctionCall(literal) {
    return {
        type: 'MemberExpression',
        object: {
            type: 'Identifier',
            name: 'externals'
        },
        property: literal,
        computed: true
    };
}

function testAgainstRegex(regex, value) {
    return {
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
            object: regex,
            property: {
                type: 'Identifier',
                name: 'test'
            }
        },
        arguments: [value]
    }
}

function not(expression) {
    return {
        type: 'UnaryExpression',
        operator: '!',
        argument: expression,
        prefix: true
    };
}

module.exports = transform;
