var iife = require('./es-iife');

var lookupVariable = require('./lookup-variable');

var perlExpression = require('./perl-expression');

var NULL_NODE = {
    type: 'Literal',
    value: null,
    raw: 'null'
};

function conditionAsTest(conditionNode) {
    if (conditionNode.type === 'SingleAttribute') {
        return lookupVariable(conditionNode.name);
    } else if (conditionNode.type === 'Expression') {
        return perlExpression(conditionNode.content);
    }
}

module.exports = function(context, transform) {
    var otherwise = NULL_NODE;

    if (context.node.otherwise) {
        otherwise = iife(
            transform(context.node.otherwise.content)
        );
    }

    return context.node.conditions.reduceRight(function(statement, node) {
        var test = conditionAsTest(node.condition);
        var consequent = iife(transform(node.content));
        var alternate = statement;

        if (context.node.name === 'TMPL_UNLESS') {
            return {
                type: 'ConditionalExpression',
                test: test,
                consequent: alternate,
                alternate: consequent
            };
        } else {
            return {
                type: 'ConditionalExpression',
                test: test,
                consequent: consequent,
                alternate: alternate
            };
        }
    }, otherwise);
}
