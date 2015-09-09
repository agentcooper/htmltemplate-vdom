function render(state, h) {
    var lookupChain = [state];

    function buildAttribute() {
        return Array.prototype.slice.call(arguments).join('');
    }

    function tmpl_var(propertyName) {
        return lookupValue(propertyName);
    }

    function tmpl_call(name) {
        var args = Array.prototype.slice.call(arguments, 1);

        return lookupValue(name).apply(this, args);
    }

    function lookupValue(propertyName) {
        var value = null;

        for (var i = lookupChain.length - 1; i >= 0; i--) {
            if (lookupChain[i][propertyName]) {
                return lookupChain[i][propertyName];
            }
        }
    }

    function tmpl_loop(property, body) {
        return lookupValue(property).map(function(item) {
            lookupChain.push(item);

            var out = body();

            lookupChain.pop();

            return out;
        });
    }

    function perl_binary_expr(operator, left, right) {
        if (operator === 'ne') {
            return String(left) !== String(right);
        }

        if (operator === 'eq') {
            return String(left) === String(right);
        }

        throw new Error(operator + ' is not implemented');
    }

return h('div', { 'className': buildAttribute('header') }, [
    '\n    ',
    lookupValue('showNotifications') && lookupValue('loggedIn') ? function () {
        return [
            '\n        ',
            h('div', { 'className': buildAttribute('notifications') }, [
                '\n            ',
                tmpl_loop('notifications', function () {
                    return [
                        '\n                ',
                        h('div', {
                            'className': buildAttribute('\n                    notification\n                    ', perl_binary_expr('eq', lookupValue('type'), 'warning') ? function () {
                                return ['\n                        notification--warning\n                    '];
                            }() : perl_binary_expr('eq', lookupValue('type'), 'urgent') ? function () {
                                return ['\n                        notification--urgent\n                    '];
                            }() : null, '\n                ')
                        }, [
                            '\n                ',
                            tmpl_var('text'),
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
])
}
