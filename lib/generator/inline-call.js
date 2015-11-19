var getPrimaryAttributeValue = require('./get-primary-attribute-value');

var perlExpression = require('./perl-expression');

var property = require('./property');

function escapeBlockName(blockName) {
    // TODO: More rigorous escaping.
    return 'block_' + blockName;
}

function inlineCall(node) {
    var componentName = getComponentName(node);

    var blockName = escapeBlockName(
        getPrimaryAttributeValue(node.attributes)
    );

    var props = {
        type: 'ObjectExpression',
        properties: node.attributes
            .filter(function(attr) {
                return (
                    attr.type === 'PairAttribute' &&
                    !isComponentAttribute(attr)
                );
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

    if (componentName) {
        return {
            type: 'NewExpression',
            callee: {
                type: 'Identifier',
                name: 'ViewBlockThunk'
            },
            arguments: [
                {
                    type: 'Literal',
                    value: componentName
                },
                {
                    type: 'Identifier',
                    name: blockName
                },
                props
            ]
        };
    } else {
        return {
            type: 'CallExpression',
            callee: {
                type: 'Identifier',
                name: blockName
            },
            arguments: [props]
        };
    }
}

function getComponentName(node) {
    var componentAttribute = node.attributes.filter(isComponentAttribute);

    if (componentAttribute.length > 0) {
        return componentAttribute[0].value;
    }

    return null;
}

function isComponentAttribute(attr) {
    return attr.name === 'BLOCK_NAME';
}

module.exports = inlineCall;
