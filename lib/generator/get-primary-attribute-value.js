var transformAttributeValue = require('./transform-attribute-value');

function getPrimaryAttributeValue(attributes) {
    return attributes
        .filter(function(attr) {
            return (
                attr.type === 'SingleAttribute' ||
                (
                    attr.type === 'PairAttribute' &&
                    attr.name === 'name'
                )
            );
        })
        .map(transformAttributeValue)
        [0];
}

module.exports = getPrimaryAttributeValue;
