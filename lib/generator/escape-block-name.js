var assert = require('assert');

function escapeBlockName(node) {
    assert(node.type === 'Literal', 'Dynamic block names are not allowed.');

    // TODO: More rigorous escaping.
    return 'block_' + node.value;
}

module.exports = escapeBlockName;
