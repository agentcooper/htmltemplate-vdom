!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.clientRuntime=t():e.clientRuntime=t()}(this,function(){return function(e){function t(n){if(r[n])return r[n].exports;var i=r[n]={exports:{},id:n,loaded:!1};return e[n].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}var r={};return t.m=e,t.c=r,t.p="",t(0)}([function(e,t,r){"use strict";var n=r(65);e.exports={h:r(85),mainLoop:function(e,t){var i=n(e,t,{create:r(83),diff:r(84),patch:r(90)});return i}}},function(e,t){function r(e){return e&&"Widget"===e.type}e.exports=r},,,,function(e,t,r){function n(e){return e&&"VirtualNode"===e.type&&e.version===i}var i=r(6);e.exports=n},function(e,t){e.exports="2"},,function(e,t){function r(){l=!1,a.length?u=a.concat(u):c=-1,u.length&&n()}function n(){if(!l){var e=setTimeout(r);l=!0;for(var t=u.length;t;){for(a=u,u=[];++c<t;)a&&a[c].run();c=-1,t=u.length}a=null,l=!1,clearTimeout(e)}}function i(e,t){this.fun=e,this.array=t}function o(){}var a,s=e.exports={},u=[],l=!1,c=-1;s.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)t[r-1]=arguments[r];u.push(new i(e,t)),1!==u.length||l||setTimeout(n,0)},i.prototype.run=function(){this.fun.apply(null,this.array)},s.title="browser",s.browser=!0,s.env={},s.argv=[],s.version="",s.versions={},s.on=o,s.addListener=o,s.once=o,s.off=o,s.removeListener=o,s.removeAllListeners=o,s.emit=o,s.binding=function(e){throw new Error("process.binding is not supported")},s.cwd=function(){return"/"},s.chdir=function(e){throw new Error("process.chdir is not supported")},s.umask=function(){return 0}},,,,function(e,t){function r(e){return e&&"Thunk"===e.type}e.exports=r},function(e,t){function r(e){return e&&("function"==typeof e.hook&&!e.hasOwnProperty("hook")||"function"==typeof e.unhook&&!e.hasOwnProperty("unhook"))}e.exports=r},function(e,t,r){function n(e){return e&&"VirtualText"===e.type&&e.version===i}var i=r(6);e.exports=n},,,,function(e,t){function r(e){return"[object Array]"===i.call(e)}var n=Array.isArray,i=Object.prototype.toString;e.exports=n||r},,,,,,,,,,,,function(e,t,r){(function(t){var n="undefined"!=typeof t?t:"undefined"!=typeof window?window:{},i=r(103);if("undefined"!=typeof document)e.exports=document;else{var o=n["__GLOBAL_DOCUMENT_CACHE@4"];o||(o=n["__GLOBAL_DOCUMENT_CACHE@4"]=i),e.exports=o}}).call(t,function(){return this}())},function(e,t){"use strict";e.exports=function(e){return"object"==typeof e&&null!==e}},function(e,t,r){function n(e,t,r){for(var n in t){var a=t[n];void 0===a?i(e,n,a,r):u(a)?(i(e,n,a,r),a.hook&&a.hook(e,n,r?r[n]:void 0)):s(a)?o(e,t,r,n,a):e[n]=a}}function i(e,t,r,n){if(n){var i=n[t];if(u(i))i.unhook&&i.unhook(e,t,r);else if("attributes"===t)for(var o in i)e.removeAttribute(o);else if("style"===t)for(var a in i)e.style[a]="";else"string"==typeof i?e[t]="":e[t]=null}}function o(e,t,r,n,i){var o=r?r[n]:void 0;if("attributes"!==n){if(o&&s(o)&&a(o)!==a(i))return void(e[n]=i);s(e[n])||(e[n]={});var u="style"===n?"":void 0;for(var l in i){var c=i[l];e[n][l]=void 0===c?u:c}}else for(var p in i){var f=i[p];void 0===f?e.removeAttribute(p):e.setAttribute(p,f)}}function a(e){return Object.getPrototypeOf?Object.getPrototypeOf(e):e.__proto__?e.__proto__:e.constructor?e.constructor.prototype:void 0}var s=r(31),u=r(13);e.exports=n},function(e,t,r){function n(e,t){var r=t?t.document||i:i,c=t?t.warn:null;if(e=l(e).a,u(e))return e.init();if(s(e))return r.createTextNode(e.text);if(!a(e))return c&&c("Item is not a valid virtual dom node",e),null;var p=null===e.namespace?r.createElement(e.tagName):r.createElementNS(e.namespace,e.tagName),f=e.properties;o(p,f);for(var h=e.children,d=0;d<h.length;d++){var g=n(h[d],t);g&&p.appendChild(g)}return p}var i=r(30),o=r(32),a=r(5),s=r(14),u=r(1),l=r(34);e.exports=n},function(e,t,r){function n(e,t){var r=e,n=t;return u(t)&&(n=i(t,e)),u(e)&&(r=i(e,null)),{a:r,b:n}}function i(e,t){var r=e.vnode;if(r||(r=e.vnode=e.render(t)),!(o(r)||a(r)||s(r)))throw new Error("thunk did not return a valid node");return r}var o=r(5),a=r(14),s=r(1),u=r(12);e.exports=n},function(e,t,r){function n(e,t,r){this.type=Number(e),this.vNode=t,this.patch=r}var i=r(6);n.NONE=0,n.VTEXT=1,n.VNODE=2,n.WIDGET=3,n.PROPS=4,n.ORDER=5,n.INSERT=6,n.REMOVE=7,n.THUNK=8,e.exports=n,n.prototype.version=i,n.prototype.type="VirtualPatch"},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,function(e,t,r){function n(e,t,r){function n(e){if(d)throw a({diff:e._diff,stringDiff:JSON.stringify(e._diff)});null!==s||p||(p=!0,i(o)),s=e}function o(){if(p=!1,null!==s){d=!0;var e=t(s);if(r.createOnly)d=!1,u(e,r);else{var n=l(f,e,r);d=!1,h=c(h,n,r)}f=e,s=null}}r=r||{};var s=e,u=r.create,l=r.diff,c=r.patch,p=!1,f=r.initialTree||t(s),h=r.target||u(f,r),d=!1;return s=null,{target:h,update:n}}var i=r(70),o=r(69),a=o({type:"main-loop.invalid.update.in-render",message:"main-loop: Unexpected update occurred in loop.\nWe are currently rendering a view, you can't change state right now.\nThe diff is: {stringDiff}.\nSUGGESTED FIX: find the state mutation in your view or rendering function and remove it.\nThe view should not have any side effects.\n",diff:null,stringDiff:null});e.exports=n},function(e,t){function r(e){return e&&"object"==typeof e?s(e)||u(e)?e:a(e)?i(e,r):o(c(e),function(t,i){var o=n(i);return t[o]=r(e[i]),t},{}):e}function n(e){return e.replace(/[_.-](\w|$)/g,function(e,t){return t.toUpperCase()})}function i(e,t){if(e.map)return e.map(t);for(var r=[],n=0;n<e.length;n++)r.push(t(e[n],n));return r}function o(e,t,r){if(e.reduce)return e.reduce(t,r);for(var n=0;n<e.length;n++)r=t(r,e[n],n);return r}e.exports=function(e){return"string"==typeof e?n(e):r(e)};var a=Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)},s=function(e){return"[object Date]"===Object.prototype.toString.call(e)},u=function(e){return"[object RegExp]"===Object.prototype.toString.call(e)},l=Object.prototype.hasOwnProperty,c=Object.keys||function(e){var t=[];for(var r in e)l.call(e,r)&&t.push(r);return t}},function(e,t){function r(e){var t;return t=2===arguments.length&&"object"==typeof arguments[1]?arguments[1]:i.call(arguments,1),t&&t.hasOwnProperty||(t={}),e.replace(n,function(r,n,i){var o;return"{"===e[i-1]&&"}"===e[i+r.length]?n:(o=t.hasOwnProperty(n)?t[n]:null,null===o||void 0===o?"":o)})}var n=/\{([0-9a-zA-Z]+)\}/g,i=Array.prototype.slice;e.exports=r},function(e,t){function r(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n])}return e}e.exports=r},function(e,t,r){function n(e){function t(t){var n=new Error;Object.defineProperty(n,"type",{value:n.type,enumerable:!0,writable:!0,configurable:!0});var i=a({},e,t);return a(n,i),n.message=o(r,i),n}if(!e)throw new Error("args is required");if(!e.type)throw new Error("args.type is required");if(!e.message)throw new Error("args.message is required");var r=e.message;if(e.type&&!e.name){var n=i(e.type)+"Error";e.name=n[0].toUpperCase()+n.substr(1)}return a(t,e),t._name=e.name,t}var i=r(66),o=r(67),a=r(68);e.exports=n},function(e,t,r){for(var n=r(71),i="undefined"==typeof window?{}:window,o=["moz","webkit"],a="AnimationFrame",s=i["request"+a],u=i["cancel"+a]||i["cancelRequest"+a],l=!0,c=0;c<o.length&&!s;c++)s=i[o[c]+"Request"+a],u=i[o[c]+"Cancel"+a]||i[o[c]+"CancelRequest"+a];if(!s||!u){l=!1;var p=0,f=0,h=[],d=1e3/60;s=function(e){if(0===h.length){var t=n(),r=Math.max(0,d-(t-p));p=r+t,setTimeout(function(){var e=h.slice(0);h.length=0;for(var t=0;t<e.length;t++)if(!e[t].cancelled)try{e[t].callback(p)}catch(r){setTimeout(function(){throw r},0)}},Math.round(r))}return h.push({handle:++f,callback:e,cancelled:!1}),f},u=function(e){for(var t=0;t<h.length;t++)h[t].handle===e&&(h[t].cancelled=!0)}}e.exports=function(e){return l?s.call(i,function(){try{e.apply(this,arguments)}catch(t){setTimeout(function(){throw t},0)}}):s.call(i,e)},e.exports.cancel=function(){u.apply(i,arguments)}},function(e,t,r){(function(t){(function(){var r,n,i;"undefined"!=typeof performance&&null!==performance&&performance.now?e.exports=function(){return performance.now()}:"undefined"!=typeof t&&null!==t&&t.hrtime?(e.exports=function(){return(r()-i)/1e6},n=t.hrtime,r=function(){var e;return e=n(),1e9*e[0]+e[1]},i=r()):Date.now?(e.exports=function(){return Date.now()-i},i=Date.now()):(e.exports=function(){return(new Date).getTime()-i},i=(new Date).getTime())}).call(this)}).call(t,r(8))},,,,,,,,,,,,function(e,t,r){var n=r(33);e.exports=n},function(e,t,r){var n=r(102);e.exports=n},function(e,t,r){var n=r(97);e.exports=n},function(e,t){/*!
	 * Cross-Browser Split 1.1.1
	 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
	 * Available under the MIT License
	 * ECMAScript compliant, uniform cross-browser split method
	 */
e.exports=function(e){var t,r=String.prototype.split,n=/()??/.exec("")[1]===e;return t=function(t,i,o){if("[object RegExp]"!==Object.prototype.toString.call(i))return r.call(t,i,o);var a,s,u,l,c=[],p=(i.ignoreCase?"i":"")+(i.multiline?"m":"")+(i.extended?"x":"")+(i.sticky?"y":""),f=0,i=new RegExp(i.source,p+"g");for(t+="",n||(a=new RegExp("^"+i.source+"$(?!\\s)",p)),o=o===e?-1>>>0:o>>>0;(s=i.exec(t))&&(u=s.index+s[0].length,!(u>f&&(c.push(t.slice(f,s.index)),!n&&s.length>1&&s[0].replace(a,function(){for(var t=1;t<arguments.length-2;t++)arguments[t]===e&&(s[t]=e)}),s.length>1&&s.index<t.length&&Array.prototype.push.apply(c,s.slice(1)),l=s[0].length,f=u,c.length>=o)));)i.lastIndex===s.index&&i.lastIndex++;return f===t.length?(l||!i.test(""))&&c.push(""):c.push(t.slice(f)),c.length>o?c.slice(0,o):c}}()},function(e,t,r){"use strict";function n(e){var t=e[a];return t||(t=e[a]={}),t}var i=r(89),o="7";i("ev-store",o);var a="__EV_STORE_KEY@"+o;e.exports=n},function(e,t){(function(t){"use strict";function r(e,t){return e in n?n[e]:(n[e]=t,t)}var n="undefined"!=typeof window?window:"undefined"!=typeof t?t:{};e.exports=r}).call(t,function(){return this}())},function(e,t,r){"use strict";function n(e,t,r){var n="__INDIVIDUAL_ONE_VERSION_"+e,o=n+"_ENFORCE_SINGLETON",a=i(o,t);if(a!==t)throw new Error("Can only have one copy of "+e+".\nYou already have version "+a+" installed.\nThis means you cannot install version "+t);return i(n,r)}var i=r(88);e.exports=n},function(e,t,r){var n=r(93);e.exports=n},function(e,t){function r(e,t,r,i){return r&&0!==r.length?(r.sort(o),n(e,t,r,i,0)):{}}function n(e,t,r,o,s){if(o=o||{},e){i(r,s,s)&&(o[s]=e);var u=t.children;if(u)for(var l=e.childNodes,c=0;c<t.children.length;c++){s+=1;var p=u[c]||a,f=s+(p.count||0);i(r,s,f)&&n(l[c],p,r,o,s),s=f}}return o}function i(e,t,r){if(0===e.length)return!1;for(var n,i,o=0,a=e.length-1;a>=o;){if(n=(a+o)/2>>0,i=e[n],o===a)return i>=t&&r>=i;if(t>i)o=n+1;else{if(!(i>r))return!0;a=n-1}}return!1}function o(e,t){return e>t?1:-1}var a={};e.exports=r},function(e,t,r){function n(e,t,r){var n=e.type,l=e.vNode,h=e.patch;switch(n){case d.REMOVE:return i(t,l);case d.INSERT:return o(t,h,r);case d.VTEXT:return a(t,l,h,r);case d.WIDGET:return s(t,l,h,r);case d.VNODE:return u(t,l,h,r);case d.ORDER:return c(t,h),t;case d.PROPS:return f(t,h,l.properties),t;case d.THUNK:return p(t,r.patch(t,h,r));default:return t}}function i(e,t){var r=e.parentNode;return r&&r.removeChild(e),l(e,t),null}function o(e,t,r){var n=r.render(t,r);return e&&e.appendChild(n),e}function a(e,t,r,n){var i;if(3===e.nodeType)e.replaceData(0,e.length,r.text),i=e;else{var o=e.parentNode;i=n.render(r,n),o&&i!==e&&o.replaceChild(i,e)}return i}function s(e,t,r,n){var i,o=g(t,r);i=o?r.update(t,e)||e:n.render(r,n);var a=e.parentNode;return a&&i!==e&&a.replaceChild(i,e),o||l(e,t),i}function u(e,t,r,n){var i=e.parentNode,o=n.render(r,n);return i&&o!==e&&i.replaceChild(o,e),o}function l(e,t){"function"==typeof t.destroy&&h(t)&&t.destroy(e)}function c(e,t){for(var r,n,i,o=e.childNodes,a={},s=0;s<t.removes.length;s++)n=t.removes[s],r=o[n.from],n.key&&(a[n.key]=r),e.removeChild(r);for(var u=o.length,l=0;l<t.inserts.length;l++)i=t.inserts[l],r=a[i.key],e.insertBefore(r,i.to>=u++?null:o[i.to])}function p(e,t){return e&&t&&e!==t&&e.parentNode&&e.parentNode.replaceChild(t,e),t}var f=r(32),h=r(1),d=r(35),g=r(94);e.exports=n},function(e,t,r){function n(e,t,r){return r=r||{},r.patch=r.patch&&r.patch!==n?r.patch:i,r.render=r.render||l,r.patch(e,t,r)}function i(e,t,r){var n=a(t);if(0===n.length)return e;var i=c(e,t.a,n),u=e.ownerDocument;r.document||u===s||(r.document=u);for(var l=0;l<n.length;l++){var p=n[l];e=o(e,i[p],t[p],r)}return e}function o(e,t,r,n){if(!t)return e;var i;if(u(r))for(var o=0;o<r.length;o++)i=p(r[o],t,n),t===e&&(e=i);else i=p(r,t,n),t===e&&(e=i);return e}function a(e){var t=[];for(var r in e)"a"!==r&&t.push(Number(r));return t}var s=r(30),u=r(18),l=r(33),c=r(91),p=r(92);e.exports=n},function(e,t,r){function n(e,t){return i(e)&&i(t)?"name"in e&&"name"in t?e.id===t.id:e.init===t.init:!1}var i=r(1);e.exports=n},function(e,t,r){"use strict";function n(e){return this instanceof n?void(this.value=e):new n(e)}var i=r(87);e.exports=n,n.prototype.hook=function(e,t){var r=i(e),n=t.substr(3);r[n]=this.value},n.prototype.unhook=function(e,t){var r=i(e),n=t.substr(3);r[n]=void 0}},function(e,t){"use strict";function r(e){return this instanceof r?void(this.value=e):new r(e)}e.exports=r,r.prototype.hook=function(e,t){e[t]!==this.value&&(e[t]=this.value)}},function(e,t,r){"use strict";function n(e,t,r){var n,a,u,l,c=[];return!r&&s(t)&&(r=t,a={}),a=a||t||{},n=v(e,a),a.hasOwnProperty("key")&&(u=a.key,a.key=void 0),a.hasOwnProperty("namespace")&&(l=a.namespace,a.namespace=void 0),"INPUT"!==n||l||!a.hasOwnProperty("value")||void 0===a.value||m(a.value)||(a.value=b(a.value)),o(a),void 0!==r&&null!==r&&i(r,c,n,a),new p(n,a,c,u,l)}function i(e,t,r,n){if("string"==typeof e)t.push(new f(e));else if("number"==typeof e)t.push(new f(String(e)));else if(a(e))t.push(e);else{if(!c(e)){if(null===e||void 0===e)return;throw u({foreignObject:e,parentVnode:{tagName:r,properties:n}})}for(var o=0;o<e.length;o++)i(e[o],t,r,n)}}function o(e){for(var t in e)if(e.hasOwnProperty(t)){var r=e[t];if(m(r))continue;"ev-"===t.substr(0,3)&&(e[t]=x(r))}}function a(e){return h(e)||d(e)||g(e)||y(e)}function s(e){return"string"==typeof e||c(e)||a(e)}function u(e){var t=new Error;return t.type="virtual-hyperscript.unexpected.virtual-element",t.message="Unexpected virtual child passed to h().\nExpected a VNode / Vthunk / VWidget / string but:\ngot:\n"+l(e.foreignObject)+".\nThe parent vnode is:\n"+l(e.parentVnode),t.foreignObject=e.foreignObject,t.parentVnode=e.parentVnode,t}function l(e){try{return JSON.stringify(e,null,"    ")}catch(t){return String(e)}}var c=r(18),p=r(99),f=r(100),h=r(5),d=r(14),g=r(1),m=r(13),y=r(12),v=r(98),b=r(96),x=r(95);e.exports=n},function(e,t,r){"use strict";function n(e,t){if(!e)return"DIV";var r=!t.hasOwnProperty("id"),n=i(e,o),s=null;a.test(n[1])&&(s="DIV");var u,l,c,p;for(p=0;p<n.length;p++)l=n[p],l&&(c=l.charAt(0),s?"."===c?(u=u||[],u.push(l.substring(1,l.length))):"#"===c&&r&&(t.id=l.substring(1,l.length)):s=l);return u&&(t.className&&u.push(t.className),t.className=u.join(" ")),t.namespace?s:s.toUpperCase()}var i=r(86),o=/([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/,a=/^\.|#/;e.exports=n},function(e,t,r){function n(e,t,r,n,i){this.tagName=e,this.properties=t||l,this.children=r||c,this.key=null!=n?String(n):void 0,this.namespace="string"==typeof i?i:null;var p,f=r&&r.length||0,h=0,d=!1,g=!1,m=!1;for(var y in t)if(t.hasOwnProperty(y)){var v=t[y];u(v)&&v.unhook&&(p||(p={}),p[y]=v)}for(var b=0;f>b;b++){var x=r[b];o(x)?(h+=x.count||0,!d&&x.hasWidgets&&(d=!0),!g&&x.hasThunks&&(g=!0),m||!x.hooks&&!x.descendantHooks||(m=!0)):!d&&a(x)?"function"==typeof x.destroy&&(d=!0):!g&&s(x)&&(g=!0)}this.count=f+h,this.hasWidgets=d,this.hasThunks=g,this.hooks=p,this.descendantHooks=m}var i=r(6),o=r(5),a=r(1),s=r(12),u=r(13);e.exports=n;var l={},c=[];n.prototype.version=i,n.prototype.type="VirtualNode"},function(e,t,r){function n(e){this.text=String(e)}var i=r(6);e.exports=n,n.prototype.version=i,n.prototype.type="VirtualText"},function(e,t,r){function n(e,t){var r;for(var s in e){s in t||(r=r||{},r[s]=void 0);var u=e[s],l=t[s];if(u!==l)if(o(u)&&o(l))if(i(l)!==i(u))r=r||{},r[s]=l;else if(a(l))r=r||{},r[s]=l;else{var c=n(u,l);c&&(r=r||{},r[s]=c)}else r=r||{},r[s]=l}for(var p in t)p in e||(r=r||{},r[p]=t[p]);return r}function i(e){return Object.getPrototypeOf?Object.getPrototypeOf(e):e.__proto__?e.__proto__:e.constructor?e.constructor.prototype:void 0}var o=r(31),a=r(13);e.exports=n},function(e,t,r){function n(e,t){var r={a:e};return i(e,t,r,0),r}function i(e,t,r,n){if(e!==t){var i=r[n],s=!1;if(E(e)||E(t))u(e,t,r,n);else if(null==t)x(e)||(a(e,r,n),i=r[n]),i=g(i,new y(y.REMOVE,e,t));else if(v(t))if(v(e))if(e.tagName===t.tagName&&e.namespace===t.namespace&&e.key===t.key){var l=A(e.properties,t.properties);l&&(i=g(i,new y(y.PROPS,e,l))),i=o(e,t,r,i,n)}else i=g(i,new y(y.VNODE,e,t)),s=!0;else i=g(i,new y(y.VNODE,e,t)),s=!0;else b(t)?b(e)?e.text!==t.text&&(i=g(i,new y(y.VTEXT,e,t))):(i=g(i,new y(y.VTEXT,e,t)),s=!0):x(t)&&(x(e)||(s=!0),i=g(i,new y(y.WIDGET,e,t)));i&&(r[n]=i),s&&a(e,r,n)}}function o(e,t,r,n,o){for(var a=e.children,s=f(a,t.children),u=s.children,l=a.length,c=u.length,p=l>c?l:c,h=0;p>h;h++){var d=a[h],m=u[h];o+=1,d?i(d,m,r,o):m&&(n=g(n,new y(y.INSERT,null,m))),v(d)&&d.count&&(o+=d.count)}return s.moves&&(n=g(n,new y(y.ORDER,e,s.moves))),n}function a(e,t,r){c(e,t,r),s(e,t,r)}function s(e,t,r){if(x(e))"function"==typeof e.destroy&&(t[r]=g(t[r],new y(y.REMOVE,e,null)));else if(v(e)&&(e.hasWidgets||e.hasThunks))for(var n=e.children,i=n.length,o=0;i>o;o++){var a=n[o];r+=1,s(a,t,r),v(a)&&a.count&&(r+=a.count)}else E(e)&&u(e,null,t,r)}function u(e,t,r,i){var o=w(e,t),a=n(o.a,o.b);l(a)&&(r[i]=new y(y.THUNK,null,a))}function l(e){for(var t in e)if("a"!==t)return!0;return!1}function c(e,t,r){if(v(e)){if(e.hooks&&(t[r]=g(t[r],new y(y.PROPS,e,p(e.hooks)))),e.descendantHooks||e.hasThunks)for(var n=e.children,i=n.length,o=0;i>o;o++){var a=n[o];r+=1,c(a,t,r),v(a)&&a.count&&(r+=a.count)}}else E(e)&&u(e,null,t,r)}function p(e){var t={};for(var r in e)t[r]=void 0;return t}function f(e,t){var r=d(t),n=r.keys,i=r.free;if(i.length===t.length)return{children:t,moves:null};var o=d(e),a=o.keys,s=o.free;if(s.length===e.length)return{children:t,moves:null};for(var u=[],l=0,c=i.length,p=0,f=0;f<e.length;f++){var g,m=e[f];m.key?n.hasOwnProperty(m.key)?(g=n[m.key],u.push(t[g])):(g=f-p++,u.push(null)):c>l?(g=i[l++],u.push(t[g])):(g=f-p++,u.push(null))}for(var y=l>=i.length?t.length:i[l],v=0;v<t.length;v++){var b=t[v];b.key?a.hasOwnProperty(b.key)||u.push(b):v>=y&&u.push(b)}for(var x,E=u.slice(),w=0,A=[],S=[],C=0;C<t.length;){var k=t[C];for(x=E[w];null===x&&E.length;)A.push(h(E,w,null)),x=E[w];x&&x.key===k.key?(w++,C++):k.key?(x&&x.key&&n[x.key]!==C+1?(A.push(h(E,w,x.key)),x=E[w],x&&x.key===k.key?w++:S.push({key:k.key,to:C})):S.push({key:k.key,to:C}),C++):x&&x.key&&A.push(h(E,w,x.key))}for(;w<E.length;)x=E[w],A.push(h(E,w,x&&x.key));return A.length!==p||S.length?{children:u,moves:{removes:A,inserts:S}}:{children:u,moves:null}}function h(e,t,r){return e.splice(t,1),{from:t,key:r}}function d(e){for(var t={},r=[],n=e.length,i=0;n>i;i++){var o=e[i];o.key?t[o.key]=i:r.push(i)}return{keys:t,free:r}}function g(e,t){return e?(m(e)?e.push(t):e=[e,t],e):t}var m=r(18),y=r(35),v=r(5),b=r(14),x=r(1),E=r(12),w=r(34),A=r(101);e.exports=n},function(e,t){}])});