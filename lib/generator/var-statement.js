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

    var lookupMode = lookupVariable.LOOKUP_WITHOUT_FALLBACK;

    if (node.name === 'TMPL_VAR') {
        lookupMode = lookupVariable.LOOKUP_WITH_FALLBACK;
    } else if (node.name === 'TMPL_TRANS') {
        lookupMode = lookupVariable.LOOKUP_IN_FALLBACK;
    }

    return lookupVariable(
        primaryAttribute.name,
        lookupParameters,
        lookupMode
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
