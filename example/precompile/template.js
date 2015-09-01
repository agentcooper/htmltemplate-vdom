function render(state, h) {
    var lookupChain = [state];

    function buildAttribute() {
        return Array.prototype.slice.call(arguments).join('');
    }

    function tmpl_var(propertyName) {
        return lookupValue(propertyName);
    }

    function tmpl_if(condition, a, b) {
        return lookupValue(condition) ? (a && a()) : (b && b());
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

return h('div', { 'className': buildAttribute('app') }, [
    '\n    ',
    h('h2', {}, [tmpl_var('title')]),
    '\n\n    ',
    h('p', {}, [tmpl_var('description')]),
    '\n\n    ',
    h('ul', { 'className': buildAttribute('list') }, [
        '\n        ',
        tmpl_loop('people', function () {
            return [
                '\n            ',
                h('li', {
                    'className': buildAttribute('item ', tmpl_if('active', function () {
                        return 'item--active';
                    }), ' js-item'),
                    attributes: { 'data-id': buildAttribute(tmpl_var('id')) }
                }, [
                    '\n                ',
                    tmpl_var('name'),
                    ' ',
                    h('a', { 'href': buildAttribute('#/items/', tmpl_var('id')) }, ['some link']),
                    '\n\n                ',
                    h('div', { 'className': buildAttribute('input') }, [h('input', {
                            'type': buildAttribute('text'),
                            'placeholder': buildAttribute('Type something here')
                        })]),
                    '\n\n                ',
                    h('ul', {}, [
                        '\n                    ',
                        tmpl_loop('inner', function () {
                            return [
                                '\n                        ',
                                h('li', {}, [tmpl_var('title')]),
                                '\n                    '
                            ];
                        }),
                        '\n                '
                    ]),
                    '\n\n                ',
                    h('div', {}, [
                        tmpl_var('city_copy'),
                        tmpl_var('city')
                    ]),
                    '\n\n                ',
                    tmpl_if('active', function () {
                        return 'active';
                    }, function () {
                        return 'not active';
                    }),
                    '\n\n                ',
                    h('div', {}, [
                        '\n                    ',
                        h('button', { 'className': buildAttribute('js-increase-counter') }, [
                            '\n                        ',
                            h('span', {}, ['Click me']),
                            '\n                    '
                        ]),
                        '\n                    ',
                        h('span', {}, [tmpl_var('counter')]),
                        '\n                '
                    ]),
                    '\n            '
                ]),
                '\n        '
            ];
        }),
        '\n    '
    ]),
    '\n\n    ',
    h('div', {}, [
        '\n        ',
        h('a', { 'href': buildAttribute(tmpl_var('githubLink')) }, [tmpl_var('githubLink')]),
        '\n    '
    ]),
    '\n'
])
}