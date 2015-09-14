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

return h('div', { 'className': 'app' }, [
    '\n    ',
    h('h2', {}, [lookupValue('title')]),
    '\n\n    ',
    h('p', {}, [lookupValue('description')]),
    '\n\n    ',
    h('ul', { 'className': 'list' }, [
        '\n        ',
        tmpl_loop('people', function () {
            return [
                '\n            ',
                h('li', {
                    'className': [
                        'item ',
                        lookupValue('active') ? function () {
                            return ['item--active'];
                        }() : null
                    ].join(''),
                    'onclick': tmpl_call.bind(state, 'itemClick', lookupValue('id'))
                }, [
                    '\n                ',
                    lookupValue('name'),
                    ' ',
                    h('a', {
                        'href': [
                            '#/items/',
                            lookupValue('id')
                        ].join('')
                    }, ['some link']),
                    '\n\n                ',
                    h('div', { 'className': 'input' }, [h('input', {
                            'type': 'text',
                            'placeholder': 'Type something here'
                        })]),
                    '\n\n                ',
                    h('ul', {}, [
                        '\n                    ',
                        tmpl_loop('inner', function () {
                            return [
                                '\n                        ',
                                h('li', {}, [lookupValue('title')]),
                                '\n                    '
                            ];
                        }),
                        '\n                '
                    ]),
                    '\n\n                ',
                    h('div', {}, [
                        lookupValue('city_copy'),
                        lookupValue('city')
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
                        h('button', { 'onclick': tmpl_call.bind(state, 'counterClick', lookupValue('id')) }, [
                            '\n                        ',
                            h('span', {}, ['Click me']),
                            '\n                    '
                        ]),
                        '\n                    ',
                        h('span', {}, [lookupValue('counter')]),
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
        h('a', { 'href': [lookupValue('githubLink')].join('') }, [lookupValue('githubLink')]),
        '\n    '
    ]),
    '\n'
]);
};
