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
            if (attr.type === 'PairAttribute') {
                return {
                    type: 'Literal',
                    value: attr.value
                };
            }

            return {
                type: 'Literal',
                value: attr.name
            };
        })
        [0];
}

module.exports = getPrimaryAttributeValue;
