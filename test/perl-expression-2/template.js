function render(state, h, userHook) {
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

return h('div', { 'className': 'header' }, [
    '\n    ',
    lookupValue('showNotifications') && lookupValue('loggedIn') ? function () {
        return [
            '\n        ',
            h('div', { 'className': 'notifications' }, [
                '\n            ',
                tmpl_loop('notifications', function () {
                    return [
                        '\n                ',
                        h('div', {
                            'className': [
                                '\n                    notification\n                    ',
                                String(lookupValue('type')) === 'warning' ? function () {
                                    return ['\n                        notification--warning\n                    '];
                                }() : String(lookupValue('type')) === 'urgent' ? function () {
                                    return ['\n                        notification--urgent\n                    '];
                                }() : null,
                                '\n                '
                            ].join('')
                        }, [
                            '\n                ',
                            lookupValue('text'),
                            '\n                '
                        ]),
                        '\n            '
                    ];
                }),
                '\n        '
            ]),
            '\n    '
        ];
    }() : null,
    '\n'
]);
}
