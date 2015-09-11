function render(state, h, userHook) {
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

    function perl_binary_expr(operator, left, right) {
        if (operator === 'ne') {
            return String(left) !== String(right);
        }

        if (operator === 'eq') {
            return String(left) === String(right);
        }

        throw new Error(operator + ' is not implemented');
    }

return h('div', { 'className': buildAttribute('app') }, [
    '\n    ',
    h('h2', {}, [tmpl_var('title')]),
    '\n\n    ',
    h('p', {}, [tmpl_var('description')]),
    '\n\n    ',
    h('ul', { 'className': buildAttribute('list') }, [
        '\n        ',
        tmpl_loop('people', function () {
            return [
                '\n            ',
                h('li', {
                    'className': buildAttribute('item ', lookupValue('active') ? function () {
                        return ['item--active'];
                    }() : null),
                    'onclick': tmpl_call.bind(state, 'itemClick', tmpl_var('id'))
                }, [
                    '\n                ',
                    tmpl_var('name'),
                    ' ',
                    h('a', { 'href': buildAttribute('#/items/', tmpl_var('id')) }, ['some link']),
                    '\n\n                ',
                    h('div', { 'className': buildAttribute('input') }, [h('input', {
                            'type': buildAttribute('text'),
                            'placeholder': buildAttribute('Type something here')
                        })]),
                    '\n\n                ',
                    h('ul', {}, [
                        '\n                    ',
                        tmpl_loop('inner', function () {
                            return [
                                '\n                        ',
                                h('li', {}, [tmpl_var('title')]),
                                '\n                    '
                            ];
                        }),
                        '\n                '
                    ]),
                    '\n\n                ',
                    h('div', {}, [
                        tmpl_var('city_copy'),
                        tmpl_var('city')
                    ]),
                    '\n\n                ',
                    lookupValue('active') ? function () {
                        return ['active'];
                    }() : function () {
                        return ['not active'];
                    }(),
                    '\n\n                ',
                    h('div', {}, [
                        '\n                    ',
                        h('button', { 'onclick': tmpl_call.bind(state, 'counterClick', tmpl_var('id')) }, [
                            '\n                        ',
                            h('span', {}, ['Click me']),
                            '\n                    '
                        ]),
                        '\n                    ',
                        h('span', {}, [tmpl_var('counter')]),
                        '\n                '
                    ]),
                    '\n            '
                ]),
                '\n        '
            ];
        }),
        '\n    '
    ]),
    '\n\n    ',
    h('div', {}, [
        '\n        ',
        h('a', { 'href': buildAttribute(tmpl_var('githubLink')) }, [tmpl_var('githubLink')]),
        '\n    '
    ]),
    '\n'
]);
}
