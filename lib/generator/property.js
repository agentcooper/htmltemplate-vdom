module.exports = function(name, value) {
    return {
        "type": "Property",
        "key": {
            "type": "Literal",
            "value": name,
        },
        "computed": false,
        "value": value,
        "kind": "init",
        "method": false,
        "shorthand": false
    };
};
