function render(state, h, options) {
    var scopeChain = [];

    function enterScope(context) {
        scopeChain.push({local: null, context: context});
    }

    function exitScope() {
        var innerScope = scopeChain.pop();
        var outerScope = last(scopeChain);

        var localVariables = innerScope.local;

        if (localVariables) {
            if (!outerScope.local) {
                outerScope.local = localVariables
            } else {
                for (var key in localVariables) {
                    outerScope.local[key] = localVariables[key];
                }
            }
        }
    }

    function tmpl_setvar(propertyName, value) {
        var scope = last(scopeChain);

        if (!scope.local) {
            scope.local = keyValue(propertyName, value);
        } else {
            scope.local[propertyName] = value;
        }
    }

    function tmpl_call(name) {
        var args = Array.prototype.slice.call(arguments, 1);

        return lookupValue(name).apply(this, args);
    }

    function lookupValue(propertyName) {
        for (var i = scopeChain.length - 1; i >= 0; i--) {
            var scope = scopeChain[i];

            if (scope.local && propertyName in scope.local) {
                return scope.local[propertyName];
            } else if (propertyName in scope.context) {
                return scope.context[propertyName];
            }
        }

        return null;
    }

    function keyValue(key, value) {
        var p = {};
        p[key] = value;
        return p;
    }

    function last(list) {
        return list[list.length - 1];
    }

    enterScope(state);

function block_person(blockParameters) {
    enterScope(blockParameters);
    var blockResult = [
        '\n ',
        h('li', {
            'className': [
                'item ',
                lookupValue('active') ? function () {
                    return ['item--active'];
                }() : null
            ].join(''),
            'onclick': tmpl_call.bind(state, 'itemClick', lookupValue('id')),
            'user-hook': options.userHook
        }, [
            '\n ',
            lookupValue('name'),
            ' ',
            h('a', {
                'href': [
                    '#/items/',
                    lookupValue('id')
                ].join(''),
                'user-hook': options.userHook
            }, ['some link']),
            '\n\n ',
            h('div', {
                'className': 'input',
                'user-hook': options.userHook
            }, [h('input', {
                    'type': 'text',
                    'placeholder': 'Type something here',
                    'user-hook': options.userHook
                })]),
            '\n\n ',
            h('ul', { 'user-hook': options.userHook }, [
                '\n ',
                (lookupValue('inner') || []).reduce(function (acc, item) {
                    enterScope(item);
                    acc.push.apply(acc, [
                        '\n ',
                        h('li', { 'user-hook': options.userHook }, [lookupValue('title')]),
                        '\n '
                    ]);
                    exitScope();
                    return acc;
                }, []),
                '\n '
            ]),
            '\n\n ',
            h('div', { 'user-hook': options.userHook }, [
                lookupValue('city_copy'),
                lookupValue('city')
            ]),
            '\n\n ',
            lookupValue('active') ? function () {
                return ['active'];
            }() : function () {
                return ['not active'];
            }(),
            '\n\n ',
            h('div', { 'user-hook': options.userHook }, [
                '\n ',
                h('button', {
                    'onclick': tmpl_call.bind(state, 'counterClick', lookupValue('id')),
                    'user-hook': options.userHook
                }, [
                    '\n ',
                    h('span', { 'user-hook': options.userHook }, ['Click me']),
                    '\n '
                ]),
                '\n ',
                h('span', { 'user-hook': options.userHook }, [lookupValue('counter')]),
                '\n '
            ]),
            '\n '
        ]),
        '\n'
    ];
    exitScope();
    return blockResult;
}
return h('div', {
    'className': 'app',
    'user-hook': options.userHook
}, [
    '\n ',
    h('h2', { 'user-hook': options.userHook }, [lookupValue('title')]),
    '\n\n ',
    h('p', { 'user-hook': options.userHook }, [lookupValue('description')]),
    '\n\n ',
    h('ul', {
        'className': 'list',
        'user-hook': options.userHook
    }, [
        '\n ',
        (lookupValue('people') || []).reduce(function (acc, item) {
            enterScope(item);
            acc.push.apply(acc, [
                '\n ',
                block_person({}),
                '\n '
            ]);
            exitScope();
            return acc;
        }, []),
        '\n '
    ]),
    '\n\n ',
    h('p', { 'user-hook': options.userHook }, [h('button', {
            'onclick': tmpl_call.bind(state, 'addClick', lookupValue('id')),
            'user-hook': options.userHook
        }, ['Add person'])]),
    '\n\n ',
    h('div', { 'user-hook': options.userHook }, [
        '\n ',
        h('a', {
            'href': [lookupValue('githubLink')].join(''),
            'user-hook': options.userHook
        }, [lookupValue('githubLink')]),
        '\n '
    ]),
    '\n'
]);
}

