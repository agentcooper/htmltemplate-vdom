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

    function keyValue(key, value) {
        var p = {};
        p[key] = value;
        return p;
    }

    function last(list) {
        return list[list.length - 1];
    }

    enterScope(state);

return h('div', {}, [
    '\n ',
    (lookupValue('basicArray') || []).reduce(function (acc, item) {
        enterScope(item);
        acc.push.apply(acc, [lookupValue('title')]);
        exitScope();
        return acc;
    }, []),
    '\n\n ',
    (lookupValue('basicArray') || []).reduce(function (acc, item) {
        enterScope(keyValue('item', item));
        acc.push.apply(acc, [lookupValue('item')['title']]);
        exitScope();
        return acc;
    }, []),
    '\n\n ',
    (lookupValue('nested') && lookupValue('nested')['items'] || []).reduce(function (acc, item) {
        enterScope(item);
        acc.push.apply(acc, ['bla']);
        exitScope();
        return acc;
    }, []),
    '\n\n ',
    (lookupValue('nested') && lookupValue('nested')['moreItems'] || []).reduce(function (acc, item) {
        enterScope(keyValue('item', item));
        acc.push.apply(acc, [lookupValue('item')]);
        exitScope();
        return acc;
    }, []),
    '\n'
]);
}
