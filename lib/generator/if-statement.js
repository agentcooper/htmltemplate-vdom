var attributeValueToExpression = require('./attribute-value-to-expression');

var NULL_NODE = {
    type: 'Literal',
    value: null,
    raw: 'null'
};

module.exports = function(context, transform) {
    var otherwise = NULL_NODE;

    if (context.node.otherwise) {
        otherwise = contentAsArray(
            transform(context.node.otherwise.content)
        );
    }

    return context.node.conditions.reduceRight(function(statement, node) {
        var test = attributeValueToExpression(node.condition);
        var consequent = contentAsArray(transform(node.content));
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

function contentAsArray(body) {
    if (Array.isArray(body)) {
        if (body.length === 0) {
            return NULL_NODE;
        }

        if (body.length === 1) {
            return body[0];
        }

        return {
            type: 'ArrayExpression',
            elements: body
        };
    }

    return body;
}
