function render(state, h, options) {
    options = options || {};

    var externals = options.externals;
    var userHook = options.userHook;
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

        if (options.resolveLookup) {
            return options.resolveLookup(propertyName);
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
            'user-hook': userHook
        }, [
            '\n ',
            lookupValue('name'),
            ' ',
            h('a', {
                'href': [
                    '#/items/',
                    lookupValue('id')
                ].join(''),
                'user-hook': userHook
            }, ['some link']),
            '\n\n ',
            h('div', {
                'className': 'input',
                'user-hook': userHook
            }, [h('input', {
                    'type': 'text',
                    'placeholder': 'Type something here',
                    'user-hook': userHook
                })]),
            '\n\n ',
            h('ul', { 'user-hook': userHook }, [
                '\n ',
                (lookupValue('inner') || []).reduce(function (acc, item) {
                    enterScope(item);
                    acc.push.apply(acc, [
                        '\n ',
                        h('li', { 'user-hook': userHook }, [lookupValue('title')]),
                        '\n '
                    ]);
                    exitScope();
                    return acc;
                }, []),
                '\n '
            ]),
            '\n\n ',
            h('div', { 'user-hook': userHook }, [
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
            h('div', { 'user-hook': userHook }, [
                '\n ',
                h('button', {
                    'onclick': tmpl_call.bind(state, 'counterClick', lookupValue('id')),
                    'user-hook': userHook
                }, [
                    '\n ',
                    h('span', { 'user-hook': userHook }, ['Click me']),
                    '\n '
                ]),
                '\n ',
                h('span', { 'user-hook': userHook }, [lookupValue('counter')]),
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
    'user-hook': userHook
}, [
    '\n ',
    h('h2', { 'user-hook': userHook }, [lookupValue('title')]),
    '\n\n ',
    h('p', { 'user-hook': userHook }, [lookupValue('description')]),
    '\n\n ',
    h('ul', {
        'className': 'list',
        'user-hook': userHook
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
    h('p', { 'user-hook': userHook }, [h('button', {
            'onclick': tmpl_call.bind(state, 'addClick', lookupValue('id')),
            'user-hook': userHook
        }, ['Add person'])]),
    '\n\n ',
    h('div', { 'user-hook': userHook }, [
        '\n ',
        h('a', {
            'href': [lookupValue('githubLink')].join(''),
            'user-hook': userHook
        }, [lookupValue('githubLink')]),
        '\n '
    ]),
    '\n'
]);
}

