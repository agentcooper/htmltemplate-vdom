### htmltemplate-vdom

**WIP**

```bash
npm install htmltemplate-vdom
```

[HTML::Template](http://search.cpan.org/~samtregar/HTML-Template/Template.pm) engine on top of [virtual-dom](https://github.com/Matt-Esch/virtual-dom).

Parser is modified version of https://github.com/Lapple/htmltemplate-parser.

Full client runtime including `virtual-dom` is around 15kb (minified + gzip).

#### Generator

```
# will output compiled template
node ./bin/compile-template.js --path ../example/precompile/tmpl.inc
```

#### Example

Client render

[example/client/index.html](example/client/index.html)

```bash

npm install
webpack

open example/client/index.html
```

Server render

[example/server/index.js](example/server/index.js)

```bash
node example/server/index.js
```

#### Building parser

```bash
npm install pegjs -g
npm run build-parser # produces lib/parser.js from htmltemplate.pegjs
```

#### Tests

```bash
# npm install mocha -g

npm test
```

#### Related

[https://github.com/agentcooper/htmltemplate-react](https://github.com/agentcooper/htmltemplate-react)
