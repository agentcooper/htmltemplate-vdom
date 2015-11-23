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
                label: state.new_todo_label
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
