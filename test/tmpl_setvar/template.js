function render(state, h) {
    var lookupChain = [state];

    function buildAttribute() {
        return Array.prototype.slice.call(arguments).join('');
    }

    function tmpl_var(propertyName) {
        return lookupValue(propertyName);
    }

    function tmpl_setvar(propertyName, value) {
        lookupChain[lookupChain.length - 1][propertyName] = value;
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

return h('div', {}, [
    '\n    ',
    tmpl_setvar('number', 1 + 2),
    '\n\n    ',
    tmpl_setvar('message', [
        'Nanana ',
        tmpl_var('superhero'),
        tmpl_var('number')
    ]),
    '\n\n    ',
    tmpl_var('message'),
    ', ',
    tmpl_var('message'),
    '\n\n    ',
    tmpl_loop('items', function () {
        return [
            '\n        ',
            tmpl_setvar('name', [
                'Mr. ',
                tmpl_var('name')
            ]),
            '\n        Name: ',
            tmpl_var('name'),
            '\n    '
        ];
    }),
    '\n'
])
}
