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

function block_person(blockParameters) {
    lookupChain.push(blockParameters);
    var blockResult = [
        '\n    ',
        h('li', {
            'className': [
                'item ',
                lookupValue('active') ? function () {
                    return ['item--active'];
                }() : null
            ].join(''),
            'onclick': tmpl_call.bind(state, 'itemClick', lookupValue('id')),
            'user-hook': userHook
        }, [
            '\n        ',
            lookupValue('name'),
            ' ',
            h('a', {
                'href': [
                    '#/items/',
                    lookupValue('id')
                ].join(''),
                'user-hook': userHook
            }, ['some link']),
            '\n\n        ',
            h('div', {
                'className': 'input',
                'user-hook': userHook
            }, [h('input', {
                    'type': 'text',
                    'placeholder': 'Type something here',
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
    'className': 'app',
    'user-hook': userHook
}, [
    '\n    ',
    h('h2', { 'user-hook': userHook }, [lookupValue('title')]),
    '\n\n    ',
    h('p', { 'user-hook': userHook }, [lookupValue('description')]),
    '\n\n    ',
    h('ul', {
        'className': 'list',
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
            'href': [lookupValue('githubLink')].join(''),
            'user-hook': userHook
        }, [lookupValue('githubLink')]),
        '\n    '
    ]),
    '\n'
]);
};

