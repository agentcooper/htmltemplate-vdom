### htmltemplate-vdom

WIP [HTML::Template](http://search.cpan.org/~samtregar/HTML-Template/Template.pm) engine on top of virtual-dom.

Parser is modified version of https://github.com/Lapple/htmltemplate-parser.

#### Example

[Example](example/index.html)

```bash
npm install

cd example
webpack
open index.html
```

#### Building parser

```bash
npm install pegjs -g
npm run build-parser # produces lib/parser.js from htmltemplate.pegjs
```
