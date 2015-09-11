function render(state, h, userHook) {
    var lookupChain = [state];

    function buildAttribute() {
        return Array.prototype.slice.call(arguments).join('');
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

function block_person(blockParameters) {
    lookupChain.push(blockParameters);
    var blockResult = [
        '\n    ',
        h('li', {
            'className': buildAttribute('item ', lookupValue('active') ? function () {
                return ['item--active'];
            }() : null),
            'onclick': tmpl_call.bind(state, 'itemClick', lookupValue('id')),
            'user-hook': userHook
        }, [
            '\n        ',
            lookupValue('name'),
            ' ',
            h('a', {
                'href': buildAttribute('#/items/', lookupValue('id')),
                'user-hook': userHook
            }, ['some link']),
            '\n\n        ',
            h('div', {
                'className': buildAttribute('input'),
                'user-hook': userHook
            }, [h('input', {
                    'type': buildAttribute('text'),
                    'placeholder': buildAttribute('Type something here'),
                    'user-hook': userHook
                })]),
            '\n\n        ',
            h('ul', { 'user-hook': userHook }, [
                '\n            ',
                tmpl_loop('inner', function () {
                    return [
                        '\n                ',
                        h('li', { 'user-hook': userHook }, [lookupValue('title')]),
                        '\n            '
                    ];
                }),
                '\n        '
            ]),
            '\n\n        ',
            h('div', { 'user-hook': userHook }, [
                lookupValue('city_copy'),
                lookupValue('city')
            ]),
            '\n\n        ',
            lookupValue('active') ? function () {
                return ['active'];
            }() : function () {
                return ['not active'];
            }(),
            '\n\n        ',
            h('div', { 'user-hook': userHook }, [
                '\n            ',
                h('button', {
                    'onclick': tmpl_call.bind(state, 'counterClick', lookupValue('id')),
                    'user-hook': userHook
                }, [
                    '\n                ',
                    h('span', { 'user-hook': userHook }, ['Click me']),
                    '\n            '
                ]),
                '\n            ',
                h('span', { 'user-hook': userHook }, [lookupValue('counter')]),
                '\n        '
            ]),
            '\n    '
        ]),
        '\n'
    ];
    lookupChain.pop(blockParameters);
    return blockResult;
}
return h('div', {
    'className': buildAttribute('app'),
    'user-hook': userHook
}, [
    '\n    ',
    h('h2', { 'user-hook': userHook }, [lookupValue('title')]),
    '\n\n    ',
    h('p', { 'user-hook': userHook }, [lookupValue('description')]),
    '\n\n    ',
    h('ul', {
        'className': buildAttribute('list'),
        'user-hook': userHook
    }, [
        '\n        ',
        tmpl_loop('people', function () {
            return [
                '\n            ',
                block_person({}),
                '\n        '
            ];
        }),
        '\n    '
    ]),
    '\n\n    ',
    h('p', { 'user-hook': userHook }, [h('button', {
            'onclick': tmpl_call.bind(state, 'addClick', lookupValue('id')),
            'user-hook': userHook
        }, ['Add person'])]),
    '\n\n    ',
    h('div', { 'user-hook': userHook }, [
        '\n        ',
        h('a', {
            'href': buildAttribute(lookupValue('githubLink')),
            'user-hook': userHook
        }, [lookupValue('githubLink')]),
        '\n    '
    ]),
    '\n'
]);
}

