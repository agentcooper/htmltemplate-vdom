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
