var lookupVariable = require('./lookup-variable');
var perlExpression = require('./perl-expression');

function attributeValueToExpression(attribute) {
    if (attribute.type === 'Expression') {
        return perlExpression(attribute.content);
    } else if (attribute.type === 'SingleAttribute') {
        return lookupVariable(attribute.name);
    } else if (attribute.type === 'PairAttribute') {
        return attribute.value.type === 'Expression' ?
            attributeValueToExpression(attribute.value) :
            lookupVariable(attribute.value)
    }
}

module.exports = attributeValueToExpression;
