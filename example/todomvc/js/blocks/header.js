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
