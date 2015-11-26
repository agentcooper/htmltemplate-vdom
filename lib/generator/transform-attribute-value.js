var perlExpression = require('./perl-expression');

function transformAttributeValue(attribute) {
    if (attribute.type === 'PairAttribute') {
        if (attribute.value.type === 'Expression') {
            return perlExpression(attribute.value.content);
        }

        if (attribute.content) {
            return perlExpression(attribute.content);
        }

        return {
            type: 'Literal',
            value: attribute.value
        };
    }

    return {
        type: 'Literal',
        value: attribute.name
    };
}

module.exports = transformAttributeValue;
