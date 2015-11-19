function render(state, h, options) {
    options = options || {};

    var blocks = options.blocks || {};
    var externals = options.externals || {};
    var resolveLookup = options.resolveLookup;

    // Scope manipulation.
    var scopeChain = [];

    function enterScope(context) {
        scopeChain.push({
            local: null,
            context: context
        });
    }

    function exitScope() {
        var innerScope = scopeChain.pop();
        var outerScope = last(scopeChain);

        var localVariables = innerScope.local;

        if (localVariables) {
            if (!outerScope.local) {
                outerScope.local = localVariables
            } else {
                merge(outerScope.local, localVariables);
            }
        }
    }

    function assignLocalVariable(name, value) {
        var scope = last(scopeChain);

        if (!scope.local) {
            scope.local = keyValue(name, value);
        } else {
            scope.local[name] = value;
        }
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

        if (isFunction(resolveLookup)) {
            return resolveLookup(propertyName);
        }

        return null;
    }

    // View blocks.
    //
    // Each view block is wrapped by a thunk that optionally calls
    // `block.shouldBlockUpdate` before each render.

    /**
     * Creates a thunk that wraps a view block
     * @param {String}   name   Block name, should be passed to top-level
     *                          render function
     * @param {Function} render Block render function
     * @param {Object}   props  Properties of the block - attributes that were
     *                          passed to the TMPL_INLINE tag.
     */
    function ViewBlockThunk(name, render, props) {
        var Block = blocks[name];

        if (!isFunction(Block)) {
            throw new Error('No block: ' + name);
        }

        var block = new Block(props);
        block.el = null;

        if (isFunction(block.shouldBlockUpdate)) {
            this._shouldUpdate = function(previousProps, nextProps) {
                return block.shouldBlockUpdate(previousProps, nextProps);
            };
        }

        this.name = name;
        this.block = block;
        this.props = props;

        this._render = render;

        // Save current scope chain to a special closure to retrieve on
        // `render` call.
        this._closure = scopeChain.slice();
    }

    /**
     * This property is used by `virtual-dom` to detect thunks.
     * @type {String}
     */
    ViewBlockThunk.prototype.type = 'Thunk';

    /**
     * Renders the view block content, this function is called by `virtual-dom`s
     * diff process.
     * @param  {ViewBlockThunk} previous Previously rendered thunk
     * @return {VNode}
     */
    ViewBlockThunk.prototype.render = function(previous) {
        var props = this.props;
        var name = this.name;

        if (!previous || this._shouldUpdate(previous.props, props)) {
            // Replace shared `scopeChain` with the one saved in closure, then
            // restore it once block content is retrieved.
            var oldScopeChain = scopeChain;
            scopeChain = this._closure;

            // TODO: Emit warnings when zero or more than one top-level VNodes
            // are rendered?
            var topLevelVNodes = this._render(props).filter(isVDOMNode);
            var nextVNode = last(topLevelVNodes);

            scopeChain = oldScopeChain;

            var lifeCycleHook = new LifeCycleHook(this.block, props);

            // Do not override special 'no-properties' object that is shared
            // across all VNode instances.
            var nextVNodeProperties = nextVNode.properties;

            nextVNode.properties = merge(clone(nextVNodeProperties), {
                lc: lifeCycleHook,
                attributes: merge(clone(nextVNodeProperties.attributes), {
                    // This attribute is added for easier debugging, maybe
                    // it should only be added in a special *debug* mode.
                    'data-block-name': name
                })
            });

            // Lifecycle hook has to be also installed into special `hooks`
            // hash. Since there are certainly no hooks installed already,
            // this property is overwritten.
            nextVNode.hooks = { lc: lifeCycleHook };

            return nextVNode;
        } else {
            return previous.vnode;
        }
    };

    /**
     * Default `shouldBlockUpdate` implementation, always rerenders.
     * @param  {Object} previousProps
     * @param  {Object} nextProps
     * @return {Boolean}
     */
    ViewBlockThunk.prototype._shouldUpdate = function(previousProps, nextProps) {
        return true;
    };

    /**
     * Hook that implements view block lifecycle mechanism.
     * @param {Block} block
     * @param {Object} props
     */
    function LifeCycleHook(block, props) {
        this.block = block;
        this.props = props;
    }

    /**
     * Called whenever its target VNode is updated, for now the block callback
     * is executed on initial VNode update, i.e. insertion.
     * @param  {DOMNode}       node
     * @param  {String}        propertyName  property name that hook is attached
     *                                       to, meaningless in current use
     * @param  {LifeCycleHook} previousValue
     */
    LifeCycleHook.prototype.hook = function(node, propertyName, previousValue) {
        var block = this.block;

        if (!previousValue) {
            block.el = node;

            if (isFunction(block.blockWillMount)) {
                block.blockWillMount();
            }

            if (isFunction(block.blockDidMount)) {
                defer(function() {
                    block.blockDidMount();
                });
            }
        } else {
            var previousProps = previousValue.props;

            if (isFunction(block.blockDidUpdate) && !areShallowEqual(this.props, previousProps)) {
                defer(function() {
                    block.blockDidUpdate(previousProps);
                });
            }
        }
    };

    /**
     * Called whenever its target VNode is updated or removed, for now block
     * callback is executed in latter case.
     * @param  {DOMNode}       node
     * @param  {String}        propertyName property name that hook is attached
     *                                      to, meaningless in current use
     * @param  {LifeCycleHook} nextValue
     */
    LifeCycleHook.prototype.unhook = function(node, propertyName, nextValue) {
        var block = this.block;

        if (!nextValue) {
            if (isFunction(block.blockWillUnmount)) {
                block.blockWillUnmount();
            }
        } else {
            var nextProps = nextValue.props;

            if (isFunction(block.blockWillUpdate) && !areShallowEqual(this.props, nextProps)) {
                block.blockWillUpdate(nextProps);
            }
        }
    };

    function tmpl_call(name) {
        var args = Array.prototype.slice.call(arguments, 1);

        return lookupValue(name).apply(this, args);
    }

    function isVDOMNode(node) {
        return node && node.type === 'VirtualNode';
    }

    function isFunction(fn) {
        return typeof fn === 'function';
    }

    function merge(target, source) {
        if (source) {
            for (var key in source) {
                target[key] = source[key];
            }
        }

        return target;
    }

    function clone(object) {
        return merge({}, object);
    }

    function areShallowEqual(a, b, finish) {
        for (var key in a) {
            if (a[key] !== b[key]) {
                return false;
            }
        }

        if (finish) {
            return true;
        } else {
            return areShallowEqual(b, a, true);
        }
    }

    function defer(fn) {
        setTimeout(fn, 0);
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

function block_person(blockParameters) {
    enterScope(blockParameters);
    var blockResult = [
        '\n ',
        h('li', {
            'className': [
                'item ',
                lookupValue('active') ? function () {
                    return ['item--active'];
                }() : null
            ].join(''),
            'onclick': tmpl_call.bind(state, 'itemClick', lookupValue('id'))
        }, [
            '\n ',
            lookupValue('name'),
            ' ',
            h('a', {
                'href': [
                    '#/items/',
                    lookupValue('id')
                ].join('')
            }, ['some link']),
            '\n\n ',
            h('div', { 'className': 'input' }, [h('input', {
                    'type': 'text',
                    'placeholder': 'Type something here'
                })]),
            '\n\n ',
            h('ul', {}, [
                '\n ',
                (lookupValue('inner') || []).reduce(function (acc, item) {
                    enterScope(item);
                    acc.push.apply(acc, [
                        '\n ',
                        h('li', {}, [lookupValue('title')]),
                        '\n '
                    ]);
                    exitScope();
                    return acc;
                }, []),
                '\n '
            ]),
            '\n\n ',
            h('div', {}, [
                lookupValue('city_copy'),
                lookupValue('city')
            ]),
            '\n\n ',
            lookupValue('active') ? function () {
                return ['active'];
            }() : function () {
                return ['not active'];
            }(),
            '\n\n ',
            h('div', {}, [
                '\n ',
                h('button', { 'onclick': tmpl_call.bind(state, 'counterClick', lookupValue('id')) }, [
                    '\n ',
                    h('span', {}, ['Click me']),
                    '\n '
                ]),
                '\n ',
                h('span', {}, [lookupValue('counter')]),
                '\n '
            ]),
            '\n '
        ]),
        '\n'
    ];
    exitScope();
    return blockResult;
}
return h('div', { 'className': 'app' }, [
    '\n ',
    h('h2', {}, [lookupValue('title')]),
    '\n\n ',
    h('p', {}, [lookupValue('description')]),
    '\n\n ',
    h('ul', { 'className': 'list' }, [
        '\n ',
        (lookupValue('people') || []).reduce(function (acc, item) {
            enterScope(item);
            acc.push.apply(acc, [
                '\n ',
                new ViewBlockThunk('person', block_person, {
                    'p': lookupValue('name'),
                    'active': lookupValue('active')
                }),
                '\n '
            ]);
            exitScope();
            return acc;
        }, []),
        '\n '
    ]),
    '\n\n ',
    h('p', {}, [h('button', { 'onclick': tmpl_call.bind(state, 'addClick', lookupValue('id')) }, ['Add person'])]),
    '\n ',
    h('p', {}, [h('button', { 'onclick': tmpl_call.bind(state, 'popClick', lookupValue('id')) }, ['Pop person'])]),
    '\n\n ',
    h('div', {}, [
        '\n ',
        h('a', { 'href': [lookupValue('githubLink')].join('') }, [lookupValue('githubLink')]),
        '\n '
    ]),
    '\n'
]);
}

