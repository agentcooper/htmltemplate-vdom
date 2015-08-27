### htmltemplate-vdom

**WIP**

[HTML::Template](http://search.cpan.org/~samtregar/HTML-Template/Template.pm) engine on top of [virtual-dom](https://github.com/Matt-Esch/virtual-dom).

Parser is modified version of https://github.com/Lapple/htmltemplate-parser.

Full client runtime is around 10kb (minified + gzip).

#### Example

[example/client/index.html](example/client/index.html)

```bash
# client render

npm install
webpack

open example/client/index.html
```

[example/client/index.html](example/server/index.js)

```bash
# server render

node example/server/index.js
```

#### Building parser

```bash
npm install pegjs -g
npm run build-parser # produces lib/parser.js from htmltemplate.pegjs
```
