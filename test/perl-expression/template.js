function render(state, h, userHook) {
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
    lookupValue('a') || lookupValue('b') || lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    (lookupValue('a') || lookupValue('b')) && lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    lookupValue('a') || (lookupValue('b') || lookupValue('c')) ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    !lookupValue('a') && lookupValue('b') || lookupValue('c') && !lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    lookupValue('a') < lookupValue('c') && lookupValue('b') >= lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    lookupValue('a') / lookupValue('b') * lookupValue('c') % lookupValue('d') ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    !lookupValue('a') && lookupValue('b') || +lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    lookupValue('a') + lookupValue('b') - lookupValue('c') ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    (lookupValue('a') ? lookupValue('a') + lookupValue('b') : lookupValue('c')) ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    lookupValue('a') > 3 ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    5.5 * lookupValue('a') >= 0.3 ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    String(lookupValue('a')) !== 'ok' ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    lookupValue('a')['prop'] && lookupValue('b')[lookupValue('prop')] && lookupValue('a')['b']['c'] && lookupValue('a')['b'][0][1] && lookupValue('a')[1] && lookupValue('a')['b'][9] && lookupValue('a')[3] ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    lookupValue('a')[lookupValue('b')] && lookupValue('a')[1][lookupValue('b')] && lookupValue('a')['b'][lookupValue('c')] && lookupValue('a')['b'] && lookupValue('a')['1x1'] ? function () {
        return ['x'];
    }() : null,
    '\n    ',
    lookupValue('a')[lookupValue('b') - 1] && lookupValue('a')[lookupValue('@b') % 3] && lookupValue('a')[0] ? function () {
        return ['x'];
    }() : null,
    '\n\n    ',
    ht.x.substr(lookupValue('string'), 1, -1) ? function () {
        return ['x'];
    }() : null,
    '\n\n    ',
    lookupValue('a1') && lookupValue('b2') && !(lookupValue('c3') || lookupValue('d4')) && lookupValue('e5') ? function () {
        return ['x'];
    }() : null,
    '\n\n    ',
    (ht.x.fn(lookupValue('a'), lookupValue('b')) >= 0 ? ht.x.substr(lookupValue('c'), ht.x.fn(lookupValue('c'), lookupValue('b'))) : '') ? function () {
        return ['x'];
    }() : null,
    '\n\n    ',
    !!lookupValue('a') ? function () {
        return ['x'];
    }() : null,
    '\n'
]);
}
