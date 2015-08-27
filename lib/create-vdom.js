// var parser = require('pegjs').buildParser(
//     require('fs').readFileSync('tmpl-html.pegjs').toString()
// );

var parser = require('./htmltemplate-parser');

var traverse = require('traverse');

var h = require('virtual-dom/h');

function createVdom(string, state) {
    var ast = parser.parse(string);

    var lookupChain = [state];

    function lookup(propertyName) {
        var value = null;

        for (var i = lookupChain.length - 1; i >= 0; i--) {
            if (lookupChain[i][propertyName]) {
                return lookupChain[i][propertyName];
            }
        }
    }

    var output = traverse(ast).map(function handler() {
        if (this.node.type === 'Text') {
            return this.update(this.node.content);
        }

        if (this.node.type === 'Condition') {
            var condition = this.node.conditions[0].condition;

            var ifTrue = this.node.conditions[0].content,
                ifFalse = null;

            if (this.node.otherwise) {
                ifFalse = this.node.otherwise.content;
            }

            var value = lookup(condition.name);

            return this.update(
                value ? ifTrue : ifFalse,
                false
            );
        }

        if (this.node.type === 'Tag' && this.node.name === 'TMPL_LOOP') {
            var propertyName = this.node.attributes[0].name;

            return this.update(
                h(
                    'div',
                    {},
                    lookup(propertyName).map(function(item, index, arr) {
                        lookupChain.push(item);

                        var c = this.node.content &&
                            traverse(this.node.content).map(handler);

                        lookupChain.pop();

                        return c;
                    }.bind(this))
                ),
                true
            );
        }

        if (this.node.type === 'Tag' && this.node.name === 'TMPL_VAR') {
            var propertyName = this.node.attributes[0].name;

            return this.update(lookup(propertyName));
        }

        if (this.node.type === 'Tag') {
            return this.update(
                h(
                    this.node.name,
                    {},
                    traverse(this.node.content).map(handler)
                ),
                true
            );
        }
    });

    return h('div', {}, output);
}

module.exports = createVdom;
