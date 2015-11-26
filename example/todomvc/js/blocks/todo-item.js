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
