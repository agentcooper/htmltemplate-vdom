(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["clientRuntime"] = factory();
	else
		root["clientRuntime"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var mainLoop = __webpack_require__(1);
	
	module.exports = {
	    createVdom: __webpack_require__(9),
	
	    loop: function loop(state, render) {
	        var loop = mainLoop(state, render, {
	            create: __webpack_require__(35),
	            diff: __webpack_require__(42),
	            patch: __webpack_require__(46)
	        });
	
	        return loop;
	    }
	};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var raf = __webpack_require__(2)
	var TypedError = __webpack_require__(5)
	
	var InvalidUpdateInRender = TypedError({
	    type: "main-loop.invalid.update.in-render",
	    message: "main-loop: Unexpected update occurred in loop.\n" +
	        "We are currently rendering a view, " +
	            "you can't change state right now.\n" +
	        "The diff is: {stringDiff}.\n" +
	        "SUGGESTED FIX: find the state mutation in your view " +
	            "or rendering function and remove it.\n" +
	        "The view should not have any side effects.\n",
	    diff: null,
	    stringDiff: null
	})
	
	module.exports = main
	
	function main(initialState, view, opts) {
	    opts = opts || {}
	
	    var currentState = initialState
	    var create = opts.create
	    var diff = opts.diff
	    var patch = opts.patch
	    var redrawScheduled = false
	
	    var tree = opts.initialTree || view(currentState)
	    var target = opts.target || create(tree, opts)
	    var inRenderingTransaction = false
	
	    currentState = null
	
	    return {
	        target: target,
	        update: update
	    }
	
	    function update(state) {
	        if (inRenderingTransaction) {
	            throw InvalidUpdateInRender({
	                diff: state._diff,
	                stringDiff: JSON.stringify(state._diff)
	            })
	        }
	
	        if (currentState === null && !redrawScheduled) {
	            redrawScheduled = true
	            raf(redraw)
	        }
	
	        currentState = state
	    }
	
	    function redraw() {
	        redrawScheduled = false;
	        if (currentState === null) {
	            return
	        }
	
	        inRenderingTransaction = true
	        var newTree = view(currentState)
	
	        if (opts.createOnly) {
	            inRenderingTransaction = false
	            create(newTree, opts)
	        } else {
	            var patches = diff(tree, newTree, opts)
	            inRenderingTransaction = false
	            target = patch(target, patches, opts)
	        }
	
	        tree = newTree
	        currentState = null
	    }
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var now = __webpack_require__(3)
	  , global = typeof window === 'undefined' ? {} : window
	  , vendors = ['moz', 'webkit']
	  , suffix = 'AnimationFrame'
	  , raf = global['request' + suffix]
	  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]
	  , isNative = true
	
	for(var i = 0; i < vendors.length && !raf; i++) {
	  raf = global[vendors[i] + 'Request' + suffix]
	  caf = global[vendors[i] + 'Cancel' + suffix]
	      || global[vendors[i] + 'CancelRequest' + suffix]
	}
	
	// Some versions of FF have rAF but not cAF
	if(!raf || !caf) {
	  isNative = false
	
	  var last = 0
	    , id = 0
	    , queue = []
	    , frameDuration = 1000 / 60
	
	  raf = function(callback) {
	    if(queue.length === 0) {
	      var _now = now()
	        , next = Math.max(0, frameDuration - (_now - last))
	      last = next + _now
	      setTimeout(function() {
	        var cp = queue.slice(0)
	        // Clear queue here to prevent
	        // callbacks from appending listeners
	        // to the current frame's queue
	        queue.length = 0
	        for(var i = 0; i < cp.length; i++) {
	          if(!cp[i].cancelled) {
	            try{
	              cp[i].callback(last)
	            } catch(e) {
	              setTimeout(function() { throw e }, 0)
	            }
	          }
	        }
	      }, Math.round(next))
	    }
	    queue.push({
	      handle: ++id,
	      callback: callback,
	      cancelled: false
	    })
	    return id
	  }
	
	  caf = function(handle) {
	    for(var i = 0; i < queue.length; i++) {
	      if(queue[i].handle === handle) {
	        queue[i].cancelled = true
	      }
	    }
	  }
	}
	
	module.exports = function(fn) {
	  // Wrap in a new function to prevent
	  // `cancel` potentially being assigned
	  // to the native rAF function
	  if(!isNative) {
	    return raf.call(global, fn)
	  }
	  return raf.call(global, function() {
	    try{
	      fn.apply(this, arguments)
	    } catch(e) {
	      setTimeout(function() { throw e }, 0)
	    }
	  })
	}
	module.exports.cancel = function() {
	  caf.apply(global, arguments)
	}


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Generated by CoffeeScript 1.6.3
	(function() {
	  var getNanoSeconds, hrtime, loadTime;
	
	  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
	    module.exports = function() {
	      return performance.now();
	    };
	  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
	    module.exports = function() {
	      return (getNanoSeconds() - loadTime) / 1e6;
	    };
	    hrtime = process.hrtime;
	    getNanoSeconds = function() {
	      var hr;
	      hr = hrtime();
	      return hr[0] * 1e9 + hr[1];
	    };
	    loadTime = getNanoSeconds();
	  } else if (Date.now) {
	    module.exports = function() {
	      return Date.now() - loadTime;
	    };
	    loadTime = Date.now();
	  } else {
	    module.exports = function() {
	      return new Date().getTime() - loadTime;
	    };
	    loadTime = new Date().getTime();
	  }
	
	}).call(this);
	
	/*
	//@ sourceMappingURL=performance-now.map
	*/
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ },
/* 4 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            currentQueue[queueIndex].run();
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var camelize = __webpack_require__(6)
	var template = __webpack_require__(7)
	var extend = __webpack_require__(8)
	
	module.exports = TypedError
	
	function TypedError(args) {
	    if (!args) {
	        throw new Error("args is required");
	    }
	    if (!args.type) {
	        throw new Error("args.type is required");
	    }
	    if (!args.message) {
	        throw new Error("args.message is required");
	    }
	
	    var message = args.message
	
	    if (args.type && !args.name) {
	        var errorName = camelize(args.type) + "Error"
	        args.name = errorName[0].toUpperCase() + errorName.substr(1)
	    }
	
	    extend(createError, args);
	    createError._name = args.name;
	
	    return createError;
	
	    function createError(opts) {
	        var result = new Error()
	
	        Object.defineProperty(result, "type", {
	            value: result.type,
	            enumerable: true,
	            writable: true,
	            configurable: true
	        })
	
	        var options = extend({}, args, opts)
	
	        extend(result, options)
	        result.message = template(message, options)
	
	        return result
	    }
	}
	


/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = function(obj) {
	    if (typeof obj === 'string') return camelCase(obj);
	    return walk(obj);
	};
	
	function walk (obj) {
	    if (!obj || typeof obj !== 'object') return obj;
	    if (isDate(obj) || isRegex(obj)) return obj;
	    if (isArray(obj)) return map(obj, walk);
	    return reduce(objectKeys(obj), function (acc, key) {
	        var camel = camelCase(key);
	        acc[camel] = walk(obj[key]);
	        return acc;
	    }, {});
	}
	
	function camelCase(str) {
	    return str.replace(/[_.-](\w|$)/g, function (_,x) {
	        return x.toUpperCase();
	    });
	}
	
	var isArray = Array.isArray || function (obj) {
	    return Object.prototype.toString.call(obj) === '[object Array]';
	};
	
	var isDate = function (obj) {
	    return Object.prototype.toString.call(obj) === '[object Date]';
	};
	
	var isRegex = function (obj) {
	    return Object.prototype.toString.call(obj) === '[object RegExp]';
	};
	
	var has = Object.prototype.hasOwnProperty;
	var objectKeys = Object.keys || function (obj) {
	    var keys = [];
	    for (var key in obj) {
	        if (has.call(obj, key)) keys.push(key);
	    }
	    return keys;
	};
	
	function map (xs, f) {
	    if (xs.map) return xs.map(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        res.push(f(xs[i], i));
	    }
	    return res;
	}
	
	function reduce (xs, f, acc) {
	    if (xs.reduce) return xs.reduce(f, acc);
	    for (var i = 0; i < xs.length; i++) {
	        acc = f(acc, xs[i], i);
	    }
	    return acc;
	}


/***/ },
/* 7 */
/***/ function(module, exports) {

	var nargs = /\{([0-9a-zA-Z]+)\}/g
	var slice = Array.prototype.slice
	
	module.exports = template
	
	function template(string) {
	    var args
	
	    if (arguments.length === 2 && typeof arguments[1] === "object") {
	        args = arguments[1]
	    } else {
	        args = slice.call(arguments, 1)
	    }
	
	    if (!args || !args.hasOwnProperty) {
	        args = {}
	    }
	
	    return string.replace(nargs, function replaceArg(match, i, index) {
	        var result
	
	        if (string[index - 1] === "{" &&
	            string[index + match.length] === "}") {
	            return i
	        } else {
	            result = args.hasOwnProperty(i) ? args[i] : null
	            if (result === null || result === undefined) {
	                return ""
	            }
	
	            return result
	        }
	    })
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = extend
	
	function extend(target) {
	    for (var i = 1; i < arguments.length; i++) {
	        var source = arguments[i]
	
	        for (var key in source) {
	            if (source.hasOwnProperty(key)) {
	                target[key] = source[key]
	            }
	        }
	    }
	
	    return target
	}


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	// var parser = require('pegjs').buildParser(
	//     require('fs').readFileSync('tmpl-html.pegjs').toString()
	// );
	
	'use strict';
	
	var parser = __webpack_require__(10);
	
	var flatten = __webpack_require__(11);;
	
	var traverse = __webpack_require__(16);
	
	var h = __webpack_require__(17);
	
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
	
	        var result = flatten(traverse(parser.parse(value)).map(handler)).join('');
	
	        return result;
	    }
	
	    function handler() {
	        if (!this.node) {
	            return;
	        }
	
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
	
	            return this.update(value ? ifTrue : ifFalse, false);
	        }
	
	        if (this.node.type === 'Tag' && this.node.name === 'TMPL_LOOP') {
	            var propertyName = this.node.attributes[0].name;
	
	            return this.update(h('div', {}, lookupValue(propertyName).map((function (item, index, arr) {
	                lookupChain.push(item);
	
	                var c = this.node.content && traverse(this.node.content).map(handler);
	
	                lookupChain.pop();
	
	                return c;
	            }).bind(this))), true);
	        }
	
	        if (this.node.type === 'Tag' && this.node.name === 'TMPL_VAR') {
	            var propertyName = this.node.attributes[0].name;
	
	            return this.update(lookupValue(propertyName));
	        }
	
	        if (this.node.type === 'Tag') {
	            var attrs = this.node.attributes.reduce(function (hash, item) {
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
	
	            return this.update(h(this.node.name, attrs, traverse(this.node.content).map(handler)), true);
	        }
	    }
	
	    var output = traverse(ast).map(handler);
	
	    return h('div', {}, output);
	}
	
	module.exports = createVdom;

/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = (function () {
	  /*
	   * Generated by PEG.js 0.8.0.
	   *
	   * http://pegjs.majda.cz/
	   */
	
	  function peg$subclass(child, parent) {
	    function ctor() {
	      this.constructor = child;
	    }
	    ctor.prototype = parent.prototype;
	    child.prototype = new ctor();
	  }
	
	  function SyntaxError(message, expected, found, offset, line, column) {
	    this.message = message;
	    this.expected = expected;
	    this.found = found;
	    this.offset = offset;
	    this.line = line;
	    this.column = column;
	
	    this.name = "SyntaxError";
	  }
	
	  peg$subclass(SyntaxError, Error);
	
	  function parse(input) {
	    var options = arguments.length > 1 ? arguments[1] : {},
	        peg$FAILED = {},
	        peg$startRuleFunctions = { Content: peg$parseContent },
	        peg$startRuleFunction = peg$parseContent,
	        peg$c0 = [],
	        peg$c1 = peg$FAILED,
	        peg$c2 = void 0,
	        peg$c3 = function peg$c3(name, attributes) {
	      return token({
	        type: BLOCK_TYPES.TAG,
	        name: name,
	        attributes: attributes
	      }, line, column);
	    },
	        peg$c4 = function peg$c4(start, content, end) {
	      if (start.name != end) {
	        throw syntaxError("Expected a </" + start.name + "> but </" + end + "> found.", offset, line, column);
	      }
	
	      return token({
	        type: BLOCK_TYPES.TAG,
	        name: start.name,
	        attributes: start.attributes,
	        content: content
	      }, line, column);
	    },
	        peg$c5 = null,
	        peg$c6 = function peg$c6(start, content, elsif, otherwise, end) {
	      if (start.name != end) {
	        throw syntaxError("Expected a </" + start.name + "> but </" + end + "> found.", offset, line, column);
	      }
	
	      var primaryCondition = token({
	        type: BLOCK_TYPES.CONDITION_BRANCH,
	        condition: start.condition,
	        content: content
	      }, line, column);
	
	      var conditions = [primaryCondition].concat(elsif);
	
	      return token({
	        type: BLOCK_TYPES.CONDITION,
	        name: start.name,
	        conditions: conditions,
	        otherwise: otherwise
	      }, line, column);
	    },
	        peg$c7 = function peg$c7(name, attributes) {
	      return token({
	        type: BLOCK_TYPES.INVALID_TAG,
	        name: name,
	        attributes: attributes
	      }, line, column);
	    },
	        peg$c8 = function peg$c8(condition, content) {
	      return token({
	        type: BLOCK_TYPES.CONDITION_BRANCH,
	        condition: condition,
	        content: content
	      }, line, column);
	    },
	        peg$c9 = function peg$c9(content) {
	      return token({
	        type: BLOCK_TYPES.ALTERNATE_CONDITION_BRANCH,
	        content: content
	      }, line, column);
	    },
	        peg$c10 = function peg$c10(text) {
	      return token({
	        type: BLOCK_TYPES.TEXT,
	        content: text
	      }, line, column);
	    },
	        peg$c11 = function peg$c11(name, attributes) {
	      return {
	        name: name,
	        attributes: attributes
	      };
	    },
	        peg$c12 = function peg$c12(name) {
	      return name;
	    },
	        peg$c13 = function peg$c13(name, condition) {
	      return {
	        name: name,
	        condition: condition[0] || null
	      };
	    },
	        peg$c14 = function peg$c14(condition) {
	      return condition[0] || null;
	    },
	        peg$c15 = function peg$c15(c) {
	      return token({
	        type: BLOCK_TYPES.COMMENT,
	        content: c
	      }, line, column);
	    },
	        peg$c16 = function peg$c16(c) {
	      return token({
	        type: BLOCK_TYPES.COMMENT,
	        content: c
	      }, line, COLUMN_ONE);
	    },
	        peg$c17 = function peg$c17(content) {
	      return token({
	        type: BLOCK_TYPES.COMMENT,
	        content: content
	      }, line, column);
	    },
	        peg$c18 = function peg$c18(attrs) {
	      return attrs;
	    },
	        peg$c19 = function peg$c19(expression) {
	      return expression;
	    },
	        peg$c20 = function peg$c20(expression) {
	      return token({
	        type: ATTRIBUTE_TYPES.EXPRESSION,
	        value: expression
	      }, line, column);
	    },
	        peg$c21 = "=",
	        peg$c22 = { type: "literal", value: "=", description: "\"=\"" },
	        peg$c23 = function peg$c23(name, value) {
	      return token({
	        type: ATTRIBUTE_TYPES.PAIR,
	        name: name,
	        value: value
	      }, line, column);
	    },
	        peg$c24 = function peg$c24(name) {
	      return token({
	        type: ATTRIBUTE_TYPES.SINGLE,
	        name: name,
	        value: null
	      }, line, column);
	    },
	        peg$c25 = /^[a-zA-Z0-9\-_\/:.{}$]/,
	        peg$c26 = { type: "class", value: "[a-zA-Z0-9\\-_\\/:.{}$]", description: "[a-zA-Z0-9\\-_\\/:.{}$]" },
	        peg$c27 = function peg$c27(n) {
	      if (n.indexOf("$") > 0) {
	        throw syntaxError("Unexpected $ in attribute name.", offset, line, column);
	      }
	
	      return n;
	    },
	        peg$c28 = "'",
	        peg$c29 = { type: "literal", value: "'", description: "\"'\"" },
	        peg$c30 = function peg$c30(chars) {
	      return join(chars);
	    },
	        peg$c31 = "\"",
	        peg$c32 = { type: "literal", value: "\"", description: "\"\\\"\"" },
	        peg$c33 = "TMPL_",
	        peg$c34 = { type: "literal", value: "TMPL_", description: "\"TMPL_\"" },
	        peg$c35 = "TMPL_INCLUDE",
	        peg$c36 = { type: "literal", value: "TMPL_INCLUDE", description: "\"TMPL_INCLUDE\"" },
	        peg$c37 = "TMPL_VAR",
	        peg$c38 = { type: "literal", value: "TMPL_VAR", description: "\"TMPL_VAR\"" },
	        peg$c39 = "TMPL_V",
	        peg$c40 = { type: "literal", value: "TMPL_V", description: "\"TMPL_V\"" },
	        peg$c41 = "TMPL_BLOCK",
	        peg$c42 = { type: "literal", value: "TMPL_BLOCK", description: "\"TMPL_BLOCK\"" },
	        peg$c43 = "TMPL_FOR",
	        peg$c44 = { type: "literal", value: "TMPL_FOR", description: "\"TMPL_FOR\"" },
	        peg$c45 = "TMPL_LOOP",
	        peg$c46 = { type: "literal", value: "TMPL_LOOP", description: "\"TMPL_LOOP\"" },
	        peg$c47 = "TMPL_SETVAR",
	        peg$c48 = { type: "literal", value: "TMPL_SETVAR", description: "\"TMPL_SETVAR\"" },
	        peg$c49 = "TMPL_WITH",
	        peg$c50 = { type: "literal", value: "TMPL_WITH", description: "\"TMPL_WITH\"" },
	        peg$c51 = "TMPL_WS",
	        peg$c52 = { type: "literal", value: "TMPL_WS", description: "\"TMPL_WS\"" },
	        peg$c53 = "TMPL_IF",
	        peg$c54 = { type: "literal", value: "TMPL_IF", description: "\"TMPL_IF\"" },
	        peg$c55 = "TMPL_UNLESS",
	        peg$c56 = { type: "literal", value: "TMPL_UNLESS", description: "\"TMPL_UNLESS\"" },
	        peg$c57 = "TMPL_ELSIF",
	        peg$c58 = { type: "literal", value: "TMPL_ELSIF", description: "\"TMPL_ELSIF\"" },
	        peg$c59 = "TMPL_ELSE",
	        peg$c60 = { type: "literal", value: "TMPL_ELSE", description: "\"TMPL_ELSE\"" },
	        peg$c61 = "TMPL_COMMENT",
	        peg$c62 = { type: "literal", value: "TMPL_COMMENT", description: "\"TMPL_COMMENT\"" },
	        peg$c63 = { type: "other", description: "whitespace control character" },
	        peg$c64 = "-",
	        peg$c65 = { type: "literal", value: "-", description: "\"-\"" },
	        peg$c66 = "~.",
	        peg$c67 = { type: "literal", value: "~.", description: "\"~.\"" },
	        peg$c68 = "~|",
	        peg$c69 = { type: "literal", value: "~|", description: "\"~|\"" },
	        peg$c70 = "~",
	        peg$c71 = { type: "literal", value: "~", description: "\"~\"" },
	        peg$c72 = ".~",
	        peg$c73 = { type: "literal", value: ".~", description: "\".~\"" },
	        peg$c74 = "|~",
	        peg$c75 = { type: "literal", value: "|~", description: "\"|~\"" },
	        peg$c76 = /^[a-zA-Z_]/,
	        peg$c77 = { type: "class", value: "[a-zA-Z_]", description: "[a-zA-Z_]" },
	        peg$c78 = { type: "other", description: "whitespace" },
	        peg$c79 = "\t",
	        peg$c80 = { type: "literal", value: "\t", description: "\"\\t\"" },
	        peg$c81 = "\x0B",
	        peg$c82 = { type: "literal", value: "\x0B", description: "\"\\x0B\"" },
	        peg$c83 = "\f",
	        peg$c84 = { type: "literal", value: "\f", description: "\"\\f\"" },
	        peg$c85 = " ",
	        peg$c86 = { type: "literal", value: " ", description: "\" \"" },
	        peg$c87 = "\xA0",
	        peg$c88 = { type: "literal", value: "\xA0", description: "\"\\xA0\"" },
	        peg$c89 = "﻿",
	        peg$c90 = { type: "literal", value: "﻿", description: "\"\\uFEFF\"" },
	        peg$c91 = /^[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/,
	        peg$c92 = { type: "class", value: "[ \\xA0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000]", description: "[ \\xA0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000]" },
	        peg$c93 = "#",
	        peg$c94 = { type: "literal", value: "#", description: "\"#\"" },
	        peg$c95 = "##",
	        peg$c96 = { type: "literal", value: "##", description: "\"##\"" },
	        peg$c97 = { type: "any", description: "any character" },
	        peg$c98 = { type: "other", description: "end of line" },
	        peg$c99 = "\n",
	        peg$c100 = { type: "literal", value: "\n", description: "\"\\n\"" },
	        peg$c101 = "\r\n",
	        peg$c102 = { type: "literal", value: "\r\n", description: "\"\\r\\n\"" },
	        peg$c103 = "\r",
	        peg$c104 = { type: "literal", value: "\r", description: "\"\\r\"" },
	        peg$c105 = "\u2028",
	        peg$c106 = { type: "literal", value: "\u2028", description: "\"\\u2028\"" },
	        peg$c107 = "\u2029",
	        peg$c108 = { type: "literal", value: "\u2029", description: "\"\\u2029\"" },
	        peg$c109 = "<",
	        peg$c110 = { type: "literal", value: "<", description: "\"<\"" },
	        peg$c111 = "/",
	        peg$c112 = { type: "literal", value: "/", description: "\"/\"" },
	        peg$c113 = ">",
	        peg$c114 = { type: "literal", value: ">", description: "\">\"" },
	        peg$c115 = function peg$c115() {
	      throw syntaxError("Expected a closing bracket.", offset, line, column);
	    },
	        peg$c116 = "/>",
	        peg$c117 = { type: "literal", value: "/>", description: "\"/>\"" },
	        peg$c118 = "[%",
	        peg$c119 = { type: "literal", value: "[%", description: "\"[%\"" },
	        peg$c120 = "%]",
	        peg$c121 = { type: "literal", value: "%]", description: "\"%]\"" },
	        peg$c122 = "\\",
	        peg$c123 = { type: "literal", value: "\\", description: "\"\\\\\"" },
	        peg$c124 = function peg$c124() {
	      return text();
	    },
	        peg$c125 = function peg$c125(esc) {
	      return esc;
	    },
	        peg$c126 = "b",
	        peg$c127 = { type: "literal", value: "b", description: "\"b\"" },
	        peg$c128 = function peg$c128() {
	      return "\b";
	    },
	        peg$c129 = "f",
	        peg$c130 = { type: "literal", value: "f", description: "\"f\"" },
	        peg$c131 = function peg$c131() {
	      return "\f";
	    },
	        peg$c132 = "n",
	        peg$c133 = { type: "literal", value: "n", description: "\"n\"" },
	        peg$c134 = function peg$c134() {
	      return "\n";
	    },
	        peg$c135 = "r",
	        peg$c136 = { type: "literal", value: "r", description: "\"r\"" },
	        peg$c137 = function peg$c137() {
	      return "\r";
	    },
	        peg$c138 = "t",
	        peg$c139 = { type: "literal", value: "t", description: "\"t\"" },
	        peg$c140 = function peg$c140() {
	      return "\t";
	    },
	        peg$c141 = "v",
	        peg$c142 = { type: "literal", value: "v", description: "\"v\"" },
	        peg$c143 = function peg$c143() {
	      return "\v";
	    },
	        peg$c144 = function peg$c144(name, attributes) {
	      return {
	        name: name,
	        attributes: attributes
	      };
	    },
	        peg$c145 = "</",
	        peg$c146 = { type: "literal", value: "</", description: "\"</\"" },
	        peg$c147 = function peg$c147(name) {
	      return name;
	    },
	        peg$c148 = /^[a-zA-Z0-9]/,
	        peg$c149 = { type: "class", value: "[a-zA-Z0-9]", description: "[a-zA-Z0-9]" },
	        peg$c150 = function peg$c150(chars) {
	      return chars.join("");
	    },
	        peg$currPos = 0,
	        peg$reportedPos = 0,
	        peg$cachedPos = 0,
	        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
	        peg$maxFailPos = 0,
	        peg$maxFailExpected = [],
	        peg$silentFails = 0,
	        peg$result;
	
	    if ("startRule" in options) {
	      if (!(options.startRule in peg$startRuleFunctions)) {
	        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
	      }
	
	      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
	    }
	
	    function text() {
	      return input.substring(peg$reportedPos, peg$currPos);
	    }
	
	    function offset() {
	      return peg$reportedPos;
	    }
	
	    function line() {
	      return peg$computePosDetails(peg$reportedPos).line;
	    }
	
	    function column() {
	      return peg$computePosDetails(peg$reportedPos).column;
	    }
	
	    function expected(description) {
	      throw peg$buildException(null, [{ type: "other", description: description }], peg$reportedPos);
	    }
	
	    function error(message) {
	      throw peg$buildException(message, null, peg$reportedPos);
	    }
	
	    function peg$computePosDetails(pos) {
	      function advance(details, startPos, endPos) {
	        var p, ch;
	
	        for (p = startPos; p < endPos; p++) {
	          ch = input.charAt(p);
	          if (ch === "\n") {
	            if (!details.seenCR) {
	              details.line++;
	            }
	            details.column = 1;
	            details.seenCR = false;
	          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
	            details.line++;
	            details.column = 1;
	            details.seenCR = true;
	          } else {
	            details.column++;
	            details.seenCR = false;
	          }
	        }
	      }
	
	      if (peg$cachedPos !== pos) {
	        if (peg$cachedPos > pos) {
	          peg$cachedPos = 0;
	          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
	        }
	        advance(peg$cachedPosDetails, peg$cachedPos, pos);
	        peg$cachedPos = pos;
	      }
	
	      return peg$cachedPosDetails;
	    }
	
	    function peg$fail(expected) {
	      if (peg$currPos < peg$maxFailPos) {
	        return;
	      }
	
	      if (peg$currPos > peg$maxFailPos) {
	        peg$maxFailPos = peg$currPos;
	        peg$maxFailExpected = [];
	      }
	
	      peg$maxFailExpected.push(expected);
	    }
	
	    function peg$buildException(message, expected, pos) {
	      function cleanupExpected(expected) {
	        var i = 1;
	
	        expected.sort(function (a, b) {
	          if (a.description < b.description) {
	            return -1;
	          } else if (a.description > b.description) {
	            return 1;
	          } else {
	            return 0;
	          }
	        });
	
	        while (i < expected.length) {
	          if (expected[i - 1] === expected[i]) {
	            expected.splice(i, 1);
	          } else {
	            i++;
	          }
	        }
	      }
	
	      function buildMessage(expected, found) {
	        function stringEscape(s) {
	          function hex(ch) {
	            return ch.charCodeAt(0).toString(16).toUpperCase();
	          }
	
	          return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\x08/g, '\\b').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\f/g, '\\f').replace(/\r/g, '\\r').replace(/[\x00-\x07\x0B\x0E\x0F]/g, function (ch) {
	            return '\\x0' + hex(ch);
	          }).replace(/[\x10-\x1F\x80-\xFF]/g, function (ch) {
	            return '\\x' + hex(ch);
	          }).replace(/[\u0180-\u0FFF]/g, function (ch) {
	            return "\\u0" + hex(ch);
	          }).replace(/[\u1080-\uFFFF]/g, function (ch) {
	            return "\\u" + hex(ch);
	          });
	        }
	
	        var expectedDescs = new Array(expected.length),
	            expectedDesc,
	            foundDesc,
	            i;
	
	        for (i = 0; i < expected.length; i++) {
	          expectedDescs[i] = expected[i].description;
	        }
	
	        expectedDesc = expected.length > 1 ? expectedDescs.slice(0, -1).join(", ") + " or " + expectedDescs[expected.length - 1] : expectedDescs[0];
	
	        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";
	
	        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
	      }
	
	      var posDetails = peg$computePosDetails(pos),
	          found = pos < input.length ? input.charAt(pos) : null;
	
	      if (expected !== null) {
	        cleanupExpected(expected);
	      }
	
	      return new SyntaxError(message !== null ? message : buildMessage(expected, found), expected, found, pos, posDetails.line, posDetails.column);
	    }
	
	    function peg$parseContent() {
	      var s0, s1;
	
	      s0 = [];
	      s1 = peg$parseComment();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parseConditionalTag();
	        if (s1 === peg$FAILED) {
	          s1 = peg$parseBlockTag();
	          if (s1 === peg$FAILED) {
	            s1 = peg$parseSingleTag();
	            if (s1 === peg$FAILED) {
	              s1 = peg$parseBlockHtmlTag();
	              if (s1 === peg$FAILED) {
	                s1 = peg$parseSingleHtmlTag();
	                if (s1 === peg$FAILED) {
	                  s1 = peg$parseInvalidTag();
	                  if (s1 === peg$FAILED) {
	                    s1 = peg$parseText();
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	      while (s1 !== peg$FAILED) {
	        s0.push(s1);
	        s1 = peg$parseComment();
	        if (s1 === peg$FAILED) {
	          s1 = peg$parseConditionalTag();
	          if (s1 === peg$FAILED) {
	            s1 = peg$parseBlockTag();
	            if (s1 === peg$FAILED) {
	              s1 = peg$parseSingleTag();
	              if (s1 === peg$FAILED) {
	                s1 = peg$parseBlockHtmlTag();
	                if (s1 === peg$FAILED) {
	                  s1 = peg$parseSingleHtmlTag();
	                  if (s1 === peg$FAILED) {
	                    s1 = peg$parseInvalidTag();
	                    if (s1 === peg$FAILED) {
	                      s1 = peg$parseText();
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseComment() {
	      var s0;
	
	      s0 = peg$parseCommentTag();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseFullLineComment();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseSingleLineComment();
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseSingleTag() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$currPos;
	        s4 = peg$parseSingleTagName();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$currPos;
	          peg$silentFails++;
	          s6 = [];
	          s7 = peg$parseTagNameCharacter();
	          if (s7 !== peg$FAILED) {
	            while (s7 !== peg$FAILED) {
	              s6.push(s7);
	              s7 = peg$parseTagNameCharacter();
	            }
	          } else {
	            s6 = peg$c1;
	          }
	          peg$silentFails--;
	          if (s6 === peg$FAILED) {
	            s5 = peg$c2;
	          } else {
	            peg$currPos = s5;
	            s5 = peg$c1;
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$c1;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$c1;
	        }
	        if (s3 !== peg$FAILED) {
	          s3 = input.substring(s2, peg$currPos);
	        }
	        s2 = s3;
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseAttributes();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parseAttributes();
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseClosingBracket();
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c3(s2, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c1;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseSingleHtmlTag() {
	      var s0, s1, s2, s3, s4, s5, s6, s7;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$currPos;
	        s4 = peg$parseHtmlTagName();
	        if (s4 !== peg$FAILED) {
	          s5 = peg$currPos;
	          peg$silentFails++;
	          s6 = [];
	          s7 = peg$parseTagNameCharacter();
	          if (s7 !== peg$FAILED) {
	            while (s7 !== peg$FAILED) {
	              s6.push(s7);
	              s7 = peg$parseTagNameCharacter();
	            }
	          } else {
	            s6 = peg$c1;
	          }
	          peg$silentFails--;
	          if (s6 === peg$FAILED) {
	            s5 = peg$c2;
	          } else {
	            peg$currPos = s5;
	            s5 = peg$c1;
	          }
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$c1;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$c1;
	        }
	        if (s3 !== peg$FAILED) {
	          s3 = input.substring(s2, peg$currPos);
	        }
	        s2 = s3;
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseAttributes();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parseAttributes();
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseSelfClosingBracket();
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c3(s2, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c1;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseBlockTag() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = peg$parseStartTag();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseContent();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseEndTag();
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c4(s1, s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseConditionalTag() {
	      var s0, s1, s2, s3, s4, s5;
	
	      s0 = peg$currPos;
	      s1 = peg$parseConditionStartTag();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseContent();
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseElsIfTag();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parseElsIfTag();
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseElseTag();
	            if (s4 === peg$FAILED) {
	              s4 = peg$c5;
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parseConditionEndTag();
	              if (s5 !== peg$FAILED) {
	                peg$reportedPos = s0;
	                s1 = peg$c6(s1, s2, s3, s4, s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c1;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c1;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseInvalidTag() {
	      var s0, s1, s2, s3, s4;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningEndBracket();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parseOpeningBracket();
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseUnknownTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseAttributes();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parseAttributes();
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseClosingBracket();
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c7(s2, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c1;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseElsIfTag() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      s1 = peg$parseElsIfStartTag();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseContent();
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c8(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseElseTag() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      s1 = peg$parseElseStartTag();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseContent();
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c9(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseNonText() {
	      var s0;
	
	      s0 = peg$parseComment();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseSingleTag();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseStartTag();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseEndTag();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseConditionStartTag();
	              if (s0 === peg$FAILED) {
	                s0 = peg$parseElsIfStartTag();
	                if (s0 === peg$FAILED) {
	                  s0 = peg$parseElseStartTag();
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$parseConditionEndTag();
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$parseInvalidTag();
	                      if (s0 === peg$FAILED) {
	                        s0 = peg$parseStartHtmlTag();
	                        if (s0 === peg$FAILED) {
	                          s0 = peg$parseEndHtmlTag();
	                        }
	                      }
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseText() {
	      var s0, s1, s2, s3, s4, s5;
	
	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = [];
	      s3 = peg$currPos;
	      s4 = peg$currPos;
	      peg$silentFails++;
	      s5 = peg$parseNonText();
	      peg$silentFails--;
	      if (s5 === peg$FAILED) {
	        s4 = peg$c2;
	      } else {
	        peg$currPos = s4;
	        s4 = peg$c1;
	      }
	      if (s4 !== peg$FAILED) {
	        s5 = peg$parseSourceCharacter();
	        if (s5 !== peg$FAILED) {
	          s4 = [s4, s5];
	          s3 = s4;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$c1;
	        }
	      } else {
	        peg$currPos = s3;
	        s3 = peg$c1;
	      }
	      if (s3 !== peg$FAILED) {
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          s4 = peg$currPos;
	          peg$silentFails++;
	          s5 = peg$parseNonText();
	          peg$silentFails--;
	          if (s5 === peg$FAILED) {
	            s4 = peg$c2;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c1;
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseSourceCharacter();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$c1;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$c1;
	          }
	        }
	      } else {
	        s2 = peg$c1;
	      }
	      if (s2 !== peg$FAILED) {
	        s2 = input.substring(s1, peg$currPos);
	      }
	      s1 = s2;
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c10(s1);
	      }
	      s0 = s1;
	
	      return s0;
	    }
	
	    function peg$parseStartTag() {
	      var s0, s1, s2, s3, s4;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseBlockTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseAttributes();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parseAttributes();
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseClosingBracket();
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c11(s2, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c1;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseEndTag() {
	      var s0, s1, s2, s3, s4;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningEndBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseBlockTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseAttributes();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parseAttributes();
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseClosingBracket();
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c12(s2);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c1;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseConditionStartTag() {
	      var s0, s1, s2, s3, s4;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseConditionalTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseAttributes();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parseAttributes();
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseClosingBracket();
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c13(s2, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c1;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseElsIfStartTag() {
	      var s0, s1, s2, s3, s4;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseElsIfTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseAttributes();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parseAttributes();
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parseClosingBracket();
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c14(s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c1;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseElseStartTag() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseElseTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseClosingBracket();
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseConditionEndTag() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningEndBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseConditionalTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseClosingBracket();
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c12(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseSingleLineComment() {
	      var s0, s1, s2, s3, s4, s5, s6;
	
	      s0 = peg$currPos;
	      s1 = peg$parseCommentStart();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = [];
	        s4 = peg$currPos;
	        s5 = peg$currPos;
	        peg$silentFails++;
	        s6 = peg$parseLineTerminator();
	        peg$silentFails--;
	        if (s6 === peg$FAILED) {
	          s5 = peg$c2;
	        } else {
	          peg$currPos = s5;
	          s5 = peg$c1;
	        }
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parseSourceCharacter();
	          if (s6 !== peg$FAILED) {
	            s5 = [s5, s6];
	            s4 = s5;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c1;
	          }
	        } else {
	          peg$currPos = s4;
	          s4 = peg$c1;
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          s4 = peg$currPos;
	          s5 = peg$currPos;
	          peg$silentFails++;
	          s6 = peg$parseLineTerminator();
	          peg$silentFails--;
	          if (s6 === peg$FAILED) {
	            s5 = peg$c2;
	          } else {
	            peg$currPos = s5;
	            s5 = peg$c1;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parseSourceCharacter();
	            if (s6 !== peg$FAILED) {
	              s5 = [s5, s6];
	              s4 = s5;
	            } else {
	              peg$currPos = s4;
	              s4 = peg$c1;
	            }
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c1;
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s3 = input.substring(s2, peg$currPos);
	        }
	        s2 = s3;
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c15(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseFullLineComment() {
	      var s0, s1, s2, s3, s4, s5, s6;
	
	      s0 = peg$currPos;
	      s1 = peg$parseFullLineCommentStart();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = [];
	        s4 = peg$currPos;
	        s5 = peg$currPos;
	        peg$silentFails++;
	        s6 = peg$parseLineTerminator();
	        peg$silentFails--;
	        if (s6 === peg$FAILED) {
	          s5 = peg$c2;
	        } else {
	          peg$currPos = s5;
	          s5 = peg$c1;
	        }
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parseSourceCharacter();
	          if (s6 !== peg$FAILED) {
	            s5 = [s5, s6];
	            s4 = s5;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c1;
	          }
	        } else {
	          peg$currPos = s4;
	          s4 = peg$c1;
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          s4 = peg$currPos;
	          s5 = peg$currPos;
	          peg$silentFails++;
	          s6 = peg$parseLineTerminator();
	          peg$silentFails--;
	          if (s6 === peg$FAILED) {
	            s5 = peg$c2;
	          } else {
	            peg$currPos = s5;
	            s5 = peg$c1;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parseSourceCharacter();
	            if (s6 !== peg$FAILED) {
	              s5 = [s5, s6];
	              s4 = s5;
	            } else {
	              peg$currPos = s4;
	              s4 = peg$c1;
	            }
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c1;
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s3 = input.substring(s2, peg$currPos);
	        }
	        s2 = s3;
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c16(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseCommentTag() {
	      var s0, s1, s2, s3, s4, s5, s6;
	
	      s0 = peg$currPos;
	      s1 = peg$parseCommentTagStart();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = [];
	        s4 = peg$currPos;
	        s5 = peg$currPos;
	        peg$silentFails++;
	        s6 = peg$parseCommentTagEnd();
	        peg$silentFails--;
	        if (s6 === peg$FAILED) {
	          s5 = peg$c2;
	        } else {
	          peg$currPos = s5;
	          s5 = peg$c1;
	        }
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parseSourceCharacter();
	          if (s6 !== peg$FAILED) {
	            s5 = [s5, s6];
	            s4 = s5;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c1;
	          }
	        } else {
	          peg$currPos = s4;
	          s4 = peg$c1;
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          s4 = peg$currPos;
	          s5 = peg$currPos;
	          peg$silentFails++;
	          s6 = peg$parseCommentTagEnd();
	          peg$silentFails--;
	          if (s6 === peg$FAILED) {
	            s5 = peg$c2;
	          } else {
	            peg$currPos = s5;
	            s5 = peg$c1;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parseSourceCharacter();
	            if (s6 !== peg$FAILED) {
	              s5 = [s5, s6];
	              s4 = s5;
	            } else {
	              peg$currPos = s4;
	              s4 = peg$c1;
	            }
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c1;
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s3 = input.substring(s2, peg$currPos);
	        }
	        s2 = s3;
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseCommentTagEnd();
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c17(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseAttributes() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parseWhiteSpace();
	      if (s2 !== peg$FAILED) {
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          s2 = peg$parseWhiteSpace();
	        }
	      } else {
	        s1 = peg$c1;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseAttributeWithValue();
	        if (s2 === peg$FAILED) {
	          s2 = peg$parseAttributeWithoutValue();
	        }
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c18(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = [];
	        s2 = peg$parseWhiteSpace();
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          s2 = peg$parseWhiteSpace();
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parsePerlExpression();
	          if (s2 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c19(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parsePerlExpression() {
	      var s0, s1, s2, s3, s4, s5, s6;
	
	      s0 = peg$currPos;
	      s1 = peg$parsePerlExpressionStart();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = [];
	        s4 = peg$currPos;
	        s5 = peg$currPos;
	        peg$silentFails++;
	        s6 = peg$parsePerlExpressionEnd();
	        peg$silentFails--;
	        if (s6 === peg$FAILED) {
	          s5 = peg$c2;
	        } else {
	          peg$currPos = s5;
	          s5 = peg$c1;
	        }
	        if (s5 !== peg$FAILED) {
	          s6 = peg$parseSourceCharacter();
	          if (s6 !== peg$FAILED) {
	            s5 = [s5, s6];
	            s4 = s5;
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c1;
	          }
	        } else {
	          peg$currPos = s4;
	          s4 = peg$c1;
	        }
	        while (s4 !== peg$FAILED) {
	          s3.push(s4);
	          s4 = peg$currPos;
	          s5 = peg$currPos;
	          peg$silentFails++;
	          s6 = peg$parsePerlExpressionEnd();
	          peg$silentFails--;
	          if (s6 === peg$FAILED) {
	            s5 = peg$c2;
	          } else {
	            peg$currPos = s5;
	            s5 = peg$c1;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parseSourceCharacter();
	            if (s6 !== peg$FAILED) {
	              s5 = [s5, s6];
	              s4 = s5;
	            } else {
	              peg$currPos = s4;
	              s4 = peg$c1;
	            }
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c1;
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s3 = input.substring(s2, peg$currPos);
	        }
	        s2 = s3;
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parsePerlExpressionEnd();
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c20(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseAttributeWithValue() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = peg$parseAttributeToken();
	      if (s1 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 61) {
	          s2 = peg$c21;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c22);
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseAttributeToken();
	          if (s3 === peg$FAILED) {
	            s3 = peg$parsePerlExpression();
	            if (s3 === peg$FAILED) {
	              s3 = peg$parseQuotedString();
	            }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c23(s1, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseAttributeWithoutValue() {
	      var s0, s1;
	
	      s0 = peg$currPos;
	      s1 = peg$parseAttributeToken();
	      if (s1 === peg$FAILED) {
	        s1 = peg$parseQuotedString();
	      }
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c24(s1);
	      }
	      s0 = s1;
	
	      return s0;
	    }
	
	    function peg$parseAttributeToken() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = [];
	      if (peg$c25.test(input.charAt(peg$currPos))) {
	        s3 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s3 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c26);
	        }
	      }
	      if (s3 !== peg$FAILED) {
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          if (peg$c25.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c26);
	            }
	          }
	        }
	      } else {
	        s2 = peg$c1;
	      }
	      if (s2 !== peg$FAILED) {
	        s2 = input.substring(s1, peg$currPos);
	      }
	      s1 = s2;
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c27(s1);
	      }
	      s0 = s1;
	
	      return s0;
	    }
	
	    function peg$parseQuotedString() {
	      var s0;
	
	      s0 = peg$parseSingleQuotedString();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseDoubleQuotedString();
	      }
	
	      return s0;
	    }
	
	    function peg$parseSingleQuotedString() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 39) {
	        s1 = peg$c28;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c29);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$parseSingleStringCharacter();
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$parseSingleStringCharacter();
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 39) {
	            s3 = peg$c28;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c29);
	            }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c30(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseDoubleQuotedString() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 34) {
	        s1 = peg$c31;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c32);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$parseDoubleStringCharacter();
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$parseDoubleStringCharacter();
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 34) {
	            s3 = peg$c31;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c32);
	            }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c30(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseKnownTagName() {
	      var s0;
	
	      s0 = peg$parseBlockTagName();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseConditionalTagName();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseElsIfTagName();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseElseTagName();
	          }
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseUnknownTagName() {
	      var s0, s1, s2, s3, s4, s5;
	
	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = peg$currPos;
	      peg$silentFails++;
	      s3 = peg$parseKnownTagName();
	      peg$silentFails--;
	      if (s3 === peg$FAILED) {
	        s2 = peg$c2;
	      } else {
	        peg$currPos = s2;
	        s2 = peg$c1;
	      }
	      if (s2 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 5) === peg$c33) {
	          s3 = peg$c33;
	          peg$currPos += 5;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c34);
	          }
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          s5 = peg$parseTagNameCharacter();
	          if (s5 !== peg$FAILED) {
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              s5 = peg$parseTagNameCharacter();
	            }
	          } else {
	            s4 = peg$c1;
	          }
	          if (s4 !== peg$FAILED) {
	            s2 = [s2, s3, s4];
	            s1 = s2;
	          } else {
	            peg$currPos = s1;
	            s1 = peg$c1;
	          }
	        } else {
	          peg$currPos = s1;
	          s1 = peg$c1;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$c1;
	      }
	      if (s1 !== peg$FAILED) {
	        s1 = input.substring(s0, peg$currPos);
	      }
	      s0 = s1;
	
	      return s0;
	    }
	
	    function peg$parseSingleTagName() {
	      var s0;
	
	      if (input.substr(peg$currPos, 12) === peg$c35) {
	        s0 = peg$c35;
	        peg$currPos += 12;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c36);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 8) === peg$c37) {
	          s0 = peg$c37;
	          peg$currPos += 8;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c38);
	          }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.substr(peg$currPos, 6) === peg$c39) {
	            s0 = peg$c39;
	            peg$currPos += 6;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c40);
	            }
	          }
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseBlockTagName() {
	      var s0;
	
	      if (input.substr(peg$currPos, 10) === peg$c41) {
	        s0 = peg$c41;
	        peg$currPos += 10;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c42);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 8) === peg$c43) {
	          s0 = peg$c43;
	          peg$currPos += 8;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c44);
	          }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.substr(peg$currPos, 9) === peg$c45) {
	            s0 = peg$c45;
	            peg$currPos += 9;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c46);
	            }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.substr(peg$currPos, 11) === peg$c47) {
	              s0 = peg$c47;
	              peg$currPos += 11;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c48);
	              }
	            }
	            if (s0 === peg$FAILED) {
	              if (input.substr(peg$currPos, 9) === peg$c49) {
	                s0 = peg$c49;
	                peg$currPos += 9;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c50);
	                }
	              }
	              if (s0 === peg$FAILED) {
	                if (input.substr(peg$currPos, 7) === peg$c51) {
	                  s0 = peg$c51;
	                  peg$currPos += 7;
	                } else {
	                  s0 = peg$FAILED;
	                  if (peg$silentFails === 0) {
	                    peg$fail(peg$c52);
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseConditionalTagName() {
	      var s0;
	
	      if (input.substr(peg$currPos, 7) === peg$c53) {
	        s0 = peg$c53;
	        peg$currPos += 7;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c54);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 11) === peg$c55) {
	          s0 = peg$c55;
	          peg$currPos += 11;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c56);
	          }
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseElsIfTagName() {
	      var s0;
	
	      if (input.substr(peg$currPos, 10) === peg$c57) {
	        s0 = peg$c57;
	        peg$currPos += 10;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c58);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseElseTagName() {
	      var s0;
	
	      if (input.substr(peg$currPos, 9) === peg$c59) {
	        s0 = peg$c59;
	        peg$currPos += 9;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c60);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseCommentTagName() {
	      var s0;
	
	      if (input.substr(peg$currPos, 12) === peg$c61) {
	        s0 = peg$c61;
	        peg$currPos += 12;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c62);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseWhiteSpaceControlStart() {
	      var s0, s1;
	
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 45) {
	        s0 = peg$c64;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c65);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c66) {
	          s0 = peg$c66;
	          peg$currPos += 2;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c67);
	          }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c68) {
	            s0 = peg$c68;
	            peg$currPos += 2;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c69);
	            }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 126) {
	              s0 = peg$c70;
	              peg$currPos++;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c71);
	              }
	            }
	          }
	        }
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c63);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseWhiteSpaceControlEnd() {
	      var s0, s1;
	
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 45) {
	        s0 = peg$c64;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c65);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c72) {
	          s0 = peg$c72;
	          peg$currPos += 2;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c73);
	          }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c74) {
	            s0 = peg$c74;
	            peg$currPos += 2;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c75);
	            }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 126) {
	              s0 = peg$c70;
	              peg$currPos++;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c71);
	              }
	            }
	          }
	        }
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c63);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseCommentTagStart() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseCommentTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseClosingBracket();
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseCommentTagEnd() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = peg$parseOpeningEndBracket();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseCommentTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseClosingBracket();
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseTagNameCharacter() {
	      var s0;
	
	      if (peg$c76.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c77);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseWhiteSpace() {
	      var s0, s1;
	
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 9) {
	        s0 = peg$c79;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c80);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 11) {
	          s0 = peg$c81;
	          peg$currPos++;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c82);
	          }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 12) {
	            s0 = peg$c83;
	            peg$currPos++;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c84);
	            }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 32) {
	              s0 = peg$c85;
	              peg$currPos++;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c86);
	              }
	            }
	            if (s0 === peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 160) {
	                s0 = peg$c87;
	                peg$currPos++;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c88);
	                }
	              }
	              if (s0 === peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 65279) {
	                  s0 = peg$c89;
	                  peg$currPos++;
	                } else {
	                  s0 = peg$FAILED;
	                  if (peg$silentFails === 0) {
	                    peg$fail(peg$c90);
	                  }
	                }
	                if (s0 === peg$FAILED) {
	                  if (peg$c91.test(input.charAt(peg$currPos))) {
	                    s0 = input.charAt(peg$currPos);
	                    peg$currPos++;
	                  } else {
	                    s0 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                      peg$fail(peg$c92);
	                    }
	                  }
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$parseLineTerminator();
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c78);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseFullLineCommentStart() {
	      var s0, s1, s2, s3, s4;
	
	      s0 = peg$currPos;
	      s1 = peg$parseLineTerminator();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$currPos;
	        peg$silentFails++;
	        s4 = peg$parseCommentStart();
	        peg$silentFails--;
	        if (s4 === peg$FAILED) {
	          s3 = peg$c2;
	        } else {
	          peg$currPos = s3;
	          s3 = peg$c1;
	        }
	        if (s3 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 35) {
	            s4 = peg$c93;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c94);
	            }
	          }
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$c1;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$c1;
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseCommentStart() {
	      var s0;
	
	      if (input.substr(peg$currPos, 2) === peg$c95) {
	        s0 = peg$c95;
	        peg$currPos += 2;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c96);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseSourceCharacter() {
	      var s0;
	
	      if (input.length > peg$currPos) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c97);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseLineTerminator() {
	      var s0, s1;
	
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 10) {
	        s0 = peg$c99;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c100);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c101) {
	          s0 = peg$c101;
	          peg$currPos += 2;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c102);
	          }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 13) {
	            s0 = peg$c103;
	            peg$currPos++;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c104);
	            }
	          }
	          if (s0 === peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 8232) {
	              s0 = peg$c105;
	              peg$currPos++;
	            } else {
	              s0 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c106);
	              }
	            }
	            if (s0 === peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 8233) {
	                s0 = peg$c107;
	                peg$currPos++;
	              } else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c108);
	                }
	              }
	            }
	          }
	        }
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c98);
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseOpeningBracket() {
	      var s0, s1, s2, s3, s4, s5;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s1 = peg$c109;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c110);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = peg$parseWhiteSpaceControlStart();
	        if (s3 !== peg$FAILED) {
	          s4 = [];
	          s5 = peg$parseWhiteSpace();
	          while (s5 !== peg$FAILED) {
	            s4.push(s5);
	            s5 = peg$parseWhiteSpace();
	          }
	          if (s4 !== peg$FAILED) {
	            s3 = [s3, s4];
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$c1;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$c1;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = peg$c5;
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseOpeningEndBracket() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s1 = peg$c109;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c110);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseWhiteSpaceControlStart();
	        if (s2 === peg$FAILED) {
	          s2 = peg$c5;
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 47) {
	            s3 = peg$c111;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c112);
	            }
	          }
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseClosingBracket() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parseWhiteSpace();
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parseWhiteSpace();
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseWhiteSpaceControlEnd();
	        if (s2 === peg$FAILED) {
	          s2 = peg$c5;
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 62) {
	            s3 = peg$c113;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c114);
	            }
	          }
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        peg$silentFails++;
	        if (input.charCodeAt(peg$currPos) === 62) {
	          s2 = peg$c113;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c114);
	          }
	        }
	        peg$silentFails--;
	        if (s2 === peg$FAILED) {
	          s1 = peg$c2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$c1;
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = [];
	          s3 = peg$parseSourceCharacter();
	          if (s3 !== peg$FAILED) {
	            while (s3 !== peg$FAILED) {
	              s2.push(s3);
	              s3 = peg$parseSourceCharacter();
	            }
	          } else {
	            s2 = peg$c1;
	          }
	          if (s2 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c115();
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseSelfClosingBracket() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parseWhiteSpace();
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parseWhiteSpace();
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseWhiteSpaceControlEnd();
	        if (s2 === peg$FAILED) {
	          s2 = peg$c5;
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.substr(peg$currPos, 2) === peg$c116) {
	            s3 = peg$c116;
	            peg$currPos += 2;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c117);
	            }
	          }
	          if (s3 !== peg$FAILED) {
	            s1 = [s1, s2, s3];
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        peg$silentFails++;
	        if (input.charCodeAt(peg$currPos) === 62) {
	          s2 = peg$c113;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c114);
	          }
	        }
	        peg$silentFails--;
	        if (s2 === peg$FAILED) {
	          s1 = peg$c2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$c1;
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = [];
	          s3 = peg$parseSourceCharacter();
	          if (s3 !== peg$FAILED) {
	            while (s3 !== peg$FAILED) {
	              s2.push(s3);
	              s3 = peg$parseSourceCharacter();
	            }
	          } else {
	            s2 = peg$c1;
	          }
	          if (s2 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c115();
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parsePerlExpressionStart() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c118) {
	        s1 = peg$c118;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c119);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$parseWhiteSpace();
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$parseWhiteSpace();
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parsePerlExpressionEnd() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parseWhiteSpace();
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parseWhiteSpace();
	      }
	      if (s1 !== peg$FAILED) {
	        if (input.substr(peg$currPos, 2) === peg$c120) {
	          s2 = peg$c120;
	          peg$currPos += 2;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c121);
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s1 = [s1, s2];
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseSingleStringCharacter() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 39) {
	        s2 = peg$c28;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c29);
	        }
	      }
	      if (s2 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 92) {
	          s2 = peg$c122;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c123);
	          }
	        }
	        if (s2 === peg$FAILED) {
	          s2 = peg$parseLineTerminator();
	        }
	      }
	      peg$silentFails--;
	      if (s2 === peg$FAILED) {
	        s1 = peg$c2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$c1;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseSourceCharacter();
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c124();
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 92) {
	          s1 = peg$c122;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c123);
	          }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parseSingleEscapeCharacter();
	          if (s2 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c125(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseDoubleStringCharacter() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 34) {
	        s2 = peg$c31;
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c32);
	        }
	      }
	      if (s2 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 92) {
	          s2 = peg$c122;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c123);
	          }
	        }
	        if (s2 === peg$FAILED) {
	          s2 = peg$parseLineTerminator();
	        }
	      }
	      peg$silentFails--;
	      if (s2 === peg$FAILED) {
	        s1 = peg$c2;
	      } else {
	        peg$currPos = s1;
	        s1 = peg$c1;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseSourceCharacter();
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c124();
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	      if (s0 === peg$FAILED) {
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 92) {
	          s1 = peg$c122;
	          peg$currPos++;
	        } else {
	          s1 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c123);
	          }
	        }
	        if (s1 !== peg$FAILED) {
	          s2 = peg$parseSingleEscapeCharacter();
	          if (s2 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c125(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseSingleEscapeCharacter() {
	      var s0, s1;
	
	      if (input.charCodeAt(peg$currPos) === 39) {
	        s0 = peg$c28;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c29);
	        }
	      }
	      if (s0 === peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 34) {
	          s0 = peg$c31;
	          peg$currPos++;
	        } else {
	          s0 = peg$FAILED;
	          if (peg$silentFails === 0) {
	            peg$fail(peg$c32);
	          }
	        }
	        if (s0 === peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 92) {
	            s0 = peg$c122;
	            peg$currPos++;
	          } else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c123);
	            }
	          }
	          if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 98) {
	              s1 = peg$c126;
	              peg$currPos++;
	            } else {
	              s1 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c127);
	              }
	            }
	            if (s1 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c128();
	            }
	            s0 = s1;
	            if (s0 === peg$FAILED) {
	              s0 = peg$currPos;
	              if (input.charCodeAt(peg$currPos) === 102) {
	                s1 = peg$c129;
	                peg$currPos++;
	              } else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                  peg$fail(peg$c130);
	                }
	              }
	              if (s1 !== peg$FAILED) {
	                peg$reportedPos = s0;
	                s1 = peg$c131();
	              }
	              s0 = s1;
	              if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                if (input.charCodeAt(peg$currPos) === 110) {
	                  s1 = peg$c132;
	                  peg$currPos++;
	                } else {
	                  s1 = peg$FAILED;
	                  if (peg$silentFails === 0) {
	                    peg$fail(peg$c133);
	                  }
	                }
	                if (s1 !== peg$FAILED) {
	                  peg$reportedPos = s0;
	                  s1 = peg$c134();
	                }
	                s0 = s1;
	                if (s0 === peg$FAILED) {
	                  s0 = peg$currPos;
	                  if (input.charCodeAt(peg$currPos) === 114) {
	                    s1 = peg$c135;
	                    peg$currPos++;
	                  } else {
	                    s1 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                      peg$fail(peg$c136);
	                    }
	                  }
	                  if (s1 !== peg$FAILED) {
	                    peg$reportedPos = s0;
	                    s1 = peg$c137();
	                  }
	                  s0 = s1;
	                  if (s0 === peg$FAILED) {
	                    s0 = peg$currPos;
	                    if (input.charCodeAt(peg$currPos) === 116) {
	                      s1 = peg$c138;
	                      peg$currPos++;
	                    } else {
	                      s1 = peg$FAILED;
	                      if (peg$silentFails === 0) {
	                        peg$fail(peg$c139);
	                      }
	                    }
	                    if (s1 !== peg$FAILED) {
	                      peg$reportedPos = s0;
	                      s1 = peg$c140();
	                    }
	                    s0 = s1;
	                    if (s0 === peg$FAILED) {
	                      s0 = peg$currPos;
	                      if (input.charCodeAt(peg$currPos) === 118) {
	                        s1 = peg$c141;
	                        peg$currPos++;
	                      } else {
	                        s1 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                          peg$fail(peg$c142);
	                        }
	                      }
	                      if (s1 !== peg$FAILED) {
	                        peg$reportedPos = s0;
	                        s1 = peg$c143();
	                      }
	                      s0 = s1;
	                    }
	                  }
	                }
	              }
	            }
	          }
	        }
	      }
	
	      return s0;
	    }
	
	    function peg$parseBlockHtmlTag() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = peg$parseStartHtmlTag();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseContent();
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseEndHtmlTag();
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c4(s1, s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseStartHtmlTag() {
	      var s0, s1, s2, s3, s4;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 60) {
	        s1 = peg$c109;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c110);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseHtmlTagName();
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parseAttributes();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parseAttributes();
	          }
	          if (s3 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 62) {
	              s4 = peg$c113;
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) {
	                peg$fail(peg$c114);
	              }
	            }
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c144(s2, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c1;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseEndHtmlTag() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      if (input.substr(peg$currPos, 2) === peg$c145) {
	        s1 = peg$c145;
	        peg$currPos += 2;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c146);
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseHtmlTagName();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 62) {
	            s3 = peg$c113;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c114);
	            }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c147(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c1;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c1;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c1;
	      }
	
	      return s0;
	    }
	
	    function peg$parseHtmlTagName() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      s1 = [];
	      if (peg$c148.test(input.charAt(peg$currPos))) {
	        s2 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s2 = peg$FAILED;
	        if (peg$silentFails === 0) {
	          peg$fail(peg$c149);
	        }
	      }
	      if (s2 !== peg$FAILED) {
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          if (peg$c148.test(input.charAt(peg$currPos))) {
	            s2 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) {
	              peg$fail(peg$c149);
	            }
	          }
	        }
	      } else {
	        s1 = peg$c1;
	      }
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c150(s1);
	      }
	      s0 = s1;
	
	      return s0;
	    }
	
	    function join(s) {
	      return s.join("");
	    }
	
	    function token(object, line, column) {
	      var preventPositionCalculation = options.reducePositionLookups && (object.type === BLOCK_TYPES.TEXT || object.type === BLOCK_TYPES.CONDITION_BRANCH || object.type === BLOCK_TYPES.ALTERNATE_CONDITION_BRANCH || object.type === ATTRIBUTE_TYPES.EXPRESSION || object.type === ATTRIBUTE_TYPES.PAIR || object.type === ATTRIBUTE_TYPES.SINGLE);
	
	      if (!preventPositionCalculation) {
	        object.position = {
	          line: line(),
	          column: column()
	        };
	      }
	
	      return object;
	    }
	
	    function syntaxError(message, offset, line, column) {
	      return new SyntaxError(message, null, null, offset(), line(), column());
	    }
	
	    var BLOCK_TYPES = {
	      COMMENT: "Comment",
	      TAG: "Tag",
	      TEXT: "Text",
	      CONDITION: "Condition",
	      CONDITION_BRANCH: "ConditionBranch",
	      ALTERNATE_CONDITION_BRANCH: "AlternateConditionBranch",
	      INVALID_TAG: "InvalidTag"
	    };
	
	    var ATTRIBUTE_TYPES = {
	      EXPRESSION: "Expression",
	      PAIR: "PairAttribute",
	      SINGLE: "SingleAttribute"
	    };
	
	    var COLUMN_ONE = function COLUMN_ONE() {
	      return 1;
	    };
	
	    peg$result = peg$startRuleFunction();
	
	    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
	      return peg$result;
	    } else {
	      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
	        peg$fail({ type: "end", description: "end of input" });
	      }
	
	      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
	    }
	  }
	
	  return {
	    SyntaxError: SyntaxError,
	    parse: parse
	  };
	})();

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * lodash 3.0.2 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.2 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	var baseFlatten = __webpack_require__(12),
	    isIterateeCall = __webpack_require__(15);
	
	/**
	 * Flattens a nested array. If `isDeep` is `true` the array is recursively
	 * flattened, otherwise it is only flattened a single level.
	 *
	 * @static
	 * @memberOf _
	 * @category Array
	 * @param {Array} array The array to flatten.
	 * @param {boolean} [isDeep] Specify a deep flatten.
	 * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	 * @returns {Array} Returns the new flattened array.
	 * @example
	 *
	 * _.flatten([1, [2, 3, [4]]]);
	 * // => [1, 2, 3, [4]]
	 *
	 * // using `isDeep`
	 * _.flatten([1, [2, 3, [4]]], true);
	 * // => [1, 2, 3, 4]
	 */
	function flatten(array, isDeep, guard) {
	  var length = array ? array.length : 0;
	  if (guard && isIterateeCall(array, isDeep, guard)) {
	    isDeep = false;
	  }
	  return length ? baseFlatten(array, isDeep) : [];
	}
	
	module.exports = flatten;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * lodash 3.1.4 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	var isArguments = __webpack_require__(13),
	    isArray = __webpack_require__(14);
	
	/**
	 * Checks if `value` is object-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	/**
	 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
	 * of an array-like value.
	 */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;
	
	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}
	
	/**
	 * The base implementation of `_.flatten` with added support for restricting
	 * flattening and specifying the start index.
	 *
	 * @private
	 * @param {Array} array The array to flatten.
	 * @param {boolean} [isDeep] Specify a deep flatten.
	 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
	 * @param {Array} [result=[]] The initial result value.
	 * @returns {Array} Returns the new flattened array.
	 */
	function baseFlatten(array, isDeep, isStrict, result) {
	  result || (result = []);
	
	  var index = -1,
	      length = array.length;
	
	  while (++index < length) {
	    var value = array[index];
	    if (isObjectLike(value) && isArrayLike(value) &&
	        (isStrict || isArray(value) || isArguments(value))) {
	      if (isDeep) {
	        // Recursively flatten arrays (susceptible to call stack limits).
	        baseFlatten(value, isDeep, isStrict, result);
	      } else {
	        arrayPush(result, value);
	      }
	    } else if (!isStrict) {
	      result[result.length] = value;
	    }
	  }
	  return result;
	}
	
	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}
	
	/**
	 * Gets the "length" property value of `object`.
	 *
	 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
	 * that affects Safari on at least iOS 8.1-8.3 ARM64.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {*} Returns the "length" value.
	 */
	var getLength = baseProperty('length');
	
	/**
	 * Checks if `value` is array-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 */
	function isArrayLike(value) {
	  return value != null && isLength(getLength(value));
	}
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 */
	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	module.exports = baseFlatten;


/***/ },
/* 13 */
/***/ function(module, exports) {

	/**
	 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/**
	 * Checks if `value` is object-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/** Native method references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;
	
	/**
	 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
	 * of an array-like value.
	 */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}
	
	/**
	 * Gets the "length" property value of `object`.
	 *
	 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
	 * that affects Safari on at least iOS 8.1-8.3 ARM64.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {*} Returns the "length" value.
	 */
	var getLength = baseProperty('length');
	
	/**
	 * Checks if `value` is array-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 */
	function isArrayLike(value) {
	  return value != null && isLength(getLength(value));
	}
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 */
	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	/**
	 * Checks if `value` is classified as an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  return isObjectLike(value) && isArrayLike(value) &&
	    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
	}
	
	module.exports = isArguments;


/***/ },
/* 14 */
/***/ function(module, exports) {

	/**
	 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/** `Object#toString` result references. */
	var arrayTag = '[object Array]',
	    funcTag = '[object Function]';
	
	/** Used to detect host constructors (Safari > 5). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;
	
	/**
	 * Checks if `value` is object-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	/** Used for native method references. */
	var objectProto = Object.prototype;
	
	/** Used to resolve the decompiled source of functions. */
	var fnToString = Function.prototype.toString;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objToString = objectProto.toString;
	
	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);
	
	/* Native method references for those with the same name as other `lodash` methods. */
	var nativeIsArray = getNative(Array, 'isArray');
	
	/**
	 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
	 * of an array-like value.
	 */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = object == null ? undefined : object[key];
	  return isNative(value) ? value : undefined;
	}
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 */
	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(function() { return arguments; }());
	 * // => false
	 */
	var isArray = nativeIsArray || function(value) {
	  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
	};
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in older versions of Chrome and Safari which return 'function' for regexes
	  // and Safari 8 equivalents which return 'object' for typed array constructors.
	  return isObject(value) && objToString.call(value) == funcTag;
	}
	
	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(1);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	/**
	 * Checks if `value` is a native function.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
	 * @example
	 *
	 * _.isNative(Array.prototype.push);
	 * // => true
	 *
	 * _.isNative(_);
	 * // => false
	 */
	function isNative(value) {
	  if (value == null) {
	    return false;
	  }
	  if (isFunction(value)) {
	    return reIsNative.test(fnToString.call(value));
	  }
	  return isObjectLike(value) && reIsHostCtor.test(value);
	}
	
	module.exports = isArray;


/***/ },
/* 15 */
/***/ function(module, exports) {

	/**
	 * lodash 3.0.9 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	
	/** Used to detect unsigned integer values. */
	var reIsUint = /^\d+$/;
	
	/**
	 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
	 * of an array-like value.
	 */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new function.
	 */
	function baseProperty(key) {
	  return function(object) {
	    return object == null ? undefined : object[key];
	  };
	}
	
	/**
	 * Gets the "length" property value of `object`.
	 *
	 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
	 * that affects Safari on at least iOS 8.1-8.3 ARM64.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {*} Returns the "length" value.
	 */
	var getLength = baseProperty('length');
	
	/**
	 * Checks if `value` is array-like.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 */
	function isArrayLike(value) {
	  return value != null && isLength(getLength(value));
	}
	
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return value > -1 && value % 1 == 0 && value < length;
	}
	
	/**
	 * Checks if the provided arguments are from an iteratee call.
	 *
	 * @private
	 * @param {*} value The potential iteratee value argument.
	 * @param {*} index The potential iteratee index or key argument.
	 * @param {*} object The potential iteratee object argument.
	 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
	 */
	function isIterateeCall(value, index, object) {
	  if (!isObject(object)) {
	    return false;
	  }
	  var type = typeof index;
	  if (type == 'number'
	      ? (isArrayLike(object) && isIndex(index, object.length))
	      : (type == 'string' && index in object)) {
	    var other = object[index];
	    return value === value ? (value === other) : (other !== other);
	  }
	  return false;
	}
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 */
	function isLength(value) {
	  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	/**
	 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(1);
	 * // => false
	 */
	function isObject(value) {
	  // Avoid a V8 JIT bug in Chrome 19-20.
	  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	module.exports = isIterateeCall;


/***/ },
/* 16 */
/***/ function(module, exports) {

	var traverse = module.exports = function (obj) {
	    return new Traverse(obj);
	};
	
	function Traverse (obj) {
	    this.value = obj;
	}
	
	Traverse.prototype.get = function (ps) {
	    var node = this.value;
	    for (var i = 0; i < ps.length; i ++) {
	        var key = ps[i];
	        if (!node || !hasOwnProperty.call(node, key)) {
	            node = undefined;
	            break;
	        }
	        node = node[key];
	    }
	    return node;
	};
	
	Traverse.prototype.has = function (ps) {
	    var node = this.value;
	    for (var i = 0; i < ps.length; i ++) {
	        var key = ps[i];
	        if (!node || !hasOwnProperty.call(node, key)) {
	            return false;
	        }
	        node = node[key];
	    }
	    return true;
	};
	
	Traverse.prototype.set = function (ps, value) {
	    var node = this.value;
	    for (var i = 0; i < ps.length - 1; i ++) {
	        var key = ps[i];
	        if (!hasOwnProperty.call(node, key)) node[key] = {};
	        node = node[key];
	    }
	    node[ps[i]] = value;
	    return value;
	};
	
	Traverse.prototype.map = function (cb) {
	    return walk(this.value, cb, true);
	};
	
	Traverse.prototype.forEach = function (cb) {
	    this.value = walk(this.value, cb, false);
	    return this.value;
	};
	
	Traverse.prototype.reduce = function (cb, init) {
	    var skip = arguments.length === 1;
	    var acc = skip ? this.value : init;
	    this.forEach(function (x) {
	        if (!this.isRoot || !skip) {
	            acc = cb.call(this, acc, x);
	        }
	    });
	    return acc;
	};
	
	Traverse.prototype.paths = function () {
	    var acc = [];
	    this.forEach(function (x) {
	        acc.push(this.path); 
	    });
	    return acc;
	};
	
	Traverse.prototype.nodes = function () {
	    var acc = [];
	    this.forEach(function (x) {
	        acc.push(this.node);
	    });
	    return acc;
	};
	
	Traverse.prototype.clone = function () {
	    var parents = [], nodes = [];
	    
	    return (function clone (src) {
	        for (var i = 0; i < parents.length; i++) {
	            if (parents[i] === src) {
	                return nodes[i];
	            }
	        }
	        
	        if (typeof src === 'object' && src !== null) {
	            var dst = copy(src);
	            
	            parents.push(src);
	            nodes.push(dst);
	            
	            forEach(objectKeys(src), function (key) {
	                dst[key] = clone(src[key]);
	            });
	            
	            parents.pop();
	            nodes.pop();
	            return dst;
	        }
	        else {
	            return src;
	        }
	    })(this.value);
	};
	
	function walk (root, cb, immutable) {
	    var path = [];
	    var parents = [];
	    var alive = true;
	    
	    return (function walker (node_) {
	        var node = immutable ? copy(node_) : node_;
	        var modifiers = {};
	        
	        var keepGoing = true;
	        
	        var state = {
	            node : node,
	            node_ : node_,
	            path : [].concat(path),
	            parent : parents[parents.length - 1],
	            parents : parents,
	            key : path.slice(-1)[0],
	            isRoot : path.length === 0,
	            level : path.length,
	            circular : null,
	            update : function (x, stopHere) {
	                if (!state.isRoot) {
	                    state.parent.node[state.key] = x;
	                }
	                state.node = x;
	                if (stopHere) keepGoing = false;
	            },
	            'delete' : function (stopHere) {
	                delete state.parent.node[state.key];
	                if (stopHere) keepGoing = false;
	            },
	            remove : function (stopHere) {
	                if (isArray(state.parent.node)) {
	                    state.parent.node.splice(state.key, 1);
	                }
	                else {
	                    delete state.parent.node[state.key];
	                }
	                if (stopHere) keepGoing = false;
	            },
	            keys : null,
	            before : function (f) { modifiers.before = f },
	            after : function (f) { modifiers.after = f },
	            pre : function (f) { modifiers.pre = f },
	            post : function (f) { modifiers.post = f },
	            stop : function () { alive = false },
	            block : function () { keepGoing = false }
	        };
	        
	        if (!alive) return state;
	        
	        function updateState() {
	            if (typeof state.node === 'object' && state.node !== null) {
	                if (!state.keys || state.node_ !== state.node) {
	                    state.keys = objectKeys(state.node)
	                }
	                
	                state.isLeaf = state.keys.length == 0;
	                
	                for (var i = 0; i < parents.length; i++) {
	                    if (parents[i].node_ === node_) {
	                        state.circular = parents[i];
	                        break;
	                    }
	                }
	            }
	            else {
	                state.isLeaf = true;
	                state.keys = null;
	            }
	            
	            state.notLeaf = !state.isLeaf;
	            state.notRoot = !state.isRoot;
	        }
	        
	        updateState();
	        
	        // use return values to update if defined
	        var ret = cb.call(state, state.node);
	        if (ret !== undefined && state.update) state.update(ret);
	        
	        if (modifiers.before) modifiers.before.call(state, state.node);
	        
	        if (!keepGoing) return state;
	        
	        if (typeof state.node == 'object'
	        && state.node !== null && !state.circular) {
	            parents.push(state);
	            
	            updateState();
	            
	            forEach(state.keys, function (key, i) {
	                path.push(key);
	                
	                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
	                
	                var child = walker(state.node[key]);
	                if (immutable && hasOwnProperty.call(state.node, key)) {
	                    state.node[key] = child.node;
	                }
	                
	                child.isLast = i == state.keys.length - 1;
	                child.isFirst = i == 0;
	                
	                if (modifiers.post) modifiers.post.call(state, child);
	                
	                path.pop();
	            });
	            parents.pop();
	        }
	        
	        if (modifiers.after) modifiers.after.call(state, state.node);
	        
	        return state;
	    })(root).node;
	}
	
	function copy (src) {
	    if (typeof src === 'object' && src !== null) {
	        var dst;
	        
	        if (isArray(src)) {
	            dst = [];
	        }
	        else if (isDate(src)) {
	            dst = new Date(src.getTime ? src.getTime() : src);
	        }
	        else if (isRegExp(src)) {
	            dst = new RegExp(src);
	        }
	        else if (isError(src)) {
	            dst = { message: src.message };
	        }
	        else if (isBoolean(src)) {
	            dst = new Boolean(src);
	        }
	        else if (isNumber(src)) {
	            dst = new Number(src);
	        }
	        else if (isString(src)) {
	            dst = new String(src);
	        }
	        else if (Object.create && Object.getPrototypeOf) {
	            dst = Object.create(Object.getPrototypeOf(src));
	        }
	        else if (src.constructor === Object) {
	            dst = {};
	        }
	        else {
	            var proto =
	                (src.constructor && src.constructor.prototype)
	                || src.__proto__
	                || {}
	            ;
	            var T = function () {};
	            T.prototype = proto;
	            dst = new T;
	        }
	        
	        forEach(objectKeys(src), function (key) {
	            dst[key] = src[key];
	        });
	        return dst;
	    }
	    else return src;
	}
	
	var objectKeys = Object.keys || function keys (obj) {
	    var res = [];
	    for (var key in obj) res.push(key)
	    return res;
	};
	
	function toS (obj) { return Object.prototype.toString.call(obj) }
	function isDate (obj) { return toS(obj) === '[object Date]' }
	function isRegExp (obj) { return toS(obj) === '[object RegExp]' }
	function isError (obj) { return toS(obj) === '[object Error]' }
	function isBoolean (obj) { return toS(obj) === '[object Boolean]' }
	function isNumber (obj) { return toS(obj) === '[object Number]' }
	function isString (obj) { return toS(obj) === '[object String]' }
	
	var isArray = Array.isArray || function isArray (xs) {
	    return Object.prototype.toString.call(xs) === '[object Array]';
	};
	
	var forEach = function (xs, fn) {
	    if (xs.forEach) return xs.forEach(fn)
	    else for (var i = 0; i < xs.length; i++) {
	        fn(xs[i], i, xs);
	    }
	};
	
	forEach(objectKeys(Traverse.prototype), function (key) {
	    traverse[key] = function (obj) {
	        var args = [].slice.call(arguments, 1);
	        var t = new Traverse(obj);
	        return t[key].apply(t, args);
	    };
	});
	
	var hasOwnProperty = Object.hasOwnProperty || function (obj, key) {
	    return key in obj;
	};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var h = __webpack_require__(18)
	
	module.exports = h


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var isArray = __webpack_require__(19);
	
	var VNode = __webpack_require__(20);
	var VText = __webpack_require__(26);
	var isVNode = __webpack_require__(22);
	var isVText = __webpack_require__(27);
	var isWidget = __webpack_require__(23);
	var isHook = __webpack_require__(25);
	var isVThunk = __webpack_require__(24);
	
	var parseTag = __webpack_require__(28);
	var softSetHook = __webpack_require__(30);
	var evHook = __webpack_require__(31);
	
	module.exports = h;
	
	function h(tagName, properties, children) {
	    var childNodes = [];
	    var tag, props, key, namespace;
	
	    if (!children && isChildren(properties)) {
	        children = properties;
	        props = {};
	    }
	
	    props = props || properties || {};
	    tag = parseTag(tagName, props);
	
	    // support keys
	    if (props.hasOwnProperty('key')) {
	        key = props.key;
	        props.key = undefined;
	    }
	
	    // support namespace
	    if (props.hasOwnProperty('namespace')) {
	        namespace = props.namespace;
	        props.namespace = undefined;
	    }
	
	    // fix cursor bug
	    if (tag === 'INPUT' &&
	        !namespace &&
	        props.hasOwnProperty('value') &&
	        props.value !== undefined &&
	        !isHook(props.value)
	    ) {
	        props.value = softSetHook(props.value);
	    }
	
	    transformProperties(props);
	
	    if (children !== undefined && children !== null) {
	        addChild(children, childNodes, tag, props);
	    }
	
	
	    return new VNode(tag, props, childNodes, key, namespace);
	}
	
	function addChild(c, childNodes, tag, props) {
	    if (typeof c === 'string') {
	        childNodes.push(new VText(c));
	    } else if (typeof c === 'number') {
	        childNodes.push(new VText(String(c)));
	    } else if (isChild(c)) {
	        childNodes.push(c);
	    } else if (isArray(c)) {
	        for (var i = 0; i < c.length; i++) {
	            addChild(c[i], childNodes, tag, props);
	        }
	    } else if (c === null || c === undefined) {
	        return;
	    } else {
	        throw UnexpectedVirtualElement({
	            foreignObject: c,
	            parentVnode: {
	                tagName: tag,
	                properties: props
	            }
	        });
	    }
	}
	
	function transformProperties(props) {
	    for (var propName in props) {
	        if (props.hasOwnProperty(propName)) {
	            var value = props[propName];
	
	            if (isHook(value)) {
	                continue;
	            }
	
	            if (propName.substr(0, 3) === 'ev-') {
	                // add ev-foo support
	                props[propName] = evHook(value);
	            }
	        }
	    }
	}
	
	function isChild(x) {
	    return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
	}
	
	function isChildren(x) {
	    return typeof x === 'string' || isArray(x) || isChild(x);
	}
	
	function UnexpectedVirtualElement(data) {
	    var err = new Error();
	
	    err.type = 'virtual-hyperscript.unexpected.virtual-element';
	    err.message = 'Unexpected virtual child passed to h().\n' +
	        'Expected a VNode / Vthunk / VWidget / string but:\n' +
	        'got:\n' +
	        errorString(data.foreignObject) +
	        '.\n' +
	        'The parent vnode is:\n' +
	        errorString(data.parentVnode)
	        '\n' +
	        'Suggested fix: change your `h(..., [ ... ])` callsite.';
	    err.foreignObject = data.foreignObject;
	    err.parentVnode = data.parentVnode;
	
	    return err;
	}
	
	function errorString(obj) {
	    try {
	        return JSON.stringify(obj, null, '    ');
	    } catch (e) {
	        return String(obj);
	    }
	}


/***/ },
/* 19 */
/***/ function(module, exports) {

	var nativeIsArray = Array.isArray
	var toString = Object.prototype.toString
	
	module.exports = nativeIsArray || isArray
	
	function isArray(obj) {
	    return toString.call(obj) === "[object Array]"
	}


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var version = __webpack_require__(21)
	var isVNode = __webpack_require__(22)
	var isWidget = __webpack_require__(23)
	var isThunk = __webpack_require__(24)
	var isVHook = __webpack_require__(25)
	
	module.exports = VirtualNode
	
	var noProperties = {}
	var noChildren = []
	
	function VirtualNode(tagName, properties, children, key, namespace) {
	    this.tagName = tagName
	    this.properties = properties || noProperties
	    this.children = children || noChildren
	    this.key = key != null ? String(key) : undefined
	    this.namespace = (typeof namespace === "string") ? namespace : null
	
	    var count = (children && children.length) || 0
	    var descendants = 0
	    var hasWidgets = false
	    var hasThunks = false
	    var descendantHooks = false
	    var hooks
	
	    for (var propName in properties) {
	        if (properties.hasOwnProperty(propName)) {
	            var property = properties[propName]
	            if (isVHook(property) && property.unhook) {
	                if (!hooks) {
	                    hooks = {}
	                }
	
	                hooks[propName] = property
	            }
	        }
	    }
	
	    for (var i = 0; i < count; i++) {
	        var child = children[i]
	        if (isVNode(child)) {
	            descendants += child.count || 0
	
	            if (!hasWidgets && child.hasWidgets) {
	                hasWidgets = true
	            }
	
	            if (!hasThunks && child.hasThunks) {
	                hasThunks = true
	            }
	
	            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
	                descendantHooks = true
	            }
	        } else if (!hasWidgets && isWidget(child)) {
	            if (typeof child.destroy === "function") {
	                hasWidgets = true
	            }
	        } else if (!hasThunks && isThunk(child)) {
	            hasThunks = true;
	        }
	    }
	
	    this.count = count + descendants
	    this.hasWidgets = hasWidgets
	    this.hasThunks = hasThunks
	    this.hooks = hooks
	    this.descendantHooks = descendantHooks
	}
	
	VirtualNode.prototype.version = version
	VirtualNode.prototype.type = "VirtualNode"


/***/ },
/* 21 */
/***/ function(module, exports) {

	module.exports = "2"


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var version = __webpack_require__(21)
	
	module.exports = isVirtualNode
	
	function isVirtualNode(x) {
	    return x && x.type === "VirtualNode" && x.version === version
	}


/***/ },
/* 23 */
/***/ function(module, exports) {

	module.exports = isWidget
	
	function isWidget(w) {
	    return w && w.type === "Widget"
	}


/***/ },
/* 24 */
/***/ function(module, exports) {

	module.exports = isThunk
	
	function isThunk(t) {
	    return t && t.type === "Thunk"
	}


/***/ },
/* 25 */
/***/ function(module, exports) {

	module.exports = isHook
	
	function isHook(hook) {
	    return hook &&
	      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
	       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
	}


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var version = __webpack_require__(21)
	
	module.exports = VirtualText
	
	function VirtualText(text) {
	    this.text = String(text)
	}
	
	VirtualText.prototype.version = version
	VirtualText.prototype.type = "VirtualText"


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var version = __webpack_require__(21)
	
	module.exports = isVirtualText
	
	function isVirtualText(x) {
	    return x && x.type === "VirtualText" && x.version === version
	}


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var split = __webpack_require__(29);
	
	var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
	var notClassId = /^\.|#/;
	
	module.exports = parseTag;
	
	function parseTag(tag, props) {
	    if (!tag) {
	        return 'DIV';
	    }
	
	    var noId = !(props.hasOwnProperty('id'));
	
	    var tagParts = split(tag, classIdSplit);
	    var tagName = null;
	
	    if (notClassId.test(tagParts[1])) {
	        tagName = 'DIV';
	    }
	
	    var classes, part, type, i;
	
	    for (i = 0; i < tagParts.length; i++) {
	        part = tagParts[i];
	
	        if (!part) {
	            continue;
	        }
	
	        type = part.charAt(0);
	
	        if (!tagName) {
	            tagName = part;
	        } else if (type === '.') {
	            classes = classes || [];
	            classes.push(part.substring(1, part.length));
	        } else if (type === '#' && noId) {
	            props.id = part.substring(1, part.length);
	        }
	    }
	
	    if (classes) {
	        if (props.className) {
	            classes.push(props.className);
	        }
	
	        props.className = classes.join(' ');
	    }
	
	    return props.namespace ? tagName : tagName.toUpperCase();
	}


/***/ },
/* 29 */
/***/ function(module, exports) {

	/*!
	 * Cross-Browser Split 1.1.1
	 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
	 * Available under the MIT License
	 * ECMAScript compliant, uniform cross-browser split method
	 */
	
	/**
	 * Splits a string into an array of strings using a regex or string separator. Matches of the
	 * separator are not included in the result array. However, if `separator` is a regex that contains
	 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
	 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
	 * cross-browser.
	 * @param {String} str String to split.
	 * @param {RegExp|String} separator Regex or string to use for separating the string.
	 * @param {Number} [limit] Maximum number of items to include in the result array.
	 * @returns {Array} Array of substrings.
	 * @example
	 *
	 * // Basic use
	 * split('a b c d', ' ');
	 * // -> ['a', 'b', 'c', 'd']
	 *
	 * // With limit
	 * split('a b c d', ' ', 2);
	 * // -> ['a', 'b']
	 *
	 * // Backreferences in result array
	 * split('..word1 word2..', /([a-z]+)(\d+)/i);
	 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
	 */
	module.exports = (function split(undef) {
	
	  var nativeSplit = String.prototype.split,
	    compliantExecNpcg = /()??/.exec("")[1] === undef,
	    // NPCG: nonparticipating capturing group
	    self;
	
	  self = function(str, separator, limit) {
	    // If `separator` is not a regex, use `nativeSplit`
	    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
	      return nativeSplit.call(str, separator, limit);
	    }
	    var output = [],
	      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
	      (separator.sticky ? "y" : ""),
	      // Firefox 3+
	      lastLastIndex = 0,
	      // Make `global` and avoid `lastIndex` issues by working with a copy
	      separator = new RegExp(separator.source, flags + "g"),
	      separator2, match, lastIndex, lastLength;
	    str += ""; // Type-convert
	    if (!compliantExecNpcg) {
	      // Doesn't need flags gy, but they don't hurt
	      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
	    }
	    /* Values for `limit`, per the spec:
	     * If undefined: 4294967295 // Math.pow(2, 32) - 1
	     * If 0, Infinity, or NaN: 0
	     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
	     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
	     * If other: Type-convert, then use the above rules
	     */
	    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
	    limit >>> 0; // ToUint32(limit)
	    while (match = separator.exec(str)) {
	      // `separator.lastIndex` is not reliable cross-browser
	      lastIndex = match.index + match[0].length;
	      if (lastIndex > lastLastIndex) {
	        output.push(str.slice(lastLastIndex, match.index));
	        // Fix browsers whose `exec` methods don't consistently return `undefined` for
	        // nonparticipating capturing groups
	        if (!compliantExecNpcg && match.length > 1) {
	          match[0].replace(separator2, function() {
	            for (var i = 1; i < arguments.length - 2; i++) {
	              if (arguments[i] === undef) {
	                match[i] = undef;
	              }
	            }
	          });
	        }
	        if (match.length > 1 && match.index < str.length) {
	          Array.prototype.push.apply(output, match.slice(1));
	        }
	        lastLength = match[0].length;
	        lastLastIndex = lastIndex;
	        if (output.length >= limit) {
	          break;
	        }
	      }
	      if (separator.lastIndex === match.index) {
	        separator.lastIndex++; // Avoid an infinite loop
	      }
	    }
	    if (lastLastIndex === str.length) {
	      if (lastLength || !separator.test("")) {
	        output.push("");
	      }
	    } else {
	      output.push(str.slice(lastLastIndex));
	    }
	    return output.length > limit ? output.slice(0, limit) : output;
	  };
	
	  return self;
	})();


/***/ },
/* 30 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = SoftSetHook;
	
	function SoftSetHook(value) {
	    if (!(this instanceof SoftSetHook)) {
	        return new SoftSetHook(value);
	    }
	
	    this.value = value;
	}
	
	SoftSetHook.prototype.hook = function (node, propertyName) {
	    if (node[propertyName] !== this.value) {
	        node[propertyName] = this.value;
	    }
	};


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var EvStore = __webpack_require__(32);
	
	module.exports = EvHook;
	
	function EvHook(value) {
	    if (!(this instanceof EvHook)) {
	        return new EvHook(value);
	    }
	
	    this.value = value;
	}
	
	EvHook.prototype.hook = function (node, propertyName) {
	    var es = EvStore(node);
	    var propName = propertyName.substr(3);
	
	    es[propName] = this.value;
	};
	
	EvHook.prototype.unhook = function(node, propertyName) {
	    var es = EvStore(node);
	    var propName = propertyName.substr(3);
	
	    es[propName] = undefined;
	};


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var OneVersionConstraint = __webpack_require__(33);
	
	var MY_VERSION = '7';
	OneVersionConstraint('ev-store', MY_VERSION);
	
	var hashKey = '__EV_STORE_KEY@' + MY_VERSION;
	
	module.exports = EvStore;
	
	function EvStore(elem) {
	    var hash = elem[hashKey];
	
	    if (!hash) {
	        hash = elem[hashKey] = {};
	    }
	
	    return hash;
	}


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Individual = __webpack_require__(34);
	
	module.exports = OneVersion;
	
	function OneVersion(moduleName, version, defaultValue) {
	    var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
	    var enforceKey = key + '_ENFORCE_SINGLETON';
	
	    var versionValue = Individual(enforceKey, version);
	
	    if (versionValue !== version) {
	        throw new Error('Can only have one copy of ' +
	            moduleName + '.\n' +
	            'You already have version ' + versionValue +
	            ' installed.\n' +
	            'This means you cannot install version ' + version);
	    }
	
	    return Individual(key, defaultValue);
	}


/***/ },
/* 34 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	/*global window, global*/
	
	var root = typeof window !== 'undefined' ?
	    window : typeof global !== 'undefined' ?
	    global : {};
	
	module.exports = Individual;
	
	function Individual(key, value) {
	    if (key in root) {
	        return root[key];
	    }
	
	    root[key] = value;
	
	    return value;
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var createElement = __webpack_require__(36)
	
	module.exports = createElement


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var document = __webpack_require__(37)
	
	var applyProperties = __webpack_require__(39)
	
	var isVNode = __webpack_require__(22)
	var isVText = __webpack_require__(27)
	var isWidget = __webpack_require__(23)
	var handleThunk = __webpack_require__(41)
	
	module.exports = createElement
	
	function createElement(vnode, opts) {
	    var doc = opts ? opts.document || document : document
	    var warn = opts ? opts.warn : null
	
	    vnode = handleThunk(vnode).a
	
	    if (isWidget(vnode)) {
	        return vnode.init()
	    } else if (isVText(vnode)) {
	        return doc.createTextNode(vnode.text)
	    } else if (!isVNode(vnode)) {
	        if (warn) {
	            warn("Item is not a valid virtual dom node", vnode)
	        }
	        return null
	    }
	
	    var node = (vnode.namespace === null) ?
	        doc.createElement(vnode.tagName) :
	        doc.createElementNS(vnode.namespace, vnode.tagName)
	
	    var props = vnode.properties
	    applyProperties(node, props)
	
	    var children = vnode.children
	
	    for (var i = 0; i < children.length; i++) {
	        var childNode = createElement(children[i], opts)
	        if (childNode) {
	            node.appendChild(childNode)
	        }
	    }
	
	    return node
	}


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var topLevel = typeof global !== 'undefined' ? global :
	    typeof window !== 'undefined' ? window : {}
	var minDoc = __webpack_require__(38);
	
	if (typeof document !== 'undefined') {
	    module.exports = document;
	} else {
	    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];
	
	    if (!doccy) {
	        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
	    }
	
	    module.exports = doccy;
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 38 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(40)
	var isHook = __webpack_require__(25)
	
	module.exports = applyProperties
	
	function applyProperties(node, props, previous) {
	    for (var propName in props) {
	        var propValue = props[propName]
	
	        if (propValue === undefined) {
	            removeProperty(node, propName, propValue, previous);
	        } else if (isHook(propValue)) {
	            removeProperty(node, propName, propValue, previous)
	            if (propValue.hook) {
	                propValue.hook(node,
	                    propName,
	                    previous ? previous[propName] : undefined)
	            }
	        } else {
	            if (isObject(propValue)) {
	                patchObject(node, props, previous, propName, propValue);
	            } else {
	                node[propName] = propValue
	            }
	        }
	    }
	}
	
	function removeProperty(node, propName, propValue, previous) {
	    if (previous) {
	        var previousValue = previous[propName]
	
	        if (!isHook(previousValue)) {
	            if (propName === "attributes") {
	                for (var attrName in previousValue) {
	                    node.removeAttribute(attrName)
	                }
	            } else if (propName === "style") {
	                for (var i in previousValue) {
	                    node.style[i] = ""
	                }
	            } else if (typeof previousValue === "string") {
	                node[propName] = ""
	            } else {
	                node[propName] = null
	            }
	        } else if (previousValue.unhook) {
	            previousValue.unhook(node, propName, propValue)
	        }
	    }
	}
	
	function patchObject(node, props, previous, propName, propValue) {
	    var previousValue = previous ? previous[propName] : undefined
	
	    // Set attributes
	    if (propName === "attributes") {
	        for (var attrName in propValue) {
	            var attrValue = propValue[attrName]
	
	            if (attrValue === undefined) {
	                node.removeAttribute(attrName)
	            } else {
	                node.setAttribute(attrName, attrValue)
	            }
	        }
	
	        return
	    }
	
	    if(previousValue && isObject(previousValue) &&
	        getPrototype(previousValue) !== getPrototype(propValue)) {
	        node[propName] = propValue
	        return
	    }
	
	    if (!isObject(node[propName])) {
	        node[propName] = {}
	    }
	
	    var replacer = propName === "style" ? "" : undefined
	
	    for (var k in propValue) {
	        var value = propValue[k]
	        node[propName][k] = (value === undefined) ? replacer : value
	    }
	}
	
	function getPrototype(value) {
	    if (Object.getPrototypeOf) {
	        return Object.getPrototypeOf(value)
	    } else if (value.__proto__) {
	        return value.__proto__
	    } else if (value.constructor) {
	        return value.constructor.prototype
	    }
	}


/***/ },
/* 40 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function isObject(x) {
		return typeof x === "object" && x !== null;
	};


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var isVNode = __webpack_require__(22)
	var isVText = __webpack_require__(27)
	var isWidget = __webpack_require__(23)
	var isThunk = __webpack_require__(24)
	
	module.exports = handleThunk
	
	function handleThunk(a, b) {
	    var renderedA = a
	    var renderedB = b
	
	    if (isThunk(b)) {
	        renderedB = renderThunk(b, a)
	    }
	
	    if (isThunk(a)) {
	        renderedA = renderThunk(a, null)
	    }
	
	    return {
	        a: renderedA,
	        b: renderedB
	    }
	}
	
	function renderThunk(thunk, previous) {
	    var renderedThunk = thunk.vnode
	
	    if (!renderedThunk) {
	        renderedThunk = thunk.vnode = thunk.render(previous)
	    }
	
	    if (!(isVNode(renderedThunk) ||
	            isVText(renderedThunk) ||
	            isWidget(renderedThunk))) {
	        throw new Error("thunk did not return a valid node");
	    }
	
	    return renderedThunk
	}


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var diff = __webpack_require__(43)
	
	module.exports = diff


/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var isArray = __webpack_require__(19)
	
	var VPatch = __webpack_require__(44)
	var isVNode = __webpack_require__(22)
	var isVText = __webpack_require__(27)
	var isWidget = __webpack_require__(23)
	var isThunk = __webpack_require__(24)
	var handleThunk = __webpack_require__(41)
	
	var diffProps = __webpack_require__(45)
	
	module.exports = diff
	
	function diff(a, b) {
	    var patch = { a: a }
	    walk(a, b, patch, 0)
	    return patch
	}
	
	function walk(a, b, patch, index) {
	    if (a === b) {
	        return
	    }
	
	    var apply = patch[index]
	    var applyClear = false
	
	    if (isThunk(a) || isThunk(b)) {
	        thunks(a, b, patch, index)
	    } else if (b == null) {
	
	        // If a is a widget we will add a remove patch for it
	        // Otherwise any child widgets/hooks must be destroyed.
	        // This prevents adding two remove patches for a widget.
	        if (!isWidget(a)) {
	            clearState(a, patch, index)
	            apply = patch[index]
	        }
	
	        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
	    } else if (isVNode(b)) {
	        if (isVNode(a)) {
	            if (a.tagName === b.tagName &&
	                a.namespace === b.namespace &&
	                a.key === b.key) {
	                var propsPatch = diffProps(a.properties, b.properties)
	                if (propsPatch) {
	                    apply = appendPatch(apply,
	                        new VPatch(VPatch.PROPS, a, propsPatch))
	                }
	                apply = diffChildren(a, b, patch, apply, index)
	            } else {
	                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
	                applyClear = true
	            }
	        } else {
	            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
	            applyClear = true
	        }
	    } else if (isVText(b)) {
	        if (!isVText(a)) {
	            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
	            applyClear = true
	        } else if (a.text !== b.text) {
	            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
	        }
	    } else if (isWidget(b)) {
	        if (!isWidget(a)) {
	            applyClear = true
	        }
	
	        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
	    }
	
	    if (apply) {
	        patch[index] = apply
	    }
	
	    if (applyClear) {
	        clearState(a, patch, index)
	    }
	}
	
	function diffChildren(a, b, patch, apply, index) {
	    var aChildren = a.children
	    var orderedSet = reorder(aChildren, b.children)
	    var bChildren = orderedSet.children
	
	    var aLen = aChildren.length
	    var bLen = bChildren.length
	    var len = aLen > bLen ? aLen : bLen
	
	    for (var i = 0; i < len; i++) {
	        var leftNode = aChildren[i]
	        var rightNode = bChildren[i]
	        index += 1
	
	        if (!leftNode) {
	            if (rightNode) {
	                // Excess nodes in b need to be added
	                apply = appendPatch(apply,
	                    new VPatch(VPatch.INSERT, null, rightNode))
	            }
	        } else {
	            walk(leftNode, rightNode, patch, index)
	        }
	
	        if (isVNode(leftNode) && leftNode.count) {
	            index += leftNode.count
	        }
	    }
	
	    if (orderedSet.moves) {
	        // Reorder nodes last
	        apply = appendPatch(apply, new VPatch(
	            VPatch.ORDER,
	            a,
	            orderedSet.moves
	        ))
	    }
	
	    return apply
	}
	
	function clearState(vNode, patch, index) {
	    // TODO: Make this a single walk, not two
	    unhook(vNode, patch, index)
	    destroyWidgets(vNode, patch, index)
	}
	
	// Patch records for all destroyed widgets must be added because we need
	// a DOM node reference for the destroy function
	function destroyWidgets(vNode, patch, index) {
	    if (isWidget(vNode)) {
	        if (typeof vNode.destroy === "function") {
	            patch[index] = appendPatch(
	                patch[index],
	                new VPatch(VPatch.REMOVE, vNode, null)
	            )
	        }
	    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
	        var children = vNode.children
	        var len = children.length
	        for (var i = 0; i < len; i++) {
	            var child = children[i]
	            index += 1
	
	            destroyWidgets(child, patch, index)
	
	            if (isVNode(child) && child.count) {
	                index += child.count
	            }
	        }
	    } else if (isThunk(vNode)) {
	        thunks(vNode, null, patch, index)
	    }
	}
	
	// Create a sub-patch for thunks
	function thunks(a, b, patch, index) {
	    var nodes = handleThunk(a, b)
	    var thunkPatch = diff(nodes.a, nodes.b)
	    if (hasPatches(thunkPatch)) {
	        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
	    }
	}
	
	function hasPatches(patch) {
	    for (var index in patch) {
	        if (index !== "a") {
	            return true
	        }
	    }
	
	    return false
	}
	
	// Execute hooks when two nodes are identical
	function unhook(vNode, patch, index) {
	    if (isVNode(vNode)) {
	        if (vNode.hooks) {
	            patch[index] = appendPatch(
	                patch[index],
	                new VPatch(
	                    VPatch.PROPS,
	                    vNode,
	                    undefinedKeys(vNode.hooks)
	                )
	            )
	        }
	
	        if (vNode.descendantHooks || vNode.hasThunks) {
	            var children = vNode.children
	            var len = children.length
	            for (var i = 0; i < len; i++) {
	                var child = children[i]
	                index += 1
	
	                unhook(child, patch, index)
	
	                if (isVNode(child) && child.count) {
	                    index += child.count
	                }
	            }
	        }
	    } else if (isThunk(vNode)) {
	        thunks(vNode, null, patch, index)
	    }
	}
	
	function undefinedKeys(obj) {
	    var result = {}
	
	    for (var key in obj) {
	        result[key] = undefined
	    }
	
	    return result
	}
	
	// List diff, naive left to right reordering
	function reorder(aChildren, bChildren) {
	    // O(M) time, O(M) memory
	    var bChildIndex = keyIndex(bChildren)
	    var bKeys = bChildIndex.keys
	    var bFree = bChildIndex.free
	
	    if (bFree.length === bChildren.length) {
	        return {
	            children: bChildren,
	            moves: null
	        }
	    }
	
	    // O(N) time, O(N) memory
	    var aChildIndex = keyIndex(aChildren)
	    var aKeys = aChildIndex.keys
	    var aFree = aChildIndex.free
	
	    if (aFree.length === aChildren.length) {
	        return {
	            children: bChildren,
	            moves: null
	        }
	    }
	
	    // O(MAX(N, M)) memory
	    var newChildren = []
	
	    var freeIndex = 0
	    var freeCount = bFree.length
	    var deletedItems = 0
	
	    // Iterate through a and match a node in b
	    // O(N) time,
	    for (var i = 0 ; i < aChildren.length; i++) {
	        var aItem = aChildren[i]
	        var itemIndex
	
	        if (aItem.key) {
	            if (bKeys.hasOwnProperty(aItem.key)) {
	                // Match up the old keys
	                itemIndex = bKeys[aItem.key]
	                newChildren.push(bChildren[itemIndex])
	
	            } else {
	                // Remove old keyed items
	                itemIndex = i - deletedItems++
	                newChildren.push(null)
	            }
	        } else {
	            // Match the item in a with the next free item in b
	            if (freeIndex < freeCount) {
	                itemIndex = bFree[freeIndex++]
	                newChildren.push(bChildren[itemIndex])
	            } else {
	                // There are no free items in b to match with
	                // the free items in a, so the extra free nodes
	                // are deleted.
	                itemIndex = i - deletedItems++
	                newChildren.push(null)
	            }
	        }
	    }
	
	    var lastFreeIndex = freeIndex >= bFree.length ?
	        bChildren.length :
	        bFree[freeIndex]
	
	    // Iterate through b and append any new keys
	    // O(M) time
	    for (var j = 0; j < bChildren.length; j++) {
	        var newItem = bChildren[j]
	
	        if (newItem.key) {
	            if (!aKeys.hasOwnProperty(newItem.key)) {
	                // Add any new keyed items
	                // We are adding new items to the end and then sorting them
	                // in place. In future we should insert new items in place.
	                newChildren.push(newItem)
	            }
	        } else if (j >= lastFreeIndex) {
	            // Add any leftover non-keyed items
	            newChildren.push(newItem)
	        }
	    }
	
	    var simulate = newChildren.slice()
	    var simulateIndex = 0
	    var removes = []
	    var inserts = []
	    var simulateItem
	
	    for (var k = 0; k < bChildren.length;) {
	        var wantedItem = bChildren[k]
	        simulateItem = simulate[simulateIndex]
	
	        // remove items
	        while (simulateItem === null && simulate.length) {
	            removes.push(remove(simulate, simulateIndex, null))
	            simulateItem = simulate[simulateIndex]
	        }
	
	        if (!simulateItem || simulateItem.key !== wantedItem.key) {
	            // if we need a key in this position...
	            if (wantedItem.key) {
	                if (simulateItem && simulateItem.key) {
	                    // if an insert doesn't put this key in place, it needs to move
	                    if (bKeys[simulateItem.key] !== k + 1) {
	                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
	                        simulateItem = simulate[simulateIndex]
	                        // if the remove didn't put the wanted item in place, we need to insert it
	                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
	                            inserts.push({key: wantedItem.key, to: k})
	                        }
	                        // items are matching, so skip ahead
	                        else {
	                            simulateIndex++
	                        }
	                    }
	                    else {
	                        inserts.push({key: wantedItem.key, to: k})
	                    }
	                }
	                else {
	                    inserts.push({key: wantedItem.key, to: k})
	                }
	                k++
	            }
	            // a key in simulate has no matching wanted key, remove it
	            else if (simulateItem && simulateItem.key) {
	                removes.push(remove(simulate, simulateIndex, simulateItem.key))
	            }
	        }
	        else {
	            simulateIndex++
	            k++
	        }
	    }
	
	    // remove all the remaining nodes from simulate
	    while(simulateIndex < simulate.length) {
	        simulateItem = simulate[simulateIndex]
	        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
	    }
	
	    // If the only moves we have are deletes then we can just
	    // let the delete patch remove these items.
	    if (removes.length === deletedItems && !inserts.length) {
	        return {
	            children: newChildren,
	            moves: null
	        }
	    }
	
	    return {
	        children: newChildren,
	        moves: {
	            removes: removes,
	            inserts: inserts
	        }
	    }
	}
	
	function remove(arr, index, key) {
	    arr.splice(index, 1)
	
	    return {
	        from: index,
	        key: key
	    }
	}
	
	function keyIndex(children) {
	    var keys = {}
	    var free = []
	    var length = children.length
	
	    for (var i = 0; i < length; i++) {
	        var child = children[i]
	
	        if (child.key) {
	            keys[child.key] = i
	        } else {
	            free.push(i)
	        }
	    }
	
	    return {
	        keys: keys,     // A hash of key name to index
	        free: free      // An array of unkeyed item indices
	    }
	}
	
	function appendPatch(apply, patch) {
	    if (apply) {
	        if (isArray(apply)) {
	            apply.push(patch)
	        } else {
	            apply = [apply, patch]
	        }
	
	        return apply
	    } else {
	        return patch
	    }
	}


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var version = __webpack_require__(21)
	
	VirtualPatch.NONE = 0
	VirtualPatch.VTEXT = 1
	VirtualPatch.VNODE = 2
	VirtualPatch.WIDGET = 3
	VirtualPatch.PROPS = 4
	VirtualPatch.ORDER = 5
	VirtualPatch.INSERT = 6
	VirtualPatch.REMOVE = 7
	VirtualPatch.THUNK = 8
	
	module.exports = VirtualPatch
	
	function VirtualPatch(type, vNode, patch) {
	    this.type = Number(type)
	    this.vNode = vNode
	    this.patch = patch
	}
	
	VirtualPatch.prototype.version = version
	VirtualPatch.prototype.type = "VirtualPatch"


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(40)
	var isHook = __webpack_require__(25)
	
	module.exports = diffProps
	
	function diffProps(a, b) {
	    var diff
	
	    for (var aKey in a) {
	        if (!(aKey in b)) {
	            diff = diff || {}
	            diff[aKey] = undefined
	        }
	
	        var aValue = a[aKey]
	        var bValue = b[aKey]
	
	        if (aValue === bValue) {
	            continue
	        } else if (isObject(aValue) && isObject(bValue)) {
	            if (getPrototype(bValue) !== getPrototype(aValue)) {
	                diff = diff || {}
	                diff[aKey] = bValue
	            } else if (isHook(bValue)) {
	                 diff = diff || {}
	                 diff[aKey] = bValue
	            } else {
	                var objectDiff = diffProps(aValue, bValue)
	                if (objectDiff) {
	                    diff = diff || {}
	                    diff[aKey] = objectDiff
	                }
	            }
	        } else {
	            diff = diff || {}
	            diff[aKey] = bValue
	        }
	    }
	
	    for (var bKey in b) {
	        if (!(bKey in a)) {
	            diff = diff || {}
	            diff[bKey] = b[bKey]
	        }
	    }
	
	    return diff
	}
	
	function getPrototype(value) {
	  if (Object.getPrototypeOf) {
	    return Object.getPrototypeOf(value)
	  } else if (value.__proto__) {
	    return value.__proto__
	  } else if (value.constructor) {
	    return value.constructor.prototype
	  }
	}


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var patch = __webpack_require__(47)
	
	module.exports = patch


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var document = __webpack_require__(37)
	var isArray = __webpack_require__(19)
	
	var render = __webpack_require__(36)
	var domIndex = __webpack_require__(48)
	var patchOp = __webpack_require__(49)
	module.exports = patch
	
	function patch(rootNode, patches, renderOptions) {
	    renderOptions = renderOptions || {}
	    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
	        ? renderOptions.patch
	        : patchRecursive
	    renderOptions.render = renderOptions.render || render
	
	    return renderOptions.patch(rootNode, patches, renderOptions)
	}
	
	function patchRecursive(rootNode, patches, renderOptions) {
	    var indices = patchIndices(patches)
	
	    if (indices.length === 0) {
	        return rootNode
	    }
	
	    var index = domIndex(rootNode, patches.a, indices)
	    var ownerDocument = rootNode.ownerDocument
	
	    if (!renderOptions.document && ownerDocument !== document) {
	        renderOptions.document = ownerDocument
	    }
	
	    for (var i = 0; i < indices.length; i++) {
	        var nodeIndex = indices[i]
	        rootNode = applyPatch(rootNode,
	            index[nodeIndex],
	            patches[nodeIndex],
	            renderOptions)
	    }
	
	    return rootNode
	}
	
	function applyPatch(rootNode, domNode, patchList, renderOptions) {
	    if (!domNode) {
	        return rootNode
	    }
	
	    var newNode
	
	    if (isArray(patchList)) {
	        for (var i = 0; i < patchList.length; i++) {
	            newNode = patchOp(patchList[i], domNode, renderOptions)
	
	            if (domNode === rootNode) {
	                rootNode = newNode
	            }
	        }
	    } else {
	        newNode = patchOp(patchList, domNode, renderOptions)
	
	        if (domNode === rootNode) {
	            rootNode = newNode
	        }
	    }
	
	    return rootNode
	}
	
	function patchIndices(patches) {
	    var indices = []
	
	    for (var key in patches) {
	        if (key !== "a") {
	            indices.push(Number(key))
	        }
	    }
	
	    return indices
	}


/***/ },
/* 48 */
/***/ function(module, exports) {

	// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
	// We don't want to read all of the DOM nodes in the tree so we use
	// the in-order tree indexing to eliminate recursion down certain branches.
	// We only recurse into a DOM node if we know that it contains a child of
	// interest.
	
	var noChild = {}
	
	module.exports = domIndex
	
	function domIndex(rootNode, tree, indices, nodes) {
	    if (!indices || indices.length === 0) {
	        return {}
	    } else {
	        indices.sort(ascending)
	        return recurse(rootNode, tree, indices, nodes, 0)
	    }
	}
	
	function recurse(rootNode, tree, indices, nodes, rootIndex) {
	    nodes = nodes || {}
	
	
	    if (rootNode) {
	        if (indexInRange(indices, rootIndex, rootIndex)) {
	            nodes[rootIndex] = rootNode
	        }
	
	        var vChildren = tree.children
	
	        if (vChildren) {
	
	            var childNodes = rootNode.childNodes
	
	            for (var i = 0; i < tree.children.length; i++) {
	                rootIndex += 1
	
	                var vChild = vChildren[i] || noChild
	                var nextIndex = rootIndex + (vChild.count || 0)
	
	                // skip recursion down the tree if there are no nodes down here
	                if (indexInRange(indices, rootIndex, nextIndex)) {
	                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
	                }
	
	                rootIndex = nextIndex
	            }
	        }
	    }
	
	    return nodes
	}
	
	// Binary search for an index in the interval [left, right]
	function indexInRange(indices, left, right) {
	    if (indices.length === 0) {
	        return false
	    }
	
	    var minIndex = 0
	    var maxIndex = indices.length - 1
	    var currentIndex
	    var currentItem
	
	    while (minIndex <= maxIndex) {
	        currentIndex = ((maxIndex + minIndex) / 2) >> 0
	        currentItem = indices[currentIndex]
	
	        if (minIndex === maxIndex) {
	            return currentItem >= left && currentItem <= right
	        } else if (currentItem < left) {
	            minIndex = currentIndex + 1
	        } else  if (currentItem > right) {
	            maxIndex = currentIndex - 1
	        } else {
	            return true
	        }
	    }
	
	    return false;
	}
	
	function ascending(a, b) {
	    return a > b ? 1 : -1
	}


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var applyProperties = __webpack_require__(39)
	
	var isWidget = __webpack_require__(23)
	var VPatch = __webpack_require__(44)
	
	var updateWidget = __webpack_require__(50)
	
	module.exports = applyPatch
	
	function applyPatch(vpatch, domNode, renderOptions) {
	    var type = vpatch.type
	    var vNode = vpatch.vNode
	    var patch = vpatch.patch
	
	    switch (type) {
	        case VPatch.REMOVE:
	            return removeNode(domNode, vNode)
	        case VPatch.INSERT:
	            return insertNode(domNode, patch, renderOptions)
	        case VPatch.VTEXT:
	            return stringPatch(domNode, vNode, patch, renderOptions)
	        case VPatch.WIDGET:
	            return widgetPatch(domNode, vNode, patch, renderOptions)
	        case VPatch.VNODE:
	            return vNodePatch(domNode, vNode, patch, renderOptions)
	        case VPatch.ORDER:
	            reorderChildren(domNode, patch)
	            return domNode
	        case VPatch.PROPS:
	            applyProperties(domNode, patch, vNode.properties)
	            return domNode
	        case VPatch.THUNK:
	            return replaceRoot(domNode,
	                renderOptions.patch(domNode, patch, renderOptions))
	        default:
	            return domNode
	    }
	}
	
	function removeNode(domNode, vNode) {
	    var parentNode = domNode.parentNode
	
	    if (parentNode) {
	        parentNode.removeChild(domNode)
	    }
	
	    destroyWidget(domNode, vNode);
	
	    return null
	}
	
	function insertNode(parentNode, vNode, renderOptions) {
	    var newNode = renderOptions.render(vNode, renderOptions)
	
	    if (parentNode) {
	        parentNode.appendChild(newNode)
	    }
	
	    return parentNode
	}
	
	function stringPatch(domNode, leftVNode, vText, renderOptions) {
	    var newNode
	
	    if (domNode.nodeType === 3) {
	        domNode.replaceData(0, domNode.length, vText.text)
	        newNode = domNode
	    } else {
	        var parentNode = domNode.parentNode
	        newNode = renderOptions.render(vText, renderOptions)
	
	        if (parentNode && newNode !== domNode) {
	            parentNode.replaceChild(newNode, domNode)
	        }
	    }
	
	    return newNode
	}
	
	function widgetPatch(domNode, leftVNode, widget, renderOptions) {
	    var updating = updateWidget(leftVNode, widget)
	    var newNode
	
	    if (updating) {
	        newNode = widget.update(leftVNode, domNode) || domNode
	    } else {
	        newNode = renderOptions.render(widget, renderOptions)
	    }
	
	    var parentNode = domNode.parentNode
	
	    if (parentNode && newNode !== domNode) {
	        parentNode.replaceChild(newNode, domNode)
	    }
	
	    if (!updating) {
	        destroyWidget(domNode, leftVNode)
	    }
	
	    return newNode
	}
	
	function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
	    var parentNode = domNode.parentNode
	    var newNode = renderOptions.render(vNode, renderOptions)
	
	    if (parentNode && newNode !== domNode) {
	        parentNode.replaceChild(newNode, domNode)
	    }
	
	    return newNode
	}
	
	function destroyWidget(domNode, w) {
	    if (typeof w.destroy === "function" && isWidget(w)) {
	        w.destroy(domNode)
	    }
	}
	
	function reorderChildren(domNode, moves) {
	    var childNodes = domNode.childNodes
	    var keyMap = {}
	    var node
	    var remove
	    var insert
	
	    for (var i = 0; i < moves.removes.length; i++) {
	        remove = moves.removes[i]
	        node = childNodes[remove.from]
	        if (remove.key) {
	            keyMap[remove.key] = node
	        }
	        domNode.removeChild(node)
	    }
	
	    var length = childNodes.length
	    for (var j = 0; j < moves.inserts.length; j++) {
	        insert = moves.inserts[j]
	        node = keyMap[insert.key]
	        // this is the weirdest bug i've ever seen in webkit
	        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
	    }
	}
	
	function replaceRoot(oldRoot, newRoot) {
	    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
	        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
	    }
	
	    return newRoot;
	}


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var isWidget = __webpack_require__(23)
	
	module.exports = updateWidget
	
	function updateWidget(a, b) {
	    if (isWidget(a) && isWidget(b)) {
	        if ("name" in a && "name" in b) {
	            return a.id === b.id
	        } else {
	            return a.init === b.init
	        }
	    }
	
	    return false
	}


/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCBkMjMzM2E2NTM0M2FiOWY4ZmZmMCIsIndlYnBhY2s6Ly8vLi9saWIvY2xpZW50UnVudGltZS5qcyIsIndlYnBhY2s6Ly8vLi9+L21haW4tbG9vcC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L21haW4tbG9vcC9+L3JhZi9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L21haW4tbG9vcC9+L3JhZi9+L3BlcmZvcm1hbmNlLW5vdy9saWIvcGVyZm9ybWFuY2Utbm93LmpzIiwid2VicGFjazovLy8uLi8ubnZtL3ZlcnNpb25zL25vZGUvdjAuMTIuMC9saWIvfi9ub2RlLWxpYnMtYnJvd3Nlci9+L3Byb2Nlc3MvYnJvd3Nlci5qcyIsIndlYnBhY2s6Ly8vLi9+L21haW4tbG9vcC9+L2Vycm9yL3R5cGVkLmpzIiwid2VicGFjazovLy8uL34vbWFpbi1sb29wL34vZXJyb3Ivfi9jYW1lbGl6ZS9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L21haW4tbG9vcC9+L2Vycm9yL34vc3RyaW5nLXRlbXBsYXRlL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vbWFpbi1sb29wL34vZXJyb3Ivfi94dGVuZC9tdXRhYmxlLmpzIiwid2VicGFjazovLy8uL2xpYi9jcmVhdGUtdmRvbS5qcyIsIndlYnBhY2s6Ly8vLi9saWIvaHRtbHRlbXBsYXRlLXBhcnNlci5qcyIsIndlYnBhY2s6Ly8vLi9+L2xvZGFzaC5mbGF0dGVuL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vbG9kYXNoLmZsYXR0ZW4vfi9sb2Rhc2guX2Jhc2VmbGF0dGVuL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vbG9kYXNoLmZsYXR0ZW4vfi9sb2Rhc2guX2Jhc2VmbGF0dGVuL34vbG9kYXNoLmlzYXJndW1lbnRzL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vbG9kYXNoLmZsYXR0ZW4vfi9sb2Rhc2guX2Jhc2VmbGF0dGVuL34vbG9kYXNoLmlzYXJyYXkvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9sb2Rhc2guZmxhdHRlbi9+L2xvZGFzaC5faXNpdGVyYXRlZWNhbGwvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi90cmF2ZXJzZS9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3ZpcnR1YWwtZG9tL2guanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS92aXJ0dWFsLWh5cGVyc2NyaXB0L2luZGV4LmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vfi94LWlzLWFycmF5L2luZGV4LmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vdm5vZGUvdm5vZGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS92bm9kZS92ZXJzaW9uLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vdm5vZGUvaXMtdm5vZGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS92bm9kZS9pcy13aWRnZXQuanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS92bm9kZS9pcy10aHVuay5qcyIsIndlYnBhY2s6Ly8vLi9+L3ZpcnR1YWwtZG9tL3Zub2RlL2lzLXZob29rLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vdm5vZGUvdnRleHQuanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS92bm9kZS9pcy12dGV4dC5qcyIsIndlYnBhY2s6Ly8vLi9+L3ZpcnR1YWwtZG9tL3ZpcnR1YWwtaHlwZXJzY3JpcHQvcGFyc2UtdGFnLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vfi9icm93c2VyLXNwbGl0L2luZGV4LmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vdmlydHVhbC1oeXBlcnNjcmlwdC9ob29rcy9zb2Z0LXNldC1ob29rLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vdmlydHVhbC1oeXBlcnNjcmlwdC9ob29rcy9ldi1ob29rLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vfi9ldi1zdG9yZS9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3ZpcnR1YWwtZG9tL34vZXYtc3RvcmUvfi9pbmRpdmlkdWFsL29uZS12ZXJzaW9uLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vfi9ldi1zdG9yZS9+L2luZGl2aWR1YWwvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS9jcmVhdGUtZWxlbWVudC5qcyIsIndlYnBhY2s6Ly8vLi9+L3ZpcnR1YWwtZG9tL3Zkb20vY3JlYXRlLWVsZW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS9+L2dsb2JhbC9kb2N1bWVudC5qcyIsIndlYnBhY2s6Ly8vbWluLWRvY3VtZW50IChpZ25vcmVkKSIsIndlYnBhY2s6Ly8vLi9+L3ZpcnR1YWwtZG9tL3Zkb20vYXBwbHktcHJvcGVydGllcy5qcyIsIndlYnBhY2s6Ly8vLi9+L3ZpcnR1YWwtZG9tL34vaXMtb2JqZWN0L2luZGV4LmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vdm5vZGUvaGFuZGxlLXRodW5rLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vZGlmZi5qcyIsIndlYnBhY2s6Ly8vLi9+L3ZpcnR1YWwtZG9tL3Z0cmVlL2RpZmYuanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS92bm9kZS92cGF0Y2guanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS92dHJlZS9kaWZmLXByb3BzLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vcGF0Y2guanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS92ZG9tL3BhdGNoLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vdmRvbS9kb20taW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi92aXJ0dWFsLWRvbS92ZG9tL3BhdGNoLW9wLmpzIiwid2VicGFjazovLy8uL34vdmlydHVhbC1kb20vdmRvbS91cGRhdGUtd2lkZ2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPO0FDVkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7O0FDdENBLEtBQUksUUFBUSxHQUFHLG1CQUFPLENBQUMsQ0FBVyxDQUFDLENBQUM7O0FBRXBDLE9BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDYixlQUFVLEVBQUUsbUJBQU8sQ0FBQyxDQUFlLENBQUM7O0FBRXBDLFNBQUksRUFBRSxjQUFTLEtBQUssRUFBRSxNQUFNLEVBQUU7QUFDMUIsYUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7QUFDL0IsbUJBQU0sRUFBRSxtQkFBTyxDQUFDLEVBQTRCLENBQUM7QUFDN0MsaUJBQUksRUFBRSxtQkFBTyxDQUFDLEVBQWtCLENBQUM7QUFDakMsa0JBQUssRUFBRSxtQkFBTyxDQUFDLEVBQW1CLENBQUM7VUFDdEMsQ0FBQyxDQUFDOztBQUVILGdCQUFPLElBQUksQ0FBQztNQUNmO0VBQ0osQzs7Ozs7O0FDZEQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXVCLFdBQVc7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7O0FBRUQ7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiOztBQUVBO0FBQ0E7QUFD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O0FBQ0E7QUFDQTtBQUNBLEVBQUM7O0FBRUQ7QUFDQTtBQUNBOzs7Ozs7O0FDelRBOztBQUVBOzs7Ozs7O0FDRkE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBLE1BQUs7QUFDTDtBQUNBLE1BQUs7QUFDTCx3QkFBdUIsY0FBYztBQUNyQztBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTs7Ozs7OztBQ3hJQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7Ozs7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtB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TDtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBLG9CQUFtQixxQkFBcUI7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDN0NBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBQztBQUNEOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7OztBQ2RBLGdCOzs7Ozs7QUNBQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTs7Ozs7OztBQ2hHQTs7QUFFQTtBQUNBO0FBQ0E7Ozs7Ozs7QUNKQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ3ZDQTs7QUFFQTs7Ozs7OztBQ0ZBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBLGtCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsb0JBQW1CLFNBQVM7QUFDNUI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQSx3QkFBdUIsU0FBUztBQUNoQztBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLDRCQUEyQixTQUFTO0FBQ3BDO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EscUJBQW9CLHNCQUFzQjtBQUMxQztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxvQkFBbUIsc0JBQXNCO0FBQ3pDOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsb0JBQW1CLHNCQUFzQjtBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMEMsMkJBQTJCO0FBQ3JFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXNDLDJCQUEyQjtBQUNqRTtBQUNBO0FBQ0E7QUFDQSxtQ0FBa0MsMkJBQTJCO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBbUIsWUFBWTtBQUMvQjs7QUFFQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7O0FBRUE7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBOzs7Ozs7O0FDMWFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7QUNyQkE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYjtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBOzs7Ozs7O0FDekRBOztBQUVBOzs7Ozs7O0FDRkE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBbUIsb0JBQW9CO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0Esd0JBQXVCLHNCQUFzQjtBQUM3Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBLDRCQUEyQiwwQkFBMEI7QUFDckQ7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQSxVQUFTO0FBQ1Q7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7O0FDcEZBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxvQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDdEpBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTs7QUFFQTtBQUNBIiwiZmlsZSI6ImNsaWVudFJ1bnRpbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcImNsaWVudFJ1bnRpbWVcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiY2xpZW50UnVudGltZVwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIFxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvblxuICoqLyIsIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgZDIzMzNhNjUzNDNhYjlmOGZmZjBcbiAqKi8iLCJ2YXIgbWFpbkxvb3AgPSByZXF1aXJlKCdtYWluLWxvb3AnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlVmRvbTogcmVxdWlyZSgnLi9jcmVhdGUtdmRvbScpLFxuXG4gICAgbG9vcDogZnVuY3Rpb24oc3RhdGUsIHJlbmRlcikge1xuICAgICAgICB2YXIgbG9vcCA9IG1haW5Mb29wKHN0YXRlLCByZW5kZXIsIHtcbiAgICAgICAgICAgIGNyZWF0ZTogcmVxdWlyZSgndmlydHVhbC1kb20vY3JlYXRlLWVsZW1lbnQnKSxcbiAgICAgICAgICAgIGRpZmY6IHJlcXVpcmUoJ3ZpcnR1YWwtZG9tL2RpZmYnKSxcbiAgICAgICAgICAgIHBhdGNoOiByZXF1aXJlKCd2aXJ0dWFsLWRvbS9wYXRjaCcpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBsb29wO1xuICAgIH1cbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2xpYi9jbGllbnRSdW50aW1lLmpzXG4gKiovIiwidmFyIHJhZiA9IHJlcXVpcmUoXCJyYWZcIilcbnZhciBUeXBlZEVycm9yID0gcmVxdWlyZShcImVycm9yL3R5cGVkXCIpXG5cbnZhciBJbnZhbGlkVXBkYXRlSW5SZW5kZXIgPSBUeXBlZEVycm9yKHtcbiAgICB0eXBlOiBcIm1haW4tbG9vcC5pbnZhbGlkLnVwZGF0ZS5pbi1yZW5kZXJcIixcbiAgICBtZXNzYWdlOiBcIm1haW4tbG9vcDogVW5leHBlY3RlZCB1cGRhdGUgb2NjdXJyZWQgaW4gbG9vcC5cXG5cIiArXG4gICAgICAgIFwiV2UgYXJlIGN1cnJlbnRseSByZW5kZXJpbmcgYSB2aWV3LCBcIiArXG4gICAgICAgICAgICBcInlvdSBjYW4ndCBjaGFuZ2Ugc3RhdGUgcmlnaHQgbm93LlxcblwiICtcbiAgICAgICAgXCJUaGUgZGlmZiBpczoge3N0cmluZ0RpZmZ9LlxcblwiICtcbiAgICAgICAgXCJTVUdHRVNURUQgRklYOiBmaW5kIHRoZSBzdGF0ZSBtdXRhdGlvbiBpbiB5b3VyIHZpZXcgXCIgK1xuICAgICAgICAgICAgXCJvciByZW5kZXJpbmcgZnVuY3Rpb24gYW5kIHJlbW92ZSBpdC5cXG5cIiArXG4gICAgICAgIFwiVGhlIHZpZXcgc2hvdWxkIG5vdCBoYXZlIGFueSBzaWRlIGVmZmVjdHMuXFxuXCIsXG4gICAgZGlmZjogbnVsbCxcbiAgICBzdHJpbmdEaWZmOiBudWxsXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1haW5cblxuZnVuY3Rpb24gbWFpbihpbml0aWFsU3RhdGUsIHZpZXcsIG9wdHMpIHtcbiAgICBvcHRzID0gb3B0cyB8fCB7fVxuXG4gICAgdmFyIGN1cnJlbnRTdGF0ZSA9IGluaXRpYWxTdGF0ZVxuICAgIHZhciBjcmVhdGUgPSBvcHRzLmNyZWF0ZVxuICAgIHZhciBkaWZmID0gb3B0cy5kaWZmXG4gICAgdmFyIHBhdGNoID0gb3B0cy5wYXRjaFxuICAgIHZhciByZWRyYXdTY2hlZHVsZWQgPSBmYWxzZVxuXG4gICAgdmFyIHRyZWUgPSBvcHRzLmluaXRpYWxUcmVlIHx8IHZpZXcoY3VycmVudFN0YXRlKVxuICAgIHZhciB0YXJnZXQgPSBvcHRzLnRhcmdldCB8fCBjcmVhdGUodHJlZSwgb3B0cylcbiAgICB2YXIgaW5SZW5kZXJpbmdUcmFuc2FjdGlvbiA9IGZhbHNlXG5cbiAgICBjdXJyZW50U3RhdGUgPSBudWxsXG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgICAgdXBkYXRlOiB1cGRhdGVcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGUoc3RhdGUpIHtcbiAgICAgICAgaWYgKGluUmVuZGVyaW5nVHJhbnNhY3Rpb24pIHtcbiAgICAgICAgICAgIHRocm93IEludmFsaWRVcGRhdGVJblJlbmRlcih7XG4gICAgICAgICAgICAgICAgZGlmZjogc3RhdGUuX2RpZmYsXG4gICAgICAgICAgICAgICAgc3RyaW5nRGlmZjogSlNPTi5zdHJpbmdpZnkoc3RhdGUuX2RpZmYpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGN1cnJlbnRTdGF0ZSA9PT0gbnVsbCAmJiAhcmVkcmF3U2NoZWR1bGVkKSB7XG4gICAgICAgICAgICByZWRyYXdTY2hlZHVsZWQgPSB0cnVlXG4gICAgICAgICAgICByYWYocmVkcmF3KVxuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudFN0YXRlID0gc3RhdGVcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWRyYXcoKSB7XG4gICAgICAgIHJlZHJhd1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoY3VycmVudFN0YXRlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGluUmVuZGVyaW5nVHJhbnNhY3Rpb24gPSB0cnVlXG4gICAgICAgIHZhciBuZXdUcmVlID0gdmlldyhjdXJyZW50U3RhdGUpXG5cbiAgICAgICAgaWYgKG9wdHMuY3JlYXRlT25seSkge1xuICAgICAgICAgICAgaW5SZW5kZXJpbmdUcmFuc2FjdGlvbiA9IGZhbHNlXG4gICAgICAgICAgICBjcmVhdGUobmV3VHJlZSwgb3B0cylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwYXRjaGVzID0gZGlmZih0cmVlLCBuZXdUcmVlLCBvcHRzKVxuICAgICAgICAgICAgaW5SZW5kZXJpbmdUcmFuc2FjdGlvbiA9IGZhbHNlXG4gICAgICAgICAgICB0YXJnZXQgPSBwYXRjaCh0YXJnZXQsIHBhdGNoZXMsIG9wdHMpXG4gICAgICAgIH1cblxuICAgICAgICB0cmVlID0gbmV3VHJlZVxuICAgICAgICBjdXJyZW50U3RhdGUgPSBudWxsXG4gICAgfVxufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbWFpbi1sb29wL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIG5vdyA9IHJlcXVpcmUoJ3BlcmZvcm1hbmNlLW5vdycpXG4gICwgZ2xvYmFsID0gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgPyB7fSA6IHdpbmRvd1xuICAsIHZlbmRvcnMgPSBbJ21veicsICd3ZWJraXQnXVxuICAsIHN1ZmZpeCA9ICdBbmltYXRpb25GcmFtZSdcbiAgLCByYWYgPSBnbG9iYWxbJ3JlcXVlc3QnICsgc3VmZml4XVxuICAsIGNhZiA9IGdsb2JhbFsnY2FuY2VsJyArIHN1ZmZpeF0gfHwgZ2xvYmFsWydjYW5jZWxSZXF1ZXN0JyArIHN1ZmZpeF1cbiAgLCBpc05hdGl2ZSA9IHRydWVcblxuZm9yKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICFyYWY7IGkrKykge1xuICByYWYgPSBnbG9iYWxbdmVuZG9yc1tpXSArICdSZXF1ZXN0JyArIHN1ZmZpeF1cbiAgY2FmID0gZ2xvYmFsW3ZlbmRvcnNbaV0gKyAnQ2FuY2VsJyArIHN1ZmZpeF1cbiAgICAgIHx8IGdsb2JhbFt2ZW5kb3JzW2ldICsgJ0NhbmNlbFJlcXVlc3QnICsgc3VmZml4XVxufVxuXG4vLyBTb21lIHZlcnNpb25zIG9mIEZGIGhhdmUgckFGIGJ1dCBub3QgY0FGXG5pZighcmFmIHx8ICFjYWYpIHtcbiAgaXNOYXRpdmUgPSBmYWxzZVxuXG4gIHZhciBsYXN0ID0gMFxuICAgICwgaWQgPSAwXG4gICAgLCBxdWV1ZSA9IFtdXG4gICAgLCBmcmFtZUR1cmF0aW9uID0gMTAwMCAvIDYwXG5cbiAgcmFmID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBpZihxdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHZhciBfbm93ID0gbm93KClcbiAgICAgICAgLCBuZXh0ID0gTWF0aC5tYXgoMCwgZnJhbWVEdXJhdGlvbiAtIChfbm93IC0gbGFzdCkpXG4gICAgICBsYXN0ID0gbmV4dCArIF9ub3dcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjcCA9IHF1ZXVlLnNsaWNlKDApXG4gICAgICAgIC8vIENsZWFyIHF1ZXVlIGhlcmUgdG8gcHJldmVudFxuICAgICAgICAvLyBjYWxsYmFja3MgZnJvbSBhcHBlbmRpbmcgbGlzdGVuZXJzXG4gICAgICAgIC8vIHRvIHRoZSBjdXJyZW50IGZyYW1lJ3MgcXVldWVcbiAgICAgICAgcXVldWUubGVuZ3RoID0gMFxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgY3AubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZighY3BbaV0uY2FuY2VsbGVkKSB7XG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgIGNwW2ldLmNhbGxiYWNrKGxhc3QpXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgdGhyb3cgZSB9LCAwKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgTWF0aC5yb3VuZChuZXh0KSlcbiAgICB9XG4gICAgcXVldWUucHVzaCh7XG4gICAgICBoYW5kbGU6ICsraWQsXG4gICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICBjYW5jZWxsZWQ6IGZhbHNlXG4gICAgfSlcbiAgICByZXR1cm4gaWRcbiAgfVxuXG4gIGNhZiA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYocXVldWVbaV0uaGFuZGxlID09PSBoYW5kbGUpIHtcbiAgICAgICAgcXVldWVbaV0uY2FuY2VsbGVkID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGZuKSB7XG4gIC8vIFdyYXAgaW4gYSBuZXcgZnVuY3Rpb24gdG8gcHJldmVudFxuICAvLyBgY2FuY2VsYCBwb3RlbnRpYWxseSBiZWluZyBhc3NpZ25lZFxuICAvLyB0byB0aGUgbmF0aXZlIHJBRiBmdW5jdGlvblxuICBpZighaXNOYXRpdmUpIHtcbiAgICByZXR1cm4gcmFmLmNhbGwoZ2xvYmFsLCBmbilcbiAgfVxuICByZXR1cm4gcmFmLmNhbGwoZ2xvYmFsLCBmdW5jdGlvbigpIHtcbiAgICB0cnl7XG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aHJvdyBlIH0sIDApXG4gICAgfVxuICB9KVxufVxubW9kdWxlLmV4cG9ydHMuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gIGNhZi5hcHBseShnbG9iYWwsIGFyZ3VtZW50cylcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L21haW4tbG9vcC9+L3JhZi9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIGdldE5hbm9TZWNvbmRzLCBocnRpbWUsIGxvYWRUaW1lO1xuXG4gIGlmICgodHlwZW9mIHBlcmZvcm1hbmNlICE9PSBcInVuZGVmaW5lZFwiICYmIHBlcmZvcm1hbmNlICE9PSBudWxsKSAmJiBwZXJmb3JtYW5jZS5ub3cpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmIHByb2Nlc3MgIT09IG51bGwpICYmIHByb2Nlc3MuaHJ0aW1lKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAoZ2V0TmFub1NlY29uZHMoKSAtIGxvYWRUaW1lKSAvIDFlNjtcbiAgICB9O1xuICAgIGhydGltZSA9IHByb2Nlc3MuaHJ0aW1lO1xuICAgIGdldE5hbm9TZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaHI7XG4gICAgICBociA9IGhydGltZSgpO1xuICAgICAgcmV0dXJuIGhyWzBdICogMWU5ICsgaHJbMV07XG4gICAgfTtcbiAgICBsb2FkVGltZSA9IGdldE5hbm9TZWNvbmRzKCk7XG4gIH0gZWxzZSBpZiAoRGF0ZS5ub3cpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIERhdGUubm93KCkgLSBsb2FkVGltZTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gRGF0ZS5ub3coKTtcbiAgfSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbG9hZFRpbWU7XG4gICAgfTtcbiAgICBsb2FkVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICB9XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1wZXJmb3JtYW5jZS1ub3cubWFwXG4qL1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbWFpbi1sb29wL34vcmFmL34vcGVyZm9ybWFuY2Utbm93L2xpYi9wZXJmb3JtYW5jZS1ub3cuanNcbiAqKiBtb2R1bGUgaWQgPSAzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi4vLm52bS92ZXJzaW9ucy9ub2RlL3YwLjEyLjAvbGliL34vbm9kZS1saWJzLWJyb3dzZXIvfi9wcm9jZXNzL2Jyb3dzZXIuanNcbiAqKiBtb2R1bGUgaWQgPSA0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgY2FtZWxpemUgPSByZXF1aXJlKFwiY2FtZWxpemVcIilcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoXCJzdHJpbmctdGVtcGxhdGVcIilcbnZhciBleHRlbmQgPSByZXF1aXJlKFwieHRlbmQvbXV0YWJsZVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFR5cGVkRXJyb3JcblxuZnVuY3Rpb24gVHlwZWRFcnJvcihhcmdzKSB7XG4gICAgaWYgKCFhcmdzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImFyZ3MgaXMgcmVxdWlyZWRcIik7XG4gICAgfVxuICAgIGlmICghYXJncy50eXBlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImFyZ3MudHlwZSBpcyByZXF1aXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKCFhcmdzLm1lc3NhZ2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXJncy5tZXNzYWdlIGlzIHJlcXVpcmVkXCIpO1xuICAgIH1cblxuICAgIHZhciBtZXNzYWdlID0gYXJncy5tZXNzYWdlXG5cbiAgICBpZiAoYXJncy50eXBlICYmICFhcmdzLm5hbWUpIHtcbiAgICAgICAgdmFyIGVycm9yTmFtZSA9IGNhbWVsaXplKGFyZ3MudHlwZSkgKyBcIkVycm9yXCJcbiAgICAgICAgYXJncy5uYW1lID0gZXJyb3JOYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBlcnJvck5hbWUuc3Vic3RyKDEpXG4gICAgfVxuXG4gICAgZXh0ZW5kKGNyZWF0ZUVycm9yLCBhcmdzKTtcbiAgICBjcmVhdGVFcnJvci5fbmFtZSA9IGFyZ3MubmFtZTtcblxuICAgIHJldHVybiBjcmVhdGVFcnJvcjtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVycm9yKG9wdHMpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBFcnJvcigpXG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHJlc3VsdCwgXCJ0eXBlXCIsIHtcbiAgICAgICAgICAgIHZhbHVlOiByZXN1bHQudHlwZSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9KVxuXG4gICAgICAgIHZhciBvcHRpb25zID0gZXh0ZW5kKHt9LCBhcmdzLCBvcHRzKVxuXG4gICAgICAgIGV4dGVuZChyZXN1bHQsIG9wdGlvbnMpXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlID0gdGVtcGxhdGUobWVzc2FnZSwgb3B0aW9ucylcblxuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgfVxufVxuXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9tYWluLWxvb3Avfi9lcnJvci90eXBlZC5qc1xuICoqIG1vZHVsZSBpZCA9IDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSByZXR1cm4gY2FtZWxDYXNlKG9iaik7XG4gICAgcmV0dXJuIHdhbGsob2JqKTtcbn07XG5cbmZ1bmN0aW9uIHdhbGsgKG9iaikge1xuICAgIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSByZXR1cm4gb2JqO1xuICAgIGlmIChpc0RhdGUob2JqKSB8fCBpc1JlZ2V4KG9iaikpIHJldHVybiBvYmo7XG4gICAgaWYgKGlzQXJyYXkob2JqKSkgcmV0dXJuIG1hcChvYmosIHdhbGspO1xuICAgIHJldHVybiByZWR1Y2Uob2JqZWN0S2V5cyhvYmopLCBmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgdmFyIGNhbWVsID0gY2FtZWxDYXNlKGtleSk7XG4gICAgICAgIGFjY1tjYW1lbF0gPSB3YWxrKG9ialtrZXldKTtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG59XG5cbmZ1bmN0aW9uIGNhbWVsQ2FzZShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1tfLi1dKFxcd3wkKS9nLCBmdW5jdGlvbiAoXyx4KSB7XG4gICAgICAgIHJldHVybiB4LnRvVXBwZXJDYXNlKCk7XG4gICAgfSk7XG59XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxudmFyIGlzRGF0ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IERhdGVdJztcbn07XG5cbnZhciBpc1JlZ2V4ID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59O1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoaGFzLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG59O1xuXG5mdW5jdGlvbiBtYXAgKHhzLCBmKSB7XG4gICAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZXMucHVzaChmKHhzW2ldLCBpKSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIHJlZHVjZSAoeHMsIGYsIGFjYykge1xuICAgIGlmICh4cy5yZWR1Y2UpIHJldHVybiB4cy5yZWR1Y2UoZiwgYWNjKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFjYyA9IGYoYWNjLCB4c1tpXSwgaSk7XG4gICAgfVxuICAgIHJldHVybiBhY2M7XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9tYWluLWxvb3Avfi9lcnJvci9+L2NhbWVsaXplL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gNlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIG5hcmdzID0gL1xceyhbMC05YS16QS1aXSspXFx9L2dcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRlbXBsYXRlXG5cbmZ1bmN0aW9uIHRlbXBsYXRlKHN0cmluZykge1xuICAgIHZhciBhcmdzXG5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMiAmJiB0eXBlb2YgYXJndW1lbnRzWzFdID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGFyZ3MgPSBhcmd1bWVudHNbMV1cbiAgICB9IGVsc2Uge1xuICAgICAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgfVxuXG4gICAgaWYgKCFhcmdzIHx8ICFhcmdzLmhhc093blByb3BlcnR5KSB7XG4gICAgICAgIGFyZ3MgPSB7fVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZShuYXJncywgZnVuY3Rpb24gcmVwbGFjZUFyZyhtYXRjaCwgaSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHJlc3VsdFxuXG4gICAgICAgIGlmIChzdHJpbmdbaW5kZXggLSAxXSA9PT0gXCJ7XCIgJiZcbiAgICAgICAgICAgIHN0cmluZ1tpbmRleCArIG1hdGNoLmxlbmd0aF0gPT09IFwifVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gYXJncy5oYXNPd25Qcm9wZXJ0eShpKSA/IGFyZ3NbaV0gOiBudWxsXG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsIHx8IHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiXCJcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICB9XG4gICAgfSlcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L21haW4tbG9vcC9+L2Vycm9yL34vc3RyaW5nLXRlbXBsYXRlL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBleHRlbmRcblxuZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCkge1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9tYWluLWxvb3Avfi9lcnJvci9+L3h0ZW5kL211dGFibGUuanNcbiAqKiBtb2R1bGUgaWQgPSA4XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyB2YXIgcGFyc2VyID0gcmVxdWlyZSgncGVnanMnKS5idWlsZFBhcnNlcihcbi8vICAgICByZXF1aXJlKCdmcycpLnJlYWRGaWxlU3luYygndG1wbC1odG1sLnBlZ2pzJykudG9TdHJpbmcoKVxuLy8gKTtcblxudmFyIHBhcnNlciA9IHJlcXVpcmUoJy4vaHRtbHRlbXBsYXRlLXBhcnNlcicpO1xuXG52YXIgZmxhdHRlbiA9IHJlcXVpcmUoJ2xvZGFzaC5mbGF0dGVuJyk7O1xuXG52YXIgdHJhdmVyc2UgPSByZXF1aXJlKCd0cmF2ZXJzZScpO1xuXG52YXIgaCA9IHJlcXVpcmUoJ3ZpcnR1YWwtZG9tL2gnKTtcblxuZnVuY3Rpb24gY3JlYXRlVmRvbShzdHJpbmcsIHN0YXRlKSB7XG4gICAgdmFyIGFzdCA9IHBhcnNlci5wYXJzZShzdHJpbmcpO1xuXG4gICAgdmFyIGxvb2t1cENoYWluID0gW3N0YXRlXTtcblxuICAgIGZ1bmN0aW9uIGxvb2t1cFZhbHVlKHByb3BlcnR5TmFtZSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBudWxsO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSBsb29rdXBDaGFpbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKGxvb2t1cENoYWluW2ldW3Byb3BlcnR5TmFtZV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9va3VwQ2hhaW5baV1bcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNsYXNzPVwiPFRNUExfSUYgY29uZGl0aW9uPmNsYXNzTmFtZTwvVE1QTF9JRj5cIlxuICAgIC8vIGhyZWY9XCJpdGVtcy88VE1QTF9WQVIgaWQ+XCJcbiAgICBmdW5jdGlvbiBldmFsQXR0cmlidXRlKHZhbHVlKSB7XG4gICAgICAgIC8vIGRvIG5vdCBldmFsIGlmIG5vdCBuZWVkZWRcbiAgICAgICAgaWYgKHZhbHVlLmluZGV4T2YoJzxUTVBMXycpID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc3VsdCA9IGZsYXR0ZW4oXG4gICAgICAgICAgICB0cmF2ZXJzZShwYXJzZXIucGFyc2UodmFsdWUpKS5tYXAoaGFuZGxlcilcbiAgICAgICAgKS5qb2luKCcnKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgICAgIGlmICghdGhpcy5ub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ub2RlLnR5cGUgPT09ICdUZXh0Jykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlKHRoaXMubm9kZS5jb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm5vZGUudHlwZSA9PT0gJ0NvbmRpdGlvbicpIHtcbiAgICAgICAgICAgIHZhciBjb25kaXRpb24gPSB0aGlzLm5vZGUuY29uZGl0aW9uc1swXS5jb25kaXRpb247XG5cbiAgICAgICAgICAgIHZhciBpZlRydWUgPSB0aGlzLm5vZGUuY29uZGl0aW9uc1swXS5jb250ZW50LFxuICAgICAgICAgICAgICAgIGlmRmFsc2UgPSBudWxsO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5ub2RlLm90aGVyd2lzZSkge1xuICAgICAgICAgICAgICAgIGlmRmFsc2UgPSB0aGlzLm5vZGUub3RoZXJ3aXNlLmNvbnRlbnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGxvb2t1cFZhbHVlKGNvbmRpdGlvbi5uYW1lKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlKFxuICAgICAgICAgICAgICAgIHZhbHVlID8gaWZUcnVlIDogaWZGYWxzZSxcbiAgICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm5vZGUudHlwZSA9PT0gJ1RhZycgJiYgdGhpcy5ub2RlLm5hbWUgPT09ICdUTVBMX0xPT1AnKSB7XG4gICAgICAgICAgICB2YXIgcHJvcGVydHlOYW1lID0gdGhpcy5ub2RlLmF0dHJpYnV0ZXNbMF0ubmFtZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlKFxuICAgICAgICAgICAgICAgIGgoXG4gICAgICAgICAgICAgICAgICAgICdkaXYnLFxuICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAgbG9va3VwVmFsdWUocHJvcGVydHlOYW1lKS5tYXAoZnVuY3Rpb24oaXRlbSwgaW5kZXgsIGFycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9va3VwQ2hhaW4ucHVzaChpdGVtKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSB0aGlzLm5vZGUuY29udGVudCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlKHRoaXMubm9kZS5jb250ZW50KS5tYXAoaGFuZGxlcik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvb2t1cENoYWluLnBvcCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm5vZGUudHlwZSA9PT0gJ1RhZycgJiYgdGhpcy5ub2RlLm5hbWUgPT09ICdUTVBMX1ZBUicpIHtcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSB0aGlzLm5vZGUuYXR0cmlidXRlc1swXS5uYW1lO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUobG9va3VwVmFsdWUocHJvcGVydHlOYW1lKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ub2RlLnR5cGUgPT09ICdUYWcnKSB7XG4gICAgICAgICAgICB2YXIgYXR0cnMgPSB0aGlzLm5vZGUuYXR0cmlidXRlcy5yZWR1Y2UoZnVuY3Rpb24oaGFzaCwgaXRlbSkge1xuICAgICAgICAgICAgICAgIHZhciBhdHRyTmFtZSA9IGl0ZW0ubmFtZTtcblxuICAgICAgICAgICAgICAgIGlmIChpdGVtLm5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0ck5hbWUgPSAnY2xhc3NOYW1lJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYXR0ck5hbWUuaW5kZXhPZignZGF0YScpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc2guYXR0cmlidXRlcyA9IGhhc2guYXR0cmlidXRlcyB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgaGFzaC5hdHRyaWJ1dGVzW2F0dHJOYW1lXSA9IGV2YWxBdHRyaWJ1dGUoaXRlbS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzaFthdHRyTmFtZV0gPSBldmFsQXR0cmlidXRlKGl0ZW0udmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBoYXNoO1xuICAgICAgICAgICAgfSwge30pO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUoXG4gICAgICAgICAgICAgICAgaChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHJzLFxuICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZSh0aGlzLm5vZGUuY29udGVudCkubWFwKGhhbmRsZXIpXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG91dHB1dCA9IHRyYXZlcnNlKGFzdCkubWFwKGhhbmRsZXIpO1xuXG4gICAgcmV0dXJuIGgoJ2RpdicsIHt9LCBvdXRwdXQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVZkb207XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2xpYi9jcmVhdGUtdmRvbS5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICAvKlxuICAgKiBHZW5lcmF0ZWQgYnkgUEVHLmpzIDAuOC4wLlxuICAgKlxuICAgKiBodHRwOi8vcGVnanMubWFqZGEuY3ovXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHBlZyRzdWJjbGFzcyhjaGlsZCwgcGFyZW50KSB7XG4gICAgZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9XG4gICAgY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuICAgIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG4gIH1cblxuICBmdW5jdGlvbiBTeW50YXhFcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgZm91bmQsIG9mZnNldCwgbGluZSwgY29sdW1uKSB7XG4gICAgdGhpcy5tZXNzYWdlICA9IG1lc3NhZ2U7XG4gICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkO1xuICAgIHRoaXMuZm91bmQgICAgPSBmb3VuZDtcbiAgICB0aGlzLm9mZnNldCAgID0gb2Zmc2V0O1xuICAgIHRoaXMubGluZSAgICAgPSBsaW5lO1xuICAgIHRoaXMuY29sdW1uICAgPSBjb2x1bW47XG5cbiAgICB0aGlzLm5hbWUgICAgID0gXCJTeW50YXhFcnJvclwiO1xuICB9XG5cbiAgcGVnJHN1YmNsYXNzKFN5bnRheEVycm9yLCBFcnJvcik7XG5cbiAgZnVuY3Rpb24gcGFyc2UoaW5wdXQpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDoge30sXG5cbiAgICAgICAgcGVnJEZBSUxFRCA9IHt9LFxuXG4gICAgICAgIHBlZyRzdGFydFJ1bGVGdW5jdGlvbnMgPSB7IENvbnRlbnQ6IHBlZyRwYXJzZUNvbnRlbnQgfSxcbiAgICAgICAgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uICA9IHBlZyRwYXJzZUNvbnRlbnQsXG5cbiAgICAgICAgcGVnJGMwID0gW10sXG4gICAgICAgIHBlZyRjMSA9IHBlZyRGQUlMRUQsXG4gICAgICAgIHBlZyRjMiA9IHZvaWQgMCxcbiAgICAgICAgcGVnJGMzID0gZnVuY3Rpb24obmFtZSwgYXR0cmlidXRlcykge1xuICAgICAgICAgIHJldHVybiB0b2tlbih7XG4gICAgICAgICAgICB0eXBlOiBCTE9DS19UWVBFUy5UQUcsXG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlc1xuICAgICAgICAgIH0sIGxpbmUsIGNvbHVtbik7XG4gICAgICAgIH0sXG4gICAgICAgIHBlZyRjNCA9IGZ1bmN0aW9uKHN0YXJ0LCBjb250ZW50LCBlbmQpIHtcbiAgICAgICAgICBpZiAoc3RhcnQubmFtZSAhPSBlbmQpIHtcbiAgICAgICAgICAgIHRocm93IHN5bnRheEVycm9yKFwiRXhwZWN0ZWQgYSA8L1wiICsgc3RhcnQubmFtZSArIFwiPiBidXQgPC9cIiArIGVuZCArIFwiPiBmb3VuZC5cIiwgb2Zmc2V0LCBsaW5lLCBjb2x1bW4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0b2tlbih7XG4gICAgICAgICAgICB0eXBlOiBCTE9DS19UWVBFUy5UQUcsXG4gICAgICAgICAgICBuYW1lOiBzdGFydC5uYW1lLFxuICAgICAgICAgICAgYXR0cmlidXRlczogc3RhcnQuYXR0cmlidXRlcyxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnRcbiAgICAgICAgICB9LCBsaW5lLCBjb2x1bW4pO1xuICAgICAgICB9LFxuICAgICAgICBwZWckYzUgPSBudWxsLFxuICAgICAgICBwZWckYzYgPSBmdW5jdGlvbihzdGFydCwgY29udGVudCwgZWxzaWYsIG90aGVyd2lzZSwgZW5kKSB7XG4gICAgICAgICAgaWYgKHN0YXJ0Lm5hbWUgIT0gZW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBzeW50YXhFcnJvcihcIkV4cGVjdGVkIGEgPC9cIiArIHN0YXJ0Lm5hbWUgKyBcIj4gYnV0IDwvXCIgKyBlbmQgKyBcIj4gZm91bmQuXCIsIG9mZnNldCwgbGluZSwgY29sdW1uKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgcHJpbWFyeUNvbmRpdGlvbiA9IHRva2VuKHtcbiAgICAgICAgICAgIHR5cGU6IEJMT0NLX1RZUEVTLkNPTkRJVElPTl9CUkFOQ0gsXG4gICAgICAgICAgICBjb25kaXRpb246IHN0YXJ0LmNvbmRpdGlvbixcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnRcbiAgICAgICAgICB9LCBsaW5lLCBjb2x1bW4pO1xuXG4gICAgICAgICAgdmFyIGNvbmRpdGlvbnMgPSBbcHJpbWFyeUNvbmRpdGlvbl0uY29uY2F0KGVsc2lmKTtcblxuICAgICAgICAgIHJldHVybiB0b2tlbih7XG4gICAgICAgICAgICB0eXBlOiBCTE9DS19UWVBFUy5DT05ESVRJT04sXG4gICAgICAgICAgICBuYW1lOiBzdGFydC5uYW1lLFxuICAgICAgICAgICAgY29uZGl0aW9uczogY29uZGl0aW9ucyxcbiAgICAgICAgICAgIG90aGVyd2lzZTogb3RoZXJ3aXNlXG4gICAgICAgICAgfSwgbGluZSwgY29sdW1uKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGVnJGM3ID0gZnVuY3Rpb24obmFtZSwgYXR0cmlidXRlcykge1xuICAgICAgICAgIHJldHVybiB0b2tlbih7XG4gICAgICAgICAgICB0eXBlOiBCTE9DS19UWVBFUy5JTlZBTElEX1RBRyxcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzXG4gICAgICAgICAgfSwgbGluZSwgY29sdW1uKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGVnJGM4ID0gZnVuY3Rpb24oY29uZGl0aW9uLCBjb250ZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRva2VuKHtcbiAgICAgICAgICAgIHR5cGU6IEJMT0NLX1RZUEVTLkNPTkRJVElPTl9CUkFOQ0gsXG4gICAgICAgICAgICBjb25kaXRpb246IGNvbmRpdGlvbixcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnRcbiAgICAgICAgICB9LCBsaW5lLCBjb2x1bW4pO1xuICAgICAgICB9LFxuICAgICAgICBwZWckYzkgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRva2VuKHtcbiAgICAgICAgICAgIHR5cGU6IEJMT0NLX1RZUEVTLkFMVEVSTkFURV9DT05ESVRJT05fQlJBTkNILFxuICAgICAgICAgICAgY29udGVudDogY29udGVudFxuICAgICAgICAgIH0sIGxpbmUsIGNvbHVtbik7XG4gICAgICAgIH0sXG4gICAgICAgIHBlZyRjMTAgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgICAgcmV0dXJuIHRva2VuKHtcbiAgICAgICAgICAgIHR5cGU6IEJMT0NLX1RZUEVTLlRFWFQsXG4gICAgICAgICAgICBjb250ZW50OiB0ZXh0XG4gICAgICAgICAgfSwgbGluZSwgY29sdW1uKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGVnJGMxMSA9IGZ1bmN0aW9uKG5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXNcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBwZWckYzEyID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgIHJldHVybiBuYW1lO1xuICAgICAgICB9LFxuICAgICAgICBwZWckYzEzID0gZnVuY3Rpb24obmFtZSwgY29uZGl0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICBjb25kaXRpb246IGNvbmRpdGlvblswXSB8fCBudWxsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgcGVnJGMxNCA9IGZ1bmN0aW9uKGNvbmRpdGlvbikge1xuICAgICAgICAgIHJldHVybiBjb25kaXRpb25bMF0gfHwgbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgcGVnJGMxNSA9IGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICByZXR1cm4gdG9rZW4oe1xuICAgICAgICAgICAgdHlwZTogQkxPQ0tfVFlQRVMuQ09NTUVOVCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNcbiAgICAgICAgICB9LCBsaW5lLCBjb2x1bW4pO1xuICAgICAgICB9LFxuICAgICAgICBwZWckYzE2ID0gZnVuY3Rpb24oYykge1xuICAgICAgICAgIHJldHVybiB0b2tlbih7XG4gICAgICAgICAgICB0eXBlOiBCTE9DS19UWVBFUy5DT01NRU5ULFxuICAgICAgICAgICAgY29udGVudDogY1xuICAgICAgICAgIH0sIGxpbmUsIENPTFVNTl9PTkUpO1xuICAgICAgICB9LFxuICAgICAgICBwZWckYzE3ID0gZnVuY3Rpb24oY29udGVudCkge1xuICAgICAgICAgIHJldHVybiB0b2tlbih7XG4gICAgICAgICAgICB0eXBlOiBCTE9DS19UWVBFUy5DT01NRU5ULFxuICAgICAgICAgICAgY29udGVudDogY29udGVudFxuICAgICAgICAgIH0sIGxpbmUsIGNvbHVtbik7XG4gICAgICAgIH0sXG4gICAgICAgIHBlZyRjMTggPSBmdW5jdGlvbihhdHRycykgeyByZXR1cm4gYXR0cnM7IH0sXG4gICAgICAgIHBlZyRjMTkgPSBmdW5jdGlvbihleHByZXNzaW9uKSB7IHJldHVybiBleHByZXNzaW9uOyB9LFxuICAgICAgICBwZWckYzIwID0gZnVuY3Rpb24oZXhwcmVzc2lvbikge1xuICAgICAgICAgIHJldHVybiB0b2tlbih7XG4gICAgICAgICAgICB0eXBlOiBBVFRSSUJVVEVfVFlQRVMuRVhQUkVTU0lPTixcbiAgICAgICAgICAgIHZhbHVlOiBleHByZXNzaW9uXG4gICAgICAgICAgfSwgbGluZSwgY29sdW1uKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGVnJGMyMSA9IFwiPVwiLFxuICAgICAgICBwZWckYzIyID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiPVwiLCBkZXNjcmlwdGlvbjogXCJcXFwiPVxcXCJcIiB9LFxuICAgICAgICBwZWckYzIzID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gdG9rZW4oe1xuICAgICAgICAgICAgdHlwZTogQVRUUklCVVRFX1RZUEVTLlBBSVIsXG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICAgICAgfSwgbGluZSwgY29sdW1uKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGVnJGMyNCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICByZXR1cm4gdG9rZW4oe1xuICAgICAgICAgICAgdHlwZTogQVRUUklCVVRFX1RZUEVTLlNJTkdMRSxcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICB2YWx1ZTogbnVsbFxuICAgICAgICAgIH0sIGxpbmUsIGNvbHVtbik7XG4gICAgICAgIH0sXG4gICAgICAgIHBlZyRjMjUgPSAvXlthLXpBLVowLTlcXC1fXFwvOi57fSRdLyxcbiAgICAgICAgcGVnJGMyNiA9IHsgdHlwZTogXCJjbGFzc1wiLCB2YWx1ZTogXCJbYS16QS1aMC05XFxcXC1fXFxcXC86Lnt9JF1cIiwgZGVzY3JpcHRpb246IFwiW2EtekEtWjAtOVxcXFwtX1xcXFwvOi57fSRdXCIgfSxcbiAgICAgICAgcGVnJGMyNyA9IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICBpZiAobi5pbmRleE9mKFwiJFwiKSA+IDApIHtcbiAgICAgICAgICAgIHRocm93IHN5bnRheEVycm9yKFwiVW5leHBlY3RlZCAkIGluIGF0dHJpYnV0ZSBuYW1lLlwiLCBvZmZzZXQsIGxpbmUsIGNvbHVtbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH0sXG4gICAgICAgIHBlZyRjMjggPSBcIidcIixcbiAgICAgICAgcGVnJGMyOSA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIidcIiwgZGVzY3JpcHRpb246IFwiXFxcIidcXFwiXCIgfSxcbiAgICAgICAgcGVnJGMzMCA9IGZ1bmN0aW9uKGNoYXJzKSB7XG4gICAgICAgICAgcmV0dXJuIGpvaW4oY2hhcnMpO1xuICAgICAgICB9LFxuICAgICAgICBwZWckYzMxID0gXCJcXFwiXCIsXG4gICAgICAgIHBlZyRjMzIgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJcXFwiXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJcXFxcXFxcIlxcXCJcIiB9LFxuICAgICAgICBwZWckYzMzID0gXCJUTVBMX1wiLFxuICAgICAgICBwZWckYzM0ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiVE1QTF9cIiwgZGVzY3JpcHRpb246IFwiXFxcIlRNUExfXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjMzUgPSBcIlRNUExfSU5DTFVERVwiLFxuICAgICAgICBwZWckYzM2ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiVE1QTF9JTkNMVURFXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJUTVBMX0lOQ0xVREVcXFwiXCIgfSxcbiAgICAgICAgcGVnJGMzNyA9IFwiVE1QTF9WQVJcIixcbiAgICAgICAgcGVnJGMzOCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlRNUExfVkFSXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJUTVBMX1ZBUlxcXCJcIiB9LFxuICAgICAgICBwZWckYzM5ID0gXCJUTVBMX1ZcIixcbiAgICAgICAgcGVnJGM0MCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlRNUExfVlwiLCBkZXNjcmlwdGlvbjogXCJcXFwiVE1QTF9WXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjNDEgPSBcIlRNUExfQkxPQ0tcIixcbiAgICAgICAgcGVnJGM0MiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlRNUExfQkxPQ0tcIiwgZGVzY3JpcHRpb246IFwiXFxcIlRNUExfQkxPQ0tcXFwiXCIgfSxcbiAgICAgICAgcGVnJGM0MyA9IFwiVE1QTF9GT1JcIixcbiAgICAgICAgcGVnJGM0NCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlRNUExfRk9SXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJUTVBMX0ZPUlxcXCJcIiB9LFxuICAgICAgICBwZWckYzQ1ID0gXCJUTVBMX0xPT1BcIixcbiAgICAgICAgcGVnJGM0NiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlRNUExfTE9PUFwiLCBkZXNjcmlwdGlvbjogXCJcXFwiVE1QTF9MT09QXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjNDcgPSBcIlRNUExfU0VUVkFSXCIsXG4gICAgICAgIHBlZyRjNDggPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJUTVBMX1NFVFZBUlwiLCBkZXNjcmlwdGlvbjogXCJcXFwiVE1QTF9TRVRWQVJcXFwiXCIgfSxcbiAgICAgICAgcGVnJGM0OSA9IFwiVE1QTF9XSVRIXCIsXG4gICAgICAgIHBlZyRjNTAgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJUTVBMX1dJVEhcIiwgZGVzY3JpcHRpb246IFwiXFxcIlRNUExfV0lUSFxcXCJcIiB9LFxuICAgICAgICBwZWckYzUxID0gXCJUTVBMX1dTXCIsXG4gICAgICAgIHBlZyRjNTIgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJUTVBMX1dTXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJUTVBMX1dTXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjNTMgPSBcIlRNUExfSUZcIixcbiAgICAgICAgcGVnJGM1NCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlRNUExfSUZcIiwgZGVzY3JpcHRpb246IFwiXFxcIlRNUExfSUZcXFwiXCIgfSxcbiAgICAgICAgcGVnJGM1NSA9IFwiVE1QTF9VTkxFU1NcIixcbiAgICAgICAgcGVnJGM1NiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlRNUExfVU5MRVNTXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJUTVBMX1VOTEVTU1xcXCJcIiB9LFxuICAgICAgICBwZWckYzU3ID0gXCJUTVBMX0VMU0lGXCIsXG4gICAgICAgIHBlZyRjNTggPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJUTVBMX0VMU0lGXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJUTVBMX0VMU0lGXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjNTkgPSBcIlRNUExfRUxTRVwiLFxuICAgICAgICBwZWckYzYwID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiVE1QTF9FTFNFXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJUTVBMX0VMU0VcXFwiXCIgfSxcbiAgICAgICAgcGVnJGM2MSA9IFwiVE1QTF9DT01NRU5UXCIsXG4gICAgICAgIHBlZyRjNjIgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJUTVBMX0NPTU1FTlRcIiwgZGVzY3JpcHRpb246IFwiXFxcIlRNUExfQ09NTUVOVFxcXCJcIiB9LFxuICAgICAgICBwZWckYzYzID0geyB0eXBlOiBcIm90aGVyXCIsIGRlc2NyaXB0aW9uOiBcIndoaXRlc3BhY2UgY29udHJvbCBjaGFyYWN0ZXJcIiB9LFxuICAgICAgICBwZWckYzY0ID0gXCItXCIsXG4gICAgICAgIHBlZyRjNjUgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCItXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCItXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjNjYgPSBcIn4uXCIsXG4gICAgICAgIHBlZyRjNjcgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJ+LlwiLCBkZXNjcmlwdGlvbjogXCJcXFwifi5cXFwiXCIgfSxcbiAgICAgICAgcGVnJGM2OCA9IFwifnxcIixcbiAgICAgICAgcGVnJGM2OSA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIn58XCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJ+fFxcXCJcIiB9LFxuICAgICAgICBwZWckYzcwID0gXCJ+XCIsXG4gICAgICAgIHBlZyRjNzEgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJ+XCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJ+XFxcIlwiIH0sXG4gICAgICAgIHBlZyRjNzIgPSBcIi5+XCIsXG4gICAgICAgIHBlZyRjNzMgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCIuflwiLCBkZXNjcmlwdGlvbjogXCJcXFwiLn5cXFwiXCIgfSxcbiAgICAgICAgcGVnJGM3NCA9IFwifH5cIixcbiAgICAgICAgcGVnJGM3NSA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcInx+XCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJ8flxcXCJcIiB9LFxuICAgICAgICBwZWckYzc2ID0gL15bYS16QS1aX10vLFxuICAgICAgICBwZWckYzc3ID0geyB0eXBlOiBcImNsYXNzXCIsIHZhbHVlOiBcIlthLXpBLVpfXVwiLCBkZXNjcmlwdGlvbjogXCJbYS16QS1aX11cIiB9LFxuICAgICAgICBwZWckYzc4ID0geyB0eXBlOiBcIm90aGVyXCIsIGRlc2NyaXB0aW9uOiBcIndoaXRlc3BhY2VcIiB9LFxuICAgICAgICBwZWckYzc5ID0gXCJcXHRcIixcbiAgICAgICAgcGVnJGM4MCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlxcdFwiLCBkZXNjcmlwdGlvbjogXCJcXFwiXFxcXHRcXFwiXCIgfSxcbiAgICAgICAgcGVnJGM4MSA9IFwiXFx4MEJcIixcbiAgICAgICAgcGVnJGM4MiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlxceDBCXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJcXFxceDBCXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjODMgPSBcIlxcZlwiLFxuICAgICAgICBwZWckYzg0ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiXFxmXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJcXFxcZlxcXCJcIiB9LFxuICAgICAgICBwZWckYzg1ID0gXCIgXCIsXG4gICAgICAgIHBlZyRjODYgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCIgXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCIgXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjODcgPSBcIlxceEEwXCIsXG4gICAgICAgIHBlZyRjODggPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJcXHhBMFwiLCBkZXNjcmlwdGlvbjogXCJcXFwiXFxcXHhBMFxcXCJcIiB9LFxuICAgICAgICBwZWckYzg5ID0gXCJcXHVGRUZGXCIsXG4gICAgICAgIHBlZyRjOTAgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJcXHVGRUZGXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJcXFxcdUZFRkZcXFwiXCIgfSxcbiAgICAgICAgcGVnJGM5MSA9IC9eWyBcXHhBMFxcdTE2ODBcXHUyMDAwLVxcdTIwMEFcXHUyMDJGXFx1MjA1RlxcdTMwMDBdLyxcbiAgICAgICAgcGVnJGM5MiA9IHsgdHlwZTogXCJjbGFzc1wiLCB2YWx1ZTogXCJbIFxcXFx4QTBcXFxcdTE2ODBcXFxcdTIwMDAtXFxcXHUyMDBBXFxcXHUyMDJGXFxcXHUyMDVGXFxcXHUzMDAwXVwiLCBkZXNjcmlwdGlvbjogXCJbIFxcXFx4QTBcXFxcdTE2ODBcXFxcdTIwMDAtXFxcXHUyMDBBXFxcXHUyMDJGXFxcXHUyMDVGXFxcXHUzMDAwXVwiIH0sXG4gICAgICAgIHBlZyRjOTMgPSBcIiNcIixcbiAgICAgICAgcGVnJGM5NCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIiNcIiwgZGVzY3JpcHRpb246IFwiXFxcIiNcXFwiXCIgfSxcbiAgICAgICAgcGVnJGM5NSA9IFwiIyNcIixcbiAgICAgICAgcGVnJGM5NiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIiMjXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCIjI1xcXCJcIiB9LFxuICAgICAgICBwZWckYzk3ID0geyB0eXBlOiBcImFueVwiLCBkZXNjcmlwdGlvbjogXCJhbnkgY2hhcmFjdGVyXCIgfSxcbiAgICAgICAgcGVnJGM5OCA9IHsgdHlwZTogXCJvdGhlclwiLCBkZXNjcmlwdGlvbjogXCJlbmQgb2YgbGluZVwiIH0sXG4gICAgICAgIHBlZyRjOTkgPSBcIlxcblwiLFxuICAgICAgICBwZWckYzEwMCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlxcblwiLCBkZXNjcmlwdGlvbjogXCJcXFwiXFxcXG5cXFwiXCIgfSxcbiAgICAgICAgcGVnJGMxMDEgPSBcIlxcclxcblwiLFxuICAgICAgICBwZWckYzEwMiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlxcclxcblwiLCBkZXNjcmlwdGlvbjogXCJcXFwiXFxcXHJcXFxcblxcXCJcIiB9LFxuICAgICAgICBwZWckYzEwMyA9IFwiXFxyXCIsXG4gICAgICAgIHBlZyRjMTA0ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiXFxyXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJcXFxcclxcXCJcIiB9LFxuICAgICAgICBwZWckYzEwNSA9IFwiXFx1MjAyOFwiLFxuICAgICAgICBwZWckYzEwNiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlxcdTIwMjhcIiwgZGVzY3JpcHRpb246IFwiXFxcIlxcXFx1MjAyOFxcXCJcIiB9LFxuICAgICAgICBwZWckYzEwNyA9IFwiXFx1MjAyOVwiLFxuICAgICAgICBwZWckYzEwOCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIlxcdTIwMjlcIiwgZGVzY3JpcHRpb246IFwiXFxcIlxcXFx1MjAyOVxcXCJcIiB9LFxuICAgICAgICBwZWckYzEwOSA9IFwiPFwiLFxuICAgICAgICBwZWckYzExMCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIjxcIiwgZGVzY3JpcHRpb246IFwiXFxcIjxcXFwiXCIgfSxcbiAgICAgICAgcGVnJGMxMTEgPSBcIi9cIixcbiAgICAgICAgcGVnJGMxMTIgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCIvXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCIvXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjMTEzID0gXCI+XCIsXG4gICAgICAgIHBlZyRjMTE0ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiPlwiLCBkZXNjcmlwdGlvbjogXCJcXFwiPlxcXCJcIiB9LFxuICAgICAgICBwZWckYzExNSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhyb3cgc3ludGF4RXJyb3IoXCJFeHBlY3RlZCBhIGNsb3NpbmcgYnJhY2tldC5cIiwgb2Zmc2V0LCBsaW5lLCBjb2x1bW4pO1xuICAgICAgICAgIH0sXG4gICAgICAgIHBlZyRjMTE2ID0gXCIvPlwiLFxuICAgICAgICBwZWckYzExNyA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIi8+XCIsIGRlc2NyaXB0aW9uOiBcIlxcXCIvPlxcXCJcIiB9LFxuICAgICAgICBwZWckYzExOCA9IFwiWyVcIixcbiAgICAgICAgcGVnJGMxMTkgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJbJVwiLCBkZXNjcmlwdGlvbjogXCJcXFwiWyVcXFwiXCIgfSxcbiAgICAgICAgcGVnJGMxMjAgPSBcIiVdXCIsXG4gICAgICAgIHBlZyRjMTIxID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiJV1cIiwgZGVzY3JpcHRpb246IFwiXFxcIiVdXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjMTIyID0gXCJcXFxcXCIsXG4gICAgICAgIHBlZyRjMTIzID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiXFxcXFwiLCBkZXNjcmlwdGlvbjogXCJcXFwiXFxcXFxcXFxcXFwiXCIgfSxcbiAgICAgICAgcGVnJGMxMjQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRleHQoKTsgfSxcbiAgICAgICAgcGVnJGMxMjUgPSBmdW5jdGlvbihlc2MpIHsgcmV0dXJuIGVzYzsgfSxcbiAgICAgICAgcGVnJGMxMjYgPSBcImJcIixcbiAgICAgICAgcGVnJGMxMjcgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJiXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJiXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjMTI4ID0gZnVuY3Rpb24oKSB7IHJldHVybiBcIlxcYlwiOyB9LFxuICAgICAgICBwZWckYzEyOSA9IFwiZlwiLFxuICAgICAgICBwZWckYzEzMCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcImZcIiwgZGVzY3JpcHRpb246IFwiXFxcImZcXFwiXCIgfSxcbiAgICAgICAgcGVnJGMxMzEgPSBmdW5jdGlvbigpIHsgcmV0dXJuIFwiXFxmXCI7IH0sXG4gICAgICAgIHBlZyRjMTMyID0gXCJuXCIsXG4gICAgICAgIHBlZyRjMTMzID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiblwiLCBkZXNjcmlwdGlvbjogXCJcXFwiblxcXCJcIiB9LFxuICAgICAgICBwZWckYzEzNCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJcXG5cIjsgfSxcbiAgICAgICAgcGVnJGMxMzUgPSBcInJcIixcbiAgICAgICAgcGVnJGMxMzYgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJyXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJyXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjMTM3ID0gZnVuY3Rpb24oKSB7IHJldHVybiBcIlxcclwiOyB9LFxuICAgICAgICBwZWckYzEzOCA9IFwidFwiLFxuICAgICAgICBwZWckYzEzOSA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcInRcIiwgZGVzY3JpcHRpb246IFwiXFxcInRcXFwiXCIgfSxcbiAgICAgICAgcGVnJGMxNDAgPSBmdW5jdGlvbigpIHsgcmV0dXJuIFwiXFx0XCI7IH0sXG4gICAgICAgIHBlZyRjMTQxID0gXCJ2XCIsXG4gICAgICAgIHBlZyRjMTQyID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwidlwiLCBkZXNjcmlwdGlvbjogXCJcXFwidlxcXCJcIiB9LFxuICAgICAgICBwZWckYzE0MyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJcXHZcIjsgfSxcbiAgICAgICAgcGVnJGMxNDQgPSBmdW5jdGlvbihuYW1lLCBhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlc1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcGVnJGMxNDUgPSBcIjwvXCIsXG4gICAgICAgIHBlZyRjMTQ2ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiPC9cIiwgZGVzY3JpcHRpb246IFwiXFxcIjwvXFxcIlwiIH0sXG4gICAgICAgIHBlZyRjMTQ3ID0gZnVuY3Rpb24obmFtZSkgeyByZXR1cm4gbmFtZTsgfSxcbiAgICAgICAgcGVnJGMxNDggPSAvXlthLXpBLVowLTldLyxcbiAgICAgICAgcGVnJGMxNDkgPSB7IHR5cGU6IFwiY2xhc3NcIiwgdmFsdWU6IFwiW2EtekEtWjAtOV1cIiwgZGVzY3JpcHRpb246IFwiW2EtekEtWjAtOV1cIiB9LFxuICAgICAgICBwZWckYzE1MCA9IGZ1bmN0aW9uKGNoYXJzKSB7IHJldHVybiBjaGFycy5qb2luKFwiXCIpOyB9LFxuXG4gICAgICAgIHBlZyRjdXJyUG9zICAgICAgICAgID0gMCxcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zICAgICAgPSAwLFxuICAgICAgICBwZWckY2FjaGVkUG9zICAgICAgICA9IDAsXG4gICAgICAgIHBlZyRjYWNoZWRQb3NEZXRhaWxzID0geyBsaW5lOiAxLCBjb2x1bW46IDEsIHNlZW5DUjogZmFsc2UgfSxcbiAgICAgICAgcGVnJG1heEZhaWxQb3MgICAgICAgPSAwLFxuICAgICAgICBwZWckbWF4RmFpbEV4cGVjdGVkICA9IFtdLFxuICAgICAgICBwZWckc2lsZW50RmFpbHMgICAgICA9IDAsXG5cbiAgICAgICAgcGVnJHJlc3VsdDtcblxuICAgIGlmIChcInN0YXJ0UnVsZVwiIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmICghKG9wdGlvbnMuc3RhcnRSdWxlIGluIHBlZyRzdGFydFJ1bGVGdW5jdGlvbnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IHN0YXJ0IHBhcnNpbmcgZnJvbSBydWxlIFxcXCJcIiArIG9wdGlvbnMuc3RhcnRSdWxlICsgXCJcXFwiLlwiKTtcbiAgICAgIH1cblxuICAgICAgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uID0gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uc1tvcHRpb25zLnN0YXJ0UnVsZV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGV4dCgpIHtcbiAgICAgIHJldHVybiBpbnB1dC5zdWJzdHJpbmcocGVnJHJlcG9ydGVkUG9zLCBwZWckY3VyclBvcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb2Zmc2V0KCkge1xuICAgICAgcmV0dXJuIHBlZyRyZXBvcnRlZFBvcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaW5lKCkge1xuICAgICAgcmV0dXJuIHBlZyRjb21wdXRlUG9zRGV0YWlscyhwZWckcmVwb3J0ZWRQb3MpLmxpbmU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29sdW1uKCkge1xuICAgICAgcmV0dXJuIHBlZyRjb21wdXRlUG9zRGV0YWlscyhwZWckcmVwb3J0ZWRQb3MpLmNvbHVtbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBlY3RlZChkZXNjcmlwdGlvbikge1xuICAgICAgdGhyb3cgcGVnJGJ1aWxkRXhjZXB0aW9uKFxuICAgICAgICBudWxsLFxuICAgICAgICBbeyB0eXBlOiBcIm90aGVyXCIsIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB9XSxcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zXG4gICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgIHRocm93IHBlZyRidWlsZEV4Y2VwdGlvbihtZXNzYWdlLCBudWxsLCBwZWckcmVwb3J0ZWRQb3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRjb21wdXRlUG9zRGV0YWlscyhwb3MpIHtcbiAgICAgIGZ1bmN0aW9uIGFkdmFuY2UoZGV0YWlscywgc3RhcnRQb3MsIGVuZFBvcykge1xuICAgICAgICB2YXIgcCwgY2g7XG5cbiAgICAgICAgZm9yIChwID0gc3RhcnRQb3M7IHAgPCBlbmRQb3M7IHArKykge1xuICAgICAgICAgIGNoID0gaW5wdXQuY2hhckF0KHApO1xuICAgICAgICAgIGlmIChjaCA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgaWYgKCFkZXRhaWxzLnNlZW5DUikgeyBkZXRhaWxzLmxpbmUrKzsgfVxuICAgICAgICAgICAgZGV0YWlscy5jb2x1bW4gPSAxO1xuICAgICAgICAgICAgZGV0YWlscy5zZWVuQ1IgPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIlxcclwiIHx8IGNoID09PSBcIlxcdTIwMjhcIiB8fCBjaCA9PT0gXCJcXHUyMDI5XCIpIHtcbiAgICAgICAgICAgIGRldGFpbHMubGluZSsrO1xuICAgICAgICAgICAgZGV0YWlscy5jb2x1bW4gPSAxO1xuICAgICAgICAgICAgZGV0YWlscy5zZWVuQ1IgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXRhaWxzLmNvbHVtbisrO1xuICAgICAgICAgICAgZGV0YWlscy5zZWVuQ1IgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBlZyRjYWNoZWRQb3MgIT09IHBvcykge1xuICAgICAgICBpZiAocGVnJGNhY2hlZFBvcyA+IHBvcykge1xuICAgICAgICAgIHBlZyRjYWNoZWRQb3MgPSAwO1xuICAgICAgICAgIHBlZyRjYWNoZWRQb3NEZXRhaWxzID0geyBsaW5lOiAxLCBjb2x1bW46IDEsIHNlZW5DUjogZmFsc2UgfTtcbiAgICAgICAgfVxuICAgICAgICBhZHZhbmNlKHBlZyRjYWNoZWRQb3NEZXRhaWxzLCBwZWckY2FjaGVkUG9zLCBwb3MpO1xuICAgICAgICBwZWckY2FjaGVkUG9zID0gcG9zO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGVnJGNhY2hlZFBvc0RldGFpbHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJGZhaWwoZXhwZWN0ZWQpIHtcbiAgICAgIGlmIChwZWckY3VyclBvcyA8IHBlZyRtYXhGYWlsUG9zKSB7IHJldHVybjsgfVxuXG4gICAgICBpZiAocGVnJGN1cnJQb3MgPiBwZWckbWF4RmFpbFBvcykge1xuICAgICAgICBwZWckbWF4RmFpbFBvcyA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBwZWckbWF4RmFpbEV4cGVjdGVkID0gW107XG4gICAgICB9XG5cbiAgICAgIHBlZyRtYXhGYWlsRXhwZWN0ZWQucHVzaChleHBlY3RlZCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJGJ1aWxkRXhjZXB0aW9uKG1lc3NhZ2UsIGV4cGVjdGVkLCBwb3MpIHtcbiAgICAgIGZ1bmN0aW9uIGNsZWFudXBFeHBlY3RlZChleHBlY3RlZCkge1xuICAgICAgICB2YXIgaSA9IDE7XG5cbiAgICAgICAgZXhwZWN0ZWQuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgaWYgKGEuZGVzY3JpcHRpb24gPCBiLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfSBlbHNlIGlmIChhLmRlc2NyaXB0aW9uID4gYi5kZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2hpbGUgKGkgPCBleHBlY3RlZC5sZW5ndGgpIHtcbiAgICAgICAgICBpZiAoZXhwZWN0ZWRbaSAtIDFdID09PSBleHBlY3RlZFtpXSkge1xuICAgICAgICAgICAgZXhwZWN0ZWQuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGJ1aWxkTWVzc2FnZShleHBlY3RlZCwgZm91bmQpIHtcbiAgICAgICAgZnVuY3Rpb24gc3RyaW5nRXNjYXBlKHMpIHtcbiAgICAgICAgICBmdW5jdGlvbiBoZXgoY2gpIHsgcmV0dXJuIGNoLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7IH1cblxuICAgICAgICAgIHJldHVybiBzXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxcXC9nLCAgICdcXFxcXFxcXCcpXG4gICAgICAgICAgICAucmVwbGFjZSgvXCIvZywgICAgJ1xcXFxcIicpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFx4MDgvZywgJ1xcXFxiJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHQvZywgICAnXFxcXHQnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcbi9nLCAgICdcXFxcbicpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxmL2csICAgJ1xcXFxmJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHIvZywgICAnXFxcXHInKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1tcXHgwMC1cXHgwN1xceDBCXFx4MEVcXHgwRl0vZywgZnVuY3Rpb24oY2gpIHsgcmV0dXJuICdcXFxceDAnICsgaGV4KGNoKTsgfSlcbiAgICAgICAgICAgIC5yZXBsYWNlKC9bXFx4MTAtXFx4MUZcXHg4MC1cXHhGRl0vZywgICAgZnVuY3Rpb24oY2gpIHsgcmV0dXJuICdcXFxceCcgICsgaGV4KGNoKTsgfSlcbiAgICAgICAgICAgIC5yZXBsYWNlKC9bXFx1MDE4MC1cXHUwRkZGXS9nLCAgICAgICAgIGZ1bmN0aW9uKGNoKSB7IHJldHVybiAnXFxcXHUwJyArIGhleChjaCk7IH0pXG4gICAgICAgICAgICAucmVwbGFjZSgvW1xcdTEwODAtXFx1RkZGRl0vZywgICAgICAgICBmdW5jdGlvbihjaCkgeyByZXR1cm4gJ1xcXFx1JyAgKyBoZXgoY2gpOyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBleHBlY3RlZERlc2NzID0gbmV3IEFycmF5KGV4cGVjdGVkLmxlbmd0aCksXG4gICAgICAgICAgICBleHBlY3RlZERlc2MsIGZvdW5kRGVzYywgaTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZXhwZWN0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBleHBlY3RlZERlc2NzW2ldID0gZXhwZWN0ZWRbaV0uZGVzY3JpcHRpb247XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3RlZERlc2MgPSBleHBlY3RlZC5sZW5ndGggPiAxXG4gICAgICAgICAgPyBleHBlY3RlZERlc2NzLnNsaWNlKDAsIC0xKS5qb2luKFwiLCBcIilcbiAgICAgICAgICAgICAgKyBcIiBvciBcIlxuICAgICAgICAgICAgICArIGV4cGVjdGVkRGVzY3NbZXhwZWN0ZWQubGVuZ3RoIC0gMV1cbiAgICAgICAgICA6IGV4cGVjdGVkRGVzY3NbMF07XG5cbiAgICAgICAgZm91bmREZXNjID0gZm91bmQgPyBcIlxcXCJcIiArIHN0cmluZ0VzY2FwZShmb3VuZCkgKyBcIlxcXCJcIiA6IFwiZW5kIG9mIGlucHV0XCI7XG5cbiAgICAgICAgcmV0dXJuIFwiRXhwZWN0ZWQgXCIgKyBleHBlY3RlZERlc2MgKyBcIiBidXQgXCIgKyBmb3VuZERlc2MgKyBcIiBmb3VuZC5cIjtcbiAgICAgIH1cblxuICAgICAgdmFyIHBvc0RldGFpbHMgPSBwZWckY29tcHV0ZVBvc0RldGFpbHMocG9zKSxcbiAgICAgICAgICBmb3VuZCAgICAgID0gcG9zIDwgaW5wdXQubGVuZ3RoID8gaW5wdXQuY2hhckF0KHBvcykgOiBudWxsO1xuXG4gICAgICBpZiAoZXhwZWN0ZWQgIT09IG51bGwpIHtcbiAgICAgICAgY2xlYW51cEV4cGVjdGVkKGV4cGVjdGVkKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgbWVzc2FnZSAhPT0gbnVsbCA/IG1lc3NhZ2UgOiBidWlsZE1lc3NhZ2UoZXhwZWN0ZWQsIGZvdW5kKSxcbiAgICAgICAgZXhwZWN0ZWQsXG4gICAgICAgIGZvdW5kLFxuICAgICAgICBwb3MsXG4gICAgICAgIHBvc0RldGFpbHMubGluZSxcbiAgICAgICAgcG9zRGV0YWlscy5jb2x1bW5cbiAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlQ29udGVudCgpIHtcbiAgICAgIHZhciBzMCwgczE7XG5cbiAgICAgIHMwID0gW107XG4gICAgICBzMSA9IHBlZyRwYXJzZUNvbW1lbnQoKTtcbiAgICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMSA9IHBlZyRwYXJzZUNvbmRpdGlvbmFsVGFnKCk7XG4gICAgICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxID0gcGVnJHBhcnNlQmxvY2tUYWcoKTtcbiAgICAgICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMxID0gcGVnJHBhcnNlU2luZ2xlVGFnKCk7XG4gICAgICAgICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczEgPSBwZWckcGFyc2VCbG9ja0h0bWxUYWcoKTtcbiAgICAgICAgICAgICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckcGFyc2VTaW5nbGVIdG1sVGFnKCk7XG4gICAgICAgICAgICAgICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzMSA9IHBlZyRwYXJzZUludmFsaWRUYWcoKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRwYXJzZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdoaWxlIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMC5wdXNoKHMxKTtcbiAgICAgICAgczEgPSBwZWckcGFyc2VDb21tZW50KCk7XG4gICAgICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxID0gcGVnJHBhcnNlQ29uZGl0aW9uYWxUYWcoKTtcbiAgICAgICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMxID0gcGVnJHBhcnNlQmxvY2tUYWcoKTtcbiAgICAgICAgICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzMSA9IHBlZyRwYXJzZVNpbmdsZVRhZygpO1xuICAgICAgICAgICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRwYXJzZUJsb2NrSHRtbFRhZygpO1xuICAgICAgICAgICAgICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczEgPSBwZWckcGFyc2VTaW5nbGVIdG1sVGFnKCk7XG4gICAgICAgICAgICAgICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckcGFyc2VJbnZhbGlkVGFnKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIHMxID0gcGVnJHBhcnNlVGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VDb21tZW50KCkge1xuICAgICAgdmFyIHMwO1xuXG4gICAgICBzMCA9IHBlZyRwYXJzZUNvbW1lbnRUYWcoKTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRwYXJzZUZ1bGxMaW5lQ29tbWVudCgpO1xuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMCA9IHBlZyRwYXJzZVNpbmdsZUxpbmVDb21tZW50KCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZVNpbmdsZVRhZygpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczc7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZU9wZW5pbmdCcmFja2V0KCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgczQgPSBwZWckcGFyc2VTaW5nbGVUYWdOYW1lKCk7XG4gICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM1ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgICAgczYgPSBbXTtcbiAgICAgICAgICBzNyA9IHBlZyRwYXJzZVRhZ05hbWVDaGFyYWN0ZXIoKTtcbiAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHdoaWxlIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNi5wdXNoKHM3KTtcbiAgICAgICAgICAgICAgczcgPSBwZWckcGFyc2VUYWdOYW1lQ2hhcmFjdGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHM2ID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgICBpZiAoczYgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJGMyO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHM1O1xuICAgICAgICAgICAgczUgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczQgPSBbczQsIHM1XTtcbiAgICAgICAgICAgIHMzID0gczQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICBzMyA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICBzMyA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IGlucHV0LnN1YnN0cmluZyhzMiwgcGVnJGN1cnJQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHMyID0gczM7XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMzID0gW107XG4gICAgICAgICAgczQgPSBwZWckcGFyc2VBdHRyaWJ1dGVzKCk7XG4gICAgICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlQXR0cmlidXRlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlQ2xvc2luZ0JyYWNrZXQoKTtcbiAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczEgPSBwZWckYzMoczIsIHMzKTtcbiAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlU2luZ2xlSHRtbFRhZygpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczc7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZU9wZW5pbmdCcmFja2V0KCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgczQgPSBwZWckcGFyc2VIdG1sVGFnTmFtZSgpO1xuICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICAgIHM2ID0gW107XG4gICAgICAgICAgczcgPSBwZWckcGFyc2VUYWdOYW1lQ2hhcmFjdGVyKCk7XG4gICAgICAgICAgaWYgKHM3ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICB3aGlsZSAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczYucHVzaChzNyk7XG4gICAgICAgICAgICAgIHM3ID0gcGVnJHBhcnNlVGFnTmFtZUNoYXJhY3RlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzNiA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgICAgaWYgKHM2ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRjMjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNTtcbiAgICAgICAgICAgIHM1ID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM0ID0gW3M0LCBzNV07XG4gICAgICAgICAgICBzMyA9IHM0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgczMgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgczMgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBpbnB1dC5zdWJzdHJpbmcoczIsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBzMiA9IHMzO1xuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IFtdO1xuICAgICAgICAgIHM0ID0gcGVnJHBhcnNlQXR0cmlidXRlcygpO1xuICAgICAgICAgIHdoaWxlIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczMucHVzaChzNCk7XG4gICAgICAgICAgICBzNCA9IHBlZyRwYXJzZUF0dHJpYnV0ZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNCA9IHBlZyRwYXJzZVNlbGZDbG9zaW5nQnJhY2tldCgpO1xuICAgICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMSA9IHBlZyRjMyhzMiwgczMpO1xuICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VCbG9ja1RhZygpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gcGVnJHBhcnNlU3RhcnRUYWcoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRwYXJzZUNvbnRlbnQoKTtcbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBwZWckcGFyc2VFbmRUYWcoKTtcbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzQoczEsIHMyLCBzMyk7XG4gICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlQ29uZGl0aW9uYWxUYWcoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNTtcblxuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gcGVnJHBhcnNlQ29uZGl0aW9uU3RhcnRUYWcoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRwYXJzZUNvbnRlbnQoKTtcbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBbXTtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZUVsc0lmVGFnKCk7XG4gICAgICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlRWxzSWZUYWcoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNCA9IHBlZyRwYXJzZUVsc2VUYWcoKTtcbiAgICAgICAgICAgIGlmIChzNCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNCA9IHBlZyRjNTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRwYXJzZUNvbmRpdGlvbkVuZFRhZygpO1xuICAgICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRjNihzMSwgczIsIHMzLCBzNCwgczUpO1xuICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VJbnZhbGlkVGFnKCkge1xuICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNDtcblxuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gcGVnJHBhcnNlT3BlbmluZ0VuZEJyYWNrZXQoKTtcbiAgICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMSA9IHBlZyRwYXJzZU9wZW5pbmdCcmFja2V0KCk7XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VVbmtub3duVGFnTmFtZSgpO1xuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IFtdO1xuICAgICAgICAgIHM0ID0gcGVnJHBhcnNlQXR0cmlidXRlcygpO1xuICAgICAgICAgIHdoaWxlIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczMucHVzaChzNCk7XG4gICAgICAgICAgICBzNCA9IHBlZyRwYXJzZUF0dHJpYnV0ZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNCA9IHBlZyRwYXJzZUNsb3NpbmdCcmFja2V0KCk7XG4gICAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGM3KHMyLCBzMyk7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZUVsc0lmVGFnKCkge1xuICAgICAgdmFyIHMwLCBzMSwgczI7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZUVsc0lmU3RhcnRUYWcoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRwYXJzZUNvbnRlbnQoKTtcbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzgoczEsIHMyKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlRWxzZVRhZygpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyO1xuXG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBwZWckcGFyc2VFbHNlU3RhcnRUYWcoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRwYXJzZUNvbnRlbnQoKTtcbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzkoczIpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VOb25UZXh0KCkge1xuICAgICAgdmFyIHMwO1xuXG4gICAgICBzMCA9IHBlZyRwYXJzZUNvbW1lbnQoKTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRwYXJzZVNpbmdsZVRhZygpO1xuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMCA9IHBlZyRwYXJzZVN0YXJ0VGFnKCk7XG4gICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUVuZFRhZygpO1xuICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQ29uZGl0aW9uU3RhcnRUYWcoKTtcbiAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VFbHNJZlN0YXJ0VGFnKCk7XG4gICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUVsc2VTdGFydFRhZygpO1xuICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQ29uZGl0aW9uRW5kVGFnKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlSW52YWxpZFRhZygpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VTdGFydEh0bWxUYWcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUVuZEh0bWxUYWcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZVRleHQoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNTtcblxuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMiA9IFtdO1xuICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgIHM0ID0gcGVnJGN1cnJQb3M7XG4gICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgIHM1ID0gcGVnJHBhcnNlTm9uVGV4dCgpO1xuICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICBpZiAoczUgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczQgPSBwZWckYzI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgIH1cbiAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzNSA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IFtzNCwgczVdO1xuICAgICAgICAgIHMzID0gczQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICBzMyA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgczMgPSBwZWckYzE7XG4gICAgICB9XG4gICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgd2hpbGUgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIucHVzaChzMyk7XG4gICAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgICBzNCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICAgIHM1ID0gcGVnJHBhcnNlTm9uVGV4dCgpO1xuICAgICAgICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgICAgICAgIGlmIChzNSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczQgPSBwZWckYzI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczQ7XG4gICAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM0ID0gW3M0LCBzNV07XG4gICAgICAgICAgICAgIHMzID0gczQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICBzMyA9IHBlZyRjMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgIHMzID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBwZWckYzE7XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBpbnB1dC5zdWJzdHJpbmcoczEsIHBlZyRjdXJyUG9zKTtcbiAgICAgIH1cbiAgICAgIHMxID0gczI7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMxMChzMSk7XG4gICAgICB9XG4gICAgICBzMCA9IHMxO1xuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlU3RhcnRUYWcoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0O1xuXG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBwZWckcGFyc2VPcGVuaW5nQnJhY2tldCgpO1xuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gcGVnJHBhcnNlQmxvY2tUYWdOYW1lKCk7XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMzID0gW107XG4gICAgICAgICAgczQgPSBwZWckcGFyc2VBdHRyaWJ1dGVzKCk7XG4gICAgICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlQXR0cmlidXRlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlQ2xvc2luZ0JyYWNrZXQoKTtcbiAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczEgPSBwZWckYzExKHMyLCBzMyk7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZUVuZFRhZygpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQ7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZU9wZW5pbmdFbmRCcmFja2V0KCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VCbG9ja1RhZ05hbWUoKTtcbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBbXTtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZUF0dHJpYnV0ZXMoKTtcbiAgICAgICAgICB3aGlsZSAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMzLnB1c2goczQpO1xuICAgICAgICAgICAgczQgPSBwZWckcGFyc2VBdHRyaWJ1dGVzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczQgPSBwZWckcGFyc2VDbG9zaW5nQnJhY2tldCgpO1xuICAgICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMSA9IHBlZyRjMTIoczIpO1xuICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VDb25kaXRpb25TdGFydFRhZygpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQ7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZU9wZW5pbmdCcmFja2V0KCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VDb25kaXRpb25hbFRhZ05hbWUoKTtcbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBbXTtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZUF0dHJpYnV0ZXMoKTtcbiAgICAgICAgICB3aGlsZSAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMzLnB1c2goczQpO1xuICAgICAgICAgICAgczQgPSBwZWckcGFyc2VBdHRyaWJ1dGVzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczQgPSBwZWckcGFyc2VDbG9zaW5nQnJhY2tldCgpO1xuICAgICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMSA9IHBlZyRjMTMoczIsIHMzKTtcbiAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlRWxzSWZTdGFydFRhZygpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQ7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZU9wZW5pbmdCcmFja2V0KCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VFbHNJZlRhZ05hbWUoKTtcbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBbXTtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZUF0dHJpYnV0ZXMoKTtcbiAgICAgICAgICB3aGlsZSAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMzLnB1c2goczQpO1xuICAgICAgICAgICAgczQgPSBwZWckcGFyc2VBdHRyaWJ1dGVzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczQgPSBwZWckcGFyc2VDbG9zaW5nQnJhY2tldCgpO1xuICAgICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMSA9IHBlZyRjMTQoczMpO1xuICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VFbHNlU3RhcnRUYWcoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZU9wZW5pbmdCcmFja2V0KCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VFbHNlVGFnTmFtZSgpO1xuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IHBlZyRwYXJzZUNsb3NpbmdCcmFja2V0KCk7XG4gICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IFtzMSwgczIsIHMzXTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VDb25kaXRpb25FbmRUYWcoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZU9wZW5pbmdFbmRCcmFja2V0KCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VDb25kaXRpb25hbFRhZ05hbWUoKTtcbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBwZWckcGFyc2VDbG9zaW5nQnJhY2tldCgpO1xuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMTIoczIpO1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZVNpbmdsZUxpbmVDb21tZW50KCkge1xuICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2O1xuXG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBwZWckcGFyc2VDb21tZW50U3RhcnQoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMyA9IFtdO1xuICAgICAgICBzNCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzNSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgICAgczYgPSBwZWckcGFyc2VMaW5lVGVybWluYXRvcigpO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHM2ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczUgPSBwZWckYzI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNTtcbiAgICAgICAgICBzNSA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNiA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBbczUsIHM2XTtcbiAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczQ7XG4gICAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICBzNCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgIHM1ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgICAgczYgPSBwZWckcGFyc2VMaW5lVGVybWluYXRvcigpO1xuICAgICAgICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgICAgICAgIGlmIChzNiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBwZWckYzI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICBzNSA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNiA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM1ID0gW3M1LCBzNl07XG4gICAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICAgIHM0ID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IGlucHV0LnN1YnN0cmluZyhzMiwgcGVnJGN1cnJQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHMyID0gczM7XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMxNShzMik7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZUZ1bGxMaW5lQ29tbWVudCgpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNjtcblxuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gcGVnJHBhcnNlRnVsbExpbmVDb21tZW50U3RhcnQoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMyA9IFtdO1xuICAgICAgICBzNCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzNSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgICAgczYgPSBwZWckcGFyc2VMaW5lVGVybWluYXRvcigpO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHM2ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczUgPSBwZWckYzI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNTtcbiAgICAgICAgICBzNSA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNiA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBbczUsIHM2XTtcbiAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczQ7XG4gICAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICBzNCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgIHM1ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgICAgczYgPSBwZWckcGFyc2VMaW5lVGVybWluYXRvcigpO1xuICAgICAgICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgICAgICAgIGlmIChzNiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBwZWckYzI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICBzNSA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNiA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM1ID0gW3M1LCBzNl07XG4gICAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICAgIHM0ID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IGlucHV0LnN1YnN0cmluZyhzMiwgcGVnJGN1cnJQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHMyID0gczM7XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMxNihzMik7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZUNvbW1lbnRUYWcoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNSwgczY7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZUNvbW1lbnRUYWdTdGFydCgpO1xuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMzID0gW107XG4gICAgICAgIHM0ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHM1ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICBzNiA9IHBlZyRwYXJzZUNvbW1lbnRUYWdFbmQoKTtcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzNiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM1ID0gcGVnJGMyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgczUgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczYgPSBwZWckcGFyc2VTb3VyY2VDaGFyYWN0ZXIoKTtcbiAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM1ID0gW3M1LCBzNl07XG4gICAgICAgICAgICBzNCA9IHM1O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgICAgczQgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczQ7XG4gICAgICAgICAgczQgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMucHVzaChzNCk7XG4gICAgICAgICAgczQgPSBwZWckY3VyclBvcztcbiAgICAgICAgICBzNSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICAgIHM2ID0gcGVnJHBhcnNlQ29tbWVudFRhZ0VuZCgpO1xuICAgICAgICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgICAgICAgIGlmIChzNiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBwZWckYzI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICBzNSA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNiA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM1ID0gW3M1LCBzNl07XG4gICAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICAgIHM0ID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IGlucHV0LnN1YnN0cmluZyhzMiwgcGVnJGN1cnJQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHMyID0gczM7XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMzID0gcGVnJHBhcnNlQ29tbWVudFRhZ0VuZCgpO1xuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMTcoczIpO1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZUF0dHJpYnV0ZXMoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMjtcblxuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gW107XG4gICAgICBzMiA9IHBlZyRwYXJzZVdoaXRlU3BhY2UoKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICB3aGlsZSAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMS5wdXNoKHMyKTtcbiAgICAgICAgICBzMiA9IHBlZyRwYXJzZVdoaXRlU3BhY2UoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczEgPSBwZWckYzE7XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VBdHRyaWJ1dGVXaXRoVmFsdWUoKTtcbiAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIgPSBwZWckcGFyc2VBdHRyaWJ1dGVXaXRob3V0VmFsdWUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjMTgoczIpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgczEgPSBbXTtcbiAgICAgICAgczIgPSBwZWckcGFyc2VXaGl0ZVNwYWNlKCk7XG4gICAgICAgIHdoaWxlIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICAgIHMyID0gcGVnJHBhcnNlV2hpdGVTcGFjZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gcGVnJHBhcnNlUGVybEV4cHJlc3Npb24oKTtcbiAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzE5KHMyKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlUGVybEV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNSwgczY7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZVBlcmxFeHByZXNzaW9uU3RhcnQoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMyA9IFtdO1xuICAgICAgICBzNCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzNSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgICAgczYgPSBwZWckcGFyc2VQZXJsRXhwcmVzc2lvbkVuZCgpO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHM2ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczUgPSBwZWckYzI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNTtcbiAgICAgICAgICBzNSA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNiA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBbczUsIHM2XTtcbiAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczQ7XG4gICAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICBzNCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgIHM1ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgICAgczYgPSBwZWckcGFyc2VQZXJsRXhwcmVzc2lvbkVuZCgpO1xuICAgICAgICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgICAgICAgIGlmIChzNiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBwZWckYzI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICBzNSA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNiA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM1ID0gW3M1LCBzNl07XG4gICAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICAgIHM0ID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IGlucHV0LnN1YnN0cmluZyhzMiwgcGVnJGN1cnJQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHMyID0gczM7XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMzID0gcGVnJHBhcnNlUGVybEV4cHJlc3Npb25FbmQoKTtcbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzIwKHMyKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VBdHRyaWJ1dGVXaXRoVmFsdWUoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZUF0dHJpYnV0ZVRva2VuKCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2MSkge1xuICAgICAgICAgIHMyID0gcGVnJGMyMTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjIpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBwZWckcGFyc2VBdHRyaWJ1dGVUb2tlbigpO1xuICAgICAgICAgIGlmIChzMyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczMgPSBwZWckcGFyc2VQZXJsRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgaWYgKHMzID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHMzID0gcGVnJHBhcnNlUXVvdGVkU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMjMoczEsIHMzKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VBdHRyaWJ1dGVXaXRob3V0VmFsdWUoKSB7XG4gICAgICB2YXIgczAsIHMxO1xuXG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBwZWckcGFyc2VBdHRyaWJ1dGVUb2tlbigpO1xuICAgICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMxID0gcGVnJHBhcnNlUXVvdGVkU3RyaW5nKCk7XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMyNChzMSk7XG4gICAgICB9XG4gICAgICBzMCA9IHMxO1xuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlQXR0cmlidXRlVG9rZW4oKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgICAgczIgPSBbXTtcbiAgICAgIGlmIChwZWckYzI1LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgczMgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjYpOyB9XG4gICAgICB9XG4gICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgd2hpbGUgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIucHVzaChzMyk7XG4gICAgICAgICAgaWYgKHBlZyRjMjUudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgICAgczMgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI2KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBwZWckYzE7XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBpbnB1dC5zdWJzdHJpbmcoczEsIHBlZyRjdXJyUG9zKTtcbiAgICAgIH1cbiAgICAgIHMxID0gczI7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMyNyhzMSk7XG4gICAgICB9XG4gICAgICBzMCA9IHMxO1xuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlUXVvdGVkU3RyaW5nKCkge1xuICAgICAgdmFyIHMwO1xuXG4gICAgICBzMCA9IHBlZyRwYXJzZVNpbmdsZVF1b3RlZFN0cmluZygpO1xuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJHBhcnNlRG91YmxlUXVvdGVkU3RyaW5nKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VTaW5nbGVRdW90ZWRTdHJpbmcoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM5KSB7XG4gICAgICAgIHMxID0gcGVnJGMyODtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI5KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gW107XG4gICAgICAgIHMzID0gcGVnJHBhcnNlU2luZ2xlU3RyaW5nQ2hhcmFjdGVyKCk7XG4gICAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyLnB1c2goczMpO1xuICAgICAgICAgIHMzID0gcGVnJHBhcnNlU2luZ2xlU3RyaW5nQ2hhcmFjdGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzOSkge1xuICAgICAgICAgICAgczMgPSBwZWckYzI4O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI5KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzMwKHMyKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VEb3VibGVRdW90ZWRTdHJpbmcoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM0KSB7XG4gICAgICAgIHMxID0gcGVnJGMzMTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzMyKTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gW107XG4gICAgICAgIHMzID0gcGVnJHBhcnNlRG91YmxlU3RyaW5nQ2hhcmFjdGVyKCk7XG4gICAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyLnB1c2goczMpO1xuICAgICAgICAgIHMzID0gcGVnJHBhcnNlRG91YmxlU3RyaW5nQ2hhcmFjdGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzNCkge1xuICAgICAgICAgICAgczMgPSBwZWckYzMxO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzMyKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzMwKHMyKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VLbm93blRhZ05hbWUoKSB7XG4gICAgICB2YXIgczA7XG5cbiAgICAgIHMwID0gcGVnJHBhcnNlQmxvY2tUYWdOYW1lKCk7XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckcGFyc2VDb25kaXRpb25hbFRhZ05hbWUoKTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczAgPSBwZWckcGFyc2VFbHNJZlRhZ05hbWUoKTtcbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlRWxzZVRhZ05hbWUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZVVua25vd25UYWdOYW1lKCkge1xuICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczU7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgczMgPSBwZWckcGFyc2VLbm93blRhZ05hbWUoKTtcbiAgICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgICAgaWYgKHMzID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gcGVnJGMyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgczIgPSBwZWckYzE7XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNSkgPT09IHBlZyRjMzMpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjMzM7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzM0KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0ID0gW107XG4gICAgICAgICAgczUgPSBwZWckcGFyc2VUYWdOYW1lQ2hhcmFjdGVyKCk7XG4gICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICB3aGlsZSAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczQucHVzaChzNSk7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJHBhcnNlVGFnTmFtZUNoYXJhY3RlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzNCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMiA9IFtzMiwgczMsIHM0XTtcbiAgICAgICAgICAgIHMxID0gczI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgICBzMSA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgczEgPSBwZWckYzE7XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczEgPSBpbnB1dC5zdWJzdHJpbmcoczAsIHBlZyRjdXJyUG9zKTtcbiAgICAgIH1cbiAgICAgIHMwID0gczE7XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VTaW5nbGVUYWdOYW1lKCkge1xuICAgICAgdmFyIHMwO1xuXG4gICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAxMikgPT09IHBlZyRjMzUpIHtcbiAgICAgICAgczAgPSBwZWckYzM1O1xuICAgICAgICBwZWckY3VyclBvcyArPSAxMjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzM2KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDgpID09PSBwZWckYzM3KSB7XG4gICAgICAgICAgczAgPSBwZWckYzM3O1xuICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzOCk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA2KSA9PT0gcGVnJGMzOSkge1xuICAgICAgICAgICAgczAgPSBwZWckYzM5O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQwKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlQmxvY2tUYWdOYW1lKCkge1xuICAgICAgdmFyIHMwO1xuXG4gICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAxMCkgPT09IHBlZyRjNDEpIHtcbiAgICAgICAgczAgPSBwZWckYzQxO1xuICAgICAgICBwZWckY3VyclBvcyArPSAxMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQyKTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDgpID09PSBwZWckYzQzKSB7XG4gICAgICAgICAgczAgPSBwZWckYzQzO1xuICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM0NCk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA5KSA9PT0gcGVnJGM0NSkge1xuICAgICAgICAgICAgczAgPSBwZWckYzQ1O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gOTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQ2KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDExKSA9PT0gcGVnJGM0Nykge1xuICAgICAgICAgICAgICBzMCA9IHBlZyRjNDc7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDExO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNDgpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgOSkgPT09IHBlZyRjNDkpIHtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNDk7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gOTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzUwKTsgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDcpID09PSBwZWckYzUxKSB7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNTE7XG4gICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA3O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTIpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VDb25kaXRpb25hbFRhZ05hbWUoKSB7XG4gICAgICB2YXIgczA7XG5cbiAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDcpID09PSBwZWckYzUzKSB7XG4gICAgICAgIHMwID0gcGVnJGM1MztcbiAgICAgICAgcGVnJGN1cnJQb3MgKz0gNztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzU0KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDExKSA9PT0gcGVnJGM1NSkge1xuICAgICAgICAgIHMwID0gcGVnJGM1NTtcbiAgICAgICAgICBwZWckY3VyclBvcyArPSAxMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzU2KTsgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VFbHNJZlRhZ05hbWUoKSB7XG4gICAgICB2YXIgczA7XG5cbiAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDEwKSA9PT0gcGVnJGM1Nykge1xuICAgICAgICBzMCA9IHBlZyRjNTc7XG4gICAgICAgIHBlZyRjdXJyUG9zICs9IDEwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTgpOyB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VFbHNlVGFnTmFtZSgpIHtcbiAgICAgIHZhciBzMDtcblxuICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgOSkgPT09IHBlZyRjNTkpIHtcbiAgICAgICAgczAgPSBwZWckYzU5O1xuICAgICAgICBwZWckY3VyclBvcyArPSA5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjApOyB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VDb21tZW50VGFnTmFtZSgpIHtcbiAgICAgIHZhciBzMDtcblxuICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMTIpID09PSBwZWckYzYxKSB7XG4gICAgICAgIHMwID0gcGVnJGM2MTtcbiAgICAgICAgcGVnJGN1cnJQb3MgKz0gMTI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Mik7IH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZVdoaXRlU3BhY2VDb250cm9sU3RhcnQoKSB7XG4gICAgICB2YXIgczAsIHMxO1xuXG4gICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDUpIHtcbiAgICAgICAgczAgPSBwZWckYzY0O1xuICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjUpOyB9XG4gICAgICB9XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMikgPT09IHBlZyRjNjYpIHtcbiAgICAgICAgICBzMCA9IHBlZyRjNjY7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgKz0gMjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzY3KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDIpID09PSBwZWckYzY4KSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRjNjg7XG4gICAgICAgICAgICBwZWckY3VyclBvcyArPSAyO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjkpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMjYpIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzcwO1xuICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNzEpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Myk7IH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZVdoaXRlU3BhY2VDb250cm9sRW5kKCkge1xuICAgICAgdmFyIHMwLCBzMTtcblxuICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ1KSB7XG4gICAgICAgIHMwID0gcGVnJGM2NDtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzY1KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDIpID09PSBwZWckYzcyKSB7XG4gICAgICAgICAgczAgPSBwZWckYzcyO1xuICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM3Myk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAyKSA9PT0gcGVnJGM3NCkge1xuICAgICAgICAgICAgczAgPSBwZWckYzc0O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gMjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzc1KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMTI2KSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJGM3MDtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzcxKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjMpOyB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VDb21tZW50VGFnU3RhcnQoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZU9wZW5pbmdCcmFja2V0KCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VDb21tZW50VGFnTmFtZSgpO1xuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IHBlZyRwYXJzZUNsb3NpbmdCcmFja2V0KCk7XG4gICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IFtzMSwgczIsIHMzXTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VDb21tZW50VGFnRW5kKCkge1xuICAgICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBwZWckcGFyc2VPcGVuaW5nRW5kQnJhY2tldCgpO1xuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gcGVnJHBhcnNlQ29tbWVudFRhZ05hbWUoKTtcbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBwZWckcGFyc2VDbG9zaW5nQnJhY2tldCgpO1xuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBbczEsIHMyLCBzM107XG4gICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlVGFnTmFtZUNoYXJhY3RlcigpIHtcbiAgICAgIHZhciBzMDtcblxuICAgICAgaWYgKHBlZyRjNzYudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICBzMCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM3Nyk7IH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZVdoaXRlU3BhY2UoKSB7XG4gICAgICB2YXIgczAsIHMxO1xuXG4gICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOSkge1xuICAgICAgICBzMCA9IHBlZyRjNzk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4MCk7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDExKSB7XG4gICAgICAgICAgczAgPSBwZWckYzgxO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4Mik7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyKSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRjODM7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjODQpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzMikge1xuICAgICAgICAgICAgICBzMCA9IHBlZyRjODU7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4Nik7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDE2MCkge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJGM4NztcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjODgpOyB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2NTI3OSkge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzg5O1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzkwKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChwZWckYzkxLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTIpOyB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VMaW5lVGVybWluYXRvcigpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNzgpOyB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VGdWxsTGluZUNvbW1lbnRTdGFydCgpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQ7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZUxpbmVUZXJtaW5hdG9yKCk7XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIHM0ID0gcGVnJHBhcnNlQ29tbWVudFN0YXJ0KCk7XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgICAgICBpZiAoczQgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjMjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgIHMzID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMzUpIHtcbiAgICAgICAgICAgIHM0ID0gcGVnJGM5MztcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM5NCk7IH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMyA9IFtzMywgczRdO1xuICAgICAgICAgICAgczIgPSBzMztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgICAgIHMyID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgIHMyID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxID0gW3MxLCBzMl07XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZUNvbW1lbnRTdGFydCgpIHtcbiAgICAgIHZhciBzMDtcblxuICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMikgPT09IHBlZyRjOTUpIHtcbiAgICAgICAgczAgPSBwZWckYzk1O1xuICAgICAgICBwZWckY3VyclBvcyArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTYpOyB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VTb3VyY2VDaGFyYWN0ZXIoKSB7XG4gICAgICB2YXIgczA7XG5cbiAgICAgIGlmIChpbnB1dC5sZW5ndGggPiBwZWckY3VyclBvcykge1xuICAgICAgICBzMCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM5Nyk7IH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZUxpbmVUZXJtaW5hdG9yKCkge1xuICAgICAgdmFyIHMwLCBzMTtcblxuICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEwKSB7XG4gICAgICAgIHMwID0gcGVnJGM5OTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzEwMCk7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAyKSA9PT0gcGVnJGMxMDEpIHtcbiAgICAgICAgICBzMCA9IHBlZyRjMTAxO1xuICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMDIpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMykge1xuICAgICAgICAgICAgczAgPSBwZWckYzEwMztcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMDQpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA4MjMyKSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJGMxMDU7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMDYpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA4MjMzKSB7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckYzEwNztcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTA4KTsgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM5OCk7IH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZU9wZW5pbmdCcmFja2V0KCkge1xuICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczU7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDYwKSB7XG4gICAgICAgIHMxID0gcGVnJGMxMDk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMTApOyB9XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgICAgczMgPSBwZWckcGFyc2VXaGl0ZVNwYWNlQ29udHJvbFN0YXJ0KCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0ID0gW107XG4gICAgICAgICAgczUgPSBwZWckcGFyc2VXaGl0ZVNwYWNlKCk7XG4gICAgICAgICAgd2hpbGUgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNC5wdXNoKHM1KTtcbiAgICAgICAgICAgIHM1ID0gcGVnJHBhcnNlV2hpdGVTcGFjZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMzID0gW3MzLCBzNF07XG4gICAgICAgICAgICBzMiA9IHMzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgczIgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgczIgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIgPSBwZWckYzU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczEgPSBbczEsIHMyXTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlT3BlbmluZ0VuZEJyYWNrZXQoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDYwKSB7XG4gICAgICAgIHMxID0gcGVnJGMxMDk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMTApOyB9XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VXaGl0ZVNwYWNlQ29udHJvbFN0YXJ0KCk7XG4gICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gcGVnJGM1O1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDcpIHtcbiAgICAgICAgICAgIHMzID0gcGVnJGMxMTE7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTEyKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMxID0gW3MxLCBzMiwgczNdO1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZUNsb3NpbmdCcmFja2V0KCkge1xuICAgICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBbXTtcbiAgICAgIHMyID0gcGVnJHBhcnNlV2hpdGVTcGFjZSgpO1xuICAgICAgd2hpbGUgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICBzMiA9IHBlZyRwYXJzZVdoaXRlU3BhY2UoKTtcbiAgICAgIH1cbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRwYXJzZVdoaXRlU3BhY2VDb250cm9sRW5kKCk7XG4gICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gcGVnJGM1O1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjIpIHtcbiAgICAgICAgICAgIHMzID0gcGVnJGMxMTM7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTE0KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMxID0gW3MxLCBzMiwgczNdO1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2Mikge1xuICAgICAgICAgIHMyID0gcGVnJGMxMTM7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExNCk7IH1cbiAgICAgICAgfVxuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczEgPSBwZWckYzI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgICBzMSA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMiA9IFtdO1xuICAgICAgICAgIHMzID0gcGVnJHBhcnNlU291cmNlQ2hhcmFjdGVyKCk7XG4gICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICB3aGlsZSAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczIucHVzaChzMyk7XG4gICAgICAgICAgICAgIHMzID0gcGVnJHBhcnNlU291cmNlQ2hhcmFjdGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHMyID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzExNSgpO1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VTZWxmQ2xvc2luZ0JyYWNrZXQoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IFtdO1xuICAgICAgczIgPSBwZWckcGFyc2VXaGl0ZVNwYWNlKCk7XG4gICAgICB3aGlsZSAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczEucHVzaChzMik7XG4gICAgICAgIHMyID0gcGVnJHBhcnNlV2hpdGVTcGFjZSgpO1xuICAgICAgfVxuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gcGVnJHBhcnNlV2hpdGVTcGFjZUNvbnRyb2xFbmQoKTtcbiAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIgPSBwZWckYzU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMikgPT09IHBlZyRjMTE2KSB7XG4gICAgICAgICAgICBzMyA9IHBlZyRjMTE2O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gMjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExNyk7IH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IFtzMSwgczIsIHMzXTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgczEgPSBwZWckY3VyclBvcztcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjIpIHtcbiAgICAgICAgICBzMiA9IHBlZyRjMTEzO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMTQpOyB9XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxID0gcGVnJGMyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICAgICAgczEgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIgPSBbXTtcbiAgICAgICAgICBzMyA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgd2hpbGUgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHMyLnB1c2goczMpO1xuICAgICAgICAgICAgICBzMyA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgIHMxID0gcGVnJGMxMTUoKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlUGVybEV4cHJlc3Npb25TdGFydCgpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDIpID09PSBwZWckYzExOCkge1xuICAgICAgICBzMSA9IHBlZyRjMTE4O1xuICAgICAgICBwZWckY3VyclBvcyArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTE5KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gW107XG4gICAgICAgIHMzID0gcGVnJHBhcnNlV2hpdGVTcGFjZSgpO1xuICAgICAgICB3aGlsZSAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgICBzMyA9IHBlZyRwYXJzZVdoaXRlU3BhY2UoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMSA9IFtzMSwgczJdO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VQZXJsRXhwcmVzc2lvbkVuZCgpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyO1xuXG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBbXTtcbiAgICAgIHMyID0gcGVnJHBhcnNlV2hpdGVTcGFjZSgpO1xuICAgICAgd2hpbGUgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICBzMiA9IHBlZyRwYXJzZVdoaXRlU3BhY2UoKTtcbiAgICAgIH1cbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAyKSA9PT0gcGVnJGMxMjApIHtcbiAgICAgICAgICBzMiA9IHBlZyRjMTIwO1xuICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMjEpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczEgPSBbczEsIHMyXTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlU2luZ2xlU3RyaW5nQ2hhcmFjdGVyKCkge1xuICAgICAgdmFyIHMwLCBzMSwgczI7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM5KSB7XG4gICAgICAgIHMyID0gcGVnJGMyODtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI5KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTIpIHtcbiAgICAgICAgICBzMiA9IHBlZyRjMTIyO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMjMpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIgPSBwZWckcGFyc2VMaW5lVGVybWluYXRvcigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMSA9IHBlZyRjMjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICAgIHMxID0gcGVnJGMxO1xuICAgICAgfVxuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gcGVnJHBhcnNlU291cmNlQ2hhcmFjdGVyKCk7XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMxMjQoKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTIpIHtcbiAgICAgICAgICBzMSA9IHBlZyRjMTIyO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMjMpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIgPSBwZWckcGFyc2VTaW5nbGVFc2NhcGVDaGFyYWN0ZXIoKTtcbiAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzEyNShzMik7XG4gICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZURvdWJsZVN0cmluZ0NoYXJhY3RlcigpIHtcbiAgICAgIHZhciBzMCwgczEsIHMyO1xuXG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBwZWckY3VyclBvcztcbiAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzNCkge1xuICAgICAgICBzMiA9IHBlZyRjMzE7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzMik7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkyKSB7XG4gICAgICAgICAgczIgPSBwZWckYzEyMjtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTIzKTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gcGVnJHBhcnNlTGluZVRlcm1pbmF0b3IoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczEgPSBwZWckYzI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICBzMSA9IHBlZyRjMTtcbiAgICAgIH1cbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRwYXJzZVNvdXJjZUNoYXJhY3RlcigpO1xuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjMTI0KCk7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkyKSB7XG4gICAgICAgICAgczEgPSBwZWckYzEyMjtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTIzKTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gcGVnJHBhcnNlU2luZ2xlRXNjYXBlQ2hhcmFjdGVyKCk7XG4gICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgIHMxID0gcGVnJGMxMjUoczIpO1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VTaW5nbGVFc2NhcGVDaGFyYWN0ZXIoKSB7XG4gICAgICB2YXIgczAsIHMxO1xuXG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM5KSB7XG4gICAgICAgIHMwID0gcGVnJGMyODtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI5KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMzQpIHtcbiAgICAgICAgICBzMCA9IHBlZyRjMzE7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzMyKTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTIpIHtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxMjI7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTIzKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDk4KSB7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGMxMjY7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMjcpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGMxMjgoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMDIpIHtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRjMTI5O1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMzApOyB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckYzEzMSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMTApIHtcbiAgICAgICAgICAgICAgICAgIHMxID0gcGVnJGMxMzI7XG4gICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTMzKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzEzNCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMTE0KSB7XG4gICAgICAgICAgICAgICAgICAgIHMxID0gcGVnJGMxMzU7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMzYpOyB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgIHMxID0gcGVnJGMxMzcoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMTYpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjMTM4O1xuICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMzkpOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzE0MCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMTgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMxID0gcGVnJGMxNDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTQyKTsgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzE0MygpO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VCbG9ja0h0bWxUYWcoKSB7XG4gICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZVN0YXJ0SHRtbFRhZygpO1xuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gcGVnJHBhcnNlQ29udGVudCgpO1xuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IHBlZyRwYXJzZUVuZEh0bWxUYWcoKTtcbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzQoczEsIHMyLCBzMyk7XG4gICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gczA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlU3RhcnRIdG1sVGFnKCkge1xuICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNDtcblxuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjApIHtcbiAgICAgICAgczEgPSBwZWckYzEwOTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExMCk7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRwYXJzZUh0bWxUYWdOYW1lKCk7XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMzID0gW107XG4gICAgICAgICAgczQgPSBwZWckcGFyc2VBdHRyaWJ1dGVzKCk7XG4gICAgICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlQXR0cmlidXRlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjIpIHtcbiAgICAgICAgICAgICAgczQgPSBwZWckYzExMztcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExNCk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczEgPSBwZWckYzE0NChzMiwgczMpO1xuICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VFbmRIdG1sVGFnKCkge1xuICAgICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMikgPT09IHBlZyRjMTQ1KSB7XG4gICAgICAgIHMxID0gcGVnJGMxNDU7XG4gICAgICAgIHBlZyRjdXJyUG9zICs9IDI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxNDYpOyB9XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VIdG1sVGFnTmFtZSgpO1xuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDYyKSB7XG4gICAgICAgICAgICBzMyA9IHBlZyRjMTEzO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExNCk7IH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgIHMxID0gcGVnJGMxNDcoczIpO1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZUh0bWxUYWdOYW1lKCkge1xuICAgICAgdmFyIHMwLCBzMSwgczI7XG5cbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IFtdO1xuICAgICAgaWYgKHBlZyRjMTQ4LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTQ5KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHdoaWxlIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICAgIGlmIChwZWckYzE0OC50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgICBzMiA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTQ5KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczEgPSBwZWckYzE7XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMxNTAoczEpO1xuICAgICAgfVxuICAgICAgczAgPSBzMTtcblxuICAgICAgcmV0dXJuIHMwO1xuICAgIH1cblxuXG4gICAgICBmdW5jdGlvbiBqb2luKHMpIHtcbiAgICAgICAgcmV0dXJuIHMuam9pbihcIlwiKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gdG9rZW4ob2JqZWN0LCBsaW5lLCBjb2x1bW4pIHtcbiAgICAgICAgdmFyIHByZXZlbnRQb3NpdGlvbkNhbGN1bGF0aW9uID0gKFxuICAgICAgICAgIG9wdGlvbnMucmVkdWNlUG9zaXRpb25Mb29rdXBzICYmXG4gICAgICAgICAgKFxuICAgICAgICAgICAgb2JqZWN0LnR5cGUgPT09IEJMT0NLX1RZUEVTLlRFWFQgfHxcbiAgICAgICAgICAgIG9iamVjdC50eXBlID09PSBCTE9DS19UWVBFUy5DT05ESVRJT05fQlJBTkNIIHx8XG4gICAgICAgICAgICBvYmplY3QudHlwZSA9PT0gQkxPQ0tfVFlQRVMuQUxURVJOQVRFX0NPTkRJVElPTl9CUkFOQ0ggfHxcbiAgICAgICAgICAgIG9iamVjdC50eXBlID09PSBBVFRSSUJVVEVfVFlQRVMuRVhQUkVTU0lPTiB8fFxuICAgICAgICAgICAgb2JqZWN0LnR5cGUgPT09IEFUVFJJQlVURV9UWVBFUy5QQUlSIHx8XG4gICAgICAgICAgICBvYmplY3QudHlwZSA9PT0gQVRUUklCVVRFX1RZUEVTLlNJTkdMRVxuICAgICAgICAgIClcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIXByZXZlbnRQb3NpdGlvbkNhbGN1bGF0aW9uKSB7XG4gICAgICAgICAgb2JqZWN0LnBvc2l0aW9uID0ge1xuICAgICAgICAgICAgbGluZTogbGluZSgpLFxuICAgICAgICAgICAgY29sdW1uOiBjb2x1bW4oKVxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBzeW50YXhFcnJvcihtZXNzYWdlLCBvZmZzZXQsIGxpbmUsIGNvbHVtbikge1xuICAgICAgICByZXR1cm4gbmV3IFN5bnRheEVycm9yKFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIG9mZnNldCgpLFxuICAgICAgICAgIGxpbmUoKSxcbiAgICAgICAgICBjb2x1bW4oKVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICB2YXIgQkxPQ0tfVFlQRVMgPSB7XG4gICAgICAgIENPTU1FTlQ6IFwiQ29tbWVudFwiLFxuICAgICAgICBUQUc6IFwiVGFnXCIsXG4gICAgICAgIFRFWFQ6IFwiVGV4dFwiLFxuICAgICAgICBDT05ESVRJT046IFwiQ29uZGl0aW9uXCIsXG4gICAgICAgIENPTkRJVElPTl9CUkFOQ0g6IFwiQ29uZGl0aW9uQnJhbmNoXCIsXG4gICAgICAgIEFMVEVSTkFURV9DT05ESVRJT05fQlJBTkNIOiBcIkFsdGVybmF0ZUNvbmRpdGlvbkJyYW5jaFwiLFxuICAgICAgICBJTlZBTElEX1RBRzogXCJJbnZhbGlkVGFnXCJcbiAgICAgIH07XG5cbiAgICAgIHZhciBBVFRSSUJVVEVfVFlQRVMgPSB7XG4gICAgICAgIEVYUFJFU1NJT046IFwiRXhwcmVzc2lvblwiLFxuICAgICAgICBQQUlSOiBcIlBhaXJBdHRyaWJ1dGVcIixcbiAgICAgICAgU0lOR0xFOiBcIlNpbmdsZUF0dHJpYnV0ZVwiXG4gICAgICB9O1xuXG4gICAgICB2YXIgQ09MVU1OX09ORSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuXG4gICAgcGVnJHJlc3VsdCA9IHBlZyRzdGFydFJ1bGVGdW5jdGlvbigpO1xuXG4gICAgaWYgKHBlZyRyZXN1bHQgIT09IHBlZyRGQUlMRUQgJiYgcGVnJGN1cnJQb3MgPT09IGlucHV0Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHBlZyRyZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChwZWckcmVzdWx0ICE9PSBwZWckRkFJTEVEICYmIHBlZyRjdXJyUG9zIDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgIHBlZyRmYWlsKHsgdHlwZTogXCJlbmRcIiwgZGVzY3JpcHRpb246IFwiZW5kIG9mIGlucHV0XCIgfSk7XG4gICAgICB9XG5cbiAgICAgIHRocm93IHBlZyRidWlsZEV4Y2VwdGlvbihudWxsLCBwZWckbWF4RmFpbEV4cGVjdGVkLCBwZWckbWF4RmFpbFBvcyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBTeW50YXhFcnJvcjogU3ludGF4RXJyb3IsXG4gICAgcGFyc2U6ICAgICAgIHBhcnNlXG4gIH07XG59KSgpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9saWIvaHRtbHRlbXBsYXRlLXBhcnNlci5qc1xuICoqLyIsIi8qKlxuICogbG9kYXNoIDMuMC4yIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kZXJuIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNSBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE1IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUZsYXR0ZW4gPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2VmbGF0dGVuJyksXG4gICAgaXNJdGVyYXRlZUNhbGwgPSByZXF1aXJlKCdsb2Rhc2guX2lzaXRlcmF0ZWVjYWxsJyk7XG5cbi8qKlxuICogRmxhdHRlbnMgYSBuZXN0ZWQgYXJyYXkuIElmIGBpc0RlZXBgIGlzIGB0cnVlYCB0aGUgYXJyYXkgaXMgcmVjdXJzaXZlbHlcbiAqIGZsYXR0ZW5lZCwgb3RoZXJ3aXNlIGl0IGlzIG9ubHkgZmxhdHRlbmVkIGEgc2luZ2xlIGxldmVsLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgQXJyYXlcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBmbGF0dGVuLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNEZWVwXSBTcGVjaWZ5IGEgZGVlcCBmbGF0dGVuLlxuICogQHBhcmFtLSB7T2JqZWN0fSBbZ3VhcmRdIEVuYWJsZXMgdXNlIGFzIGEgY2FsbGJhY2sgZm9yIGZ1bmN0aW9ucyBsaWtlIGBfLm1hcGAuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBmbGF0dGVuZWQgYXJyYXkuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZmxhdHRlbihbMSwgWzIsIDMsIFs0XV1dKTtcbiAqIC8vID0+IFsxLCAyLCAzLCBbNF1dXG4gKlxuICogLy8gdXNpbmcgYGlzRGVlcGBcbiAqIF8uZmxhdHRlbihbMSwgWzIsIDMsIFs0XV1dLCB0cnVlKTtcbiAqIC8vID0+IFsxLCAyLCAzLCA0XVxuICovXG5mdW5jdGlvbiBmbGF0dGVuKGFycmF5LCBpc0RlZXAsIGd1YXJkKSB7XG4gIHZhciBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDA7XG4gIGlmIChndWFyZCAmJiBpc0l0ZXJhdGVlQ2FsbChhcnJheSwgaXNEZWVwLCBndWFyZCkpIHtcbiAgICBpc0RlZXAgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gbGVuZ3RoID8gYmFzZUZsYXR0ZW4oYXJyYXksIGlzRGVlcCkgOiBbXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmbGF0dGVuO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLmZsYXR0ZW4vaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqXG4gKiBsb2Rhc2ggMy4xLjQgKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE1IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTUgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJ2xvZGFzaC5pc2FyZ3VtZW50cycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCdsb2Rhc2guaXNhcnJheScpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbi8qKlxuICogVXNlZCBhcyB0aGUgW21heGltdW0gbGVuZ3RoXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1udW1iZXIubWF4X3NhZmVfaW50ZWdlcilcbiAqIG9mIGFuIGFycmF5LWxpa2UgdmFsdWUuXG4gKi9cbnZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBlbGVtZW50cyBvZiBgdmFsdWVzYCB0byBgYXJyYXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gbW9kaWZ5LlxuICogQHBhcmFtIHtBcnJheX0gdmFsdWVzIFRoZSB2YWx1ZXMgdG8gYXBwZW5kLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5UHVzaChhcnJheSwgdmFsdWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gdmFsdWVzLmxlbmd0aCxcbiAgICAgIG9mZnNldCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGFycmF5W29mZnNldCArIGluZGV4XSA9IHZhbHVlc1tpbmRleF07XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZsYXR0ZW5gIHdpdGggYWRkZWQgc3VwcG9ydCBmb3IgcmVzdHJpY3RpbmdcbiAqIGZsYXR0ZW5pbmcgYW5kIHNwZWNpZnlpbmcgdGhlIHN0YXJ0IGluZGV4LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gZmxhdHRlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRGVlcF0gU3BlY2lmeSBhIGRlZXAgZmxhdHRlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU3RyaWN0XSBSZXN0cmljdCBmbGF0dGVuaW5nIHRvIGFycmF5cy1saWtlIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbcmVzdWx0PVtdXSBUaGUgaW5pdGlhbCByZXN1bHQgdmFsdWUuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBmbGF0dGVuZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGbGF0dGVuKGFycmF5LCBpc0RlZXAsIGlzU3RyaWN0LCByZXN1bHQpIHtcbiAgcmVzdWx0IHx8IChyZXN1bHQgPSBbXSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG4gICAgaWYgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNBcnJheUxpa2UodmFsdWUpICYmXG4gICAgICAgIChpc1N0cmljdCB8fCBpc0FycmF5KHZhbHVlKSB8fCBpc0FyZ3VtZW50cyh2YWx1ZSkpKSB7XG4gICAgICBpZiAoaXNEZWVwKSB7XG4gICAgICAgIC8vIFJlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgICAgIGJhc2VGbGF0dGVuKHZhbHVlLCBpc0RlZXAsIGlzU3RyaWN0LCByZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXJyYXlQdXNoKHJlc3VsdCwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWlzU3RyaWN0KSB7XG4gICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5wcm9wZXJ0eWAgd2l0aG91dCBzdXBwb3J0IGZvciBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHkoa2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBcImxlbmd0aFwiIHByb3BlcnR5IHZhbHVlIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gYXZvaWQgYSBbSklUIGJ1Z10oaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE0Mjc5MilcbiAqIHRoYXQgYWZmZWN0cyBTYWZhcmkgb24gYXQgbGVhc3QgaU9TIDguMS04LjMgQVJNNjQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBcImxlbmd0aFwiIHZhbHVlLlxuICovXG52YXIgZ2V0TGVuZ3RoID0gYmFzZVByb3BlcnR5KCdsZW5ndGgnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgaXNMZW5ndGgoZ2V0TGVuZ3RoKHZhbHVlKSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBiYXNlZCBvbiBbYFRvTGVuZ3RoYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9sZW5ndGgpLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgbGVuZ3RoLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTGVuZ3RoKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiYgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGbGF0dGVuO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbG9kYXNoLmZsYXR0ZW4vfi9sb2Rhc2guX2Jhc2VmbGF0dGVuL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKlxuICogbG9kYXNoIDMuMC40IChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kZXJuIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNSBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE1IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgcHJvcGVydHlJc0VudW1lcmFibGUgPSBvYmplY3RQcm90by5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuLyoqXG4gKiBVc2VkIGFzIHRoZSBbbWF4aW11bSBsZW5ndGhdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW51bWJlci5tYXhfc2FmZV9pbnRlZ2VyKVxuICogb2YgYW4gYXJyYXktbGlrZSB2YWx1ZS5cbiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnByb3BlcnR5YCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZXAgcGF0aHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VQcm9wZXJ0eShrZXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICB9O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIFwibGVuZ3RoXCIgcHJvcGVydHkgdmFsdWUgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBhdm9pZCBhIFtKSVQgYnVnXShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTQyNzkyKVxuICogdGhhdCBhZmZlY3RzIFNhZmFyaSBvbiBhdCBsZWFzdCBpT1MgOC4xLTguMyBBUk02NC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIFwibGVuZ3RoXCIgdmFsdWUuXG4gKi9cbnZhciBnZXRMZW5ndGggPSBiYXNlUHJvcGVydHkoJ2xlbmd0aCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0FycmF5TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiBpc0xlbmd0aChnZXRMZW5ndGgodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgbGVuZ3RoLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIGJhc2VkIG9uIFtgVG9MZW5ndGhgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10b2xlbmd0aCkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBsZW5ndGgsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNMZW5ndGgodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJiB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDw9IE1BWF9TQUZFX0lOVEVHRVI7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhbiBgYXJndW1lbnRzYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcmd1bWVudHMoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhbMSwgMiwgM10pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNBcnJheUxpa2UodmFsdWUpICYmXG4gICAgaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpICYmICFwcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHZhbHVlLCAnY2FsbGVlJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcmd1bWVudHM7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9sb2Rhc2guZmxhdHRlbi9+L2xvZGFzaC5fYmFzZWZsYXR0ZW4vfi9sb2Rhc2guaXNhcmd1bWVudHMvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqXG4gKiBsb2Rhc2ggMy4wLjQgKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDE1IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTUgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGhvc3QgY29uc3RydWN0b3JzIChTYWZhcmkgPiA1KS4gKi9cbnZhciByZUlzSG9zdEN0b3IgPSAvXlxcW29iamVjdCAuKz9Db25zdHJ1Y3RvclxcXSQvO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZm5Ub1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZS4gKi9cbnZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gIGZuVG9TdHJpbmcuY2FsbChoYXNPd25Qcm9wZXJ0eSkucmVwbGFjZSgvW1xcXFxeJC4qKz8oKVtcXF17fXxdL2csICdcXFxcJCYnKVxuICAucmVwbGFjZSgvaGFzT3duUHJvcGVydHl8KGZ1bmN0aW9uKS4qPyg/PVxcXFxcXCgpfCBmb3IgLis/KD89XFxcXFxcXSkvZywgJyQxLio/JykgKyAnJCdcbik7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlSXNBcnJheSA9IGdldE5hdGl2ZShBcnJheSwgJ2lzQXJyYXknKTtcblxuLyoqXG4gKiBVc2VkIGFzIHRoZSBbbWF4aW11bSBsZW5ndGhdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW51bWJlci5tYXhfc2FmZV9pbnRlZ2VyKVxuICogb2YgYW4gYXJyYXktbGlrZSB2YWx1ZS5cbiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIEdldHMgdGhlIG5hdGl2ZSBmdW5jdGlvbiBhdCBga2V5YCBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBtZXRob2QgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGZ1bmN0aW9uIGlmIGl0J3MgbmF0aXZlLCBlbHNlIGB1bmRlZmluZWRgLlxuICovXG5mdW5jdGlvbiBnZXROYXRpdmUob2JqZWN0LCBrZXkpIHtcbiAgdmFyIHZhbHVlID0gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgcmV0dXJuIGlzTmF0aXZlKHZhbHVlKSA/IHZhbHVlIDogdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBsZW5ndGguXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgYmFzZWQgb24gW2BUb0xlbmd0aGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXRvbGVuZ3RoKS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPD0gTUFYX1NBRkVfSU5URUdFUjtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBBcnJheWAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXkoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNMZW5ndGgodmFsdWUubGVuZ3RoKSAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBhcnJheVRhZztcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oXyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Z1bmN0aW9uKC9hYmMvKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gIC8vIGluIG9sZGVyIHZlcnNpb25zIG9mIENocm9tZSBhbmQgU2FmYXJpIHdoaWNoIHJldHVybiAnZnVuY3Rpb24nIGZvciByZWdleGVzXG4gIC8vIGFuZCBTYWZhcmkgOCBlcXVpdmFsZW50cyB3aGljaCByZXR1cm4gJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycy5cbiAgcmV0dXJuIGlzT2JqZWN0KHZhbHVlKSAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBmdW5jVGFnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBbbGFuZ3VhZ2UgdHlwZV0oaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OCkgb2YgYE9iamVjdGAuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KDEpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgLy8gQXZvaWQgYSBWOCBKSVQgYnVnIGluIENocm9tZSAxOS0yMC5cbiAgLy8gU2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxIGZvciBtb3JlIGRldGFpbHMuXG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gISF2YWx1ZSAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbiwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTmF0aXZlKEFycmF5LnByb3RvdHlwZS5wdXNoKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzTmF0aXZlKF8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNOYXRpdmUodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgcmV0dXJuIHJlSXNOYXRpdmUudGVzdChmblRvU3RyaW5nLmNhbGwodmFsdWUpKTtcbiAgfVxuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiByZUlzSG9zdEN0b3IudGVzdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xvZGFzaC5mbGF0dGVuL34vbG9kYXNoLl9iYXNlZmxhdHRlbi9+L2xvZGFzaC5pc2FycmF5L2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKlxuICogbG9kYXNoIDMuMC45IChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kZXJuIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNSBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE1IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIHRvIGRldGVjdCB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcy4gKi9cbnZhciByZUlzVWludCA9IC9eXFxkKyQvO1xuXG4vKipcbiAqIFVzZWQgYXMgdGhlIFttYXhpbXVtIGxlbmd0aF0oaHR0cHM6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLW51bWJlci5tYXhfc2FmZV9pbnRlZ2VyKVxuICogb2YgYW4gYXJyYXktbGlrZSB2YWx1ZS5cbiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnByb3BlcnR5YCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZXAgcGF0aHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VQcm9wZXJ0eShrZXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICB9O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIFwibGVuZ3RoXCIgcHJvcGVydHkgdmFsdWUgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBhdm9pZCBhIFtKSVQgYnVnXShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTQyNzkyKVxuICogdGhhdCBhZmZlY3RzIFNhZmFyaSBvbiBhdCBsZWFzdCBpT1MgOC4xLTguMyBBUk02NC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIFwibGVuZ3RoXCIgdmFsdWUuXG4gKi9cbnZhciBnZXRMZW5ndGggPSBiYXNlUHJvcGVydHkoJ2xlbmd0aCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0FycmF5TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiBpc0xlbmd0aChnZXRMZW5ndGgodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgaW5kZXguXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHBhcmFtIHtudW1iZXJ9IFtsZW5ndGg9TUFYX1NBRkVfSU5URUdFUl0gVGhlIHVwcGVyIGJvdW5kcyBvZiBhIHZhbGlkIGluZGV4LlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBpbmRleCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0luZGV4KHZhbHVlLCBsZW5ndGgpIHtcbiAgdmFsdWUgPSAodHlwZW9mIHZhbHVlID09ICdudW1iZXInIHx8IHJlSXNVaW50LnRlc3QodmFsdWUpKSA/ICt2YWx1ZSA6IC0xO1xuICBsZW5ndGggPSBsZW5ndGggPT0gbnVsbCA/IE1BWF9TQUZFX0lOVEVHRVIgOiBsZW5ndGg7XG4gIHJldHVybiB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDwgbGVuZ3RoO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgcHJvdmlkZWQgYXJndW1lbnRzIGFyZSBmcm9tIGFuIGl0ZXJhdGVlIGNhbGwuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHBvdGVudGlhbCBpdGVyYXRlZSB2YWx1ZSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7Kn0gaW5kZXggVGhlIHBvdGVudGlhbCBpdGVyYXRlZSBpbmRleCBvciBrZXkgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp9IG9iamVjdCBUaGUgcG90ZW50aWFsIGl0ZXJhdGVlIG9iamVjdCBhcmd1bWVudC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYXJndW1lbnRzIGFyZSBmcm9tIGFuIGl0ZXJhdGVlIGNhbGwsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNJdGVyYXRlZUNhbGwodmFsdWUsIGluZGV4LCBvYmplY3QpIHtcbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciB0eXBlID0gdHlwZW9mIGluZGV4O1xuICBpZiAodHlwZSA9PSAnbnVtYmVyJ1xuICAgICAgPyAoaXNBcnJheUxpa2Uob2JqZWN0KSAmJiBpc0luZGV4KGluZGV4LCBvYmplY3QubGVuZ3RoKSlcbiAgICAgIDogKHR5cGUgPT0gJ3N0cmluZycgJiYgaW5kZXggaW4gb2JqZWN0KSkge1xuICAgIHZhciBvdGhlciA9IG9iamVjdFtpbmRleF07XG4gICAgcmV0dXJuIHZhbHVlID09PSB2YWx1ZSA/ICh2YWx1ZSA9PT0gb3RoZXIpIDogKG90aGVyICE9PSBvdGhlcik7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBsZW5ndGguXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgYmFzZWQgb24gW2BUb0xlbmd0aGBdKGh0dHBzOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy10b2xlbmd0aCkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBsZW5ndGgsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNMZW5ndGgodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJiB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDw9IE1BWF9TQUZFX0lOVEVHRVI7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIFtsYW5ndWFnZSB0eXBlXShodHRwczovL2VzNS5naXRodWIuaW8vI3g4KSBvZiBgT2JqZWN0YC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoMSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxuICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNJdGVyYXRlZUNhbGw7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9sb2Rhc2guZmxhdHRlbi9+L2xvZGFzaC5faXNpdGVyYXRlZWNhbGwvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxNVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIHRyYXZlcnNlID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIG5ldyBUcmF2ZXJzZShvYmopO1xufTtcblxuZnVuY3Rpb24gVHJhdmVyc2UgKG9iaikge1xuICAgIHRoaXMudmFsdWUgPSBvYmo7XG59XG5cblRyYXZlcnNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAocHMpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMudmFsdWU7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcy5sZW5ndGg7IGkgKyspIHtcbiAgICAgICAgdmFyIGtleSA9IHBzW2ldO1xuICAgICAgICBpZiAoIW5vZGUgfHwgIWhhc093blByb3BlcnR5LmNhbGwobm9kZSwga2V5KSkge1xuICAgICAgICAgICAgbm9kZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlW2tleV07XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xufTtcblxuVHJhdmVyc2UucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChwcykge1xuICAgIHZhciBub2RlID0gdGhpcy52YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBzLmxlbmd0aDsgaSArKykge1xuICAgICAgICB2YXIga2V5ID0gcHNbaV07XG4gICAgICAgIGlmICghbm9kZSB8fCAhaGFzT3duUHJvcGVydHkuY2FsbChub2RlLCBrZXkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGVba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHBzLCB2YWx1ZSkge1xuICAgIHZhciBub2RlID0gdGhpcy52YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBzLmxlbmd0aCAtIDE7IGkgKyspIHtcbiAgICAgICAgdmFyIGtleSA9IHBzW2ldO1xuICAgICAgICBpZiAoIWhhc093blByb3BlcnR5LmNhbGwobm9kZSwga2V5KSkgbm9kZVtrZXldID0ge307XG4gICAgICAgIG5vZGUgPSBub2RlW2tleV07XG4gICAgfVxuICAgIG5vZGVbcHNbaV1dID0gdmFsdWU7XG4gICAgcmV0dXJuIHZhbHVlO1xufTtcblxuVHJhdmVyc2UucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChjYikge1xuICAgIHJldHVybiB3YWxrKHRoaXMudmFsdWUsIGNiLCB0cnVlKTtcbn07XG5cblRyYXZlcnNlLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdGhpcy52YWx1ZSA9IHdhbGsodGhpcy52YWx1ZSwgY2IsIGZhbHNlKTtcbiAgICByZXR1cm4gdGhpcy52YWx1ZTtcbn07XG5cblRyYXZlcnNlLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2IsIGluaXQpIHtcbiAgICB2YXIgc2tpcCA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDE7XG4gICAgdmFyIGFjYyA9IHNraXAgPyB0aGlzLnZhbHVlIDogaW5pdDtcbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUm9vdCB8fCAhc2tpcCkge1xuICAgICAgICAgICAgYWNjID0gY2IuY2FsbCh0aGlzLCBhY2MsIHgpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGFjYztcbn07XG5cblRyYXZlcnNlLnByb3RvdHlwZS5wYXRocyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYWNjID0gW107XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGFjYy5wdXNoKHRoaXMucGF0aCk7IFxuICAgIH0pO1xuICAgIHJldHVybiBhY2M7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUubm9kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFjYyA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICBhY2MucHVzaCh0aGlzLm5vZGUpO1xuICAgIH0pO1xuICAgIHJldHVybiBhY2M7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhcmVudHMgPSBbXSwgbm9kZXMgPSBbXTtcbiAgICBcbiAgICByZXR1cm4gKGZ1bmN0aW9uIGNsb25lIChzcmMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocGFyZW50c1tpXSA9PT0gc3JjKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGVzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIHNyYyA9PT0gJ29iamVjdCcgJiYgc3JjICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgZHN0ID0gY29weShzcmMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBwYXJlbnRzLnB1c2goc3JjKTtcbiAgICAgICAgICAgIG5vZGVzLnB1c2goZHN0KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yRWFjaChvYmplY3RLZXlzKHNyYyksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBkc3Rba2V5XSA9IGNsb25lKHNyY1trZXldKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBwYXJlbnRzLnBvcCgpO1xuICAgICAgICAgICAgbm9kZXMucG9wKCk7XG4gICAgICAgICAgICByZXR1cm4gZHN0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHNyYztcbiAgICAgICAgfVxuICAgIH0pKHRoaXMudmFsdWUpO1xufTtcblxuZnVuY3Rpb24gd2FsayAocm9vdCwgY2IsIGltbXV0YWJsZSkge1xuICAgIHZhciBwYXRoID0gW107XG4gICAgdmFyIHBhcmVudHMgPSBbXTtcbiAgICB2YXIgYWxpdmUgPSB0cnVlO1xuICAgIFxuICAgIHJldHVybiAoZnVuY3Rpb24gd2Fsa2VyIChub2RlXykge1xuICAgICAgICB2YXIgbm9kZSA9IGltbXV0YWJsZSA/IGNvcHkobm9kZV8pIDogbm9kZV87XG4gICAgICAgIHZhciBtb2RpZmllcnMgPSB7fTtcbiAgICAgICAgXG4gICAgICAgIHZhciBrZWVwR29pbmcgPSB0cnVlO1xuICAgICAgICBcbiAgICAgICAgdmFyIHN0YXRlID0ge1xuICAgICAgICAgICAgbm9kZSA6IG5vZGUsXG4gICAgICAgICAgICBub2RlXyA6IG5vZGVfLFxuICAgICAgICAgICAgcGF0aCA6IFtdLmNvbmNhdChwYXRoKSxcbiAgICAgICAgICAgIHBhcmVudCA6IHBhcmVudHNbcGFyZW50cy5sZW5ndGggLSAxXSxcbiAgICAgICAgICAgIHBhcmVudHMgOiBwYXJlbnRzLFxuICAgICAgICAgICAga2V5IDogcGF0aC5zbGljZSgtMSlbMF0sXG4gICAgICAgICAgICBpc1Jvb3QgOiBwYXRoLmxlbmd0aCA9PT0gMCxcbiAgICAgICAgICAgIGxldmVsIDogcGF0aC5sZW5ndGgsXG4gICAgICAgICAgICBjaXJjdWxhciA6IG51bGwsXG4gICAgICAgICAgICB1cGRhdGUgOiBmdW5jdGlvbiAoeCwgc3RvcEhlcmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXN0YXRlLmlzUm9vdCkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5wYXJlbnQubm9kZVtzdGF0ZS5rZXldID0geDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RhdGUubm9kZSA9IHg7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3BIZXJlKSBrZWVwR29pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZGVsZXRlJyA6IGZ1bmN0aW9uIChzdG9wSGVyZSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBzdGF0ZS5wYXJlbnQubm9kZVtzdGF0ZS5rZXldO1xuICAgICAgICAgICAgICAgIGlmIChzdG9wSGVyZSkga2VlcEdvaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVtb3ZlIDogZnVuY3Rpb24gKHN0b3BIZXJlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkoc3RhdGUucGFyZW50Lm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnBhcmVudC5ub2RlLnNwbGljZShzdGF0ZS5rZXksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHN0YXRlLnBhcmVudC5ub2RlW3N0YXRlLmtleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzdG9wSGVyZSkga2VlcEdvaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAga2V5cyA6IG51bGwsXG4gICAgICAgICAgICBiZWZvcmUgOiBmdW5jdGlvbiAoZikgeyBtb2RpZmllcnMuYmVmb3JlID0gZiB9LFxuICAgICAgICAgICAgYWZ0ZXIgOiBmdW5jdGlvbiAoZikgeyBtb2RpZmllcnMuYWZ0ZXIgPSBmIH0sXG4gICAgICAgICAgICBwcmUgOiBmdW5jdGlvbiAoZikgeyBtb2RpZmllcnMucHJlID0gZiB9LFxuICAgICAgICAgICAgcG9zdCA6IGZ1bmN0aW9uIChmKSB7IG1vZGlmaWVycy5wb3N0ID0gZiB9LFxuICAgICAgICAgICAgc3RvcCA6IGZ1bmN0aW9uICgpIHsgYWxpdmUgPSBmYWxzZSB9LFxuICAgICAgICAgICAgYmxvY2sgOiBmdW5jdGlvbiAoKSB7IGtlZXBHb2luZyA9IGZhbHNlIH1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGlmICghYWxpdmUpIHJldHVybiBzdGF0ZTtcbiAgICAgICAgXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVN0YXRlKCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0ZS5ub2RlID09PSAnb2JqZWN0JyAmJiBzdGF0ZS5ub2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzdGF0ZS5rZXlzIHx8IHN0YXRlLm5vZGVfICE9PSBzdGF0ZS5ub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmtleXMgPSBvYmplY3RLZXlzKHN0YXRlLm5vZGUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHN0YXRlLmlzTGVhZiA9IHN0YXRlLmtleXMubGVuZ3RoID09IDA7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRzW2ldLm5vZGVfID09PSBub2RlXykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuY2lyY3VsYXIgPSBwYXJlbnRzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5pc0xlYWYgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHN0YXRlLmtleXMgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ZS5ub3RMZWFmID0gIXN0YXRlLmlzTGVhZjtcbiAgICAgICAgICAgIHN0YXRlLm5vdFJvb3QgPSAhc3RhdGUuaXNSb290O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB1cGRhdGVTdGF0ZSgpO1xuICAgICAgICBcbiAgICAgICAgLy8gdXNlIHJldHVybiB2YWx1ZXMgdG8gdXBkYXRlIGlmIGRlZmluZWRcbiAgICAgICAgdmFyIHJldCA9IGNiLmNhbGwoc3RhdGUsIHN0YXRlLm5vZGUpO1xuICAgICAgICBpZiAocmV0ICE9PSB1bmRlZmluZWQgJiYgc3RhdGUudXBkYXRlKSBzdGF0ZS51cGRhdGUocmV0KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChtb2RpZmllcnMuYmVmb3JlKSBtb2RpZmllcnMuYmVmb3JlLmNhbGwoc3RhdGUsIHN0YXRlLm5vZGUpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFrZWVwR29pbmcpIHJldHVybiBzdGF0ZTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2Ygc3RhdGUubm9kZSA9PSAnb2JqZWN0J1xuICAgICAgICAmJiBzdGF0ZS5ub2RlICE9PSBudWxsICYmICFzdGF0ZS5jaXJjdWxhcikge1xuICAgICAgICAgICAgcGFyZW50cy5wdXNoKHN0YXRlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdXBkYXRlU3RhdGUoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yRWFjaChzdGF0ZS5rZXlzLCBmdW5jdGlvbiAoa2V5LCBpKSB7XG4gICAgICAgICAgICAgICAgcGF0aC5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKG1vZGlmaWVycy5wcmUpIG1vZGlmaWVycy5wcmUuY2FsbChzdGF0ZSwgc3RhdGUubm9kZVtrZXldLCBrZXkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHdhbGtlcihzdGF0ZS5ub2RlW2tleV0pO1xuICAgICAgICAgICAgICAgIGlmIChpbW11dGFibGUgJiYgaGFzT3duUHJvcGVydHkuY2FsbChzdGF0ZS5ub2RlLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLm5vZGVba2V5XSA9IGNoaWxkLm5vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNoaWxkLmlzTGFzdCA9IGkgPT0gc3RhdGUua2V5cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIGNoaWxkLmlzRmlyc3QgPSBpID09IDA7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKG1vZGlmaWVycy5wb3N0KSBtb2RpZmllcnMucG9zdC5jYWxsKHN0YXRlLCBjaGlsZCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcGF0aC5wb3AoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcGFyZW50cy5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG1vZGlmaWVycy5hZnRlcikgbW9kaWZpZXJzLmFmdGVyLmNhbGwoc3RhdGUsIHN0YXRlLm5vZGUpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0pKHJvb3QpLm5vZGU7XG59XG5cbmZ1bmN0aW9uIGNvcHkgKHNyYykge1xuICAgIGlmICh0eXBlb2Ygc3JjID09PSAnb2JqZWN0JyAmJiBzcmMgIT09IG51bGwpIHtcbiAgICAgICAgdmFyIGRzdDtcbiAgICAgICAgXG4gICAgICAgIGlmIChpc0FycmF5KHNyYykpIHtcbiAgICAgICAgICAgIGRzdCA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzRGF0ZShzcmMpKSB7XG4gICAgICAgICAgICBkc3QgPSBuZXcgRGF0ZShzcmMuZ2V0VGltZSA/IHNyYy5nZXRUaW1lKCkgOiBzcmMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzUmVnRXhwKHNyYykpIHtcbiAgICAgICAgICAgIGRzdCA9IG5ldyBSZWdFeHAoc3JjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0Vycm9yKHNyYykpIHtcbiAgICAgICAgICAgIGRzdCA9IHsgbWVzc2FnZTogc3JjLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0Jvb2xlYW4oc3JjKSkge1xuICAgICAgICAgICAgZHN0ID0gbmV3IEJvb2xlYW4oc3JjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc051bWJlcihzcmMpKSB7XG4gICAgICAgICAgICBkc3QgPSBuZXcgTnVtYmVyKHNyYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNTdHJpbmcoc3JjKSkge1xuICAgICAgICAgICAgZHN0ID0gbmV3IFN0cmluZyhzcmMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKE9iamVjdC5jcmVhdGUgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKSB7XG4gICAgICAgICAgICBkc3QgPSBPYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZihzcmMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzcmMuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgICAgICAgICAgZHN0ID0ge307XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgcHJvdG8gPVxuICAgICAgICAgICAgICAgIChzcmMuY29uc3RydWN0b3IgJiYgc3JjLmNvbnN0cnVjdG9yLnByb3RvdHlwZSlcbiAgICAgICAgICAgICAgICB8fCBzcmMuX19wcm90b19fXG4gICAgICAgICAgICAgICAgfHwge31cbiAgICAgICAgICAgIDtcbiAgICAgICAgICAgIHZhciBUID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgICAgICBULnByb3RvdHlwZSA9IHByb3RvO1xuICAgICAgICAgICAgZHN0ID0gbmV3IFQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvckVhY2gob2JqZWN0S2V5cyhzcmMpLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBkc3Rba2V5XSA9IHNyY1trZXldO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRzdDtcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gc3JjO1xufVxuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIGtleXMgKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSByZXMucHVzaChrZXkpXG4gICAgcmV0dXJuIHJlcztcbn07XG5cbmZ1bmN0aW9uIHRvUyAob2JqKSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSB9XG5mdW5jdGlvbiBpc0RhdGUgKG9iaikgeyByZXR1cm4gdG9TKG9iaikgPT09ICdbb2JqZWN0IERhdGVdJyB9XG5mdW5jdGlvbiBpc1JlZ0V4cCAob2JqKSB7IHJldHVybiB0b1Mob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXScgfVxuZnVuY3Rpb24gaXNFcnJvciAob2JqKSB7IHJldHVybiB0b1Mob2JqKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB9XG5mdW5jdGlvbiBpc0Jvb2xlYW4gKG9iaikgeyByZXR1cm4gdG9TKG9iaikgPT09ICdbb2JqZWN0IEJvb2xlYW5dJyB9XG5mdW5jdGlvbiBpc051bWJlciAob2JqKSB7IHJldHVybiB0b1Mob2JqKSA9PT0gJ1tvYmplY3QgTnVtYmVyXScgfVxuZnVuY3Rpb24gaXNTdHJpbmcgKG9iaikgeyByZXR1cm4gdG9TKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nIH1cblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIGlzQXJyYXkgKHhzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG52YXIgZm9yRWFjaCA9IGZ1bmN0aW9uICh4cywgZm4pIHtcbiAgICBpZiAoeHMuZm9yRWFjaCkgcmV0dXJuIHhzLmZvckVhY2goZm4pXG4gICAgZWxzZSBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZuKHhzW2ldLCBpLCB4cyk7XG4gICAgfVxufTtcblxuZm9yRWFjaChvYmplY3RLZXlzKFRyYXZlcnNlLnByb3RvdHlwZSksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICB0cmF2ZXJzZVtrZXldID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgdmFyIHQgPSBuZXcgVHJhdmVyc2Uob2JqKTtcbiAgICAgICAgcmV0dXJuIHRba2V5XS5hcHBseSh0LCBhcmdzKTtcbiAgICB9O1xufSk7XG5cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5oYXNPd25Qcm9wZXJ0eSB8fCBmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgICByZXR1cm4ga2V5IGluIG9iajtcbn07XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi90cmF2ZXJzZS9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDE2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgaCA9IHJlcXVpcmUoXCIuL3ZpcnR1YWwtaHlwZXJzY3JpcHQvaW5kZXguanNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBoXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS9oLmpzXG4gKiogbW9kdWxlIGlkID0gMTdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCd4LWlzLWFycmF5Jyk7XG5cbnZhciBWTm9kZSA9IHJlcXVpcmUoJy4uL3Zub2RlL3Zub2RlLmpzJyk7XG52YXIgVlRleHQgPSByZXF1aXJlKCcuLi92bm9kZS92dGV4dC5qcycpO1xudmFyIGlzVk5vZGUgPSByZXF1aXJlKCcuLi92bm9kZS9pcy12bm9kZScpO1xudmFyIGlzVlRleHQgPSByZXF1aXJlKCcuLi92bm9kZS9pcy12dGV4dCcpO1xudmFyIGlzV2lkZ2V0ID0gcmVxdWlyZSgnLi4vdm5vZGUvaXMtd2lkZ2V0Jyk7XG52YXIgaXNIb29rID0gcmVxdWlyZSgnLi4vdm5vZGUvaXMtdmhvb2snKTtcbnZhciBpc1ZUaHVuayA9IHJlcXVpcmUoJy4uL3Zub2RlL2lzLXRodW5rJyk7XG5cbnZhciBwYXJzZVRhZyA9IHJlcXVpcmUoJy4vcGFyc2UtdGFnLmpzJyk7XG52YXIgc29mdFNldEhvb2sgPSByZXF1aXJlKCcuL2hvb2tzL3NvZnQtc2V0LWhvb2suanMnKTtcbnZhciBldkhvb2sgPSByZXF1aXJlKCcuL2hvb2tzL2V2LWhvb2suanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBoO1xuXG5mdW5jdGlvbiBoKHRhZ05hbWUsIHByb3BlcnRpZXMsIGNoaWxkcmVuKSB7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSBbXTtcbiAgICB2YXIgdGFnLCBwcm9wcywga2V5LCBuYW1lc3BhY2U7XG5cbiAgICBpZiAoIWNoaWxkcmVuICYmIGlzQ2hpbGRyZW4ocHJvcGVydGllcykpIHtcbiAgICAgICAgY2hpbGRyZW4gPSBwcm9wZXJ0aWVzO1xuICAgICAgICBwcm9wcyA9IHt9O1xuICAgIH1cblxuICAgIHByb3BzID0gcHJvcHMgfHwgcHJvcGVydGllcyB8fCB7fTtcbiAgICB0YWcgPSBwYXJzZVRhZyh0YWdOYW1lLCBwcm9wcyk7XG5cbiAgICAvLyBzdXBwb3J0IGtleXNcbiAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkoJ2tleScpKSB7XG4gICAgICAgIGtleSA9IHByb3BzLmtleTtcbiAgICAgICAgcHJvcHMua2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIHN1cHBvcnQgbmFtZXNwYWNlXG4gICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KCduYW1lc3BhY2UnKSkge1xuICAgICAgICBuYW1lc3BhY2UgPSBwcm9wcy5uYW1lc3BhY2U7XG4gICAgICAgIHByb3BzLm5hbWVzcGFjZSA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBmaXggY3Vyc29yIGJ1Z1xuICAgIGlmICh0YWcgPT09ICdJTlBVVCcgJiZcbiAgICAgICAgIW5hbWVzcGFjZSAmJlxuICAgICAgICBwcm9wcy5oYXNPd25Qcm9wZXJ0eSgndmFsdWUnKSAmJlxuICAgICAgICBwcm9wcy52YWx1ZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICFpc0hvb2socHJvcHMudmFsdWUpXG4gICAgKSB7XG4gICAgICAgIHByb3BzLnZhbHVlID0gc29mdFNldEhvb2socHJvcHMudmFsdWUpO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybVByb3BlcnRpZXMocHJvcHMpO1xuXG4gICAgaWYgKGNoaWxkcmVuICE9PSB1bmRlZmluZWQgJiYgY2hpbGRyZW4gIT09IG51bGwpIHtcbiAgICAgICAgYWRkQ2hpbGQoY2hpbGRyZW4sIGNoaWxkTm9kZXMsIHRhZywgcHJvcHMpO1xuICAgIH1cblxuXG4gICAgcmV0dXJuIG5ldyBWTm9kZSh0YWcsIHByb3BzLCBjaGlsZE5vZGVzLCBrZXksIG5hbWVzcGFjZSk7XG59XG5cbmZ1bmN0aW9uIGFkZENoaWxkKGMsIGNoaWxkTm9kZXMsIHRhZywgcHJvcHMpIHtcbiAgICBpZiAodHlwZW9mIGMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNoaWxkTm9kZXMucHVzaChuZXcgVlRleHQoYykpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGMgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGNoaWxkTm9kZXMucHVzaChuZXcgVlRleHQoU3RyaW5nKGMpKSk7XG4gICAgfSBlbHNlIGlmIChpc0NoaWxkKGMpKSB7XG4gICAgICAgIGNoaWxkTm9kZXMucHVzaChjKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoYykpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhZGRDaGlsZChjW2ldLCBjaGlsZE5vZGVzLCB0YWcsIHByb3BzKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYyA9PT0gbnVsbCB8fCBjID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFVuZXhwZWN0ZWRWaXJ0dWFsRWxlbWVudCh7XG4gICAgICAgICAgICBmb3JlaWduT2JqZWN0OiBjLFxuICAgICAgICAgICAgcGFyZW50Vm5vZGU6IHtcbiAgICAgICAgICAgICAgICB0YWdOYW1lOiB0YWcsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogcHJvcHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFuc2Zvcm1Qcm9wZXJ0aWVzKHByb3BzKSB7XG4gICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gcHJvcHMpIHtcbiAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuXG4gICAgICAgICAgICBpZiAoaXNIb29rKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocHJvcE5hbWUuc3Vic3RyKDAsIDMpID09PSAnZXYtJykge1xuICAgICAgICAgICAgICAgIC8vIGFkZCBldi1mb28gc3VwcG9ydFxuICAgICAgICAgICAgICAgIHByb3BzW3Byb3BOYW1lXSA9IGV2SG9vayh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzQ2hpbGQoeCkge1xuICAgIHJldHVybiBpc1ZOb2RlKHgpIHx8IGlzVlRleHQoeCkgfHwgaXNXaWRnZXQoeCkgfHwgaXNWVGh1bmsoeCk7XG59XG5cbmZ1bmN0aW9uIGlzQ2hpbGRyZW4oeCkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ3N0cmluZycgfHwgaXNBcnJheSh4KSB8fCBpc0NoaWxkKHgpO1xufVxuXG5mdW5jdGlvbiBVbmV4cGVjdGVkVmlydHVhbEVsZW1lbnQoZGF0YSkge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcblxuICAgIGVyci50eXBlID0gJ3ZpcnR1YWwtaHlwZXJzY3JpcHQudW5leHBlY3RlZC52aXJ0dWFsLWVsZW1lbnQnO1xuICAgIGVyci5tZXNzYWdlID0gJ1VuZXhwZWN0ZWQgdmlydHVhbCBjaGlsZCBwYXNzZWQgdG8gaCgpLlxcbicgK1xuICAgICAgICAnRXhwZWN0ZWQgYSBWTm9kZSAvIFZ0aHVuayAvIFZXaWRnZXQgLyBzdHJpbmcgYnV0OlxcbicgK1xuICAgICAgICAnZ290OlxcbicgK1xuICAgICAgICBlcnJvclN0cmluZyhkYXRhLmZvcmVpZ25PYmplY3QpICtcbiAgICAgICAgJy5cXG4nICtcbiAgICAgICAgJ1RoZSBwYXJlbnQgdm5vZGUgaXM6XFxuJyArXG4gICAgICAgIGVycm9yU3RyaW5nKGRhdGEucGFyZW50Vm5vZGUpXG4gICAgICAgICdcXG4nICtcbiAgICAgICAgJ1N1Z2dlc3RlZCBmaXg6IGNoYW5nZSB5b3VyIGBoKC4uLiwgWyAuLi4gXSlgIGNhbGxzaXRlLic7XG4gICAgZXJyLmZvcmVpZ25PYmplY3QgPSBkYXRhLmZvcmVpZ25PYmplY3Q7XG4gICAgZXJyLnBhcmVudFZub2RlID0gZGF0YS5wYXJlbnRWbm9kZTtcblxuICAgIHJldHVybiBlcnI7XG59XG5cbmZ1bmN0aW9uIGVycm9yU3RyaW5nKG9iaikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsICcgICAgJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gU3RyaW5nKG9iaik7XG4gICAgfVxufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdmlydHVhbC1kb20vdmlydHVhbC1oeXBlcnNjcmlwdC9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDE4XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgbmF0aXZlSXNBcnJheSA9IEFycmF5LmlzQXJyYXlcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcblxubW9kdWxlLmV4cG9ydHMgPSBuYXRpdmVJc0FycmF5IHx8IGlzQXJyYXlcblxuZnVuY3Rpb24gaXNBcnJheShvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCJcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL34veC1pcy1hcnJheS9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDE5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIilcbnZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4vaXMtdm5vZGVcIilcbnZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuL2lzLXdpZGdldFwiKVxudmFyIGlzVGh1bmsgPSByZXF1aXJlKFwiLi9pcy10aHVua1wiKVxudmFyIGlzVkhvb2sgPSByZXF1aXJlKFwiLi9pcy12aG9va1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpcnR1YWxOb2RlXG5cbnZhciBub1Byb3BlcnRpZXMgPSB7fVxudmFyIG5vQ2hpbGRyZW4gPSBbXVxuXG5mdW5jdGlvbiBWaXJ0dWFsTm9kZSh0YWdOYW1lLCBwcm9wZXJ0aWVzLCBjaGlsZHJlbiwga2V5LCBuYW1lc3BhY2UpIHtcbiAgICB0aGlzLnRhZ05hbWUgPSB0YWdOYW1lXG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gcHJvcGVydGllcyB8fCBub1Byb3BlcnRpZXNcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW4gfHwgbm9DaGlsZHJlblxuICAgIHRoaXMua2V5ID0ga2V5ICE9IG51bGwgPyBTdHJpbmcoa2V5KSA6IHVuZGVmaW5lZFxuICAgIHRoaXMubmFtZXNwYWNlID0gKHR5cGVvZiBuYW1lc3BhY2UgPT09IFwic3RyaW5nXCIpID8gbmFtZXNwYWNlIDogbnVsbFxuXG4gICAgdmFyIGNvdW50ID0gKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkgfHwgMFxuICAgIHZhciBkZXNjZW5kYW50cyA9IDBcbiAgICB2YXIgaGFzV2lkZ2V0cyA9IGZhbHNlXG4gICAgdmFyIGhhc1RodW5rcyA9IGZhbHNlXG4gICAgdmFyIGRlc2NlbmRhbnRIb29rcyA9IGZhbHNlXG4gICAgdmFyIGhvb2tzXG5cbiAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgICAgdmFyIHByb3BlcnR5ID0gcHJvcGVydGllc1twcm9wTmFtZV1cbiAgICAgICAgICAgIGlmIChpc1ZIb29rKHByb3BlcnR5KSAmJiBwcm9wZXJ0eS51bmhvb2spIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhvb2tzKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvb2tzID0ge31cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBob29rc1twcm9wTmFtZV0gPSBwcm9wZXJ0eVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICAgIGlmIChpc1ZOb2RlKGNoaWxkKSkge1xuICAgICAgICAgICAgZGVzY2VuZGFudHMgKz0gY2hpbGQuY291bnQgfHwgMFxuXG4gICAgICAgICAgICBpZiAoIWhhc1dpZGdldHMgJiYgY2hpbGQuaGFzV2lkZ2V0cykge1xuICAgICAgICAgICAgICAgIGhhc1dpZGdldHMgPSB0cnVlXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaGFzVGh1bmtzICYmIGNoaWxkLmhhc1RodW5rcykge1xuICAgICAgICAgICAgICAgIGhhc1RodW5rcyA9IHRydWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFkZXNjZW5kYW50SG9va3MgJiYgKGNoaWxkLmhvb2tzIHx8IGNoaWxkLmRlc2NlbmRhbnRIb29rcykpIHtcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50SG9va3MgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWhhc1dpZGdldHMgJiYgaXNXaWRnZXQoY2hpbGQpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoaWxkLmRlc3Ryb3kgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGhhc1dpZGdldHMgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWhhc1RodW5rcyAmJiBpc1RodW5rKGNoaWxkKSkge1xuICAgICAgICAgICAgaGFzVGh1bmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY291bnQgPSBjb3VudCArIGRlc2NlbmRhbnRzXG4gICAgdGhpcy5oYXNXaWRnZXRzID0gaGFzV2lkZ2V0c1xuICAgIHRoaXMuaGFzVGh1bmtzID0gaGFzVGh1bmtzXG4gICAgdGhpcy5ob29rcyA9IGhvb2tzXG4gICAgdGhpcy5kZXNjZW5kYW50SG9va3MgPSBkZXNjZW5kYW50SG9va3Ncbn1cblxuVmlydHVhbE5vZGUucHJvdG90eXBlLnZlcnNpb24gPSB2ZXJzaW9uXG5WaXJ0dWFsTm9kZS5wcm90b3R5cGUudHlwZSA9IFwiVmlydHVhbE5vZGVcIlxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdmlydHVhbC1kb20vdm5vZGUvdm5vZGUuanNcbiAqKiBtb2R1bGUgaWQgPSAyMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBcIjJcIlxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdmlydHVhbC1kb20vdm5vZGUvdmVyc2lvbi5qc1xuICoqIG1vZHVsZSBpZCA9IDIxXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIilcblxubW9kdWxlLmV4cG9ydHMgPSBpc1ZpcnR1YWxOb2RlXG5cbmZ1bmN0aW9uIGlzVmlydHVhbE5vZGUoeCkge1xuICAgIHJldHVybiB4ICYmIHgudHlwZSA9PT0gXCJWaXJ0dWFsTm9kZVwiICYmIHgudmVyc2lvbiA9PT0gdmVyc2lvblxufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdmlydHVhbC1kb20vdm5vZGUvaXMtdm5vZGUuanNcbiAqKiBtb2R1bGUgaWQgPSAyMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBpc1dpZGdldFxuXG5mdW5jdGlvbiBpc1dpZGdldCh3KSB7XG4gICAgcmV0dXJuIHcgJiYgdy50eXBlID09PSBcIldpZGdldFwiXG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS92bm9kZS9pcy13aWRnZXQuanNcbiAqKiBtb2R1bGUgaWQgPSAyM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBpc1RodW5rXHJcblxyXG5mdW5jdGlvbiBpc1RodW5rKHQpIHtcclxuICAgIHJldHVybiB0ICYmIHQudHlwZSA9PT0gXCJUaHVua1wiXHJcbn1cclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdmlydHVhbC1kb20vdm5vZGUvaXMtdGh1bmsuanNcbiAqKiBtb2R1bGUgaWQgPSAyNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBpc0hvb2tcblxuZnVuY3Rpb24gaXNIb29rKGhvb2spIHtcbiAgICByZXR1cm4gaG9vayAmJlxuICAgICAgKHR5cGVvZiBob29rLmhvb2sgPT09IFwiZnVuY3Rpb25cIiAmJiAhaG9vay5oYXNPd25Qcm9wZXJ0eShcImhvb2tcIikgfHxcbiAgICAgICB0eXBlb2YgaG9vay51bmhvb2sgPT09IFwiZnVuY3Rpb25cIiAmJiAhaG9vay5oYXNPd25Qcm9wZXJ0eShcInVuaG9va1wiKSlcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL3Zub2RlL2lzLXZob29rLmpzXG4gKiogbW9kdWxlIGlkID0gMjVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpcnR1YWxUZXh0XG5cbmZ1bmN0aW9uIFZpcnR1YWxUZXh0KHRleHQpIHtcbiAgICB0aGlzLnRleHQgPSBTdHJpbmcodGV4dClcbn1cblxuVmlydHVhbFRleHQucHJvdG90eXBlLnZlcnNpb24gPSB2ZXJzaW9uXG5WaXJ0dWFsVGV4dC5wcm90b3R5cGUudHlwZSA9IFwiVmlydHVhbFRleHRcIlxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdmlydHVhbC1kb20vdm5vZGUvdnRleHQuanNcbiAqKiBtb2R1bGUgaWQgPSAyNlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gaXNWaXJ0dWFsVGV4dFxuXG5mdW5jdGlvbiBpc1ZpcnR1YWxUZXh0KHgpIHtcbiAgICByZXR1cm4geCAmJiB4LnR5cGUgPT09IFwiVmlydHVhbFRleHRcIiAmJiB4LnZlcnNpb24gPT09IHZlcnNpb25cbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL3Zub2RlL2lzLXZ0ZXh0LmpzXG4gKiogbW9kdWxlIGlkID0gMjdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNwbGl0ID0gcmVxdWlyZSgnYnJvd3Nlci1zcGxpdCcpO1xuXG52YXIgY2xhc3NJZFNwbGl0ID0gLyhbXFwuI10/W2EtekEtWjAtOVxcdTAwN0YtXFx1RkZGRl86LV0rKS87XG52YXIgbm90Q2xhc3NJZCA9IC9eXFwufCMvO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlVGFnO1xuXG5mdW5jdGlvbiBwYXJzZVRhZyh0YWcsIHByb3BzKSB7XG4gICAgaWYgKCF0YWcpIHtcbiAgICAgICAgcmV0dXJuICdESVYnO1xuICAgIH1cblxuICAgIHZhciBub0lkID0gIShwcm9wcy5oYXNPd25Qcm9wZXJ0eSgnaWQnKSk7XG5cbiAgICB2YXIgdGFnUGFydHMgPSBzcGxpdCh0YWcsIGNsYXNzSWRTcGxpdCk7XG4gICAgdmFyIHRhZ05hbWUgPSBudWxsO1xuXG4gICAgaWYgKG5vdENsYXNzSWQudGVzdCh0YWdQYXJ0c1sxXSkpIHtcbiAgICAgICAgdGFnTmFtZSA9ICdESVYnO1xuICAgIH1cblxuICAgIHZhciBjbGFzc2VzLCBwYXJ0LCB0eXBlLCBpO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHRhZ1BhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHBhcnQgPSB0YWdQYXJ0c1tpXTtcblxuICAgICAgICBpZiAoIXBhcnQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSA9IHBhcnQuY2hhckF0KDApO1xuXG4gICAgICAgIGlmICghdGFnTmFtZSkge1xuICAgICAgICAgICAgdGFnTmFtZSA9IHBhcnQ7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJy4nKSB7XG4gICAgICAgICAgICBjbGFzc2VzID0gY2xhc3NlcyB8fCBbXTtcbiAgICAgICAgICAgIGNsYXNzZXMucHVzaChwYXJ0LnN1YnN0cmluZygxLCBwYXJ0Lmxlbmd0aCkpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICcjJyAmJiBub0lkKSB7XG4gICAgICAgICAgICBwcm9wcy5pZCA9IHBhcnQuc3Vic3RyaW5nKDEsIHBhcnQubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjbGFzc2VzKSB7XG4gICAgICAgIGlmIChwcm9wcy5jbGFzc05hbWUpIHtcbiAgICAgICAgICAgIGNsYXNzZXMucHVzaChwcm9wcy5jbGFzc05hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcHMuY2xhc3NOYW1lID0gY2xhc3Nlcy5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BzLm5hbWVzcGFjZSA/IHRhZ05hbWUgOiB0YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS92aXJ0dWFsLWh5cGVyc2NyaXB0L3BhcnNlLXRhZy5qc1xuICoqIG1vZHVsZSBpZCA9IDI4XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiFcbiAqIENyb3NzLUJyb3dzZXIgU3BsaXQgMS4xLjFcbiAqIENvcHlyaWdodCAyMDA3LTIwMTIgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+XG4gKiBBdmFpbGFibGUgdW5kZXIgdGhlIE1JVCBMaWNlbnNlXG4gKiBFQ01BU2NyaXB0IGNvbXBsaWFudCwgdW5pZm9ybSBjcm9zcy1icm93c2VyIHNwbGl0IG1ldGhvZFxuICovXG5cbi8qKlxuICogU3BsaXRzIGEgc3RyaW5nIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncyB1c2luZyBhIHJlZ2V4IG9yIHN0cmluZyBzZXBhcmF0b3IuIE1hdGNoZXMgb2YgdGhlXG4gKiBzZXBhcmF0b3IgYXJlIG5vdCBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0IGFycmF5LiBIb3dldmVyLCBpZiBgc2VwYXJhdG9yYCBpcyBhIHJlZ2V4IHRoYXQgY29udGFpbnNcbiAqIGNhcHR1cmluZyBncm91cHMsIGJhY2tyZWZlcmVuY2VzIGFyZSBzcGxpY2VkIGludG8gdGhlIHJlc3VsdCBlYWNoIHRpbWUgYHNlcGFyYXRvcmAgaXMgbWF0Y2hlZC5cbiAqIEZpeGVzIGJyb3dzZXIgYnVncyBjb21wYXJlZCB0byB0aGUgbmF0aXZlIGBTdHJpbmcucHJvdG90eXBlLnNwbGl0YCBhbmQgY2FuIGJlIHVzZWQgcmVsaWFibHlcbiAqIGNyb3NzLWJyb3dzZXIuXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFN0cmluZyB0byBzcGxpdC5cbiAqIEBwYXJhbSB7UmVnRXhwfFN0cmluZ30gc2VwYXJhdG9yIFJlZ2V4IG9yIHN0cmluZyB0byB1c2UgZm9yIHNlcGFyYXRpbmcgdGhlIHN0cmluZy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbbGltaXRdIE1heGltdW0gbnVtYmVyIG9mIGl0ZW1zIHRvIGluY2x1ZGUgaW4gdGhlIHJlc3VsdCBhcnJheS5cbiAqIEByZXR1cm5zIHtBcnJheX0gQXJyYXkgb2Ygc3Vic3RyaW5ncy5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQmFzaWMgdXNlXG4gKiBzcGxpdCgnYSBiIGMgZCcsICcgJyk7XG4gKiAvLyAtPiBbJ2EnLCAnYicsICdjJywgJ2QnXVxuICpcbiAqIC8vIFdpdGggbGltaXRcbiAqIHNwbGl0KCdhIGIgYyBkJywgJyAnLCAyKTtcbiAqIC8vIC0+IFsnYScsICdiJ11cbiAqXG4gKiAvLyBCYWNrcmVmZXJlbmNlcyBpbiByZXN1bHQgYXJyYXlcbiAqIHNwbGl0KCcuLndvcmQxIHdvcmQyLi4nLCAvKFthLXpdKykoXFxkKykvaSk7XG4gKiAvLyAtPiBbJy4uJywgJ3dvcmQnLCAnMScsICcgJywgJ3dvcmQnLCAnMicsICcuLiddXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIHNwbGl0KHVuZGVmKSB7XG5cbiAgdmFyIG5hdGl2ZVNwbGl0ID0gU3RyaW5nLnByb3RvdHlwZS5zcGxpdCxcbiAgICBjb21wbGlhbnRFeGVjTnBjZyA9IC8oKT8/Ly5leGVjKFwiXCIpWzFdID09PSB1bmRlZixcbiAgICAvLyBOUENHOiBub25wYXJ0aWNpcGF0aW5nIGNhcHR1cmluZyBncm91cFxuICAgIHNlbGY7XG5cbiAgc2VsZiA9IGZ1bmN0aW9uKHN0ciwgc2VwYXJhdG9yLCBsaW1pdCkge1xuICAgIC8vIElmIGBzZXBhcmF0b3JgIGlzIG5vdCBhIHJlZ2V4LCB1c2UgYG5hdGl2ZVNwbGl0YFxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc2VwYXJhdG9yKSAhPT0gXCJbb2JqZWN0IFJlZ0V4cF1cIikge1xuICAgICAgcmV0dXJuIG5hdGl2ZVNwbGl0LmNhbGwoc3RyLCBzZXBhcmF0b3IsIGxpbWl0KTtcbiAgICB9XG4gICAgdmFyIG91dHB1dCA9IFtdLFxuICAgICAgZmxhZ3MgPSAoc2VwYXJhdG9yLmlnbm9yZUNhc2UgPyBcImlcIiA6IFwiXCIpICsgKHNlcGFyYXRvci5tdWx0aWxpbmUgPyBcIm1cIiA6IFwiXCIpICsgKHNlcGFyYXRvci5leHRlbmRlZCA/IFwieFwiIDogXCJcIikgKyAvLyBQcm9wb3NlZCBmb3IgRVM2XG4gICAgICAoc2VwYXJhdG9yLnN0aWNreSA/IFwieVwiIDogXCJcIiksXG4gICAgICAvLyBGaXJlZm94IDMrXG4gICAgICBsYXN0TGFzdEluZGV4ID0gMCxcbiAgICAgIC8vIE1ha2UgYGdsb2JhbGAgYW5kIGF2b2lkIGBsYXN0SW5kZXhgIGlzc3VlcyBieSB3b3JraW5nIHdpdGggYSBjb3B5XG4gICAgICBzZXBhcmF0b3IgPSBuZXcgUmVnRXhwKHNlcGFyYXRvci5zb3VyY2UsIGZsYWdzICsgXCJnXCIpLFxuICAgICAgc2VwYXJhdG9yMiwgbWF0Y2gsIGxhc3RJbmRleCwgbGFzdExlbmd0aDtcbiAgICBzdHIgKz0gXCJcIjsgLy8gVHlwZS1jb252ZXJ0XG4gICAgaWYgKCFjb21wbGlhbnRFeGVjTnBjZykge1xuICAgICAgLy8gRG9lc24ndCBuZWVkIGZsYWdzIGd5LCBidXQgdGhleSBkb24ndCBodXJ0XG4gICAgICBzZXBhcmF0b3IyID0gbmV3IFJlZ0V4cChcIl5cIiArIHNlcGFyYXRvci5zb3VyY2UgKyBcIiQoPyFcXFxccylcIiwgZmxhZ3MpO1xuICAgIH1cbiAgICAvKiBWYWx1ZXMgZm9yIGBsaW1pdGAsIHBlciB0aGUgc3BlYzpcbiAgICAgKiBJZiB1bmRlZmluZWQ6IDQyOTQ5NjcyOTUgLy8gTWF0aC5wb3coMiwgMzIpIC0gMVxuICAgICAqIElmIDAsIEluZmluaXR5LCBvciBOYU46IDBcbiAgICAgKiBJZiBwb3NpdGl2ZSBudW1iZXI6IGxpbWl0ID0gTWF0aC5mbG9vcihsaW1pdCk7IGlmIChsaW1pdCA+IDQyOTQ5NjcyOTUpIGxpbWl0IC09IDQyOTQ5NjcyOTY7XG4gICAgICogSWYgbmVnYXRpdmUgbnVtYmVyOiA0Mjk0OTY3Mjk2IC0gTWF0aC5mbG9vcihNYXRoLmFicyhsaW1pdCkpXG4gICAgICogSWYgb3RoZXI6IFR5cGUtY29udmVydCwgdGhlbiB1c2UgdGhlIGFib3ZlIHJ1bGVzXG4gICAgICovXG4gICAgbGltaXQgPSBsaW1pdCA9PT0gdW5kZWYgPyAtMSA+Pj4gMCA6IC8vIE1hdGgucG93KDIsIDMyKSAtIDFcbiAgICBsaW1pdCA+Pj4gMDsgLy8gVG9VaW50MzIobGltaXQpXG4gICAgd2hpbGUgKG1hdGNoID0gc2VwYXJhdG9yLmV4ZWMoc3RyKSkge1xuICAgICAgLy8gYHNlcGFyYXRvci5sYXN0SW5kZXhgIGlzIG5vdCByZWxpYWJsZSBjcm9zcy1icm93c2VyXG4gICAgICBsYXN0SW5kZXggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIGlmIChsYXN0SW5kZXggPiBsYXN0TGFzdEluZGV4KSB7XG4gICAgICAgIG91dHB1dC5wdXNoKHN0ci5zbGljZShsYXN0TGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgICAgICAvLyBGaXggYnJvd3NlcnMgd2hvc2UgYGV4ZWNgIG1ldGhvZHMgZG9uJ3QgY29uc2lzdGVudGx5IHJldHVybiBgdW5kZWZpbmVkYCBmb3JcbiAgICAgICAgLy8gbm9ucGFydGljaXBhdGluZyBjYXB0dXJpbmcgZ3JvdXBzXG4gICAgICAgIGlmICghY29tcGxpYW50RXhlY05wY2cgJiYgbWF0Y2gubGVuZ3RoID4gMSkge1xuICAgICAgICAgIG1hdGNoWzBdLnJlcGxhY2Uoc2VwYXJhdG9yMiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAyOyBpKyspIHtcbiAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1tpXSA9PT0gdW5kZWYpIHtcbiAgICAgICAgICAgICAgICBtYXRjaFtpXSA9IHVuZGVmO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoLmxlbmd0aCA+IDEgJiYgbWF0Y2guaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkob3V0cHV0LCBtYXRjaC5zbGljZSgxKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdExlbmd0aCA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgbGFzdExhc3RJbmRleCA9IGxhc3RJbmRleDtcbiAgICAgICAgaWYgKG91dHB1dC5sZW5ndGggPj0gbGltaXQpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNlcGFyYXRvci5sYXN0SW5kZXggPT09IG1hdGNoLmluZGV4KSB7XG4gICAgICAgIHNlcGFyYXRvci5sYXN0SW5kZXgrKzsgLy8gQXZvaWQgYW4gaW5maW5pdGUgbG9vcFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAobGFzdExhc3RJbmRleCA9PT0gc3RyLmxlbmd0aCkge1xuICAgICAgaWYgKGxhc3RMZW5ndGggfHwgIXNlcGFyYXRvci50ZXN0KFwiXCIpKSB7XG4gICAgICAgIG91dHB1dC5wdXNoKFwiXCIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaChzdHIuc2xpY2UobGFzdExhc3RJbmRleCkpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0Lmxlbmd0aCA+IGxpbWl0ID8gb3V0cHV0LnNsaWNlKDAsIGxpbWl0KSA6IG91dHB1dDtcbiAgfTtcblxuICByZXR1cm4gc2VsZjtcbn0pKCk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS9+L2Jyb3dzZXItc3BsaXQvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAyOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNvZnRTZXRIb29rO1xuXG5mdW5jdGlvbiBTb2Z0U2V0SG9vayh2YWx1ZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTb2Z0U2V0SG9vaykpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTb2Z0U2V0SG9vayh2YWx1ZSk7XG4gICAgfVxuXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufVxuXG5Tb2Z0U2V0SG9vay5wcm90b3R5cGUuaG9vayA9IGZ1bmN0aW9uIChub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICBpZiAobm9kZVtwcm9wZXJ0eU5hbWVdICE9PSB0aGlzLnZhbHVlKSB7XG4gICAgICAgIG5vZGVbcHJvcGVydHlOYW1lXSA9IHRoaXMudmFsdWU7XG4gICAgfVxufTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL3ZpcnR1YWwtaHlwZXJzY3JpcHQvaG9va3Mvc29mdC1zZXQtaG9vay5qc1xuICoqIG1vZHVsZSBpZCA9IDMwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbnZhciBFdlN0b3JlID0gcmVxdWlyZSgnZXYtc3RvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdkhvb2s7XG5cbmZ1bmN0aW9uIEV2SG9vayh2YWx1ZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBFdkhvb2spKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXZIb29rKHZhbHVlKTtcbiAgICB9XG5cbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG59XG5cbkV2SG9vay5wcm90b3R5cGUuaG9vayA9IGZ1bmN0aW9uIChub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICB2YXIgZXMgPSBFdlN0b3JlKG5vZGUpO1xuICAgIHZhciBwcm9wTmFtZSA9IHByb3BlcnR5TmFtZS5zdWJzdHIoMyk7XG5cbiAgICBlc1twcm9wTmFtZV0gPSB0aGlzLnZhbHVlO1xufTtcblxuRXZIb29rLnByb3RvdHlwZS51bmhvb2sgPSBmdW5jdGlvbihub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICB2YXIgZXMgPSBFdlN0b3JlKG5vZGUpO1xuICAgIHZhciBwcm9wTmFtZSA9IHByb3BlcnR5TmFtZS5zdWJzdHIoMyk7XG5cbiAgICBlc1twcm9wTmFtZV0gPSB1bmRlZmluZWQ7XG59O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdmlydHVhbC1kb20vdmlydHVhbC1oeXBlcnNjcmlwdC9ob29rcy9ldi1ob29rLmpzXG4gKiogbW9kdWxlIGlkID0gMzFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcblxudmFyIE9uZVZlcnNpb25Db25zdHJhaW50ID0gcmVxdWlyZSgnaW5kaXZpZHVhbC9vbmUtdmVyc2lvbicpO1xuXG52YXIgTVlfVkVSU0lPTiA9ICc3Jztcbk9uZVZlcnNpb25Db25zdHJhaW50KCdldi1zdG9yZScsIE1ZX1ZFUlNJT04pO1xuXG52YXIgaGFzaEtleSA9ICdfX0VWX1NUT1JFX0tFWUAnICsgTVlfVkVSU0lPTjtcblxubW9kdWxlLmV4cG9ydHMgPSBFdlN0b3JlO1xuXG5mdW5jdGlvbiBFdlN0b3JlKGVsZW0pIHtcbiAgICB2YXIgaGFzaCA9IGVsZW1baGFzaEtleV07XG5cbiAgICBpZiAoIWhhc2gpIHtcbiAgICAgICAgaGFzaCA9IGVsZW1baGFzaEtleV0gPSB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4gaGFzaDtcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL34vZXYtc3RvcmUvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAzMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgSW5kaXZpZHVhbCA9IHJlcXVpcmUoJy4vaW5kZXguanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBPbmVWZXJzaW9uO1xuXG5mdW5jdGlvbiBPbmVWZXJzaW9uKG1vZHVsZU5hbWUsIHZlcnNpb24sIGRlZmF1bHRWYWx1ZSkge1xuICAgIHZhciBrZXkgPSAnX19JTkRJVklEVUFMX09ORV9WRVJTSU9OXycgKyBtb2R1bGVOYW1lO1xuICAgIHZhciBlbmZvcmNlS2V5ID0ga2V5ICsgJ19FTkZPUkNFX1NJTkdMRVRPTic7XG5cbiAgICB2YXIgdmVyc2lvblZhbHVlID0gSW5kaXZpZHVhbChlbmZvcmNlS2V5LCB2ZXJzaW9uKTtcblxuICAgIGlmICh2ZXJzaW9uVmFsdWUgIT09IHZlcnNpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gb25seSBoYXZlIG9uZSBjb3B5IG9mICcgK1xuICAgICAgICAgICAgbW9kdWxlTmFtZSArICcuXFxuJyArXG4gICAgICAgICAgICAnWW91IGFscmVhZHkgaGF2ZSB2ZXJzaW9uICcgKyB2ZXJzaW9uVmFsdWUgK1xuICAgICAgICAgICAgJyBpbnN0YWxsZWQuXFxuJyArXG4gICAgICAgICAgICAnVGhpcyBtZWFucyB5b3UgY2Fubm90IGluc3RhbGwgdmVyc2lvbiAnICsgdmVyc2lvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIEluZGl2aWR1YWwoa2V5LCBkZWZhdWx0VmFsdWUpO1xufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdmlydHVhbC1kb20vfi9ldi1zdG9yZS9+L2luZGl2aWR1YWwvb25lLXZlcnNpb24uanNcbiAqKiBtb2R1bGUgaWQgPSAzM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKmdsb2JhbCB3aW5kb3csIGdsb2JhbCovXG5cbnZhciByb290ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgP1xuICAgIHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID9cbiAgICBnbG9iYWwgOiB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbmRpdmlkdWFsO1xuXG5mdW5jdGlvbiBJbmRpdmlkdWFsKGtleSwgdmFsdWUpIHtcbiAgICBpZiAoa2V5IGluIHJvb3QpIHtcbiAgICAgICAgcmV0dXJuIHJvb3Rba2V5XTtcbiAgICB9XG5cbiAgICByb290W2tleV0gPSB2YWx1ZTtcblxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL34vZXYtc3RvcmUvfi9pbmRpdmlkdWFsL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMzRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBjcmVhdGVFbGVtZW50ID0gcmVxdWlyZShcIi4vdmRvbS9jcmVhdGUtZWxlbWVudC5qc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUVsZW1lbnRcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL2NyZWF0ZS1lbGVtZW50LmpzXG4gKiogbW9kdWxlIGlkID0gMzVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBkb2N1bWVudCA9IHJlcXVpcmUoXCJnbG9iYWwvZG9jdW1lbnRcIilcblxudmFyIGFwcGx5UHJvcGVydGllcyA9IHJlcXVpcmUoXCIuL2FwcGx5LXByb3BlcnRpZXNcIilcblxudmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdm5vZGUuanNcIilcbnZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZ0ZXh0LmpzXCIpXG52YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCIpXG52YXIgaGFuZGxlVGh1bmsgPSByZXF1aXJlKFwiLi4vdm5vZGUvaGFuZGxlLXRodW5rLmpzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlRWxlbWVudFxuXG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50KHZub2RlLCBvcHRzKSB7XG4gICAgdmFyIGRvYyA9IG9wdHMgPyBvcHRzLmRvY3VtZW50IHx8IGRvY3VtZW50IDogZG9jdW1lbnRcbiAgICB2YXIgd2FybiA9IG9wdHMgPyBvcHRzLndhcm4gOiBudWxsXG5cbiAgICB2bm9kZSA9IGhhbmRsZVRodW5rKHZub2RlKS5hXG5cbiAgICBpZiAoaXNXaWRnZXQodm5vZGUpKSB7XG4gICAgICAgIHJldHVybiB2bm9kZS5pbml0KClcbiAgICB9IGVsc2UgaWYgKGlzVlRleHQodm5vZGUpKSB7XG4gICAgICAgIHJldHVybiBkb2MuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dClcbiAgICB9IGVsc2UgaWYgKCFpc1ZOb2RlKHZub2RlKSkge1xuICAgICAgICBpZiAod2Fybikge1xuICAgICAgICAgICAgd2FybihcIkl0ZW0gaXMgbm90IGEgdmFsaWQgdmlydHVhbCBkb20gbm9kZVwiLCB2bm9kZSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIHZhciBub2RlID0gKHZub2RlLm5hbWVzcGFjZSA9PT0gbnVsbCkgP1xuICAgICAgICBkb2MuY3JlYXRlRWxlbWVudCh2bm9kZS50YWdOYW1lKSA6XG4gICAgICAgIGRvYy5jcmVhdGVFbGVtZW50TlModm5vZGUubmFtZXNwYWNlLCB2bm9kZS50YWdOYW1lKVxuXG4gICAgdmFyIHByb3BzID0gdm5vZGUucHJvcGVydGllc1xuICAgIGFwcGx5UHJvcGVydGllcyhub2RlLCBwcm9wcylcblxuICAgIHZhciBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZE5vZGUgPSBjcmVhdGVFbGVtZW50KGNoaWxkcmVuW2ldLCBvcHRzKVxuICAgICAgICBpZiAoY2hpbGROb2RlKSB7XG4gICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKGNoaWxkTm9kZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBub2RlXG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS92ZG9tL2NyZWF0ZS1lbGVtZW50LmpzXG4gKiogbW9kdWxlIGlkID0gMzZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciB0b3BMZXZlbCA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDpcbiAgICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHt9XG52YXIgbWluRG9jID0gcmVxdWlyZSgnbWluLWRvY3VtZW50Jyk7XG5cbmlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkb2N1bWVudDtcbn0gZWxzZSB7XG4gICAgdmFyIGRvY2N5ID0gdG9wTGV2ZWxbJ19fR0xPQkFMX0RPQ1VNRU5UX0NBQ0hFQDQnXTtcblxuICAgIGlmICghZG9jY3kpIHtcbiAgICAgICAgZG9jY3kgPSB0b3BMZXZlbFsnX19HTE9CQUxfRE9DVU1FTlRfQ0FDSEVANCddID0gbWluRG9jO1xuICAgIH1cblxuICAgIG1vZHVsZS5leHBvcnRzID0gZG9jY3k7XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS9+L2dsb2JhbC9kb2N1bWVudC5qc1xuICoqIG1vZHVsZSBpZCA9IDM3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiAoaWdub3JlZCkgKi9cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIG1pbi1kb2N1bWVudCAoaWdub3JlZClcbiAqKiBtb2R1bGUgaWQgPSAzOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZShcImlzLW9iamVjdFwiKVxudmFyIGlzSG9vayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12aG9vay5qc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFwcGx5UHJvcGVydGllc1xuXG5mdW5jdGlvbiBhcHBseVByb3BlcnRpZXMobm9kZSwgcHJvcHMsIHByZXZpb3VzKSB7XG4gICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gcHJvcHMpIHtcbiAgICAgICAgdmFyIHByb3BWYWx1ZSA9IHByb3BzW3Byb3BOYW1lXVxuXG4gICAgICAgIGlmIChwcm9wVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVtb3ZlUHJvcGVydHkobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSwgcHJldmlvdXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzSG9vayhwcm9wVmFsdWUpKSB7XG4gICAgICAgICAgICByZW1vdmVQcm9wZXJ0eShub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlLCBwcmV2aW91cylcbiAgICAgICAgICAgIGlmIChwcm9wVmFsdWUuaG9vaykge1xuICAgICAgICAgICAgICAgIHByb3BWYWx1ZS5ob29rKG5vZGUsXG4gICAgICAgICAgICAgICAgICAgIHByb3BOYW1lLFxuICAgICAgICAgICAgICAgICAgICBwcmV2aW91cyA/IHByZXZpb3VzW3Byb3BOYW1lXSA6IHVuZGVmaW5lZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpc09iamVjdChwcm9wVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hPYmplY3Qobm9kZSwgcHJvcHMsIHByZXZpb3VzLCBwcm9wTmFtZSwgcHJvcFZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBwcm9wVmFsdWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlUHJvcGVydHkobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSwgcHJldmlvdXMpIHtcbiAgICBpZiAocHJldmlvdXMpIHtcbiAgICAgICAgdmFyIHByZXZpb3VzVmFsdWUgPSBwcmV2aW91c1twcm9wTmFtZV1cblxuICAgICAgICBpZiAoIWlzSG9vayhwcmV2aW91c1ZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKHByb3BOYW1lID09PSBcImF0dHJpYnV0ZXNcIikge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGF0dHJOYW1lIGluIHByZXZpb3VzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wTmFtZSA9PT0gXCJzdHlsZVwiKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc3R5bGVbaV0gPSBcIlwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcHJldmlvdXNWYWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0gXCJcIlxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IG51bGxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChwcmV2aW91c1ZhbHVlLnVuaG9vaykge1xuICAgICAgICAgICAgcHJldmlvdXNWYWx1ZS51bmhvb2sobm9kZSwgcHJvcE5hbWUsIHByb3BWYWx1ZSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcGF0Y2hPYmplY3Qobm9kZSwgcHJvcHMsIHByZXZpb3VzLCBwcm9wTmFtZSwgcHJvcFZhbHVlKSB7XG4gICAgdmFyIHByZXZpb3VzVmFsdWUgPSBwcmV2aW91cyA/IHByZXZpb3VzW3Byb3BOYW1lXSA6IHVuZGVmaW5lZFxuXG4gICAgLy8gU2V0IGF0dHJpYnV0ZXNcbiAgICBpZiAocHJvcE5hbWUgPT09IFwiYXR0cmlidXRlc1wiKSB7XG4gICAgICAgIGZvciAodmFyIGF0dHJOYW1lIGluIHByb3BWYWx1ZSkge1xuICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IHByb3BWYWx1ZVthdHRyTmFtZV1cblxuICAgICAgICAgICAgaWYgKGF0dHJWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBhdHRyVmFsdWUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZihwcmV2aW91c1ZhbHVlICYmIGlzT2JqZWN0KHByZXZpb3VzVmFsdWUpICYmXG4gICAgICAgIGdldFByb3RvdHlwZShwcmV2aW91c1ZhbHVlKSAhPT0gZ2V0UHJvdG90eXBlKHByb3BWYWx1ZSkpIHtcbiAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBwcm9wVmFsdWVcbiAgICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKCFpc09iamVjdChub2RlW3Byb3BOYW1lXSkpIHtcbiAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSB7fVxuICAgIH1cblxuICAgIHZhciByZXBsYWNlciA9IHByb3BOYW1lID09PSBcInN0eWxlXCIgPyBcIlwiIDogdW5kZWZpbmVkXG5cbiAgICBmb3IgKHZhciBrIGluIHByb3BWYWx1ZSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBwcm9wVmFsdWVba11cbiAgICAgICAgbm9kZVtwcm9wTmFtZV1ba10gPSAodmFsdWUgPT09IHVuZGVmaW5lZCkgPyByZXBsYWNlciA6IHZhbHVlXG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRQcm90b3R5cGUodmFsdWUpIHtcbiAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpXG4gICAgfSBlbHNlIGlmICh2YWx1ZS5fX3Byb3RvX18pIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLl9fcHJvdG9fX1xuICAgIH0gZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZVxuICAgIH1cbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL3Zkb20vYXBwbHktcHJvcGVydGllcy5qc1xuICoqIG1vZHVsZSBpZCA9IDM5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc09iamVjdCh4KSB7XG5cdHJldHVybiB0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiAmJiB4ICE9PSBudWxsO1xufTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL34vaXMtb2JqZWN0L2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gNDBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4vaXMtdm5vZGVcIilcbnZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4vaXMtdnRleHRcIilcbnZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuL2lzLXdpZGdldFwiKVxudmFyIGlzVGh1bmsgPSByZXF1aXJlKFwiLi9pcy10aHVua1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhhbmRsZVRodW5rXG5cbmZ1bmN0aW9uIGhhbmRsZVRodW5rKGEsIGIpIHtcbiAgICB2YXIgcmVuZGVyZWRBID0gYVxuICAgIHZhciByZW5kZXJlZEIgPSBiXG5cbiAgICBpZiAoaXNUaHVuayhiKSkge1xuICAgICAgICByZW5kZXJlZEIgPSByZW5kZXJUaHVuayhiLCBhKVxuICAgIH1cblxuICAgIGlmIChpc1RodW5rKGEpKSB7XG4gICAgICAgIHJlbmRlcmVkQSA9IHJlbmRlclRodW5rKGEsIG51bGwpXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYTogcmVuZGVyZWRBLFxuICAgICAgICBiOiByZW5kZXJlZEJcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlclRodW5rKHRodW5rLCBwcmV2aW91cykge1xuICAgIHZhciByZW5kZXJlZFRodW5rID0gdGh1bmsudm5vZGVcblxuICAgIGlmICghcmVuZGVyZWRUaHVuaykge1xuICAgICAgICByZW5kZXJlZFRodW5rID0gdGh1bmsudm5vZGUgPSB0aHVuay5yZW5kZXIocHJldmlvdXMpXG4gICAgfVxuXG4gICAgaWYgKCEoaXNWTm9kZShyZW5kZXJlZFRodW5rKSB8fFxuICAgICAgICAgICAgaXNWVGV4dChyZW5kZXJlZFRodW5rKSB8fFxuICAgICAgICAgICAgaXNXaWRnZXQocmVuZGVyZWRUaHVuaykpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInRodW5rIGRpZCBub3QgcmV0dXJuIGEgdmFsaWQgbm9kZVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVuZGVyZWRUaHVua1xufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdmlydHVhbC1kb20vdm5vZGUvaGFuZGxlLXRodW5rLmpzXG4gKiogbW9kdWxlIGlkID0gNDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBkaWZmID0gcmVxdWlyZShcIi4vdnRyZWUvZGlmZi5qc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpZmZcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL2RpZmYuanNcbiAqKiBtb2R1bGUgaWQgPSA0MlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGlzQXJyYXkgPSByZXF1aXJlKFwieC1pcy1hcnJheVwiKVxuXG52YXIgVlBhdGNoID0gcmVxdWlyZShcIi4uL3Zub2RlL3ZwYXRjaFwiKVxudmFyIGlzVk5vZGUgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdm5vZGVcIilcbnZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZ0ZXh0XCIpXG52YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0XCIpXG52YXIgaXNUaHVuayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy10aHVua1wiKVxudmFyIGhhbmRsZVRodW5rID0gcmVxdWlyZShcIi4uL3Zub2RlL2hhbmRsZS10aHVua1wiKVxuXG52YXIgZGlmZlByb3BzID0gcmVxdWlyZShcIi4vZGlmZi1wcm9wc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpZmZcblxuZnVuY3Rpb24gZGlmZihhLCBiKSB7XG4gICAgdmFyIHBhdGNoID0geyBhOiBhIH1cbiAgICB3YWxrKGEsIGIsIHBhdGNoLCAwKVxuICAgIHJldHVybiBwYXRjaFxufVxuXG5mdW5jdGlvbiB3YWxrKGEsIGIsIHBhdGNoLCBpbmRleCkge1xuICAgIGlmIChhID09PSBiKSB7XG4gICAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHZhciBhcHBseSA9IHBhdGNoW2luZGV4XVxuICAgIHZhciBhcHBseUNsZWFyID0gZmFsc2VcblxuICAgIGlmIChpc1RodW5rKGEpIHx8IGlzVGh1bmsoYikpIHtcbiAgICAgICAgdGh1bmtzKGEsIGIsIHBhdGNoLCBpbmRleClcbiAgICB9IGVsc2UgaWYgKGIgPT0gbnVsbCkge1xuXG4gICAgICAgIC8vIElmIGEgaXMgYSB3aWRnZXQgd2Ugd2lsbCBhZGQgYSByZW1vdmUgcGF0Y2ggZm9yIGl0XG4gICAgICAgIC8vIE90aGVyd2lzZSBhbnkgY2hpbGQgd2lkZ2V0cy9ob29rcyBtdXN0IGJlIGRlc3Ryb3llZC5cbiAgICAgICAgLy8gVGhpcyBwcmV2ZW50cyBhZGRpbmcgdHdvIHJlbW92ZSBwYXRjaGVzIGZvciBhIHdpZGdldC5cbiAgICAgICAgaWYgKCFpc1dpZGdldChhKSkge1xuICAgICAgICAgICAgY2xlYXJTdGF0ZShhLCBwYXRjaCwgaW5kZXgpXG4gICAgICAgICAgICBhcHBseSA9IHBhdGNoW2luZGV4XVxuICAgICAgICB9XG5cbiAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guUkVNT1ZFLCBhLCBiKSlcbiAgICB9IGVsc2UgaWYgKGlzVk5vZGUoYikpIHtcbiAgICAgICAgaWYgKGlzVk5vZGUoYSkpIHtcbiAgICAgICAgICAgIGlmIChhLnRhZ05hbWUgPT09IGIudGFnTmFtZSAmJlxuICAgICAgICAgICAgICAgIGEubmFtZXNwYWNlID09PSBiLm5hbWVzcGFjZSAmJlxuICAgICAgICAgICAgICAgIGEua2V5ID09PSBiLmtleSkge1xuICAgICAgICAgICAgICAgIHZhciBwcm9wc1BhdGNoID0gZGlmZlByb3BzKGEucHJvcGVydGllcywgYi5wcm9wZXJ0aWVzKVxuICAgICAgICAgICAgICAgIGlmIChwcm9wc1BhdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgVlBhdGNoKFZQYXRjaC5QUk9QUywgYSwgcHJvcHNQYXRjaCkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFwcGx5ID0gZGlmZkNoaWxkcmVuKGEsIGIsIHBhdGNoLCBhcHBseSwgaW5kZXgpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZOT0RFLCBhLCBiKSlcbiAgICAgICAgICAgICAgICBhcHBseUNsZWFyID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChWUGF0Y2guVk5PREUsIGEsIGIpKVxuICAgICAgICAgICAgYXBwbHlDbGVhciA9IHRydWVcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNWVGV4dChiKSkge1xuICAgICAgICBpZiAoIWlzVlRleHQoYSkpIHtcbiAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZURVhULCBhLCBiKSlcbiAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoYS50ZXh0ICE9PSBiLnRleHQpIHtcbiAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZURVhULCBhLCBiKSlcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNXaWRnZXQoYikpIHtcbiAgICAgICAgaWYgKCFpc1dpZGdldChhKSkge1xuICAgICAgICAgICAgYXBwbHlDbGVhciA9IHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLldJREdFVCwgYSwgYikpXG4gICAgfVxuXG4gICAgaWYgKGFwcGx5KSB7XG4gICAgICAgIHBhdGNoW2luZGV4XSA9IGFwcGx5XG4gICAgfVxuXG4gICAgaWYgKGFwcGx5Q2xlYXIpIHtcbiAgICAgICAgY2xlYXJTdGF0ZShhLCBwYXRjaCwgaW5kZXgpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBkaWZmQ2hpbGRyZW4oYSwgYiwgcGF0Y2gsIGFwcGx5LCBpbmRleCkge1xuICAgIHZhciBhQ2hpbGRyZW4gPSBhLmNoaWxkcmVuXG4gICAgdmFyIG9yZGVyZWRTZXQgPSByZW9yZGVyKGFDaGlsZHJlbiwgYi5jaGlsZHJlbilcbiAgICB2YXIgYkNoaWxkcmVuID0gb3JkZXJlZFNldC5jaGlsZHJlblxuXG4gICAgdmFyIGFMZW4gPSBhQ2hpbGRyZW4ubGVuZ3RoXG4gICAgdmFyIGJMZW4gPSBiQ2hpbGRyZW4ubGVuZ3RoXG4gICAgdmFyIGxlbiA9IGFMZW4gPiBiTGVuID8gYUxlbiA6IGJMZW5cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGxlZnROb2RlID0gYUNoaWxkcmVuW2ldXG4gICAgICAgIHZhciByaWdodE5vZGUgPSBiQ2hpbGRyZW5baV1cbiAgICAgICAgaW5kZXggKz0gMVxuXG4gICAgICAgIGlmICghbGVmdE5vZGUpIHtcbiAgICAgICAgICAgIGlmIChyaWdodE5vZGUpIHtcbiAgICAgICAgICAgICAgICAvLyBFeGNlc3Mgbm9kZXMgaW4gYiBuZWVkIHRvIGJlIGFkZGVkXG4gICAgICAgICAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IFZQYXRjaChWUGF0Y2guSU5TRVJULCBudWxsLCByaWdodE5vZGUpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2FsayhsZWZ0Tm9kZSwgcmlnaHROb2RlLCBwYXRjaCwgaW5kZXgpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNWTm9kZShsZWZ0Tm9kZSkgJiYgbGVmdE5vZGUuY291bnQpIHtcbiAgICAgICAgICAgIGluZGV4ICs9IGxlZnROb2RlLmNvdW50XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3JkZXJlZFNldC5tb3Zlcykge1xuICAgICAgICAvLyBSZW9yZGVyIG5vZGVzIGxhc3RcbiAgICAgICAgYXBwbHkgPSBhcHBlbmRQYXRjaChhcHBseSwgbmV3IFZQYXRjaChcbiAgICAgICAgICAgIFZQYXRjaC5PUkRFUixcbiAgICAgICAgICAgIGEsXG4gICAgICAgICAgICBvcmRlcmVkU2V0Lm1vdmVzXG4gICAgICAgICkpXG4gICAgfVxuXG4gICAgcmV0dXJuIGFwcGx5XG59XG5cbmZ1bmN0aW9uIGNsZWFyU3RhdGUodk5vZGUsIHBhdGNoLCBpbmRleCkge1xuICAgIC8vIFRPRE86IE1ha2UgdGhpcyBhIHNpbmdsZSB3YWxrLCBub3QgdHdvXG4gICAgdW5ob29rKHZOb2RlLCBwYXRjaCwgaW5kZXgpXG4gICAgZGVzdHJveVdpZGdldHModk5vZGUsIHBhdGNoLCBpbmRleClcbn1cblxuLy8gUGF0Y2ggcmVjb3JkcyBmb3IgYWxsIGRlc3Ryb3llZCB3aWRnZXRzIG11c3QgYmUgYWRkZWQgYmVjYXVzZSB3ZSBuZWVkXG4vLyBhIERPTSBub2RlIHJlZmVyZW5jZSBmb3IgdGhlIGRlc3Ryb3kgZnVuY3Rpb25cbmZ1bmN0aW9uIGRlc3Ryb3lXaWRnZXRzKHZOb2RlLCBwYXRjaCwgaW5kZXgpIHtcbiAgICBpZiAoaXNXaWRnZXQodk5vZGUpKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygdk5vZGUuZGVzdHJveSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBwYXRjaFtpbmRleF0gPSBhcHBlbmRQYXRjaChcbiAgICAgICAgICAgICAgICBwYXRjaFtpbmRleF0sXG4gICAgICAgICAgICAgICAgbmV3IFZQYXRjaChWUGF0Y2guUkVNT1ZFLCB2Tm9kZSwgbnVsbClcbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNWTm9kZSh2Tm9kZSkgJiYgKHZOb2RlLmhhc1dpZGdldHMgfHwgdk5vZGUuaGFzVGh1bmtzKSkge1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSB2Tm9kZS5jaGlsZHJlblxuICAgICAgICB2YXIgbGVuID0gY2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICAgICAgICBpbmRleCArPSAxXG5cbiAgICAgICAgICAgIGRlc3Ryb3lXaWRnZXRzKGNoaWxkLCBwYXRjaCwgaW5kZXgpXG5cbiAgICAgICAgICAgIGlmIChpc1ZOb2RlKGNoaWxkKSAmJiBjaGlsZC5jb3VudCkge1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IGNoaWxkLmNvdW50XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzVGh1bmsodk5vZGUpKSB7XG4gICAgICAgIHRodW5rcyh2Tm9kZSwgbnVsbCwgcGF0Y2gsIGluZGV4KVxuICAgIH1cbn1cblxuLy8gQ3JlYXRlIGEgc3ViLXBhdGNoIGZvciB0aHVua3NcbmZ1bmN0aW9uIHRodW5rcyhhLCBiLCBwYXRjaCwgaW5kZXgpIHtcbiAgICB2YXIgbm9kZXMgPSBoYW5kbGVUaHVuayhhLCBiKVxuICAgIHZhciB0aHVua1BhdGNoID0gZGlmZihub2Rlcy5hLCBub2Rlcy5iKVxuICAgIGlmIChoYXNQYXRjaGVzKHRodW5rUGF0Y2gpKSB7XG4gICAgICAgIHBhdGNoW2luZGV4XSA9IG5ldyBWUGF0Y2goVlBhdGNoLlRIVU5LLCBudWxsLCB0aHVua1BhdGNoKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzUGF0Y2hlcyhwYXRjaCkge1xuICAgIGZvciAodmFyIGluZGV4IGluIHBhdGNoKSB7XG4gICAgICAgIGlmIChpbmRleCAhPT0gXCJhXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuLy8gRXhlY3V0ZSBob29rcyB3aGVuIHR3byBub2RlcyBhcmUgaWRlbnRpY2FsXG5mdW5jdGlvbiB1bmhvb2sodk5vZGUsIHBhdGNoLCBpbmRleCkge1xuICAgIGlmIChpc1ZOb2RlKHZOb2RlKSkge1xuICAgICAgICBpZiAodk5vZGUuaG9va3MpIHtcbiAgICAgICAgICAgIHBhdGNoW2luZGV4XSA9IGFwcGVuZFBhdGNoKFxuICAgICAgICAgICAgICAgIHBhdGNoW2luZGV4XSxcbiAgICAgICAgICAgICAgICBuZXcgVlBhdGNoKFxuICAgICAgICAgICAgICAgICAgICBWUGF0Y2guUFJPUFMsXG4gICAgICAgICAgICAgICAgICAgIHZOb2RlLFxuICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWRLZXlzKHZOb2RlLmhvb2tzKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2Tm9kZS5kZXNjZW5kYW50SG9va3MgfHwgdk5vZGUuaGFzVGh1bmtzKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB2Tm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgdmFyIGxlbiA9IGNoaWxkcmVuLmxlbmd0aFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICAgICAgICAgICAgaW5kZXggKz0gMVxuXG4gICAgICAgICAgICAgICAgdW5ob29rKGNoaWxkLCBwYXRjaCwgaW5kZXgpXG5cbiAgICAgICAgICAgICAgICBpZiAoaXNWTm9kZShjaGlsZCkgJiYgY2hpbGQuY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gY2hpbGQuY291bnRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzVGh1bmsodk5vZGUpKSB7XG4gICAgICAgIHRodW5rcyh2Tm9kZSwgbnVsbCwgcGF0Y2gsIGluZGV4KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gdW5kZWZpbmVkS2V5cyhvYmopIHtcbiAgICB2YXIgcmVzdWx0ID0ge31cblxuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSB1bmRlZmluZWRcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG59XG5cbi8vIExpc3QgZGlmZiwgbmFpdmUgbGVmdCB0byByaWdodCByZW9yZGVyaW5nXG5mdW5jdGlvbiByZW9yZGVyKGFDaGlsZHJlbiwgYkNoaWxkcmVuKSB7XG4gICAgLy8gTyhNKSB0aW1lLCBPKE0pIG1lbW9yeVxuICAgIHZhciBiQ2hpbGRJbmRleCA9IGtleUluZGV4KGJDaGlsZHJlbilcbiAgICB2YXIgYktleXMgPSBiQ2hpbGRJbmRleC5rZXlzXG4gICAgdmFyIGJGcmVlID0gYkNoaWxkSW5kZXguZnJlZVxuXG4gICAgaWYgKGJGcmVlLmxlbmd0aCA9PT0gYkNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2hpbGRyZW46IGJDaGlsZHJlbixcbiAgICAgICAgICAgIG1vdmVzOiBudWxsXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPKE4pIHRpbWUsIE8oTikgbWVtb3J5XG4gICAgdmFyIGFDaGlsZEluZGV4ID0ga2V5SW5kZXgoYUNoaWxkcmVuKVxuICAgIHZhciBhS2V5cyA9IGFDaGlsZEluZGV4LmtleXNcbiAgICB2YXIgYUZyZWUgPSBhQ2hpbGRJbmRleC5mcmVlXG5cbiAgICBpZiAoYUZyZWUubGVuZ3RoID09PSBhQ2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjaGlsZHJlbjogYkNoaWxkcmVuLFxuICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE8oTUFYKE4sIE0pKSBtZW1vcnlcbiAgICB2YXIgbmV3Q2hpbGRyZW4gPSBbXVxuXG4gICAgdmFyIGZyZWVJbmRleCA9IDBcbiAgICB2YXIgZnJlZUNvdW50ID0gYkZyZWUubGVuZ3RoXG4gICAgdmFyIGRlbGV0ZWRJdGVtcyA9IDBcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhIGFuZCBtYXRjaCBhIG5vZGUgaW4gYlxuICAgIC8vIE8oTikgdGltZSxcbiAgICBmb3IgKHZhciBpID0gMCA7IGkgPCBhQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGFJdGVtID0gYUNoaWxkcmVuW2ldXG4gICAgICAgIHZhciBpdGVtSW5kZXhcblxuICAgICAgICBpZiAoYUl0ZW0ua2V5KSB7XG4gICAgICAgICAgICBpZiAoYktleXMuaGFzT3duUHJvcGVydHkoYUl0ZW0ua2V5KSkge1xuICAgICAgICAgICAgICAgIC8vIE1hdGNoIHVwIHRoZSBvbGQga2V5c1xuICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGJLZXlzW2FJdGVtLmtleV1cbiAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKGJDaGlsZHJlbltpdGVtSW5kZXhdKVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBvbGQga2V5ZWQgaXRlbXNcbiAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBpIC0gZGVsZXRlZEl0ZW1zKytcbiAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG51bGwpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBNYXRjaCB0aGUgaXRlbSBpbiBhIHdpdGggdGhlIG5leHQgZnJlZSBpdGVtIGluIGJcbiAgICAgICAgICAgIGlmIChmcmVlSW5kZXggPCBmcmVlQ291bnQpIHtcbiAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBiRnJlZVtmcmVlSW5kZXgrK11cbiAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKGJDaGlsZHJlbltpdGVtSW5kZXhdKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSBhcmUgbm8gZnJlZSBpdGVtcyBpbiBiIHRvIG1hdGNoIHdpdGhcbiAgICAgICAgICAgICAgICAvLyB0aGUgZnJlZSBpdGVtcyBpbiBhLCBzbyB0aGUgZXh0cmEgZnJlZSBub2Rlc1xuICAgICAgICAgICAgICAgIC8vIGFyZSBkZWxldGVkLlxuICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGkgLSBkZWxldGVkSXRlbXMrK1xuICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2gobnVsbClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsYXN0RnJlZUluZGV4ID0gZnJlZUluZGV4ID49IGJGcmVlLmxlbmd0aCA/XG4gICAgICAgIGJDaGlsZHJlbi5sZW5ndGggOlxuICAgICAgICBiRnJlZVtmcmVlSW5kZXhdXG5cbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggYiBhbmQgYXBwZW5kIGFueSBuZXcga2V5c1xuICAgIC8vIE8oTSkgdGltZVxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgYkNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBuZXdJdGVtID0gYkNoaWxkcmVuW2pdXG5cbiAgICAgICAgaWYgKG5ld0l0ZW0ua2V5KSB7XG4gICAgICAgICAgICBpZiAoIWFLZXlzLmhhc093blByb3BlcnR5KG5ld0l0ZW0ua2V5KSkge1xuICAgICAgICAgICAgICAgIC8vIEFkZCBhbnkgbmV3IGtleWVkIGl0ZW1zXG4gICAgICAgICAgICAgICAgLy8gV2UgYXJlIGFkZGluZyBuZXcgaXRlbXMgdG8gdGhlIGVuZCBhbmQgdGhlbiBzb3J0aW5nIHRoZW1cbiAgICAgICAgICAgICAgICAvLyBpbiBwbGFjZS4gSW4gZnV0dXJlIHdlIHNob3VsZCBpbnNlcnQgbmV3IGl0ZW1zIGluIHBsYWNlLlxuICAgICAgICAgICAgICAgIG5ld0NoaWxkcmVuLnB1c2gobmV3SXRlbSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChqID49IGxhc3RGcmVlSW5kZXgpIHtcbiAgICAgICAgICAgIC8vIEFkZCBhbnkgbGVmdG92ZXIgbm9uLWtleWVkIGl0ZW1zXG4gICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG5ld0l0ZW0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgc2ltdWxhdGUgPSBuZXdDaGlsZHJlbi5zbGljZSgpXG4gICAgdmFyIHNpbXVsYXRlSW5kZXggPSAwXG4gICAgdmFyIHJlbW92ZXMgPSBbXVxuICAgIHZhciBpbnNlcnRzID0gW11cbiAgICB2YXIgc2ltdWxhdGVJdGVtXG5cbiAgICBmb3IgKHZhciBrID0gMDsgayA8IGJDaGlsZHJlbi5sZW5ndGg7KSB7XG4gICAgICAgIHZhciB3YW50ZWRJdGVtID0gYkNoaWxkcmVuW2tdXG4gICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdXG5cbiAgICAgICAgLy8gcmVtb3ZlIGl0ZW1zXG4gICAgICAgIHdoaWxlIChzaW11bGF0ZUl0ZW0gPT09IG51bGwgJiYgc2ltdWxhdGUubGVuZ3RoKSB7XG4gICAgICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBudWxsKSlcbiAgICAgICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNpbXVsYXRlSXRlbSB8fCBzaW11bGF0ZUl0ZW0ua2V5ICE9PSB3YW50ZWRJdGVtLmtleSkge1xuICAgICAgICAgICAgLy8gaWYgd2UgbmVlZCBhIGtleSBpbiB0aGlzIHBvc2l0aW9uLi4uXG4gICAgICAgICAgICBpZiAod2FudGVkSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltdWxhdGVJdGVtICYmIHNpbXVsYXRlSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaW5zZXJ0IGRvZXNuJ3QgcHV0IHRoaXMga2V5IGluIHBsYWNlLCBpdCBuZWVkcyB0byBtb3ZlXG4gICAgICAgICAgICAgICAgICAgIGlmIChiS2V5c1tzaW11bGF0ZUl0ZW0ua2V5XSAhPT0gayArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIHNpbXVsYXRlSXRlbS5rZXkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJdGVtID0gc2ltdWxhdGVbc2ltdWxhdGVJbmRleF1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSByZW1vdmUgZGlkbid0IHB1dCB0aGUgd2FudGVkIGl0ZW0gaW4gcGxhY2UsIHdlIG5lZWQgdG8gaW5zZXJ0IGl0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNpbXVsYXRlSXRlbSB8fCBzaW11bGF0ZUl0ZW0ua2V5ICE9PSB3YW50ZWRJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaCh7a2V5OiB3YW50ZWRJdGVtLmtleSwgdG86IGt9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXRlbXMgYXJlIG1hdGNoaW5nLCBzbyBza2lwIGFoZWFkXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW11bGF0ZUluZGV4KytcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaCh7a2V5OiB3YW50ZWRJdGVtLmtleSwgdG86IGt9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goe2tleTogd2FudGVkSXRlbS5rZXksIHRvOiBrfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaysrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBhIGtleSBpbiBzaW11bGF0ZSBoYXMgbm8gbWF0Y2hpbmcgd2FudGVkIGtleSwgcmVtb3ZlIGl0XG4gICAgICAgICAgICBlbHNlIGlmIChzaW11bGF0ZUl0ZW0gJiYgc2ltdWxhdGVJdGVtLmtleSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZXMucHVzaChyZW1vdmUoc2ltdWxhdGUsIHNpbXVsYXRlSW5kZXgsIHNpbXVsYXRlSXRlbS5rZXkpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2ltdWxhdGVJbmRleCsrXG4gICAgICAgICAgICBrKytcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJlbW92ZSBhbGwgdGhlIHJlbWFpbmluZyBub2RlcyBmcm9tIHNpbXVsYXRlXG4gICAgd2hpbGUoc2ltdWxhdGVJbmRleCA8IHNpbXVsYXRlLmxlbmd0aCkge1xuICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XVxuICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBzaW11bGF0ZUl0ZW0gJiYgc2ltdWxhdGVJdGVtLmtleSkpXG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIG9ubHkgbW92ZXMgd2UgaGF2ZSBhcmUgZGVsZXRlcyB0aGVuIHdlIGNhbiBqdXN0XG4gICAgLy8gbGV0IHRoZSBkZWxldGUgcGF0Y2ggcmVtb3ZlIHRoZXNlIGl0ZW1zLlxuICAgIGlmIChyZW1vdmVzLmxlbmd0aCA9PT0gZGVsZXRlZEl0ZW1zICYmICFpbnNlcnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2hpbGRyZW46IG5ld0NoaWxkcmVuLFxuICAgICAgICAgICAgbW92ZXM6IG51bGxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGNoaWxkcmVuOiBuZXdDaGlsZHJlbixcbiAgICAgICAgbW92ZXM6IHtcbiAgICAgICAgICAgIHJlbW92ZXM6IHJlbW92ZXMsXG4gICAgICAgICAgICBpbnNlcnRzOiBpbnNlcnRzXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZShhcnIsIGluZGV4LCBrZXkpIHtcbiAgICBhcnIuc3BsaWNlKGluZGV4LCAxKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZnJvbTogaW5kZXgsXG4gICAgICAgIGtleToga2V5XG4gICAgfVxufVxuXG5mdW5jdGlvbiBrZXlJbmRleChjaGlsZHJlbikge1xuICAgIHZhciBrZXlzID0ge31cbiAgICB2YXIgZnJlZSA9IFtdXG4gICAgdmFyIGxlbmd0aCA9IGNoaWxkcmVuLmxlbmd0aFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuXG4gICAgICAgIGlmIChjaGlsZC5rZXkpIHtcbiAgICAgICAgICAgIGtleXNbY2hpbGQua2V5XSA9IGlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZyZWUucHVzaChpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAga2V5czoga2V5cywgICAgIC8vIEEgaGFzaCBvZiBrZXkgbmFtZSB0byBpbmRleFxuICAgICAgICBmcmVlOiBmcmVlICAgICAgLy8gQW4gYXJyYXkgb2YgdW5rZXllZCBpdGVtIGluZGljZXNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFBhdGNoKGFwcGx5LCBwYXRjaCkge1xuICAgIGlmIChhcHBseSkge1xuICAgICAgICBpZiAoaXNBcnJheShhcHBseSkpIHtcbiAgICAgICAgICAgIGFwcGx5LnB1c2gocGF0Y2gpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcHBseSA9IFthcHBseSwgcGF0Y2hdXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXBwbHlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcGF0Y2hcbiAgICB9XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS92dHJlZS9kaWZmLmpzXG4gKiogbW9kdWxlIGlkID0gNDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKVxuXG5WaXJ0dWFsUGF0Y2guTk9ORSA9IDBcblZpcnR1YWxQYXRjaC5WVEVYVCA9IDFcblZpcnR1YWxQYXRjaC5WTk9ERSA9IDJcblZpcnR1YWxQYXRjaC5XSURHRVQgPSAzXG5WaXJ0dWFsUGF0Y2guUFJPUFMgPSA0XG5WaXJ0dWFsUGF0Y2guT1JERVIgPSA1XG5WaXJ0dWFsUGF0Y2guSU5TRVJUID0gNlxuVmlydHVhbFBhdGNoLlJFTU9WRSA9IDdcblZpcnR1YWxQYXRjaC5USFVOSyA9IDhcblxubW9kdWxlLmV4cG9ydHMgPSBWaXJ0dWFsUGF0Y2hcblxuZnVuY3Rpb24gVmlydHVhbFBhdGNoKHR5cGUsIHZOb2RlLCBwYXRjaCkge1xuICAgIHRoaXMudHlwZSA9IE51bWJlcih0eXBlKVxuICAgIHRoaXMudk5vZGUgPSB2Tm9kZVxuICAgIHRoaXMucGF0Y2ggPSBwYXRjaFxufVxuXG5WaXJ0dWFsUGF0Y2gucHJvdG90eXBlLnZlcnNpb24gPSB2ZXJzaW9uXG5WaXJ0dWFsUGF0Y2gucHJvdG90eXBlLnR5cGUgPSBcIlZpcnR1YWxQYXRjaFwiXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS92bm9kZS92cGF0Y2guanNcbiAqKiBtb2R1bGUgaWQgPSA0NFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZShcImlzLW9iamVjdFwiKVxudmFyIGlzSG9vayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12aG9va1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpZmZQcm9wc1xuXG5mdW5jdGlvbiBkaWZmUHJvcHMoYSwgYikge1xuICAgIHZhciBkaWZmXG5cbiAgICBmb3IgKHZhciBhS2V5IGluIGEpIHtcbiAgICAgICAgaWYgKCEoYUtleSBpbiBiKSkge1xuICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge31cbiAgICAgICAgICAgIGRpZmZbYUtleV0gPSB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhVmFsdWUgPSBhW2FLZXldXG4gICAgICAgIHZhciBiVmFsdWUgPSBiW2FLZXldXG5cbiAgICAgICAgaWYgKGFWYWx1ZSA9PT0gYlZhbHVlKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KGFWYWx1ZSkgJiYgaXNPYmplY3QoYlZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKGdldFByb3RvdHlwZShiVmFsdWUpICE9PSBnZXRQcm90b3R5cGUoYVZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9XG4gICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IGJWYWx1ZVxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0hvb2soYlZhbHVlKSkge1xuICAgICAgICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fVxuICAgICAgICAgICAgICAgICBkaWZmW2FLZXldID0gYlZhbHVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBvYmplY3REaWZmID0gZGlmZlByb3BzKGFWYWx1ZSwgYlZhbHVlKVxuICAgICAgICAgICAgICAgIGlmIChvYmplY3REaWZmKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9XG4gICAgICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSBvYmplY3REaWZmXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge31cbiAgICAgICAgICAgIGRpZmZbYUtleV0gPSBiVmFsdWVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGJLZXkgaW4gYikge1xuICAgICAgICBpZiAoIShiS2V5IGluIGEpKSB7XG4gICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fVxuICAgICAgICAgICAgZGlmZltiS2V5XSA9IGJbYktleV1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkaWZmXG59XG5cbmZ1bmN0aW9uIGdldFByb3RvdHlwZSh2YWx1ZSkge1xuICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKSB7XG4gICAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSlcbiAgfSBlbHNlIGlmICh2YWx1ZS5fX3Byb3RvX18pIHtcbiAgICByZXR1cm4gdmFsdWUuX19wcm90b19fXG4gIH0gZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlXG4gIH1cbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL3Z0cmVlL2RpZmYtcHJvcHMuanNcbiAqKiBtb2R1bGUgaWQgPSA0NVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIHBhdGNoID0gcmVxdWlyZShcIi4vdmRvbS9wYXRjaC5qc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGNoXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS9wYXRjaC5qc1xuICoqIG1vZHVsZSBpZCA9IDQ2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgZG9jdW1lbnQgPSByZXF1aXJlKFwiZ2xvYmFsL2RvY3VtZW50XCIpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoXCJ4LWlzLWFycmF5XCIpXG5cbnZhciByZW5kZXIgPSByZXF1aXJlKFwiLi9jcmVhdGUtZWxlbWVudFwiKVxudmFyIGRvbUluZGV4ID0gcmVxdWlyZShcIi4vZG9tLWluZGV4XCIpXG52YXIgcGF0Y2hPcCA9IHJlcXVpcmUoXCIuL3BhdGNoLW9wXCIpXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGNoXG5cbmZ1bmN0aW9uIHBhdGNoKHJvb3ROb2RlLCBwYXRjaGVzLCByZW5kZXJPcHRpb25zKSB7XG4gICAgcmVuZGVyT3B0aW9ucyA9IHJlbmRlck9wdGlvbnMgfHwge31cbiAgICByZW5kZXJPcHRpb25zLnBhdGNoID0gcmVuZGVyT3B0aW9ucy5wYXRjaCAmJiByZW5kZXJPcHRpb25zLnBhdGNoICE9PSBwYXRjaFxuICAgICAgICA/IHJlbmRlck9wdGlvbnMucGF0Y2hcbiAgICAgICAgOiBwYXRjaFJlY3Vyc2l2ZVxuICAgIHJlbmRlck9wdGlvbnMucmVuZGVyID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIgfHwgcmVuZGVyXG5cbiAgICByZXR1cm4gcmVuZGVyT3B0aW9ucy5wYXRjaChyb290Tm9kZSwgcGF0Y2hlcywgcmVuZGVyT3B0aW9ucylcbn1cblxuZnVuY3Rpb24gcGF0Y2hSZWN1cnNpdmUocm9vdE5vZGUsIHBhdGNoZXMsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgaW5kaWNlcyA9IHBhdGNoSW5kaWNlcyhwYXRjaGVzKVxuXG4gICAgaWYgKGluZGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiByb290Tm9kZVxuICAgIH1cblxuICAgIHZhciBpbmRleCA9IGRvbUluZGV4KHJvb3ROb2RlLCBwYXRjaGVzLmEsIGluZGljZXMpXG4gICAgdmFyIG93bmVyRG9jdW1lbnQgPSByb290Tm9kZS5vd25lckRvY3VtZW50XG5cbiAgICBpZiAoIXJlbmRlck9wdGlvbnMuZG9jdW1lbnQgJiYgb3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgcmVuZGVyT3B0aW9ucy5kb2N1bWVudCA9IG93bmVyRG9jdW1lbnRcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGVJbmRleCA9IGluZGljZXNbaV1cbiAgICAgICAgcm9vdE5vZGUgPSBhcHBseVBhdGNoKHJvb3ROb2RlLFxuICAgICAgICAgICAgaW5kZXhbbm9kZUluZGV4XSxcbiAgICAgICAgICAgIHBhdGNoZXNbbm9kZUluZGV4XSxcbiAgICAgICAgICAgIHJlbmRlck9wdGlvbnMpXG4gICAgfVxuXG4gICAgcmV0dXJuIHJvb3ROb2RlXG59XG5cbmZ1bmN0aW9uIGFwcGx5UGF0Y2gocm9vdE5vZGUsIGRvbU5vZGUsIHBhdGNoTGlzdCwgcmVuZGVyT3B0aW9ucykge1xuICAgIGlmICghZG9tTm9kZSkge1xuICAgICAgICByZXR1cm4gcm9vdE5vZGVcbiAgICB9XG5cbiAgICB2YXIgbmV3Tm9kZVxuXG4gICAgaWYgKGlzQXJyYXkocGF0Y2hMaXN0KSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGNoTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbmV3Tm9kZSA9IHBhdGNoT3AocGF0Y2hMaXN0W2ldLCBkb21Ob2RlLCByZW5kZXJPcHRpb25zKVxuXG4gICAgICAgICAgICBpZiAoZG9tTm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICByb290Tm9kZSA9IG5ld05vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld05vZGUgPSBwYXRjaE9wKHBhdGNoTGlzdCwgZG9tTm9kZSwgcmVuZGVyT3B0aW9ucylcblxuICAgICAgICBpZiAoZG9tTm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgICAgICAgIHJvb3ROb2RlID0gbmV3Tm9kZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvb3ROb2RlXG59XG5cbmZ1bmN0aW9uIHBhdGNoSW5kaWNlcyhwYXRjaGVzKSB7XG4gICAgdmFyIGluZGljZXMgPSBbXVxuXG4gICAgZm9yICh2YXIga2V5IGluIHBhdGNoZXMpIHtcbiAgICAgICAgaWYgKGtleSAhPT0gXCJhXCIpIHtcbiAgICAgICAgICAgIGluZGljZXMucHVzaChOdW1iZXIoa2V5KSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbmRpY2VzXG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS92ZG9tL3BhdGNoLmpzXG4gKiogbW9kdWxlIGlkID0gNDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIE1hcHMgYSB2aXJ0dWFsIERPTSB0cmVlIG9udG8gYSByZWFsIERPTSB0cmVlIGluIGFuIGVmZmljaWVudCBtYW5uZXIuXG4vLyBXZSBkb24ndCB3YW50IHRvIHJlYWQgYWxsIG9mIHRoZSBET00gbm9kZXMgaW4gdGhlIHRyZWUgc28gd2UgdXNlXG4vLyB0aGUgaW4tb3JkZXIgdHJlZSBpbmRleGluZyB0byBlbGltaW5hdGUgcmVjdXJzaW9uIGRvd24gY2VydGFpbiBicmFuY2hlcy5cbi8vIFdlIG9ubHkgcmVjdXJzZSBpbnRvIGEgRE9NIG5vZGUgaWYgd2Uga25vdyB0aGF0IGl0IGNvbnRhaW5zIGEgY2hpbGQgb2Zcbi8vIGludGVyZXN0LlxuXG52YXIgbm9DaGlsZCA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gZG9tSW5kZXhcblxuZnVuY3Rpb24gZG9tSW5kZXgocm9vdE5vZGUsIHRyZWUsIGluZGljZXMsIG5vZGVzKSB7XG4gICAgaWYgKCFpbmRpY2VzIHx8IGluZGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB7fVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGljZXMuc29ydChhc2NlbmRpbmcpXG4gICAgICAgIHJldHVybiByZWN1cnNlKHJvb3ROb2RlLCB0cmVlLCBpbmRpY2VzLCBub2RlcywgMClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlY3Vyc2Uocm9vdE5vZGUsIHRyZWUsIGluZGljZXMsIG5vZGVzLCByb290SW5kZXgpIHtcbiAgICBub2RlcyA9IG5vZGVzIHx8IHt9XG5cblxuICAgIGlmIChyb290Tm9kZSkge1xuICAgICAgICBpZiAoaW5kZXhJblJhbmdlKGluZGljZXMsIHJvb3RJbmRleCwgcm9vdEluZGV4KSkge1xuICAgICAgICAgICAgbm9kZXNbcm9vdEluZGV4XSA9IHJvb3ROb2RlXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdkNoaWxkcmVuID0gdHJlZS5jaGlsZHJlblxuXG4gICAgICAgIGlmICh2Q2hpbGRyZW4pIHtcblxuICAgICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSByb290Tm9kZS5jaGlsZE5vZGVzXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJlZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHJvb3RJbmRleCArPSAxXG5cbiAgICAgICAgICAgICAgICB2YXIgdkNoaWxkID0gdkNoaWxkcmVuW2ldIHx8IG5vQ2hpbGRcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEluZGV4ID0gcm9vdEluZGV4ICsgKHZDaGlsZC5jb3VudCB8fCAwKVxuXG4gICAgICAgICAgICAgICAgLy8gc2tpcCByZWN1cnNpb24gZG93biB0aGUgdHJlZSBpZiB0aGVyZSBhcmUgbm8gbm9kZXMgZG93biBoZXJlXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4SW5SYW5nZShpbmRpY2VzLCByb290SW5kZXgsIG5leHRJbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzZShjaGlsZE5vZGVzW2ldLCB2Q2hpbGQsIGluZGljZXMsIG5vZGVzLCByb290SW5kZXgpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcm9vdEluZGV4ID0gbmV4dEluZGV4XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZXNcbn1cblxuLy8gQmluYXJ5IHNlYXJjaCBmb3IgYW4gaW5kZXggaW4gdGhlIGludGVydmFsIFtsZWZ0LCByaWdodF1cbmZ1bmN0aW9uIGluZGV4SW5SYW5nZShpbmRpY2VzLCBsZWZ0LCByaWdodCkge1xuICAgIGlmIChpbmRpY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB2YXIgbWluSW5kZXggPSAwXG4gICAgdmFyIG1heEluZGV4ID0gaW5kaWNlcy5sZW5ndGggLSAxXG4gICAgdmFyIGN1cnJlbnRJbmRleFxuICAgIHZhciBjdXJyZW50SXRlbVxuXG4gICAgd2hpbGUgKG1pbkluZGV4IDw9IG1heEluZGV4KSB7XG4gICAgICAgIGN1cnJlbnRJbmRleCA9ICgobWF4SW5kZXggKyBtaW5JbmRleCkgLyAyKSA+PiAwXG4gICAgICAgIGN1cnJlbnRJdGVtID0gaW5kaWNlc1tjdXJyZW50SW5kZXhdXG5cbiAgICAgICAgaWYgKG1pbkluZGV4ID09PSBtYXhJbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRJdGVtID49IGxlZnQgJiYgY3VycmVudEl0ZW0gPD0gcmlnaHRcbiAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SXRlbSA8IGxlZnQpIHtcbiAgICAgICAgICAgIG1pbkluZGV4ID0gY3VycmVudEluZGV4ICsgMVxuICAgICAgICB9IGVsc2UgIGlmIChjdXJyZW50SXRlbSA+IHJpZ2h0KSB7XG4gICAgICAgICAgICBtYXhJbmRleCA9IGN1cnJlbnRJbmRleCAtIDFcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFzY2VuZGluZyhhLCBiKSB7XG4gICAgcmV0dXJuIGEgPiBiID8gMSA6IC0xXG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi92aXJ0dWFsLWRvbS92ZG9tL2RvbS1pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDQ4XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgYXBwbHlQcm9wZXJ0aWVzID0gcmVxdWlyZShcIi4vYXBwbHktcHJvcGVydGllc1wiKVxuXG52YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCIpXG52YXIgVlBhdGNoID0gcmVxdWlyZShcIi4uL3Zub2RlL3ZwYXRjaC5qc1wiKVxuXG52YXIgdXBkYXRlV2lkZ2V0ID0gcmVxdWlyZShcIi4vdXBkYXRlLXdpZGdldFwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFwcGx5UGF0Y2hcblxuZnVuY3Rpb24gYXBwbHlQYXRjaCh2cGF0Y2gsIGRvbU5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgdHlwZSA9IHZwYXRjaC50eXBlXG4gICAgdmFyIHZOb2RlID0gdnBhdGNoLnZOb2RlXG4gICAgdmFyIHBhdGNoID0gdnBhdGNoLnBhdGNoXG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBWUGF0Y2guUkVNT1ZFOlxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZU5vZGUoZG9tTm9kZSwgdk5vZGUpXG4gICAgICAgIGNhc2UgVlBhdGNoLklOU0VSVDpcbiAgICAgICAgICAgIHJldHVybiBpbnNlcnROb2RlKGRvbU5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKVxuICAgICAgICBjYXNlIFZQYXRjaC5WVEVYVDpcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgIGNhc2UgVlBhdGNoLldJREdFVDpcbiAgICAgICAgICAgIHJldHVybiB3aWRnZXRQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgIGNhc2UgVlBhdGNoLlZOT0RFOlxuICAgICAgICAgICAgcmV0dXJuIHZOb2RlUGF0Y2goZG9tTm9kZSwgdk5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKVxuICAgICAgICBjYXNlIFZQYXRjaC5PUkRFUjpcbiAgICAgICAgICAgIHJlb3JkZXJDaGlsZHJlbihkb21Ob2RlLCBwYXRjaClcbiAgICAgICAgICAgIHJldHVybiBkb21Ob2RlXG4gICAgICAgIGNhc2UgVlBhdGNoLlBST1BTOlxuICAgICAgICAgICAgYXBwbHlQcm9wZXJ0aWVzKGRvbU5vZGUsIHBhdGNoLCB2Tm9kZS5wcm9wZXJ0aWVzKVxuICAgICAgICAgICAgcmV0dXJuIGRvbU5vZGVcbiAgICAgICAgY2FzZSBWUGF0Y2guVEhVTks6XG4gICAgICAgICAgICByZXR1cm4gcmVwbGFjZVJvb3QoZG9tTm9kZSxcbiAgICAgICAgICAgICAgICByZW5kZXJPcHRpb25zLnBhdGNoKGRvbU5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKSlcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBkb21Ob2RlXG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVOb2RlKGRvbU5vZGUsIHZOb2RlKSB7XG4gICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGVcblxuICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZG9tTm9kZSlcbiAgICB9XG5cbiAgICBkZXN0cm95V2lkZ2V0KGRvbU5vZGUsIHZOb2RlKTtcblxuICAgIHJldHVybiBudWxsXG59XG5cbmZ1bmN0aW9uIGluc2VydE5vZGUocGFyZW50Tm9kZSwgdk5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHZOb2RlLCByZW5kZXJPcHRpb25zKVxuXG4gICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgcGFyZW50Tm9kZS5hcHBlbmRDaGlsZChuZXdOb2RlKVxuICAgIH1cblxuICAgIHJldHVybiBwYXJlbnROb2RlXG59XG5cbmZ1bmN0aW9uIHN0cmluZ1BhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgdlRleHQsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgbmV3Tm9kZVxuXG4gICAgaWYgKGRvbU5vZGUubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgZG9tTm9kZS5yZXBsYWNlRGF0YSgwLCBkb21Ob2RlLmxlbmd0aCwgdlRleHQudGV4dClcbiAgICAgICAgbmV3Tm9kZSA9IGRvbU5vZGVcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZVxuICAgICAgICBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodlRleHQsIHJlbmRlck9wdGlvbnMpXG5cbiAgICAgICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgZG9tTm9kZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdOb2RlXG59XG5cbmZ1bmN0aW9uIHdpZGdldFBhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgd2lkZ2V0LCByZW5kZXJPcHRpb25zKSB7XG4gICAgdmFyIHVwZGF0aW5nID0gdXBkYXRlV2lkZ2V0KGxlZnRWTm9kZSwgd2lkZ2V0KVxuICAgIHZhciBuZXdOb2RlXG5cbiAgICBpZiAodXBkYXRpbmcpIHtcbiAgICAgICAgbmV3Tm9kZSA9IHdpZGdldC51cGRhdGUobGVmdFZOb2RlLCBkb21Ob2RlKSB8fCBkb21Ob2RlXG4gICAgfSBlbHNlIHtcbiAgICAgICAgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHdpZGdldCwgcmVuZGVyT3B0aW9ucylcbiAgICB9XG5cbiAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZVxuXG4gICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBkb21Ob2RlKVxuICAgIH1cblxuICAgIGlmICghdXBkYXRpbmcpIHtcbiAgICAgICAgZGVzdHJveVdpZGdldChkb21Ob2RlLCBsZWZ0Vk5vZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld05vZGVcbn1cblxuZnVuY3Rpb24gdk5vZGVQYXRjaChkb21Ob2RlLCBsZWZ0Vk5vZGUsIHZOb2RlLCByZW5kZXJPcHRpb25zKSB7XG4gICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGVcbiAgICB2YXIgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHZOb2RlLCByZW5kZXJPcHRpb25zKVxuXG4gICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBkb21Ob2RlKVxuICAgIH1cblxuICAgIHJldHVybiBuZXdOb2RlXG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lXaWRnZXQoZG9tTm9kZSwgdykge1xuICAgIGlmICh0eXBlb2Ygdy5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIgJiYgaXNXaWRnZXQodykpIHtcbiAgICAgICAgdy5kZXN0cm95KGRvbU5vZGUpXG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW9yZGVyQ2hpbGRyZW4oZG9tTm9kZSwgbW92ZXMpIHtcbiAgICB2YXIgY2hpbGROb2RlcyA9IGRvbU5vZGUuY2hpbGROb2Rlc1xuICAgIHZhciBrZXlNYXAgPSB7fVxuICAgIHZhciBub2RlXG4gICAgdmFyIHJlbW92ZVxuICAgIHZhciBpbnNlcnRcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW92ZXMucmVtb3Zlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZW1vdmUgPSBtb3Zlcy5yZW1vdmVzW2ldXG4gICAgICAgIG5vZGUgPSBjaGlsZE5vZGVzW3JlbW92ZS5mcm9tXVxuICAgICAgICBpZiAocmVtb3ZlLmtleSkge1xuICAgICAgICAgICAga2V5TWFwW3JlbW92ZS5rZXldID0gbm9kZVxuICAgICAgICB9XG4gICAgICAgIGRvbU5vZGUucmVtb3ZlQ2hpbGQobm9kZSlcbiAgICB9XG5cbiAgICB2YXIgbGVuZ3RoID0gY2hpbGROb2Rlcy5sZW5ndGhcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1vdmVzLmluc2VydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaW5zZXJ0ID0gbW92ZXMuaW5zZXJ0c1tqXVxuICAgICAgICBub2RlID0ga2V5TWFwW2luc2VydC5rZXldXG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIHdlaXJkZXN0IGJ1ZyBpJ3ZlIGV2ZXIgc2VlbiBpbiB3ZWJraXRcbiAgICAgICAgZG9tTm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgaW5zZXJ0LnRvID49IGxlbmd0aCsrID8gbnVsbCA6IGNoaWxkTm9kZXNbaW5zZXJ0LnRvXSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VSb290KG9sZFJvb3QsIG5ld1Jvb3QpIHtcbiAgICBpZiAob2xkUm9vdCAmJiBuZXdSb290ICYmIG9sZFJvb3QgIT09IG5ld1Jvb3QgJiYgb2xkUm9vdC5wYXJlbnROb2RlKSB7XG4gICAgICAgIG9sZFJvb3QucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Um9vdCwgb2xkUm9vdClcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Um9vdDtcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL3Zkb20vcGF0Y2gtb3AuanNcbiAqKiBtb2R1bGUgaWQgPSA0OVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldC5qc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVwZGF0ZVdpZGdldFxuXG5mdW5jdGlvbiB1cGRhdGVXaWRnZXQoYSwgYikge1xuICAgIGlmIChpc1dpZGdldChhKSAmJiBpc1dpZGdldChiKSkge1xuICAgICAgICBpZiAoXCJuYW1lXCIgaW4gYSAmJiBcIm5hbWVcIiBpbiBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5pZCA9PT0gYi5pZFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGEuaW5pdCA9PT0gYi5pbml0XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3ZpcnR1YWwtZG9tL3Zkb20vdXBkYXRlLXdpZGdldC5qc1xuICoqIG1vZHVsZSBpZCA9IDUwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9