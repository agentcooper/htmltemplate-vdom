(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.render = factory();
    }
}(this, function () {

    // Scope manipulation.
    var scopeChain = [];

    function enterScope(context, special) {
        scopeChain.push({
            local: null,
            context: context,
            special: special || null
        });
    }

    function exitScope() {
        var innerScope = scopeChain.pop();
        var outerScope = last(scopeChain);

        var localVariables = innerScope.local;

        if (localVariables && outerScope) {
            if (!outerScope.local) {
                outerScope.local = localVariables;
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

    function lookupValue(propertyName, params, lookupFallback) {
        for (var i = scopeChain.length - 1; i >= 0; i--) {
            var scope = scopeChain[i];

            if (scope.local && propertyName in scope.local) {
                return scope.local[propertyName];
            } else if (scope.special && propertyName in scope.special) {
                return scope.special[propertyName];
            } else if (propertyName in scope.context) {
                return scope.context[propertyName];
            }
        }

        if (isFunction(lookupFallback)) {
            return lookupFallback(propertyName, params);
        }

        return null;
    }

    // View blocks.
    //
    // Each view block is wrapped by a thunk that optionally calls
    // `block.shouldBlockUpdate` before each render.

    /**
     * Creates a thunk that wraps a view block
     * @param {Block}    Block  Block constructor
     * @param {Function} render Block render function
     * @param {Object}   props  Properties of the block - attributes that were
     *                          passed to the TMPL_INLINE tag.
     * @param {String}   name   Block name, should be passed to top-level
     *                          render function
     * @param {String}   key    Optional block key, necessary for optimal
     *                          collection rendering.
     */
    function ViewBlockThunk(Block, render, props, name, key) {
        if (!isFunction(Block)) {
            throw new Error('Can\'t find block "' + name + '".');
        }

        this.key = key || null;
        this.name = name;
        this.props = props;

        this._render = render;
        this._Block = Block;

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
        var name = this.name;
        var props = this.props;
        var block = this.block

        if (!block) {
            // Reusing block instances between thunk renders. This is done
            // to keep a single stateful block instance throughout all render
            // passes.
            var shouldReusePreviousBlock = (
                previous &&
                previous.block &&
                previous._Block === this._Block
            );

            if (shouldReusePreviousBlock) {
                block = this.block = previous.block;
            } else {
                block = this.block = new this._Block(props);

                // These two fields will be managed by the lifecycle mechanism.
                block.el = null;
                block.props = props;
            }

            if (isFunction(block.shouldBlockUpdate)) {
                this._shouldUpdate = block.shouldBlockUpdate.bind(block);
            }
        }

        if (!previous || this._shouldUpdate(props)) {
            // Replace shared `scopeChain` with the one saved in closure, then
            // restore it once block content is retrieved.
            var oldScopeChain = scopeChain;
            scopeChain = this._closure;

            var topLevelVNodes = this._render(props).filter(isVDOMNode);

            if (topLevelVNodes.length !== 1) {
                throw new Error('Template provided for "' + name + '" block returns multiple root nodes instead of one.');
            }

            var nextVNode = last(topLevelVNodes);

            scopeChain = oldScopeChain;

            // Update block instance with the updated props.
            block.props = props;

            var lifeCycleHook = new LifeCycleHook(block, props);

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
     * @param  {Object} nextProps
     * @return {Boolean}
     */
    ViewBlockThunk.prototype._shouldUpdate = function(nextProps) {
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

    // Pure utility functions.
    function deriveSpecialLoopVariables(arr, currentIndex) {
        return {
            __counter__: currentIndex + 1,
            __first__: currentIndex === 0,
            __last__: currentIndex === (arr.length - 1)
        };
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

return function (h, options) {
    options = options || {};
    var blocks = options.blocks || {};
    var externals = options.externals || {};
    var lookupValueWithFallback = function (propertyName, params) {
        return lookupValue(propertyName, params, options.resolveLookup);
    };
    var resolveLookup = options.resolveLookup || function () {
        return null;
    };
    function block_header_inc(blockParameters) {
        enterScope(blockParameters);
        var blockResult = [
            h('header', { 'className': 'header' }, [
                '\n ',
                h('h1', null, ['todos']),
                '\n ',
                h('input', {
                    'attributes': {
                        'value': lookupValueWithFallback('new_todo_label'),
                        'class': 'new-todo',
                        'placeholder': 'What needs to be done?',
                        'autofocus': true
                    }
                }),
                '\n'
            ]),
            '\n'
        ];
        exitScope();
        return blockResult;
    }
    function block_todo_item_inc(blockParameters) {
        enterScope(blockParameters);
        var blockResult = [
            null,
            '\n',
            null,
            '\n',
            h('li', {
                'className': [
                    '\n ',
                    lookupValueWithFallback('todo') && lookupValueWithFallback('todo')['completed'] ? ' completed' : null,
                    '\n ',
                    lookupValueWithFallback('todo') && lookupValueWithFallback('todo')['editing'] ? ' editing' : null,
                    '\n '
                ].join('')
            }, [
                '\n ',
                h('div', { 'className': 'view' }, [
                    '\n ',
                    h('input', {
                        'className': 'toggle',
                        'type': 'checkbox',
                        'checked': lookupValueWithFallback('todo') && lookupValueWithFallback('todo')['completed'] ? true : null
                    }),
                    '\n ',
                    h('label', null, [lookupValueWithFallback('todo') && lookupValueWithFallback('todo')['label']]),
                    '\n ',
                    h('button', { 'className': 'destroy' }),
                    '\n '
                ]),
                '\n ',
                h('input', {
                    'className': 'edit',
                    'value': lookupValueWithFallback('todo') && lookupValueWithFallback('todo')['label_draft']
                }),
                '\n'
            ]),
            '\n'
        ];
        exitScope();
        return blockResult;
    }
    function block_main_section_inc(blockParameters) {
        enterScope(blockParameters);
        var blockResult = [
            h('section', { 'className': 'main' }, [
                '\n ',
                h('input', {
                    'className': 'toggle-all',
                    'type': 'checkbox',
                    'checked': +lookupValueWithFallback('left_count') === 0 ? true : null
                }),
                '\n ',
                h('label', { 'attributes': { 'for': 'toggle-all' } }, ['Mark all as complete']),
                '\n ',
                h('ul', { 'className': 'todo-list' }, [
                    '\n ',
                    (lookupValueWithFallback('todos') || []).reduce(function (acc, item, index, arr) {
                        enterScope(keyValue('todo', item), deriveSpecialLoopVariables(arr, index));
                        acc.push.apply(acc, [
                            '\n ',
                            new ViewBlockThunk(blocks['TodoItem'], block_todo_item_inc, {
                                'todo': lookupValueWithFallback('todo'),
                                'editing': lookupValueWithFallback('todo')['editing']
                            }, 'TodoItem', lookupValueWithFallback('todo')['id']),
                            '\n '
                        ]);
                        exitScope();
                        return acc;
                    }, []),
                    '\n '
                ]),
                '\n'
            ]),
            '\n'
        ];
        exitScope();
        return blockResult;
    }
    function block_footer_inc(blockParameters) {
        enterScope(blockParameters);
        var blockResult = [
            h('footer', { 'className': 'footer' }, [
                '\n ',
                h('span', { 'className': 'todo-count' }, [
                    '\n ',
                    +lookupValueWithFallback('left_count') === 1 ? [
                        '\n ',
                        h('strong', null, ['1']),
                        ' item left\n        '
                    ] : [
                        '\n ',
                        h('strong', null, [lookupValueWithFallback('left_count')]),
                        ' items left\n        '
                    ],
                    '\n '
                ]),
                '\n\n ',
                null,
                '\n ',
                null,
                '\n\n ',
                null,
                '\n ',
                lookupValueWithFallback('completed_count') > 0 ? [
                    '\n ',
                    h('button', { 'className': 'clear-completed' }, ['Clear completed']),
                    '\n '
                ] : null,
                '\n'
            ]),
            '\n'
        ];
        exitScope();
        return blockResult;
    }
    return function (state) {
        enterScope(state);
        var returnValue = h('div', { 'className': 'app' }, [
            '\n ',
            h('section', { 'className': 'todoapp' }, [
                '\n ',
                new ViewBlockThunk(blocks['Header'], block_header_inc, {}, 'Header'),
                '\n\n ',
                null,
                '\n ',
                externals['count'](lookupValueWithFallback('todos')) > 0 ? [
                    '\n ',
                    new ViewBlockThunk(blocks['Todos'], block_main_section_inc, {}, 'Todos'),
                    '\n '
                ] : null,
                '\n\n ',
                null,
                '\n ',
                externals['count'](lookupValueWithFallback('todos')) > 0 ? [
                    '\n ',
                    new ViewBlockThunk(blocks['Footer'], block_footer_inc, {
                        'left_count': lookupValueWithFallback('left_count'),
                        'completed_count': lookupValueWithFallback('completed_count')
                    }, 'Footer'),
                    '\n '
                ] : null,
                '\n '
            ]),
            '\n ',
            h('footer', { 'className': 'info' }, [
                '\n ',
                h('p', null, ['Double-click to edit a todo']),
                '\n ',
                h('p', null, [h('a', { 'href': 'https://github.com/agentcooper/htmltemplate-vdom/tree/master/example/todomvc' }, ['Source code'])]),
                '\n ',
                h('p', null, [
                    'Created by ',
                    h('a', { 'href': 'https://github.com/agentcooper' }, ['Artem Tyurin']),
                    ' and ',
                    h('a', { 'href': 'https://github.com/Lapple' }, ['Aziz Yuldoshev'])
                ]),
                '\n ',
                h('p', null, [
                    'Part of ',
                    h('a', { 'href': 'http://todomvc.com' }, ['TodoMVC'])
                ]),
                '\n '
            ]),
            '\n'
        ]);
        exitScope();
        return returnValue;
    };
};
}));

