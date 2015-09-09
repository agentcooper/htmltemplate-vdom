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

    function tmpl_loop(property, body) {
        return lookupValue(property).map(function(item) {
            lookupChain.push(item);

            var out = body();

            lookupChain.pop();

            return out;
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

function block_block_name() {
    return [
        '\n    ',
        h('nav', { 'id': buildAttribute('navbar') }, [
            '\n        ',
            h('h1', {}, ['Logo']),
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
}
return h('div', {}, ['\n    <header>\n        Header\n    </header>\n']);
}
