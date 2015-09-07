### htmltemplate-vdom

**WIP**

```bash
npm install htmltemplate-vdom
```

[HTML::Template](http://search.cpan.org/~samtregar/HTML-Template/Template.pm) engine on top of [virtual-dom](https://github.com/Matt-Esch/virtual-dom).

#### Generator

```bash
# will output compiled template
./bin/compile --path ../example/precompiled/tmpl.inc
```

#### Examples

##### Precompiled

[Demo](http://agentcooper.github.io/htmltemplate-vdom/example/precompiled/)

[Source](example/precompiled/index.html)

Use `npm run precompile` to precompile example template.

##### Server render

[Source](example/server/index.js)

```bash
node example/server/index.js
```

##### Client runtime render

**Not recommended, requires full parser and escodegen on the client.**

[Demo](http://agentcooper.github.io/htmltemplate-vdom/example/client/)

[Source](example/client/index.html)

```bash

npm install
webpack

open example/client/index.html
```

#### Tests

```bash
# npm install mocha -g

npm test
```

#### Related

[https://github.com/agentcooper/htmltemplate-react](https://github.com/agentcooper/htmltemplate-react)
