// var parser = require('pegjs').buildParser(
//     require('fs').readFileSync('tmpl-html.pegjs').toString()
// );

var parser = require('./htmltemplate-parser');

var flatten = require('lodash.flatten');;

var traverse = require('traverse');

var h = require('virtual-dom/h');

function createVdom(string, state) {
    var ast = parser.parse(string);

    var lookupChain = [state];

    function lookupValue(propertyName) {
        var value = null;

        for (var i = lookupChain.length - 1; i >= 0; i--) {
            if (lookupChain[i][propertyName]) {
                return lookupChain[i][propertyName];
            }
        }
    }

    // class="<TMPL_IF condition>className</TMPL_IF>"
    // href="items/<TMPL_VAR id>"
    function evalAttribute(value) {
        // do not eval if not needed
        if (value.indexOf('<TMPL_') === -1) {
            return value;
        }

        var result = flatten(
            traverse(parser.parse(value)).map(handler)
        ).join('');

        return result;
    }

    function handler() {
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

            var value = lookupValue(condition.name);

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
                    lookupValue(propertyName).map(function(item, index, arr) {
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

            return this.update(lookupValue(propertyName));
        }

        if (this.node.type === 'Tag') {
            var attrs = this.node.attributes.reduce(function(hash, item) {
                var attrName = item.name;

                if (item.name === 'class') {
                    attrName = 'className';
                }

                if (attrName.indexOf('data') === 0) {
                    hash.attributes = hash.attributes || {};
                    hash.attributes[attrName] = evalAttribute(item.value);
                } else {
                    hash[attrName] = evalAttribute(item.value);
                }

                return hash;
            }, {});

            return this.update(
                h(
                    this.node.name,
                    attrs,
                    traverse(this.node.content).map(handler)
                ),
                true
            );
        }
    }

    var output = traverse(ast).map(handler);

    return h('div', {}, output);
}

module.exports = createVdom;
