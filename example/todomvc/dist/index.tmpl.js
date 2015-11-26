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
     * @param {String}   key    Optional block key, necessary for optimal
     *                          collection rendering.
     */
    function ViewBlockThunk(name, render, props, key) {
        var Block = blocks[name];

        if (!isFunction(Block)) {
            throw new Error('Can\'t find block "' + name + '".');
        }

        this.key = key || null;
        this.name = name;
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
                previous.name === name
            );

            if (shouldReusePreviousBlock) {
                block = this.block = previous.block;
            } else {
                var Block = blocks[name];

                block = this.block = new Block(props);

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

function block_header(blockParameters) {
    enterScope(blockParameters);
    var blockResult = [
        '\n ',
        h('header', { 'className': 'header' }, [
            '\n ',
            h('h1', {}, ['todos']),
            '\n ',
            h('input', {
                'value': [lookupValue('new_todo_label')].join(''),
                'className': 'new-todo',
                'placeholder': 'What needs to be done?',
                'autofocus': true
            }),
            '\n '
        ]),
        '\n'
    ];
    exitScope();
    return blockResult;
}
function block_main_section(blockParameters) {
    enterScope(blockParameters);
    var blockResult = [
        '\n ',
        h('section', { 'className': 'main' }, [
            '\n ',
            +lookupValue('left_count') === 0 ? function () {
                return [
                    '\n ',
                    h('input', {
                        'className': 'toggle-all',
                        'type': 'checkbox',
                        'checked': true
                    }),
                    '\n '
                ];
            }() : function () {
                return [
                    '\n ',
                    h('input', {
                        'className': 'toggle-all',
                        'type': 'checkbox'
                    }),
                    '\n '
                ];
            }(),
            '\n ',
            h('label', { 'attributes': { 'for': 'toggle-all' } }, ['Mark all as complete']),
            '\n ',
            h('ul', { 'className': 'todo-list' }, [
                '\n ',
                (lookupValue('todos') || []).reduce(function (acc, item) {
                    enterScope(keyValue('todo', item));
                    acc.push.apply(acc, [
                        '\n ',
                        new ViewBlockThunk('TodoItem', block_todo_item, {
                            'todo': lookupValue('todo'),
                            'editing': lookupValue('todo')['editing']
                        }, lookupValue('todo')['id']),
                        '\n '
                    ]);
                    exitScope();
                    return acc;
                }, []),
                '\n '
            ]),
            '\n '
        ]),
        '\n'
    ];
    exitScope();
    return blockResult;
}
function block_footer(blockParameters) {
    enterScope(blockParameters);
    var blockResult = [
        '\n ',
        h('footer', { 'className': 'footer' }, [
            '\n ',
            h('span', { 'className': 'todo-count' }, [
                '\n ',
                +lookupValue('left_count') === 1 ? function () {
                    return [
                        '\n ',
                        h('strong', {}, ['1']),
                        ' item left\n            '
                    ];
                }() : function () {
                    return [
                        '\n ',
                        h('strong', {}, [lookupValue('left_count')]),
                        ' items left\n            '
                    ];
                }(),
                '\n '
            ]),
            '\n\n ',
            null,
            '\n ',
            null,
            '\n\n ',
            null,
            '\n ',
            lookupValue('completed_count') > 0 ? function () {
                return [
                    '\n ',
                    h('button', { 'className': 'clear-completed' }, ['Clear completed']),
                    '\n '
                ];
            }() : null,
            '\n '
        ]),
        '\n'
    ];
    exitScope();
    return blockResult;
}
function block_todo_item(blockParameters) {
    enterScope(blockParameters);
    var blockResult = [
        '\n ',
        null,
        '\n ',
        null,
        '\n ',
        h('li', {
            'className': [
                '\n ',
                lookupValue('todo') && lookupValue('todo')['completed'] ? function () {
                    return [' completed'];
                }() : null,
                '\n ',
                lookupValue('todo') && lookupValue('todo')['editing'] ? function () {
                    return [' editing'];
                }() : null,
                '\n '
            ].join('')
        }, [
            '\n ',
            h('div', { 'className': 'view' }, [
                '\n ',
                lookupValue('todo') && lookupValue('todo')['completed'] ? function () {
                    return [
                        '\n ',
                        h('input', {
                            'className': 'toggle',
                            'type': 'checkbox',
                            'checked': true
                        }),
                        '\n '
                    ];
                }() : function () {
                    return [
                        '\n ',
                        h('input', {
                            'className': 'toggle',
                            'type': 'checkbox'
                        }),
                        '\n '
                    ];
                }(),
                '\n ',
                h('label', {}, [lookupValue('todo') && lookupValue('todo')['label']]),
                '\n ',
                h('button', { 'className': 'destroy' }, []),
                '\n '
            ]),
            '\n ',
            h('input', {
                'className': 'edit',
                'value': [lookupValue('todo') && lookupValue('todo')['label_draft']].join('')
            }),
            '\n '
        ]),
        '\n'
    ];
    exitScope();
    return blockResult;
}
return h('div', { 'className': 'app' }, [
    '\n ',
    h('section', { 'className': 'todoapp' }, [
        '\n ',
        new ViewBlockThunk('Header', block_header, {}),
        '\n\n ',
        null,
        '\n ',
        externals['count'](lookupValue('todos')) > 0 ? function () {
            return [
                '\n ',
                new ViewBlockThunk('Todos', block_main_section, {}),
                '\n '
            ];
        }() : null,
        '\n\n ',
        null,
        '\n ',
        externals['count'](lookupValue('todos')) > 0 ? function () {
            return [
                '\n ',
                new ViewBlockThunk('Footer', block_footer, {
                    'left_count': lookupValue('left_count'),
                    'completed_count': lookupValue('completed_count')
                }),
                '\n '
            ];
        }() : null,
        '\n '
    ]),
    '\n ',
    h('footer', { 'className': 'info' }, [
        '\n ',
        h('p', {}, ['Double-click to edit a todo']),
        '\n ',
        h('p', {}, [h('a', { 'href': 'https://github.com/agentcooper/htmltemplate-vdom/tree/master/example/todomvc' }, ['Source code'])]),
        '\n ',
        h('p', {}, [
            'Created by ',
            h('a', { 'href': 'https://github.com/agentcooper' }, ['Artem Tyurin']),
            ' and ',
            h('a', { 'href': 'https://github.com/Lapple' }, ['Aziz Yuldoshev'])
        ]),
        '\n ',
        h('p', {}, [
            'Part of ',
            h('a', { 'href': 'http://todomvc.com' }, ['TodoMVC'])
        ]),
        '\n '
    ]),
    '\n'
]);
}
