function render(state, h) {
    var lookupChain = [state];

    function buildAttribute() {
        return Array.prototype.slice.call(arguments).join('');
    }

    function tmpl_var(propertyName) {
        return lookupValue(propertyName);
    }

    function tmpl_setvar(propertyName, value) {
        lookupChain[lookupChain.length - 1][propertyName] = value;
    }

    function tmpl_call(name) {
        var args = Array.prototype.slice.call(arguments, 1);

        return lookupValue(name).apply(this, args);
    }

    function lookupValue(propertyName) {
        var value = null;

        for (var i = lookupChain.length - 1; i >= 0; i--) {
            if (lookupChain[i][propertyName]) {
                return lookupChain[i][propertyName];
            }
        }
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

    function perl_binary_expr(operator, left, right) {
        if (operator === 'ne') {
            return String(left) !== String(right);
        }

        if (operator === 'eq') {
            return String(left) === String(right);
        }

        throw new Error(operator + ' is not implemented');
    }

function block_navbar(blockParameters) {
    lookupChain.push(blockParameters);
    var blockResult = [
        '\n    ',
        h('nav', { 'id': buildAttribute('navbar') }, [
            '\n        ',
            h('h1', {}, [tmpl_var('title')]),
            '\n        ',
            h('ul', {}, [
                '\n            ',
                h('li', {}, [h('a', { 'href': buildAttribute('#') }, ['Home'])]),
                '\n            ',
                h('li', {}, [h('a', { 'href': buildAttribute('#') }, ['About'])]),
                '\n            ',
                h('li', {}, [h('a', { 'href': buildAttribute('#') }, ['Log in'])]),
                '\n        '
            ]),
            '\n    '
        ]),
        '\n'
    ];
    lookupChain.pop(blockParameters);
    return blockResult;
}
return h('div', {}, [
    '\n    ',
    h('div', { 'className': buildAttribute('header') }, [
        '\n        Header\n        ',
        tmpl_setvar('logo', ['Logo']),
        '\n        ',
        block_navbar({ 'title': lookupValue('logo') }),
        '\n    '
    ]),
    '\n\n    ',
    block_footer({}),
    '\n'
]);
function block_footer(blockParameters) {
    lookupChain.push(blockParameters);
    var blockResult = [
        '\n    ',
        h('footer', {}, [
            '\n        Footer\n        ',
            block_navbar({ 'title': 'Bye bye' }),
            '\n    '
        ]),
        '\n'
    ];
    lookupChain.pop(blockParameters);
    return blockResult;
}
}
