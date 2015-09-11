var getPrimaryAttributeValue = require('./get-primary-attribute-value');

var perlExpression = require('./perl-expression');

var property = require('./property');

function escapeBlockName(blockName) {
    // TODO: More rigorous escaping.
    return 'block_' + blockName;
}

function inlineCall(node) {
    var blockName = escapeBlockName(
        getPrimaryAttributeValue(node.attributes)
    );

    var blockParameters = {
        type: 'ObjectExpression',
        properties: node.attributes
            .filter(function(attr) {
                return attr.type === 'PairAttribute';
            })
            .map(function(attr) {
                var value = (
                    attr.value.type === 'Expression' ?
                        perlExpression(attr.value.content) :
                        {
                            type: 'Literal',
                            value: attr.value
                        }
                );

                return property(attr.name, value);
            })
    };

    return {
        type: 'CallExpression',
        callee: {
            type: 'Identifier',
            name: blockName
        },
        arguments: [blockParameters]
    };
}

module.exports = inlineCall;
