var lookupVariable = require('./lookup-variable');
var perlExpression = require('./perl-expression');

function attributeValueToExpression(attribute) {
    if (attribute.type === 'Expression') {
        return perlExpression(attribute.content);
    } else if (attribute.type === 'SingleAttribute') {
        return lookupVariable(attribute.name);
    } else if (attribute.type === 'PairAttribute') {
        if (attribute.value.type === 'Expression') {
            return attributeValueToExpression(attribute.value);
        }

        if (attribute.content) {
            return perlExpression(attribute.content);
        }

        return lookupVariable(attribute.value)
    }
}

module.exports = attributeValueToExpression;
