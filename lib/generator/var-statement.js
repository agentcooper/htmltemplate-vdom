var attributeValueToExpression = require('./attribute-value-to-expression');
var perlExpression = require('./perl-expression');
var lookupVariable = require('./lookup-variable');

function varStatement(node) {
    var primaryAttribute = node.attributes.filter(isPrimaryAttribute)[0];
    var secondaryAttributes = node.attributes.filter(isSecondaryAttribute);

    if (primaryAttribute.type === 'Expression') {
        return perlExpression(primaryAttribute.content);
    }

    var lookupParameters = null;

    if (secondaryAttributes.length > 0) {
        lookupParameters = secondaryAttributes.reduce(function(acc, attr) {
            acc[attr.name] = attributeValueToExpression(attr);
            return acc;
        }, {});
    }

    return lookupVariable(
        primaryAttribute.name,
        lookupParameters,
        node.name
    );
}

module.exports = varStatement;

function isPrimaryAttribute(attr) {
    return (
        attr.type === 'SingleAttribute' ||
        attr.type === 'Expression'
    );
}

function isSecondaryAttribute(attr) {
    return !isPrimaryAttribute(attr);
}
