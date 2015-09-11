module.exports = function(propertyName, body, iterationVariable) {
	return {
        "type": "CallExpression",
        "callee": {
            "type": "Identifier",
            "name": "tmpl_loop"
        },
        "arguments": [
            {
                "type": "Literal",
                "value": propertyName,
                "raw": "'" + propertyName +"'"
            },
            {
                "type": "FunctionExpression",
                "id": null,
                "params": [],
                "defaults": [],
                "body": {
                    "type": "BlockStatement",
                    "body": [
                        {
                            "type": "ReturnStatement",
                            "argument": {
                                "type": "ArrayExpression",
                                "elements": body
                            }
                        }
                    ]
                },
                "generator": false,
                "expression": false
            }
        ].concat(
            iterationVariable ? {
                "type": "Literal",
                "value": iterationVariable
            } : []
        )
    };
}
