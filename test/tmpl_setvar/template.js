exports.render = function(state, h, userHook) {
    var lookupChain = [state];

    function tmpl_setvar(propertyName, value) {
        lookupChain[lookupChain.length - 1][propertyName] = value;
    }

    function tmpl_call(name) {
        var args = Array.prototype.slice.call(arguments, 1);

        return lookupValue(name).apply(this, args);
    }

    function lookupValue(propertyName) {
        for (var i = lookupChain.length - 1; i >= 0; i--) {
            if (propertyName in lookupChain[i]) {
                return lookupChain[i][propertyName];
            }
        }

        return null;
    }

    function tmpl_loop(property, body, iterationVariableName) {
        return lookupValue(property).map(function(item) {

            if (iterationVariableName) {
                var obj = {};
                obj[iterationVariableName] = item;
                lookupChain.push(obj);
            } else {
                lookupChain.push(item);
            }

            var iteration = body();

            lookupChain.pop();

            return iteration;
        });
    }

return h('div', {}, [
    '\n    ',
    tmpl_setvar('number', 1 + 2),
    '\n    ',
    tmpl_setvar('show', lookupValue('loggedIn') && lookupValue('showItems')),
    '\n\n    ',
    tmpl_setvar('message', [
        'Nanana ',
        lookupValue('superhero'),
        lookupValue('number')
    ]),
    '\n\n    ',
    lookupValue('message'),
    ', ',
    lookupValue('message'),
    '\n\n    ',
    lookupValue('show') ? function () {
        return [
            '\n        ',
            tmpl_loop('items', function () {
                return [
                    '\n            ',
                    tmpl_setvar('name', [
                        'Mr. ',
                        lookupValue('name')
                    ]),
                    '\n            Name: ',
                    lookupValue('name'),
                    '\n        '
                ];
            }),
            '\n    '
        ];
    }() : null,
    '\n'
]);
};
