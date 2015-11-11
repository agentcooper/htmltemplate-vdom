function render(state, h, userHook) {
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

    function tmpl_loop(arr, body, iterationVariableName) {
        return arr.map(function(item) {
            if (iterationVariableName) {
                enterScope(keyValue(iterationVariableName, item));
            } else {
                enterScope(item);
            }

            var iteration = body();

            exitScope();

            return iteration;
        });
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
    lookupValue('a') || lookupValue('b') || lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n ',
    (lookupValue('a') || lookupValue('b')) && lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n ',
    lookupValue('a') || (lookupValue('b') || lookupValue('c')) ? function () {
        return ['x'];
    }() : null,
    '\n ',
    !lookupValue('a') && lookupValue('b') || lookupValue('c') && !lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n ',
    lookupValue('a') < lookupValue('c') && lookupValue('b') >= lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n ',
    lookupValue('a') / lookupValue('b') * lookupValue('c') % lookupValue('d') ? function () {
        return ['x'];
    }() : null,
    '\n ',
    !lookupValue('a') && lookupValue('b') || +lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n ',
    lookupValue('a') + lookupValue('b') - lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n ',
    (lookupValue('a') ? lookupValue('a') + lookupValue('b') : lookupValue('c')) ? function () {
        return ['x'];
    }() : null,
    '\n ',
    lookupValue('a') > 3 ? function () {
        return ['x'];
    }() : null,
    '\n ',
    5.5 * lookupValue('a') >= 0.3 ? function () {
        return ['x'];
    }() : null,
    '\n ',
    String(lookupValue('a')) !== 'ok' ? function () {
        return ['x'];
    }() : null,
    '\n ',
    lookupValue('a')['prop'] && lookupValue('b')[lookupValue('prop')] && lookupValue('a')['b']['c'] && lookupValue('a')['b'][0][1] && lookupValue('a')[1] && lookupValue('a')['b'][9] && lookupValue('a')[3] ? function () {
        return ['x'];
    }() : null,
    '\n ',
    lookupValue('a')[lookupValue('b')] && lookupValue('a')[1][lookupValue('b')] && lookupValue('a')['b'][lookupValue('c')] && lookupValue('a')['b'] && lookupValue('a')['1x1'] ? function () {
        return ['x'];
    }() : null,
    '\n ',
    lookupValue('a')[lookupValue('b') - 1] && lookupValue('a')[lookupValue('@b') % 3] && lookupValue('a')[0] ? function () {
        return ['x'];
    }() : null,
    '\n\n ',
    ht.x.substr(lookupValue('string'), 1, -1) ? function () {
        return ['x'];
    }() : null,
    '\n\n ',
    lookupValue('a1') && lookupValue('b2') && !(lookupValue('c3') || lookupValue('d4')) && lookupValue('e5') ? function () {
        return ['x'];
    }() : null,
    '\n\n ',
    (ht.x.fn(lookupValue('a'), lookupValue('b')) >= 0 ? ht.x.substr(lookupValue('c'), ht.x.fn(lookupValue('c'), lookupValue('b'))) : '') ? function () {
        return ['x'];
    }() : null,
    '\n\n ',
    !!lookupValue('a') ? function () {
        return ['x'];
    }() : null,
    '\n ',
    /a|b|c|d/.test(lookupValue('letter')) || /[0-9]+/g.test(lookupValue('digit')) || !/^null$/.test(lookupValue('text')) ? function () {
        return [];
    }() : null,
    '\n'
]);
}
