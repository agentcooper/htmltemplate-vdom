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
