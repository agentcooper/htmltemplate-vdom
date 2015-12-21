var fs = require('fs');

var path = require('path');

var escodegen = require('escodegen');

var traverse = require('traverse');
var decodeHTMLEntities = require('ent').decode;

var parser = require('htmltemplate-parser');

var htmltemplateTransform = require('htmltemplate-transform');
var jpathTransform = require('htmltemplate-transform/plugins/jpath');
var includeTransform = require('htmltemplate-transform/plugins/include');
var replaceBreakTransform = require('htmltemplate-transform/plugins/replace-break');
var replaceContinueTransform = require('htmltemplate-transform/plugins/replace-continue');
var replaceConditionalAttributeTransform = require('htmltemplate-transform/plugins/replace-conditional-attribute');

var ifStatement = require('./if-statement');
var varStatement = require('./var-statement');

var inlineCall = require('./inline-call');

var blockDeclaration = require('./block-declaration');

var loop = require('./loop');

var setVariable = require('./set-variable');

var property = require('./property');
var attributeValueToExpression = require('./attribute-value-to-expression');

var hTag = require('./h-tag');
var moduleExports = require('./module-exports');

var NULL_NODE = {
    type: 'Literal',
    value: null,
    raw: 'null'
};

var templateRuntime = fs.readFileSync(
    path.resolve(__dirname, 'template-runtime.txt'),
    'utf8'
);

function applyHTMLTemplateTransforms(ast, options) {
    var loopTags = ['TMPL_LOOP', 'TMPL_FOR'];

    return htmltemplateTransform(options.path, ast)
        .using(
            includeTransform({
                includeTags: ['TMPL_INLINE'],

                resolvePath: function(tagname, from, to) {
                    return path.resolve(path.dirname(from), to);
                }
            })
        )
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
        .using(replaceConditionalAttributeTransform())
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
                type: 'Literal',
                value: decodeHTMLEntities(this.node.content).replace(/ +/, ' ')
            }, true);
        }

        if (this.node.type === 'Condition') {
            return this.update(ifStatement(this, transform), true);
        }

        if (this.node.name === 'TMPL_LOOP') {
            return this.update(
                loop(
                    attributeValueToExpression(this.node.attributes[0]),
                    transform(this.node.content)
                ),
                true
            );
        }

        if (this.node.name === 'TMPL_FOR') {
            return this.update(
                loop(
                    attributeValueToExpression(this.node.attributes[1]),
                    transform(this.node.content),
                    this.node.attributes[0].name
                ),
                true
            );
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
            var propertyNameAttribute = this.node.attributes[0];
            var propertyValueAttribute = this.node.attributes[1];

            return this.update(setVariable(
                propertyNameAttribute.name,
                attributeValueToExpression(propertyValueAttribute)
            ), true);
        }

        if (this.node.name === 'TMPL_BLOCK') {
            return this.update(blockDeclaration(
                this.node.attributes,
                transform(this.node.content)
            ), true);
        }

        if (this.node.name === 'TMPL_INLINE') {
            return this.update(inlineCall(this.node, transform), true);
        }

        // not supported, just displaying tag children
        if (this.node.name === 'TMPL_WS') {
            return this.update(transform(this.node.content)[0], true);
        }

        if (this.node.name === 'TMPL_VAR' || this.node.name === 'TMPL_V' || this.node.name === 'TMPL_TRANS') {
            return this.update(varStatement(this.node), true);
        }

        if (this.node.type === 'HTMLTag') {
            return this.update(hTag(this.node, transform), true);
        }

        if (this.node.type === 'InvalidTag') {
            this.update(NULL_NODE, true);
        }
    }

    var output = moduleExports(
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
        applyHTMLTemplateTransforms(ast, options),
        options
    );
}

exports.fromString = fromString;
exports.fromAST = fromAST;
