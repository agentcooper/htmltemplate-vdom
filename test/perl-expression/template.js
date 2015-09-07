function render(state, h) {
    var lookupChain = [state];

    function buildAttribute() {
        return Array.prototype.slice.call(arguments).join('');
    }

    function tmpl_var(propertyName) {
        return lookupValue(propertyName);
    }

    function tmpl_if(condition, a, b) {
        return condition() ? (a && a()) : (b && b());
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

return h('div', { 'className': buildAttribute('app') }, [
    '\n    ',
    tmpl_if(function () {
        return lookupValue('$a') || lookupValue('$b') || lookupValue('$c');
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return (lookupValue('$a') || lookupValue('$b')) && lookupValue('$c');
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return lookupValue('$a') || (lookupValue('$b') || lookupValue('$c'));
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return !lookupValue('$a') && lookupValue('$b') || lookupValue('$c') && !lookupValue('$c');
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return lookupValue('$a') < lookupValue('$c') && lookupValue('$b') >= lookupValue('$c');
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return perl_binary_expr('%', lookupValue('$a') / lookupValue('$b') * lookupValue('$c'), lookupValue('$d'));
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return !lookupValue('$a') && lookupValue('$b') || perl_unary_expr('+', lookupValue('$c'));
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return lookupValue('$a') + lookupValue('$b') - lookupValue('$c');
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return lookupValue('$a') ? lookupValue('$a') + lookupValue('$b') : lookupValue('$c');
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return lookupValue('$a') > 3;
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return 5.5 * lookupValue('$a') >= 0.3;
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return perl_binary_expr('ne', lookupValue('$a'), 'ok');
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return lookupValue('$a')['prop'] && lookupValue('$b')[lookupValue('$prop')] && lookupValue('$a')['b']['c'] && lookupValue('$a')['b'][0][1] && lookupValue('$a')[1] && lookupValue('$a')['b'][9] && lookupValue('$a')[3];
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return lookupValue('$a')[lookupValue('$b')] && lookupValue('$a')[1][lookupValue('$b')] && lookupValue('$a')['b'][lookupValue('$c')] && lookupValue('$a')['b'] && lookupValue('$a')['1x1'];
    }, function () {
        return 'x';
    }),
    '\n    ',
    tmpl_if(function () {
        return lookupValue('$a')[lookupValue('$b') - 1] && lookupValue('$a')[perl_binary_expr('%', lookupValue('@$b'), 3)] && lookupValue('$a')[0];
    }, function () {
        return 'x';
    }),
    '\n\n    ',
    tmpl_if(function () {
        return perl_call('substr', lookupValue('$string'), 1, -1);
    }, function () {
        return 'x';
    }),
    '\n\n    ',
    tmpl_if(function () {
        return lookupValue('$a1') && lookupValue('$b2') && !(lookupValue('$c3') || lookupValue('$d4')) && lookupValue('$e5');
    }, function () {
        return 'x';
    }),
    '\n\n    ',
    tmpl_if(function () {
        return perl_call('fn', lookupValue('$a'), lookupValue('$b')) >= 0 ? perl_call('substr', lookupValue('$c'), perl_call('fn', lookupValue('$c'), lookupValue('$b'))) : '';
    }, function () {
        return 'x';
    }),
    '\n\n    ',
    tmpl_if(function () {
        return !!lookupValue('$a');
    }, function () {
        return 'x';
    }),
    '\n'
])
}
