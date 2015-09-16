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

    function tmpl_loop(arr, body, iterationVariableName) {
        return arr.map(function(item) {

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

function block_navbar(blockParameters) {
    lookupChain.push(blockParameters);
    var blockResult = [
        '\n ',
        h('nav', { 'id': 'navbar' }, [
            '\n ',
            h('h1', {}, [lookupValue('title')]),
            '\n ',
            h('ul', {}, [
                '\n ',
                h('li', {}, [h('a', { 'href': '#' }, ['Home'])]),
                '\n ',
                h('li', {}, [h('a', { 'href': '#' }, ['About'])]),
                '\n ',
                h('li', {}, [h('a', { 'href': '#' }, ['Log in'])]),
                '\n '
            ]),
            '\n '
        ]),
        '\n'
    ];
    lookupChain.pop(blockParameters);
    return blockResult;
}
return h('div', {}, [
    '\n ',
    h('div', { 'className': 'header' }, [
        '\n Header\n        ',
        tmpl_setvar('logo', ['Logo']),
        '\n ',
        block_navbar({ 'title': lookupValue('logo') }),
        '\n '
    ]),
    '\n\n ',
    block_footer({}),
    '\n'
]);
function block_footer(blockParameters) {
    lookupChain.push(blockParameters);
    var blockResult = [
        '\n ',
        h('footer', {}, [
            '\n Footer\n        ',
            block_navbar({ 'title': 'Bye bye' }),
            '\n '
        ]),
        '\n'
    ];
    lookupChain.pop(blockParameters);
    return blockResult;
}
}
