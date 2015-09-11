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
        .map(function(attr) {
            return attr.value || attr.name;
        })
        [0];
}

module.exports = getPrimaryAttributeValue;
