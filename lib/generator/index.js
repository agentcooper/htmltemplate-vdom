var fs = require('fs');

var path = require('path');

var escodegen = require('escodegen');

var traverse = require('traverse');

var parser = require('htmltemplate-parser');
var htmltemplateTransform = require('htmltemplate-transform');
var jpathTransform = require('htmltemplate-transform/plugins/jpath');
var replaceBreakTransform = require('htmltemplate-transform/plugins/replace-break');
var replaceContinueTransform = require('htmltemplate-transform/plugins/replace-continue');

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

function applyHTMLTemplateTransforms(ast) {
    var loopTags = ['TMPL_LOOP', 'TMPL_FOR'];

    return htmltemplateTransform(null, ast)
        .using(jpathTransform())
        .using(
            replaceBreakTransform({
                loopTags: loopTags
            })
        )
        .using(
            replaceContinueTransform({
                loopTags: loopTags
            })
        )
        .toAST();
}

function generateJavaScript(ast, options) {
    options = options || {};

    function transform(ast) {
        return traverse(ast).map(handler);
    }

    function handler() {
        if (!this.node) {
            return;
        }

        if (this.node.type === 'Comment') {
            return this.update(NULL_NODE, true);
        }

        if (this.node.type === 'Text') {
            return this.update({
                "type": "Literal",
                "value": this.node.content.replace(/ +/, ' ')
            }, true);
        }

        if (this.node.type === 'Condition') {
            return this.update(ifStatement(this, transform), true);
        }

        if (this.node.name === 'TMPL_LOOP') {
            var attribute = this.node.attributes[0];

            return this.update(loop(
                attribute.type === 'Expression' ?
                    perlExpression(attribute.content) :
                    lookupVariable(attribute.name),

                transform(this.node.content)
            ), true);
        }

        if (this.node.name === 'TMPL_FOR') {
            var attribute = this.node.attributes[1];

            var iterationVariable = this.node.attributes[0].name;

            return this.update(loop(
                attribute.value.type === 'Expression' ?
                    perlExpression(attribute.value.content) :
                    lookupVariable(attribute.value),

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
            return this.update(blockDeclaration(
                this.node.attributes,
                transform(this.node.content)
            ), true);
        }

        if (this.node.name === 'TMPL_INLINE') {
            return this.update(inlineCall(this.node), true);
        }

        // not supported, just displaying tag children
        if (this.node.name === 'TMPL_WS') {
            return this.update(transform(this.node.content)[0], true);
        }

        if (this.node.type === 'Tag' && this.node.name === 'TMPL_VAR') {
            var attribute = this.node.attributes[0];

            if (attribute.type === 'Expression') {
                return this.update(perlExpression(attribute.content), true);
            }

            return this.update(lookupVariable(attribute.name), true);
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

function fromString(string, options) {
    return fromAST(parser.parse(string), options);
}

function fromAST(ast, options) {
    return generateJavaScript(
        applyHTMLTemplateTransforms(ast),
        options
    );
}

exports.fromString = fromString;
exports.fromAST = fromAST;
