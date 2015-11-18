function render(state, h, options) {
    var scopeChain = [];

    options = options || {};

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

return h('div', { 'className': 'app' }, [
    '\n ',
    h('h2', {}, [lookupValue('title')]),
    '\n\n ',
    h('p', {}, [lookupValue('description')]),
    '\n\n ',
    h('ul', { 'className': 'list' }, [
        '\n ',
        (lookupValue('people') || []).reduce(function (acc, item) {
            enterScope(item);
            acc.push.apply(acc, [
                '\n ',
                h('li', {
                    'className': [
                        'item ',
                        lookupValue('active') ? function () {
                            return ['item--active'];
                        }() : null
                    ].join(''),
                    'onclick': tmpl_call.bind(state, 'itemClick', lookupValue('id'))
                }, [
                    '\n ',
                    lookupValue('name'),
                    ' ',
                    h('a', {
                        'href': [
                            '#/items/',
                            lookupValue('id')
                        ].join('')
                    }, ['some link']),
                    '\n\n ',
                    h('div', { 'className': 'input' }, [h('input', {
                            'type': 'text',
                            'placeholder': 'Type something here'
                        })]),
                    '\n\n ',
                    h('ul', {}, [
                        '\n ',
                        (lookupValue('inner') || []).reduce(function (acc, item) {
                            enterScope(item);
                            acc.push.apply(acc, [
                                '\n ',
                                h('li', {}, [lookupValue('title')]),
                                '\n '
                            ]);
                            exitScope();
                            return acc;
                        }, []),
                        '\n '
                    ]),
                    '\n\n ',
                    h('div', {}, [
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
                    h('div', {}, [
                        '\n ',
                        h('button', { 'onclick': tmpl_call.bind(state, 'counterClick', lookupValue('id')) }, [
                            '\n ',
                            h('span', {}, ['Click me']),
                            '\n '
                        ]),
                        '\n ',
                        h('span', {}, [lookupValue('counter')]),
                        '\n '
                    ]),
                    '\n '
                ]),
                '\n '
            ]);
            exitScope();
            return acc;
        }, []),
        '\n '
    ]),
    '\n\n ',
    h('div', {}, [
        '\n ',
        h('a', { 'href': [lookupValue('githubLink')].join('') }, [lookupValue('githubLink')]),
        '\n '
    ]),
    '\n'
]);
}
