(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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


},{}],2:[function(require,module,exports){
var state = require('./state');

var ACTIONS = {
    TOGGLE_ALL: function(state, params) {
        state.todos.forEach(function(todo) {
            todo.completed = params.complete;
        });

        dispatch('REFRESH_DEPENDANT_DATA');
    },
    TOGGLE_TODO: function(state, params) {
        state.todos.forEach(function(todo) {
            if (todo === params.todo) {
                todo.completed = params.complete;
            }
        });

        dispatch('REFRESH_DEPENDANT_DATA');
    },
    REMOVE_TODO: function(state, params) {
        state.todos = state.todos.filter(function(todo) {
            return todo !== params.todo;
        });

        dispatch('REFRESH_DEPENDANT_DATA');
    },
    CLEAR_COMPLETED: function(state) {
        state.todos = state.todos.filter(function(todo) {
            return !todo.completed;
        });

        dispatch('REFRESH_DEPENDANT_DATA');
    },
    UPDATE_NEW_TODO_LABEL: function(state, params) {
        state.new_todo_label = params.label;
    },
    CREATE_NEW_TODO: function(state) {
        if (state.new_todo_label !== '') {
            state.todos.push({
                label: state.new_todo_label,
                id: Date.now()
            });

            state.new_todo_label = '';

            dispatch('REFRESH_DEPENDANT_DATA');
        }
    },
    START_EDITING_TODO: function(state, params) {
        state.todos.forEach(function(todo) {
            if (todo === params.todo) {
                todo.editing = true;
                todo.label_draft = todo.label;
            }
        });
    },
    CANCEL_EDITING_TODO: function(state, params) {
        state.todos.forEach(function(todo) {
            if (todo === params.todo) {
                todo.editing = false;
                delete todo.label_draft;
            }
        });
    },
    UPDATE_EDITING_TODO_LABEL: function(state, params) {
        state.todos.forEach(function(todo) {
            if (todo === params.todo && todo.editing) {
                todo.label_draft = params.label;
            }
        });
    },
    SAVE_UPDATED_TODO: function(state, params) {
        state.todos.forEach(function(todo) {
            if (todo === params.todo && todo.editing) {
                todo.label = todo.label_draft;
                todo.editing = false;
                delete todo.label_draft;
            }
        });
    },
    REFRESH_DEPENDANT_DATA: function(state) {
        var completeCount = state.todos.filter(isComplete).length;

        state.completed_count = completeCount;
        state.left_count = state.todos.length - completeCount;
    }
};

var _onChange = function() {};

function subscribe(onChange) {
    _onChange = onChange;
}

function dispatch(name, params) {
    if (typeof ACTIONS[name] === 'function') {
        ACTIONS[name](state, params);
    }

    _onChange(state);
};

exports.subscribe = subscribe;
exports.dispatch = dispatch;

function isComplete(todo) {
    return todo.completed;
}

},{"./state":10}],3:[function(require,module,exports){
'use strict';

var runtime = require('htmltemplate-vdom/lib/client/runtime');
var renderer = require('../dist/index.tmpl.js');

var externals = require('./externals');
var blocks = require('./blocks');

var actions = require('./actions');
var state = require('./state');

var render = renderer(runtime.h, {
	externals: externals,
	blocks: blocks
});

var loop = runtime.mainLoop(state, render);

actions.subscribe(loop.update);
document.body.appendChild(loop.target);

},{"../dist/index.tmpl.js":1,"./actions":2,"./blocks":4,"./externals":9,"./state":10,"htmltemplate-vdom/lib/client/runtime":13}],4:[function(require,module,exports){
exports.Todos = require('./blocks/todos');
exports.TodoItem = require('./blocks/todo-item');
exports.Header = require('./blocks/header');
exports.Footer = require('./blocks/footer');

},{"./blocks/footer":5,"./blocks/header":6,"./blocks/todo-item":7,"./blocks/todos":8}],5:[function(require,module,exports){
var dispatch = require('../actions').dispatch;

function Footer() {
    this.onClearCompletedClick = this.onClearCompletedClick.bind(this);
}

Footer.prototype.shouldBlockUpdate = function(nextProps) {
    return (
        nextProps.left_count !== this.props.left_count ||
        nextProps.completed_count !== this.props.completed_count
    );
};

Footer.prototype.blockDidMount = function() {
    this.el.addEventListener('click', this.onClearCompletedClick);
};

Footer.prototype.blockWillUnmount = function() {
    this.el.removeEventListener('click', this.onClearCompletedClick);
};

Footer.prototype.onClearCompletedClick = function(e) {
    if (e.target.classList.contains('clear-completed')) {
        dispatch('CLEAR_COMPLETED');
    }
};

module.exports = Footer;

},{"../actions":2}],6:[function(require,module,exports){
var dispatch = require('../actions').dispatch;

function Header() {
    this.onTodoInputChange = this.onTodoInputChange.bind(this);
    this.onTodoInputKeypress = this.onTodoInputKeypress.bind(this);
}

Header.prototype.blockDidMount = function() {
    this.el
        .querySelector('.new-todo')
        .addEventListener('input', this.onTodoInputChange);

    this.el
        .querySelector('.new-todo')
        .addEventListener('keypress', this.onTodoInputKeypress);
};

Header.prototype.blockWillUnmount = function() {
    this.el
        .querySelector('.new-todo')
        .removeEventListener('input', this.onTodoInputChange);

    this.el
        .querySelector('.new-todo')
        .removeEventListener('keypress', this.onTodoInputKeypress);
};

Header.prototype.onTodoInputChange = function(e) {
    dispatch('UPDATE_NEW_TODO_LABEL', {
        label: e.target.value
    });
};

Header.prototype.onTodoInputKeypress = function(e) {
    if (e.keyCode === 13) {
        dispatch('CREATE_NEW_TODO');
    }
};

module.exports = Header;

},{"../actions":2}],7:[function(require,module,exports){
var dispatch = require('../actions').dispatch;

function TodoItem() {
    this.onCheckboxToggle = this.onCheckboxToggle.bind(this);
    this.onDestroyClick = this.onDestroyClick.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onEditInputChange = this.onEditInputChange.bind(this);
    this.onEditInputBlur = this.onEditInputBlur.bind(this);
    this.onEditInputKeyUp = this.onEditInputKeyUp.bind(this);
}

TodoItem.prototype.blockDidMount = function() {
    this.edit = this.el.querySelector('.edit');

    this.el
        .querySelector('.toggle')
        .addEventListener('change', this.onCheckboxToggle);

    this.el
        .querySelector('.destroy')
        .addEventListener('click', this.onDestroyClick);

    this.el
        .querySelector('label')
        .addEventListener('dblclick', this.onDoubleClick);

    this.edit.addEventListener('input', this.onEditInputChange);
    this.edit.addEventListener('blur', this.onEditInputBlur);
    this.edit.addEventListener('keyup', this.onEditInputKeyUp);
};

TodoItem.prototype.blockWillUnmount = function() {
    this.el
        .querySelector('.toggle')
        .removeEventListener('change', this.onCheckboxToggle);

    this.el
        .querySelector('.destroy')
        .removeEventListener('click', this.onDestroyClick);

    this.el
        .querySelector('label')
        .removeEventListener('dblclick', this.onDoubleClick);
    
    this.edit.removeEventListener('input', this.onEditInputChange);
    this.edit.removeEventListener('blur', this.onEditInputBlur);
    this.edit.removeEventListener('keyup', this.onEditInputKeyUp);
};

TodoItem.prototype.blockDidUpdate = function(previousProps) {
    if (this.props.editing && this.props.editing !== previousProps.editing) {
        this.edit.focus();
    }
};

TodoItem.prototype.onCheckboxToggle = function(e) {
    dispatch('TOGGLE_TODO', {
        todo: this.props.todo,
        complete: e.target.checked
    });
};

TodoItem.prototype.onDestroyClick = function() {
    dispatch('REMOVE_TODO', {
        todo: this.props.todo
    });
};

TodoItem.prototype.onDoubleClick = function(e) {
    dispatch('START_EDITING_TODO', {
        todo: this.props.todo
    });

    e.preventDefault();
};

TodoItem.prototype.onEditInputChange = function(e) {
    dispatch('UPDATE_EDITING_TODO_LABEL', {
        todo: this.props.todo,
        label: e.target.value
    });
};

TodoItem.prototype.onEditInputBlur = function() {
    dispatch('CANCEL_EDITING_TODO', {
        todo: this.props.todo
    });
};

TodoItem.prototype.onEditInputKeyUp = function(e) {
    if (e.keyCode === 13) {
        dispatch('SAVE_UPDATED_TODO', {
            todo: this.props.todo
        });
    } else if (e.keyCode === 27) {
        dispatch('CANCEL_EDITING_TODO', {
            todo: this.props.todo
        });
    }
};

module.exports = TodoItem;

},{"../actions":2}],8:[function(require,module,exports){
var dispatch = require('../actions').dispatch;

function Todos() {
    this.onToggleAllChange = this.onToggleAllChange.bind(this);
}

Todos.prototype.blockDidMount = function() {
    this.el
        .querySelector('.toggle-all')
        .addEventListener('change', this.onToggleAllChange);
};

Todos.prototype.blockWillUnmount = function() {
    this.el
        .querySelector('.toggle-all')
        .removeEventListener('change', this.onToggleAllChange);
};

Todos.prototype.onToggleAllChange = function(e) {
    dispatch('TOGGLE_ALL', {
        complete: e.target.checked
    });
};

module.exports = Todos;

},{"../actions":2}],9:[function(require,module,exports){
exports.count = function(array) {
    if (Array.isArray(array)) {
        return array.length;
    }

    return 0;
};

},{}],10:[function(require,module,exports){
module.exports = {
    todos: [
        {
            id: 0,
            label: 'Taste JavaScript',
            completed: true
        },
        {
            id: 1,
            label: 'Buy a unicorn'
        }
    ],
    left_count: 1,
    completed_count: 1,
    new_todo_label: ''
};

},{}],11:[function(require,module,exports){

},{}],12:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],13:[function(require,module,exports){
var mainLoop = require('main-loop');

module.exports = {
    h: require('virtual-dom/h'),

    mainLoop: function(state, render) {
        var loop = mainLoop(state, render, {
            create: require('virtual-dom/create-element'),
            diff: require('virtual-dom/diff'),
            patch: require('virtual-dom/patch')
        });

        return loop;
    }
};

},{"main-loop":14,"virtual-dom/create-element":21,"virtual-dom/diff":22,"virtual-dom/h":23,"virtual-dom/patch":31}],14:[function(require,module,exports){
var raf = require("raf")
var TypedError = require("error/typed")

var InvalidUpdateInRender = TypedError({
    type: "main-loop.invalid.update.in-render",
    message: "main-loop: Unexpected update occurred in loop.\n" +
        "We are currently rendering a view, " +
            "you can't change state right now.\n" +
        "The diff is: {stringDiff}.\n" +
        "SUGGESTED FIX: find the state mutation in your view " +
            "or rendering function and remove it.\n" +
        "The view should not have any side effects.\n",
    diff: null,
    stringDiff: null
})

module.exports = main

function main(initialState, view, opts) {
    opts = opts || {}

    var currentState = initialState
    var create = opts.create
    var diff = opts.diff
    var patch = opts.patch
    var redrawScheduled = false

    var tree = opts.initialTree || view(currentState)
    var target = opts.target || create(tree, opts)
    var inRenderingTransaction = false

    currentState = null

    var loop = {
        state: initialState,
        target: target,
        update: update
    }
    return loop

    function update(state) {
        if (inRenderingTransaction) {
            throw InvalidUpdateInRender({
                diff: state._diff,
                stringDiff: JSON.stringify(state._diff)
            })
        }

        if (currentState === null && !redrawScheduled) {
            redrawScheduled = true
            raf(redraw)
        }

        currentState = state
        loop.state = state
    }

    function redraw() {
        redrawScheduled = false
        if (currentState === null) {
            return
        }

        inRenderingTransaction = true
        var newTree = view(currentState)

        if (opts.createOnly) {
            inRenderingTransaction = false
            create(newTree, opts)
        } else {
            var patches = diff(tree, newTree, opts)
            inRenderingTransaction = false
            target = patch(target, patches, opts)
        }

        tree = newTree
        currentState = null
    }
}

},{"error/typed":18,"raf":19}],15:[function(require,module,exports){
module.exports = function(obj) {
    if (typeof obj === 'string') return camelCase(obj);
    return walk(obj);
};

function walk (obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (isDate(obj) || isRegex(obj)) return obj;
    if (isArray(obj)) return map(obj, walk);
    return reduce(objectKeys(obj), function (acc, key) {
        var camel = camelCase(key);
        acc[camel] = walk(obj[key]);
        return acc;
    }, {});
}

function camelCase(str) {
    return str.replace(/[_.-](\w|$)/g, function (_,x) {
        return x.toUpperCase();
    });
}

var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

var isDate = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
};

var isRegex = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var has = Object.prototype.hasOwnProperty;
var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

function map (xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        res.push(f(xs[i], i));
    }
    return res;
}

function reduce (xs, f, acc) {
    if (xs.reduce) return xs.reduce(f, acc);
    for (var i = 0; i < xs.length; i++) {
        acc = f(acc, xs[i], i);
    }
    return acc;
}

},{}],16:[function(require,module,exports){
var nargs = /\{([0-9a-zA-Z]+)\}/g
var slice = Array.prototype.slice

module.exports = template

function template(string) {
    var args

    if (arguments.length === 2 && typeof arguments[1] === "object") {
        args = arguments[1]
    } else {
        args = slice.call(arguments, 1)
    }

    if (!args || !args.hasOwnProperty) {
        args = {}
    }

    return string.replace(nargs, function replaceArg(match, i, index) {
        var result

        if (string[index - 1] === "{" &&
            string[index + match.length] === "}") {
            return i
        } else {
            result = args.hasOwnProperty(i) ? args[i] : null
            if (result === null || result === undefined) {
                return ""
            }

            return result
        }
    })
}

},{}],17:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],18:[function(require,module,exports){
var camelize = require("camelize")
var template = require("string-template")
var extend = require("xtend/mutable")

module.exports = TypedError

function TypedError(args) {
    if (!args) {
        throw new Error("args is required");
    }
    if (!args.type) {
        throw new Error("args.type is required");
    }
    if (!args.message) {
        throw new Error("args.message is required");
    }

    var message = args.message

    if (args.type && !args.name) {
        var errorName = camelize(args.type) + "Error"
        args.name = errorName[0].toUpperCase() + errorName.substr(1)
    }

    extend(createError, args);
    createError._name = args.name;

    return createError;

    function createError(opts) {
        var result = new Error()

        Object.defineProperty(result, "type", {
            value: result.type,
            enumerable: true,
            writable: true,
            configurable: true
        })

        var options = extend({}, args, opts)

        extend(result, options)
        result.message = template(message, options)

        return result
    }
}


},{"camelize":15,"string-template":16,"xtend/mutable":17}],19:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]
  , isNative = true

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  isNative = false

  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  if(!isNative) {
    return raf.call(global, fn)
  }
  return raf.call(global, function() {
    try{
      fn.apply(this, arguments)
    } catch(e) {
      setTimeout(function() { throw e }, 0)
    }
  })
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":20}],20:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

/*

*/

}).call(this,require('_process'))
},{"_process":12}],21:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":33}],22:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":53}],23:[function(require,module,exports){
var h = require("./virtual-hyperscript/index.js")

module.exports = h

},{"./virtual-hyperscript/index.js":40}],24:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],25:[function(require,module,exports){
'use strict';

var OneVersionConstraint = require('individual/one-version');

var MY_VERSION = '7';
OneVersionConstraint('ev-store', MY_VERSION);

var hashKey = '__EV_STORE_KEY@' + MY_VERSION;

module.exports = EvStore;

function EvStore(elem) {
    var hash = elem[hashKey];

    if (!hash) {
        hash = elem[hashKey] = {};
    }

    return hash;
}

},{"individual/one-version":27}],26:[function(require,module,exports){
(function (global){
'use strict';

/*global window, global*/

var root = typeof window !== 'undefined' ?
    window : typeof global !== 'undefined' ?
    global : {};

module.exports = Individual;

function Individual(key, value) {
    if (key in root) {
        return root[key];
    }

    root[key] = value;

    return value;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],27:[function(require,module,exports){
'use strict';

var Individual = require('./index.js');

module.exports = OneVersion;

function OneVersion(moduleName, version, defaultValue) {
    var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
    var enforceKey = key + '_ENFORCE_SINGLETON';

    var versionValue = Individual(enforceKey, version);

    if (versionValue !== version) {
        throw new Error('Can only have one copy of ' +
            moduleName + '.\n' +
            'You already have version ' + versionValue +
            ' installed.\n' +
            'This means you cannot install version ' + version);
    }

    return Individual(key, defaultValue);
}

},{"./index.js":26}],28:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":11}],29:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],30:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],31:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":36}],32:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":44,"is-object":29}],33:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":42,"../vnode/is-vnode.js":45,"../vnode/is-vtext.js":46,"../vnode/is-widget.js":47,"./apply-properties":32,"global/document":28}],34:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],35:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":47,"../vnode/vpatch.js":50,"./apply-properties":32,"./update-widget":37}],36:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":33,"./dom-index":34,"./patch-op":35,"global/document":28,"x-is-array":30}],37:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":47}],38:[function(require,module,exports){
'use strict';

var EvStore = require('ev-store');

module.exports = EvHook;

function EvHook(value) {
    if (!(this instanceof EvHook)) {
        return new EvHook(value);
    }

    this.value = value;
}

EvHook.prototype.hook = function (node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = this.value;
};

EvHook.prototype.unhook = function(node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = undefined;
};

},{"ev-store":25}],39:[function(require,module,exports){
'use strict';

module.exports = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

},{}],40:[function(require,module,exports){
'use strict';

var isArray = require('x-is-array');

var VNode = require('../vnode/vnode.js');
var VText = require('../vnode/vtext.js');
var isVNode = require('../vnode/is-vnode');
var isVText = require('../vnode/is-vtext');
var isWidget = require('../vnode/is-widget');
var isHook = require('../vnode/is-vhook');
var isVThunk = require('../vnode/is-thunk');

var parseTag = require('./parse-tag.js');
var softSetHook = require('./hooks/soft-set-hook.js');
var evHook = require('./hooks/ev-hook.js');

module.exports = h;

function h(tagName, properties, children) {
    var childNodes = [];
    var tag, props, key, namespace;

    if (!children && isChildren(properties)) {
        children = properties;
        props = {};
    }

    props = props || properties || {};
    tag = parseTag(tagName, props);

    // support keys
    if (props.hasOwnProperty('key')) {
        key = props.key;
        props.key = undefined;
    }

    // support namespace
    if (props.hasOwnProperty('namespace')) {
        namespace = props.namespace;
        props.namespace = undefined;
    }

    // fix cursor bug
    if (tag === 'INPUT' &&
        !namespace &&
        props.hasOwnProperty('value') &&
        props.value !== undefined &&
        !isHook(props.value)
    ) {
        props.value = softSetHook(props.value);
    }

    transformProperties(props);

    if (children !== undefined && children !== null) {
        addChild(children, childNodes, tag, props);
    }


    return new VNode(tag, props, childNodes, key, namespace);
}

function addChild(c, childNodes, tag, props) {
    if (typeof c === 'string') {
        childNodes.push(new VText(c));
    } else if (typeof c === 'number') {
        childNodes.push(new VText(String(c)));
    } else if (isChild(c)) {
        childNodes.push(c);
    } else if (isArray(c)) {
        for (var i = 0; i < c.length; i++) {
            addChild(c[i], childNodes, tag, props);
        }
    } else if (c === null || c === undefined) {
        return;
    } else {
        throw UnexpectedVirtualElement({
            foreignObject: c,
            parentVnode: {
                tagName: tag,
                properties: props
            }
        });
    }
}

function transformProperties(props) {
    for (var propName in props) {
        if (props.hasOwnProperty(propName)) {
            var value = props[propName];

            if (isHook(value)) {
                continue;
            }

            if (propName.substr(0, 3) === 'ev-') {
                // add ev-foo support
                props[propName] = evHook(value);
            }
        }
    }
}

function isChild(x) {
    return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
}

function isChildren(x) {
    return typeof x === 'string' || isArray(x) || isChild(x);
}

function UnexpectedVirtualElement(data) {
    var err = new Error();

    err.type = 'virtual-hyperscript.unexpected.virtual-element';
    err.message = 'Unexpected virtual child passed to h().\n' +
        'Expected a VNode / Vthunk / VWidget / string but:\n' +
        'got:\n' +
        errorString(data.foreignObject) +
        '.\n' +
        'The parent vnode is:\n' +
        errorString(data.parentVnode)
        '\n' +
        'Suggested fix: change your `h(..., [ ... ])` callsite.';
    err.foreignObject = data.foreignObject;
    err.parentVnode = data.parentVnode;

    return err;
}

function errorString(obj) {
    try {
        return JSON.stringify(obj, null, '    ');
    } catch (e) {
        return String(obj);
    }
}

},{"../vnode/is-thunk":43,"../vnode/is-vhook":44,"../vnode/is-vnode":45,"../vnode/is-vtext":46,"../vnode/is-widget":47,"../vnode/vnode.js":49,"../vnode/vtext.js":51,"./hooks/ev-hook.js":38,"./hooks/soft-set-hook.js":39,"./parse-tag.js":41,"x-is-array":30}],41:[function(require,module,exports){
'use strict';

var split = require('browser-split');

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

module.exports = parseTag;

function parseTag(tag, props) {
    if (!tag) {
        return 'DIV';
    }

    var noId = !(props.hasOwnProperty('id'));

    var tagParts = split(tag, classIdSplit);
    var tagName = null;

    if (notClassId.test(tagParts[1])) {
        tagName = 'DIV';
    }

    var classes, part, type, i;

    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i];

        if (!part) {
            continue;
        }

        type = part.charAt(0);

        if (!tagName) {
            tagName = part;
        } else if (type === '.') {
            classes = classes || [];
            classes.push(part.substring(1, part.length));
        } else if (type === '#' && noId) {
            props.id = part.substring(1, part.length);
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className);
        }

        props.className = classes.join(' ');
    }

    return props.namespace ? tagName : tagName.toUpperCase();
}

},{"browser-split":24}],42:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":43,"./is-vnode":45,"./is-vtext":46,"./is-widget":47}],43:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],44:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],45:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":48}],46:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":48}],47:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],48:[function(require,module,exports){
module.exports = "2"

},{}],49:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":43,"./is-vhook":44,"./is-vnode":45,"./is-widget":47,"./version":48}],50:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":48}],51:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":48}],52:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":44,"is-object":29}],53:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":42,"../vnode/is-thunk":43,"../vnode/is-vnode":45,"../vnode/is-vtext":46,"../vnode/is-widget":47,"../vnode/vpatch":50,"./diff-props":52,"x-is-array":30}]},{},[3]);
