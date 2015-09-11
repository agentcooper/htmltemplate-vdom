var fs = require('fs');

var path = require('path');

var escodegen = require('escodegen');

var traverse = require('traverse');

var parser = require('htmltemplate-parser');

var perlExpression = require('./perl-expression');

var ifStatement = require('./if-statement');

var inlineCall = require('./inline-call');

var blockDeclaration = require('./block-declaration');

var getPrimaryAttributeValue = require('./get-primary-attribute-value');

var loop = require('./loop');

var lookupVariable = require('./lookup-variable');

var setVariable = require('./set-variable');

var property = require('./property');

var hTag = require('./h-tag');

var NULL_NODE = {
    type: 'Literal',
    value: null,
    raw: 'null'
};

var templateRuntime = fs.readFileSync(
    path.resolve(__dirname, 'template-runtime.txt'),
    'utf8'
);

function generator(ast, options) {
    options = options || {};

    function transform(ast) {
        return traverse(ast).map(handler);
    }

    function handler() {
        if (!this.node) {
            return;
        }

        if (this.node.type === 'Text') {
            return this.update({
                "type": "Literal",
                "value": this.node.content
            }, true);
        }

        if (this.node.type === 'Condition') {
            var otherwise = NULL_NODE;

            return this.update(ifStatement(this, transform), true);
        }

        if (this.node.name === 'TMPL_LOOP') {
            var propertyName = this.node.attributes[0].name;

            return this.update(loop(
                propertyName,
                transform(this.node.content)
            ), true);
        }

        if (this.node.name === 'TMPL_FOR') {
            var propertyName = this.node.attributes[1].value;

            var iterationVariable = this.node.attributes[0].name;

            return this.update(loop(
                propertyName,
                transform(this.node.content),
                iterationVariable
            ), true);
        }

        if (this.node.name === 'TMPL_SETVAR') {
            var propertyName = this.node.attributes[0].name;

            var content = transform(this.node.content);

            return this.update(setVariable(propertyName, {
                "type": "ArrayExpression",
                "elements": content
            }), true);
        }

        if (this.node.name === 'TMPL_ASSIGN') {
            var propertyName = this.node.attributes[0].name;

            return this.update(setVariable(
                propertyName,
                perlExpression(this.node.attributes[1].content)
            ), true);
        }

        if (this.node.name === 'TMPL_BLOCK') {
            return this.update(
                blockDeclaration(
                    this.node.attributes,
                    transform(this.node.content)
                )
            );
        }

        if (this.node.name === 'TMPL_INLINE') {
            return this.update(
                inlineCall(this.node)
            );
        }

        // not supported, just displaying tag children
        if (this.node.name === 'TMPL_WS') {
            return transform(this.node.content)[0];
        }

        if (this.node.type === 'Tag' && this.node.name === 'TMPL_VAR') {
            var attribute = this.node.attributes[0];

            if (attribute.type === 'Expression') {
                return this.update(perlExpression(attribute.content));
            }

            return this.update(lookupVariable(attribute.name));
        }

        if (this.node.type === 'HTMLTag') {
            return this.update(hTag(this.node, transform, options), true);
        }

        if (this.node.type === 'InvalidTag') {
            this.update(NULL_NODE, true);
        }
    }

    var output = returnLastStatement(
        stripTopLevelLiterals(
            transform(ast)
        )
    );

    var program = escodegen.generate({
        type: 'Program',
        body: output
    });

    return templateRuntime.replace('// return body', program);
}

function returnLastStatement(body) {
    var lastCallExpression = body
        .filter(function(expresssion) {
            return expresssion.type === 'CallExpression';
        })
        .pop();

    return body.map(function(statement) {
        if (statement === lastCallExpression) {
            return {
                type: 'ReturnStatement',
                argument: statement
            };
        } else {
            return statement;
        }
    });
}

function stripTopLevelLiterals(body) {
    return body.filter(function(node) {
        return node.type !== 'Literal'
    });
}

module.exports = {
    fromString: function(string, options) {
        var ast = parser.parse(string);

        return generator(ast, options);
    },

    fromAST: function(ast, options) {
        return generator(ast, options);
    }
};
