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

return h('div', { 'className': 'container' }, [
    '\n ',
    (lookupValue('items') || []).reduce(function (acc, item) {
        enterScope(item);
        acc.push.apply(acc, [!lookupValue('b_l___br0') ? function () {
                return [
                    '\n ',
                    h('div', { 'className': 'common' }, ['\n This part is common for all items.\n        ']),
                    '\n\n ',
                    lookupValue('unbreak') ? function () {
                        return [
                            '\n ',
                            h('div', { 'className': 'unskipped' }, ['\n This item is unskipped.\n            ']),
                            '\n '
                        ];
                    }() : lookupValue('can_break') ? function () {
                        return [
                            '\n ',
                            lookupValue('breakable') || 0 ? function () {
                                return [
                                    '\n ',
                                    tmpl_setvar('b_l___br0', 1)
                                ];
                            }() : function () {
                                return [
                                    '\n ',
                                    h('div', { 'className': 'not-skipped' }, ['\n Not skipped.\n                ']),
                                    '\n '
                                ];
                            }()
                        ];
                    }() : null,
                    !lookupValue('unbreak') && lookupValue('can_break') && (lookupValue('breakable') || 0) ? null : function () {
                        return [
                            '\n\n ',
                            h('div', { 'className': 'can-be-skipped' }, [
                                '\n ',
                                lookupValue('value'),
                                '\n '
                            ]),
                            '\n '
                        ];
                    }()
                ];
            }() : null]);
        exitScope();
        return acc;
    }, []),
    '\n'
]);
}
