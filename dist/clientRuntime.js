!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.clientRuntime=n():e.clientRuntime=n()}(this,function(){return function(e){function n(r){if(t[r])return t[r].exports;var o=t[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,n),o.loaded=!0,o.exports}var t={};return n.m=e,n.c=t,n.p="",n(0)}([function(e,n,t){"use strict";var r=t(39);e.exports={h:t(56),mainLoop:function(e,n){var o=r(e,n,{create:t(54),diff:t(55),patch:t(61)});return o}}},function(e,n){function t(e){return e&&"Widget"===e.type}e.exports=t},,function(e,n,t){function r(e){return e&&"VirtualNode"===e.type&&e.version===o}var o=t(4);e.exports=r},function(e,n){e.exports="2"},function(e,n){function t(e){return e&&"Thunk"===e.type}e.exports=t},function(e,n){function t(e){return e&&("function"==typeof e.hook&&!e.hasOwnProperty("hook")||"function"==typeof e.unhook&&!e.hasOwnProperty("unhook"))}e.exports=t},function(e,n,t){function r(e){return e&&"VirtualText"===e.type&&e.version===o}var o=t(4);e.exports=r},function(e,n){function t(){c=!1,u.length?s=u.concat(s):f=-1,s.length&&r()}function r(){if(!c){var e=setTimeout(t);c=!0;for(var n=s.length;n;){for(u=s,s=[];++f<n;)u[f].run();f=-1,n=s.length}u=null,c=!1,clearTimeout(e)}}function o(e,n){this.fun=e,this.array=n}function i(){}var u,a=e.exports={},s=[],c=!1,f=-1;a.nextTick=function(e){var n=new Array(arguments.length-1);if(arguments.length>1)for(var t=1;t<arguments.length;t++)n[t-1]=arguments[t];s.push(new o(e,n)),1!==s.length||c||setTimeout(r,0)},o.prototype.run=function(){this.fun.apply(null,this.array)},a.title="browser",a.browser=!0,a.env={},a.argv=[],a.version="",a.versions={},a.on=i,a.addListener=i,a.once=i,a.off=i,a.removeListener=i,a.removeAllListeners=i,a.emit=i,a.binding=function(e){throw new Error("process.binding is not supported")},a.cwd=function(){return"/"},a.chdir=function(e){throw new Error("process.chdir is not supported")},a.umask=function(){return 0}},,,,function(e,n){function t(e){return"[object Array]"===o.call(e)}var r=Array.isArray,o=Object.prototype.toString;e.exports=r||t},,,,,,,function(e,n,t){(function(n){var r="undefined"!=typeof n?n:"undefined"!=typeof window?window:{},o=t(74);if("undefined"!=typeof document)e.exports=document;else{var i=r["__GLOBAL_DOCUMENT_CACHE@4"];i||(i=r["__GLOBAL_DOCUMENT_CACHE@4"]=o),e.exports=i}}).call(n,function(){return this}())},function(e,n){"use strict";e.exports=function(e){return"object"==typeof e&&null!==e}},function(e,n,t){function r(e,n,t){for(var r in n){var u=n[r];void 0===u?o(e,r,u,t):s(u)?(o(e,r,u,t),u.hook&&u.hook(e,r,t?t[r]:void 0)):a(u)?i(e,n,t,r,u):e[r]=u}}function o(e,n,t,r){if(r){var o=r[n];if(s(o))o.unhook&&o.unhook(e,n,t);else if("attributes"===n)for(var i in o)e.removeAttribute(i);else if("style"===n)for(var u in o)e.style[u]="";else"string"==typeof o?e[n]="":e[n]=null}}function i(e,n,t,r,o){var i=t?t[r]:void 0;if("attributes"!==r){if(i&&a(i)&&u(i)!==u(o))return void(e[r]=o);a(e[r])||(e[r]={});var s="style"===r?"":void 0;for(var c in o){var f=o[c];e[r][c]=void 0===f?s:f}}else for(var l in o){var p=o[l];void 0===p?e.removeAttribute(l):e.setAttribute(l,p)}}function u(e){return Object.getPrototypeOf?Object.getPrototypeOf(e):e.__proto__?e.__proto__:e.constructor?e.constructor.prototype:void 0}var a=t(20),s=t(6);e.exports=r},function(e,n,t){function r(e,n){var t=n?n.document||o:o,f=n?n.warn:null;if(e=c(e).a,s(e))return e.init();if(a(e))return t.createTextNode(e.text);if(!u(e))return f&&f("Item is not a valid virtual dom node",e),null;var l=null===e.namespace?t.createElement(e.tagName):t.createElementNS(e.namespace,e.tagName),p=e.properties;i(l,p);for(var h=e.children,v=0;v<h.length;v++){var d=r(h[v],n);d&&l.appendChild(d)}return l}var o=t(19),i=t(21),u=t(3),a=t(7),s=t(1),c=t(23);e.exports=r},function(e,n,t){function r(e,n){var t=e,r=n;return s(n)&&(r=o(n,e)),s(e)&&(t=o(e,null)),{a:t,b:r}}function o(e,n){var t=e.vnode;if(t||(t=e.vnode=e.render(n)),!(i(t)||u(t)||a(t)))throw new Error("thunk did not return a valid node");return t}var i=t(3),u=t(7),a=t(1),s=t(5);e.exports=r},function(e,n,t){function r(e,n,t){this.type=Number(e),this.vNode=n,this.patch=t}var o=t(4);r.NONE=0,r.VTEXT=1,r.VNODE=2,r.WIDGET=3,r.PROPS=4,r.ORDER=5,r.INSERT=6,r.REMOVE=7,r.THUNK=8,e.exports=r,r.prototype.version=o,r.prototype.type="VirtualPatch"},,,,,,,,,,,,,,,function(e,n,t){function r(e,n,t){function r(e){if(v)throw u({diff:e._diff,stringDiff:JSON.stringify(e._diff)});null!==a||l||(l=!0,o(i)),a=e}function i(){if(l=!1,null!==a){v=!0;var e=n(a);if(t.createOnly)v=!1,s(e,t);else{var r=c(p,e,t);v=!1,h=f(h,r,t)}p=e,a=null}}t=t||{};var a=e,s=t.create,c=t.diff,f=t.patch,l=!1,p=t.initialTree||n(a),h=t.target||s(p,t),v=!1;return a=null,{target:h,update:r}}var o=t(44),i=t(43),u=i({type:"main-loop.invalid.update.in-render",message:"main-loop: Unexpected update occurred in loop.\nWe are currently rendering a view, you can't change state right now.\nThe diff is: {stringDiff}.\nSUGGESTED FIX: find the state mutation in your view or rendering function and remove it.\nThe view should not have any side effects.\n",diff:null,stringDiff:null});e.exports=r},function(e,n){function t(e){return e&&"object"==typeof e?a(e)||s(e)?e:u(e)?o(e,t):i(f(e),function(n,o){var i=r(o);return n[i]=t(e[o]),n},{}):e}function r(e){return e.replace(/[_.-](\w|$)/g,function(e,n){return n.toUpperCase()})}function o(e,n){if(e.map)return e.map(n);for(var t=[],r=0;r<e.length;r++)t.push(n(e[r],r));return t}function i(e,n,t){if(e.reduce)return e.reduce(n,t);for(var r=0;r<e.length;r++)t=n(t,e[r],r);return t}e.exports=function(e){return"string"==typeof e?r(e):t(e)};var u=Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)},a=function(e){return"[object Date]"===Object.prototype.toString.call(e)},s=function(e){return"[object RegExp]"===Object.prototype.toString.call(e)},c=Object.prototype.hasOwnProperty,f=Object.keys||function(e){var n=[];for(var t in e)c.call(e,t)&&n.push(t);return n}},function(e,n){function t(e){var n;return n=2===arguments.length&&"object"==typeof arguments[1]?arguments[1]:o.call(arguments,1),n&&n.hasOwnProperty||(n={}),e.replace(r,function(t,r,o){var i;return"{"===e[o-1]&&"}"===e[o+t.length]?r:(i=n.hasOwnProperty(r)?n[r]:null,null===i||void 0===i?"":i)})}var r=/\{([0-9a-zA-Z]+)\}/g,o=Array.prototype.slice;e.exports=t},function(e,n){function t(e){for(var n=1;n<arguments.length;n++){var t=arguments[n];for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])}return e}e.exports=t},function(e,n,t){function r(e){function n(n){var r=new Error;Object.defineProperty(r,"type",{value:r.type,enumerable:!0,writable:!0,configurable:!0});var o=u({},e,n);return u(r,o),r.message=i(t,o),r}if(!e)throw new Error("args is required");if(!e.type)throw new Error("args.type is required");if(!e.message)throw new Error("args.message is required");var t=e.message;if(e.type&&!e.name){var r=o(e.type)+"Error";e.name=r[0].toUpperCase()+r.substr(1)}return u(n,e),n._name=e.name,n}var o=t(40),i=t(41),u=t(42);e.exports=r},function(e,n,t){for(var r=t(45),o="undefined"==typeof window?{}:window,i=["moz","webkit"],u="AnimationFrame",a=o["request"+u],s=o["cancel"+u]||o["cancelRequest"+u],c=!0,f=0;f<i.length&&!a;f++)a=o[i[f]+"Request"+u],s=o[i[f]+"Cancel"+u]||o[i[f]+"CancelRequest"+u];if(!a||!s){c=!1;var l=0,p=0,h=[],v=1e3/60;a=function(e){if(0===h.length){var n=r(),t=Math.max(0,v-(n-l));l=t+n,setTimeout(function(){var e=h.slice(0);h.length=0;for(var n=0;n<e.length;n++)if(!e[n].cancelled)try{e[n].callback(l)}catch(t){setTimeout(function(){throw t},0)}},Math.round(t))}return h.push({handle:++p,callback:e,cancelled:!1}),p},s=function(e){for(var n=0;n<h.length;n++)h[n].handle===e&&(h[n].cancelled=!0)}}e.exports=function(e){return c?a.call(o,function(){try{e.apply(this,arguments)}catch(n){setTimeout(function(){throw n},0)}}):a.call(o,e)},e.exports.cancel=function(){s.apply(o,arguments)}},function(e,n,t){(function(n){(function(){var t,r,o;"undefined"!=typeof performance&&null!==performance&&performance.now?e.exports=function(){return performance.now()}:"undefined"!=typeof n&&null!==n&&n.hrtime?(e.exports=function(){return(t()-o)/1e6},r=n.hrtime,t=function(){var e;return e=r(),1e9*e[0]+e[1]},o=t()):Date.now?(e.exports=function(){return Date.now()-o},o=Date.now()):(e.exports=function(){return(new Date).getTime()-o},o=(new Date).getTime())}).call(this)}).call(n,t(8))},,,,,,,,,function(e,n,t){var r=t(22);e.exports=r},function(e,n,t){var r=t(73);e.exports=r},function(e,n,t){var r=t(68);e.exports=r},function(e,n){/*!
	 * Cross-Browser Split 1.1.1
	 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
	 * Available under the MIT License
	 * ECMAScript compliant, uniform cross-browser split method
	 */
e.exports=function(e){var n,t=String.prototype.split,r=/()??/.exec("")[1]===e;return n=function(n,o,i){if("[object RegExp]"!==Object.prototype.toString.call(o))return t.call(n,o,i);var u,a,s,c,f=[],l=(o.ignoreCase?"i":"")+(o.multiline?"m":"")+(o.extended?"x":"")+(o.sticky?"y":""),p=0,o=new RegExp(o.source,l+"g");for(n+="",r||(u=new RegExp("^"+o.source+"$(?!\\s)",l)),i=i===e?-1>>>0:i>>>0;(a=o.exec(n))&&(s=a.index+a[0].length,!(s>p&&(f.push(n.slice(p,a.index)),!r&&a.length>1&&a[0].replace(u,function(){for(var n=1;n<arguments.length-2;n++)arguments[n]===e&&(a[n]=e)}),a.length>1&&a.index<n.length&&Array.prototype.push.apply(f,a.slice(1)),c=a[0].length,p=s,f.length>=i)));)o.lastIndex===a.index&&o.lastIndex++;return p===n.length?(c||!o.test(""))&&f.push(""):f.push(n.slice(p)),f.length>i?f.slice(0,i):f}}()},function(e,n,t){"use strict";function r(e){var n=e[u];return n||(n=e[u]={}),n}var o=t(60),i="7";o("ev-store",i);var u="__EV_STORE_KEY@"+i;e.exports=r},function(e,n){(function(n){"use strict";function t(e,n){return e in r?r[e]:(r[e]=n,n)}var r="undefined"!=typeof window?window:"undefined"!=typeof n?n:{};e.exports=t}).call(n,function(){return this}())},function(e,n,t){"use strict";function r(e,n,t){var r="__INDIVIDUAL_ONE_VERSION_"+e,i=r+"_ENFORCE_SINGLETON",u=o(i,n);if(u!==n)throw new Error("Can only have one copy of "+e+".\nYou already have version "+u+" installed.\nThis means you cannot install version "+n);return o(r,t)}var o=t(59);e.exports=r},function(e,n,t){var r=t(64);e.exports=r},function(e,n){function t(e,n,t,o){return t&&0!==t.length?(t.sort(i),r(e,n,t,o,0)):{}}function r(e,n,t,i,a){if(i=i||{},e){o(t,a,a)&&(i[a]=e);var s=n.children;if(s)for(var c=e.childNodes,f=0;f<n.children.length;f++){a+=1;var l=s[f]||u,p=a+(l.count||0);o(t,a,p)&&r(c[f],l,t,i,a),a=p}}return i}function o(e,n,t){if(0===e.length)return!1;for(var r,o,i=0,u=e.length-1;u>=i;){if(r=(u+i)/2>>0,o=e[r],i===u)return o>=n&&t>=o;if(n>o)i=r+1;else{if(!(o>t))return!0;u=r-1}}return!1}function i(e,n){return e>n?1:-1}var u={};e.exports=t},function(e,n,t){function r(e,n,t){var r=e.type,c=e.vNode,h=e.patch;switch(r){case v.REMOVE:return o(n,c);case v.INSERT:return i(n,h,t);case v.VTEXT:return u(n,c,h,t);case v.WIDGET:return a(n,c,h,t);case v.VNODE:return s(n,c,h,t);case v.ORDER:return f(n,h),n;case v.PROPS:return p(n,h,c.properties),n;case v.THUNK:return l(n,t.patch(n,h,t));default:return n}}function o(e,n){var t=e.parentNode;return t&&t.removeChild(e),c(e,n),null}function i(e,n,t){var r=t.render(n,t);return e&&e.appendChild(r),e}function u(e,n,t,r){var o;if(3===e.nodeType)e.replaceData(0,e.length,t.text),o=e;else{var i=e.parentNode;o=r.render(t,r),i&&o!==e&&i.replaceChild(o,e)}return o}function a(e,n,t,r){var o,i=d(n,t);o=i?t.update(n,e)||e:r.render(t,r);var u=e.parentNode;return u&&o!==e&&u.replaceChild(o,e),i||c(e,n),o}function s(e,n,t,r){var o=e.parentNode,i=r.render(t,r);return o&&i!==e&&o.replaceChild(i,e),i}function c(e,n){"function"==typeof n.destroy&&h(n)&&n.destroy(e)}function f(e,n){for(var t,r,o,i=e.childNodes,u={},a=0;a<n.removes.length;a++)r=n.removes[a],t=i[r.from],r.key&&(u[r.key]=t),e.removeChild(t);for(var s=i.length,c=0;c<n.inserts.length;c++)o=n.inserts[c],t=u[o.key],e.insertBefore(t,o.to>=s++?null:i[o.to])}function l(e,n){return e&&n&&e!==n&&e.parentNode&&e.parentNode.replaceChild(n,e),n}var p=t(21),h=t(1),v=t(24),d=t(65);e.exports=r},function(e,n,t){function r(e,n,t){return t=t||{},t.patch=t.patch&&t.patch!==r?t.patch:o,t.render=t.render||c,t.patch(e,n,t)}function o(e,n,t){var r=u(n);if(0===r.length)return e;var o=f(e,n.a,r),s=e.ownerDocument;t.document||s===a||(t.document=s);for(var c=0;c<r.length;c++){var l=r[c];e=i(e,o[l],n[l],t)}return e}function i(e,n,t,r){if(!n)return e;var o;if(s(t))for(var i=0;i<t.length;i++)o=l(t[i],n,r),n===e&&(e=o);else o=l(t,n,r),n===e&&(e=o);return e}function u(e){var n=[];for(var t in e)"a"!==t&&n.push(Number(t));return n}var a=t(19),s=t(12),c=t(22),f=t(62),l=t(63);e.exports=r},function(e,n,t){function r(e,n){return o(e)&&o(n)?"name"in e&&"name"in n?e.id===n.id:e.init===n.init:!1}var o=t(1);e.exports=r},function(e,n,t){"use strict";function r(e){return this instanceof r?void(this.value=e):new r(e)}var o=t(58);e.exports=r,r.prototype.hook=function(e,n){var t=o(e),r=n.substr(3);t[r]=this.value},r.prototype.unhook=function(e,n){var t=o(e),r=n.substr(3);t[r]=void 0}},function(e,n){"use strict";function t(e){return this instanceof t?void(this.value=e):new t(e)}e.exports=t,t.prototype.hook=function(e,n){e[n]!==this.value&&(e[n]=this.value)}},function(e,n,t){"use strict";function r(e,n,t){var r,u,s,c,f=[];return!t&&a(n)&&(t=n,u={}),u=u||n||{},r=m(e,u),u.hasOwnProperty("key")&&(s=u.key,u.key=void 0),u.hasOwnProperty("namespace")&&(c=u.namespace,u.namespace=void 0),"INPUT"!==r||c||!u.hasOwnProperty("value")||void 0===u.value||y(u.value)||(u.value=w(u.value)),i(u),void 0!==t&&null!==t&&o(t,f,r,u),new l(r,u,f,s,c)}function o(e,n,t,r){if("string"==typeof e)n.push(new p(e));else if("number"==typeof e)n.push(new p(String(e)));else if(u(e))n.push(e);else{if(!f(e)){if(null===e||void 0===e)return;throw s({foreignObject:e,parentVnode:{tagName:t,properties:r}})}for(var i=0;i<e.length;i++)o(e[i],n,t,r)}}function i(e){for(var n in e)if(e.hasOwnProperty(n)){var t=e[n];if(y(t))continue;"ev-"===n.substr(0,3)&&(e[n]=x(t))}}function u(e){return h(e)||v(e)||d(e)||g(e)}function a(e){return"string"==typeof e||f(e)||u(e)}function s(e){var n=new Error;return n.type="virtual-hyperscript.unexpected.virtual-element",n.message="Unexpected virtual child passed to h().\nExpected a VNode / Vthunk / VWidget / string but:\ngot:\n"+c(e.foreignObject)+".\nThe parent vnode is:\n"+c(e.parentVnode),n.foreignObject=e.foreignObject,n.parentVnode=e.parentVnode,n}function c(e){try{return JSON.stringify(e,null,"    ")}catch(n){return String(e)}}var f=t(12),l=t(70),p=t(71),h=t(3),v=t(7),d=t(1),y=t(6),g=t(5),m=t(69),w=t(67),x=t(66);e.exports=r},function(e,n,t){"use strict";function r(e,n){if(!e)return"DIV";var t=!n.hasOwnProperty("id"),r=o(e,i),a=null;u.test(r[1])&&(a="DIV");var s,c,f,l;for(l=0;l<r.length;l++)c=r[l],c&&(f=c.charAt(0),a?"."===f?(s=s||[],s.push(c.substring(1,c.length))):"#"===f&&t&&(n.id=c.substring(1,c.length)):a=c);return s&&(n.className&&s.push(n.className),n.className=s.join(" ")),n.namespace?a:a.toUpperCase()}var o=t(57),i=/([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/,u=/^\.|#/;e.exports=r},function(e,n,t){function r(e,n,t,r,o){this.tagName=e,this.properties=n||c,this.children=t||f,this.key=null!=r?String(r):void 0,this.namespace="string"==typeof o?o:null;var l,p=t&&t.length||0,h=0,v=!1,d=!1,y=!1;for(var g in n)if(n.hasOwnProperty(g)){var m=n[g];s(m)&&m.unhook&&(l||(l={}),l[g]=m)}for(var w=0;p>w;w++){var x=t[w];i(x)?(h+=x.count||0,!v&&x.hasWidgets&&(v=!0),!d&&x.hasThunks&&(d=!0),y||!x.hooks&&!x.descendantHooks||(y=!0)):!v&&u(x)?"function"==typeof x.destroy&&(v=!0):!d&&a(x)&&(d=!0)}this.count=p+h,this.hasWidgets=v,this.hasThunks=d,this.hooks=l,this.descendantHooks=y}var o=t(4),i=t(3),u=t(1),a=t(5),s=t(6);e.exports=r;var c={},f=[];r.prototype.version=o,r.prototype.type="VirtualNode"},function(e,n,t){function r(e){this.text=String(e)}var o=t(4);e.exports=r,r.prototype.version=o,r.prototype.type="VirtualText"},function(e,n,t){function r(e,n){var t;for(var a in e){a in n||(t=t||{},t[a]=void 0);var s=e[a],c=n[a];if(s!==c)if(i(s)&&i(c))if(o(c)!==o(s))t=t||{},t[a]=c;else if(u(c))t=t||{},t[a]=c;else{var f=r(s,c);f&&(t=t||{},t[a]=f)}else t=t||{},t[a]=c}for(var l in n)l in e||(t=t||{},t[l]=n[l]);return t}function o(e){return Object.getPrototypeOf?Object.getPrototypeOf(e):e.__proto__?e.__proto__:e.constructor?e.constructor.prototype:void 0}var i=t(20),u=t(6);e.exports=r},function(e,n,t){function r(e,n){var t={a:e};return o(e,n,t,0),t}function o(e,n,t,r){if(e!==n){var o=t[r],a=!1;if(k(e)||k(n))s(e,n,t,r);else if(null==n)x(e)||(u(e,t,r),o=t[r]),o=d(o,new g(g.REMOVE,e,n));else if(m(n))if(m(e))if(e.tagName===n.tagName&&e.namespace===n.namespace&&e.key===n.key){var c=E(e.properties,n.properties);c&&(o=d(o,new g(g.PROPS,e,c))),o=i(e,n,t,o,r)}else o=d(o,new g(g.VNODE,e,n)),a=!0;else o=d(o,new g(g.VNODE,e,n)),a=!0;else w(n)?w(e)?e.text!==n.text&&(o=d(o,new g(g.VTEXT,e,n))):(o=d(o,new g(g.VTEXT,e,n)),a=!0):x(n)&&(x(e)||(a=!0),o=d(o,new g(g.WIDGET,e,n)));o&&(t[r]=o),a&&u(e,t,r)}}function i(e,n,t,r,i){for(var u=e.children,a=p(u,n.children),s=a.children,c=u.length,f=s.length,l=c>f?c:f,h=0;l>h;h++){var v=u[h],y=s[h];i+=1,v?o(v,y,t,i):y&&(r=d(r,new g(g.INSERT,null,y))),m(v)&&v.count&&(i+=v.count)}return a.moves&&(r=d(r,new g(g.ORDER,e,a.moves))),r}function u(e,n,t){f(e,n,t),a(e,n,t)}function a(e,n,t){if(x(e))"function"==typeof e.destroy&&(n[t]=d(n[t],new g(g.REMOVE,e,null)));else if(m(e)&&(e.hasWidgets||e.hasThunks))for(var r=e.children,o=r.length,i=0;o>i;i++){var u=r[i];t+=1,a(u,n,t),m(u)&&u.count&&(t+=u.count)}else k(e)&&s(e,null,n,t)}function s(e,n,t,o){var i=O(e,n),u=r(i.a,i.b);c(u)&&(t[o]=new g(g.THUNK,null,u))}function c(e){for(var n in e)if("a"!==n)return!0;return!1}function f(e,n,t){if(m(e)){if(e.hooks&&(n[t]=d(n[t],new g(g.PROPS,e,l(e.hooks)))),e.descendantHooks||e.hasThunks)for(var r=e.children,o=r.length,i=0;o>i;i++){var u=r[i];t+=1,f(u,n,t),m(u)&&u.count&&(t+=u.count)}}else k(e)&&s(e,null,n,t)}function l(e){var n={};for(var t in e)n[t]=void 0;return n}function p(e,n){var t=v(n),r=t.keys,o=t.free;if(o.length===n.length)return{children:n,moves:null};var i=v(e),u=i.keys,a=i.free;if(a.length===e.length)return{children:n,moves:null};for(var s=[],c=0,f=o.length,l=0,p=0;p<e.length;p++){var d,y=e[p];y.key?r.hasOwnProperty(y.key)?(d=r[y.key],s.push(n[d])):(d=p-l++,s.push(null)):f>c?(d=o[c++],s.push(n[d])):(d=p-l++,s.push(null))}for(var g=c>=o.length?n.length:o[c],m=0;m<n.length;m++){var w=n[m];w.key?u.hasOwnProperty(w.key)||s.push(w):m>=g&&s.push(w)}for(var x,k=s.slice(),O=0,E=[],b=[],N=0;N<n.length;){var T=n[N];for(x=k[O];null===x&&k.length;)E.push(h(k,O,null)),x=k[O];x&&x.key===T.key?(O++,N++):T.key?(x&&x.key&&r[x.key]!==N+1?(E.push(h(k,O,x.key)),x=k[O],x&&x.key===T.key?O++:b.push({key:T.key,to:N})):b.push({key:T.key,to:N}),N++):x&&x.key&&E.push(h(k,O,x.key))}for(;O<k.length;)x=k[O],E.push(h(k,O,x&&x.key));return E.length!==l||b.length?{children:s,moves:{removes:E,inserts:b}}:{children:s,moves:null}}function h(e,n,t){return e.splice(n,1),{from:n,key:t}}function v(e){for(var n={},t=[],r=e.length,o=0;r>o;o++){var i=e[o];i.key?n[i.key]=o:t.push(o)}return{keys:n,free:t}}function d(e,n){return e?(y(e)?e.push(n):e=[e,n],e):n}var y=t(12),g=t(24),m=t(3),w=t(7),x=t(1),k=t(5),O=t(23),E=t(72);e.exports=r},function(e,n){}])});