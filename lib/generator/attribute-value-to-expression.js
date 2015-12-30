var lookupVariable = require('./lookup-variable');
var perlExpression = require('./perl-expression');

function attributeValueToExpression(attribute) {
    if (attribute.type === 'Expression') {
        return perlExpression(attribute.content);

    } else if (attribute.type === 'SingleAttribute') {
        return lookupVariable(
            attribute.name,
            null,
            lookupVariable.LOOKUP_WITHOUT_FALLBACK
        );

    } else if (attribute.type === 'PairAttribute') {
        if (attribute.value.type === 'Expression') {
            return attributeValueToExpression(attribute.value);
        }

        var content = attribute.content;

        if (content) {
            // FIXME: This can go away with parser update, check later.
            if (content.type === 'Identifier') {
                return lookupVariable(
                    content.name,
                    null,
                    lookupVariable.LOOKUP_WITH_FALLBACK
                );
            }

            return perlExpression(content);
        }

        return lookupVariable(
            attribute.value,
            null,
            lookupVariable.LOOKUP_WITH_FALLBACK
        );
    }
}

module.exports = attributeValueToExpression;
