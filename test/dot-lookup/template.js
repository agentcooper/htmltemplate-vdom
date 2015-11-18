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

return h('div', { 'className': 'container' }, [
    '\n ',
    lookupValue('a') && lookupValue('a')['b'] && lookupValue('a')['b']['c'],
    '\n ',
    lookupValue('array') && lookupValue('array')[1] && lookupValue('array')[1]['c'] && lookupValue('array')[1]['c'][3] && lookupValue('array')[1]['c'][3]['field'],
    '\n ',
    lookupValue('label'),
    '\n ',
    lookupValue('label'),
    '\n ',
    lookupValue('label'),
    '\n'
]);
}
