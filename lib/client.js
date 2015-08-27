module.exports = function(template, state) {
    var createElement = require('virtual-dom/create-element');

    var createVdom = require('./create-vdom');

    var vdom = createVdom(template, state);

    return {
        vdom: vdom,
        node: createElement(vdom)
    };
};
