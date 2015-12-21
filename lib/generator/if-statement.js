var iife = require('./es-iife');
var attributeValueToExpression = require('./attribute-value-to-expression');

var NULL_NODE = {
    type: 'Literal',
    value: null,
    raw: 'null'
};

module.exports = function(context, transform) {
    var otherwise = NULL_NODE;

    if (context.node.otherwise) {
        otherwise = iife(
            transform(context.node.otherwise.content)
        );
    }

    return context.node.conditions.reduceRight(function(statement, node) {
        var test = attributeValueToExpression(node.condition);
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
