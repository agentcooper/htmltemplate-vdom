module.exports = function(propertyName, value) {
	return {
        "type": "CallExpression",
        "callee": {
            "type": "Identifier",
            "name": "tmpl_setvar"
        },
        "arguments": [
            {
                "type": "Literal",
                "value": propertyName,
                "raw": "'" + propertyName + "'"
            },
            value
        ]
    }
}
