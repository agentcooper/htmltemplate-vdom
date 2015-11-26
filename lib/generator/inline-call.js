var getPrimaryAttributeValue = require('./get-primary-attribute-value');
var transformAttributeValue = require('./transform-attribute-value');
var escapeBlockName = require('./escape-block-name');
var property = require('./property');

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
                    !isComponentAttribute(attr) &&
                    !isComponentKeyAttribute(attr)
                );
            })
            .map(function(attr) {
                return property(attr.name, transformAttributeValue(attr));
            })
    };

    if (componentName) {
        var thunkArguments = [
            transformAttributeValue(componentName),
            {
                type: 'Identifier',
                name: blockName
            },
            props
        ];

        var componentKey = getComponentKey(node.attributes);

        if (componentKey) {
            thunkArguments.push(
                transformAttributeValue(componentKey)
            );
        }

        return {
            type: 'NewExpression',
            callee: {
                type: 'Identifier',
                name: 'ViewBlockThunk'
            },
            arguments: thunkArguments
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
        return componentAttribute[0];
    }

    return null;
}

function getComponentKey(attributes) {
    var keyAttribute = attributes.filter(isComponentKeyAttribute);

    if (keyAttribute.length > 0) {
        return keyAttribute[0];
    }

    return null;
}

function isComponentAttribute(attr) {
    return attr.name === 'BLOCK_NAME';
}

function isComponentKeyAttribute(attr) {
    return attr.name === 'BLOCK_KEY';
}

module.exports = inlineCall;
