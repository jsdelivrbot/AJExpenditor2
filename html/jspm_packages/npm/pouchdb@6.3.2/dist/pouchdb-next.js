/* */ 
"format cjs";
(function(process) {
  (function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = f();
    } else if (typeof define === "function" && define.amd) {
      define([], f);
    } else {
      var g;
      if (typeof window !== "undefined") {
        g = window;
      } else if (typeof global !== "undefined") {
        g = global;
      } else if (typeof self !== "undefined") {
        g = self;
      } else {
        g = this;
      }
      g.PouchDB = f();
    }
  })(function() {
    var define,
        module,
        exports;
    return (function e(t, n, r) {
      function s(o, u) {
        if (!n[o]) {
          if (!t[o]) {
            var a = typeof require == "function" && require;
            if (!u && a)
              return a(o, !0);
            if (i)
              return i(o, !0);
            var f = new Error("Cannot find module '" + o + "'");
            throw f.code = "MODULE_NOT_FOUND", f;
          }
          var l = n[o] = {exports: {}};
          t[o][0].call(l.exports, function(e) {
            var n = t[o][1][e];
            return s(n ? n : e);
          }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
      }
      var i = typeof require == "function" && require;
      for (var o = 0; o < r.length; o++)
        s(r[o]);
      return s;
    })({
      1: [function(_dereq_, module, exports) {
        'use strict';
        module.exports = argsArray;
        function argsArray(fun) {
          return function() {
            var len = arguments.length;
            if (len) {
              var args = [];
              var i = -1;
              while (++i < len) {
                args[i] = arguments[i];
              }
              return fun.call(this, args);
            } else {
              return fun.call(this, []);
            }
          };
        }
      }, {}],
      2: [function(_dereq_, module, exports) {
        (function(process) {
          exports = module.exports = _dereq_(3);
          exports.log = log;
          exports.formatArgs = formatArgs;
          exports.save = save;
          exports.load = load;
          exports.useColors = useColors;
          exports.storage = 'undefined' != typeof chrome && 'undefined' != typeof chrome.storage ? chrome.storage.local : localstorage();
          exports.colors = ['lightseagreen', 'forestgreen', 'goldenrod', 'dodgerblue', 'darkorchid', 'crimson'];
          function useColors() {
            if (typeof window !== 'undefined' && window && typeof window.process !== 'undefined' && window.process.type === 'renderer') {
              return true;
            }
            return (typeof document !== 'undefined' && document && 'WebkitAppearance' in document.documentElement.style) || (typeof window !== 'undefined' && window && window.console && (console.firebug || (console.exception && console.table))) || (typeof navigator !== 'undefined' && navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) || (typeof navigator !== 'undefined' && navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
          }
          exports.formatters.j = function(v) {
            try {
              return JSON.stringify(v);
            } catch (err) {
              return '[UnexpectedJSONParseError]: ' + err.message;
            }
          };
          function formatArgs(args) {
            var useColors = this.useColors;
            args[0] = (useColors ? '%c' : '') + this.namespace + (useColors ? ' %c' : ' ') + args[0] + (useColors ? '%c ' : ' ') + '+' + exports.humanize(this.diff);
            if (!useColors)
              return;
            var c = 'color: ' + this.color;
            args.splice(1, 0, c, 'color: inherit');
            var index = 0;
            var lastC = 0;
            args[0].replace(/%[a-zA-Z%]/g, function(match) {
              if ('%%' === match)
                return;
              index++;
              if ('%c' === match) {
                lastC = index;
              }
            });
            args.splice(lastC, 0, c);
          }
          function log() {
            return 'object' === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
          }
          function save(namespaces) {
            try {
              if (null == namespaces) {
                exports.storage.removeItem('debug');
              } else {
                exports.storage.debug = namespaces;
              }
            } catch (e) {}
          }
          function load() {
            var r;
            try {
              r = exports.storage.debug;
            } catch (e) {}
            if (!r && typeof process !== 'undefined' && 'env' in process) {
              r = process.env.DEBUG;
            }
            return r;
          }
          exports.enable(load());
          function localstorage() {
            try {
              return window.localStorage;
            } catch (e) {}
          }
        }).call(this, _dereq_(9));
      }, {
        "3": 3,
        "9": 9
      }],
      3: [function(_dereq_, module, exports) {
        exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
        exports.coerce = coerce;
        exports.disable = disable;
        exports.enable = enable;
        exports.enabled = enabled;
        exports.humanize = _dereq_(8);
        exports.names = [];
        exports.skips = [];
        exports.formatters = {};
        var prevTime;
        function selectColor(namespace) {
          var hash = 0,
              i;
          for (i in namespace) {
            hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
            hash |= 0;
          }
          return exports.colors[Math.abs(hash) % exports.colors.length];
        }
        function createDebug(namespace) {
          function debug() {
            if (!debug.enabled)
              return;
            var self = debug;
            var curr = +new Date();
            var ms = curr - (prevTime || curr);
            self.diff = ms;
            self.prev = prevTime;
            self.curr = curr;
            prevTime = curr;
            var args = new Array(arguments.length);
            for (var i = 0; i < args.length; i++) {
              args[i] = arguments[i];
            }
            args[0] = exports.coerce(args[0]);
            if ('string' !== typeof args[0]) {
              args.unshift('%O');
            }
            var index = 0;
            args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
              if (match === '%%')
                return match;
              index++;
              var formatter = exports.formatters[format];
              if ('function' === typeof formatter) {
                var val = args[index];
                match = formatter.call(self, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            exports.formatArgs.call(self, args);
            var logFn = debug.log || exports.log || console.log.bind(console);
            logFn.apply(self, args);
          }
          debug.namespace = namespace;
          debug.enabled = exports.enabled(namespace);
          debug.useColors = exports.useColors();
          debug.color = selectColor(namespace);
          if ('function' === typeof exports.init) {
            exports.init(debug);
          }
          return debug;
        }
        function enable(namespaces) {
          exports.save(namespaces);
          exports.names = [];
          exports.skips = [];
          var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
          var len = split.length;
          for (var i = 0; i < len; i++) {
            if (!split[i])
              continue;
            namespaces = split[i].replace(/\*/g, '.*?');
            if (namespaces[0] === '-') {
              exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
            } else {
              exports.names.push(new RegExp('^' + namespaces + '$'));
            }
          }
        }
        function disable() {
          exports.enable('');
        }
        function enabled(name) {
          var i,
              len;
          for (i = 0, len = exports.skips.length; i < len; i++) {
            if (exports.skips[i].test(name)) {
              return false;
            }
          }
          for (i = 0, len = exports.names.length; i < len; i++) {
            if (exports.names[i].test(name)) {
              return true;
            }
          }
          return false;
        }
        function coerce(val) {
          if (val instanceof Error)
            return val.stack || val.message;
          return val;
        }
      }, {"8": 8}],
      4: [function(_dereq_, module, exports) {
        function EventEmitter() {
          this._events = this._events || {};
          this._maxListeners = this._maxListeners || undefined;
        }
        module.exports = EventEmitter;
        EventEmitter.EventEmitter = EventEmitter;
        EventEmitter.prototype._events = undefined;
        EventEmitter.prototype._maxListeners = undefined;
        EventEmitter.defaultMaxListeners = 10;
        EventEmitter.prototype.setMaxListeners = function(n) {
          if (!isNumber(n) || n < 0 || isNaN(n))
            throw TypeError('n must be a positive number');
          this._maxListeners = n;
          return this;
        };
        EventEmitter.prototype.emit = function(type) {
          var er,
              handler,
              len,
              args,
              i,
              listeners;
          if (!this._events)
            this._events = {};
          if (type === 'error') {
            if (!this._events.error || (isObject(this._events.error) && !this._events.error.length)) {
              er = arguments[1];
              if (er instanceof Error) {
                throw er;
              } else {
                var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
                err.context = er;
                throw err;
              }
            }
          }
          handler = this._events[type];
          if (isUndefined(handler))
            return false;
          if (isFunction(handler)) {
            switch (arguments.length) {
              case 1:
                handler.call(this);
                break;
              case 2:
                handler.call(this, arguments[1]);
                break;
              case 3:
                handler.call(this, arguments[1], arguments[2]);
                break;
              default:
                args = Array.prototype.slice.call(arguments, 1);
                handler.apply(this, args);
            }
          } else if (isObject(handler)) {
            args = Array.prototype.slice.call(arguments, 1);
            listeners = handler.slice();
            len = listeners.length;
            for (i = 0; i < len; i++)
              listeners[i].apply(this, args);
          }
          return true;
        };
        EventEmitter.prototype.addListener = function(type, listener) {
          var m;
          if (!isFunction(listener))
            throw TypeError('listener must be a function');
          if (!this._events)
            this._events = {};
          if (this._events.newListener)
            this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);
          if (!this._events[type])
            this._events[type] = listener;
          else if (isObject(this._events[type]))
            this._events[type].push(listener);
          else
            this._events[type] = [this._events[type], listener];
          if (isObject(this._events[type]) && !this._events[type].warned) {
            if (!isUndefined(this._maxListeners)) {
              m = this._maxListeners;
            } else {
              m = EventEmitter.defaultMaxListeners;
            }
            if (m && m > 0 && this._events[type].length > m) {
              this._events[type].warned = true;
              console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
              if (typeof console.trace === 'function') {
                console.trace();
              }
            }
          }
          return this;
        };
        EventEmitter.prototype.on = EventEmitter.prototype.addListener;
        EventEmitter.prototype.once = function(type, listener) {
          if (!isFunction(listener))
            throw TypeError('listener must be a function');
          var fired = false;
          function g() {
            this.removeListener(type, g);
            if (!fired) {
              fired = true;
              listener.apply(this, arguments);
            }
          }
          g.listener = listener;
          this.on(type, g);
          return this;
        };
        EventEmitter.prototype.removeListener = function(type, listener) {
          var list,
              position,
              length,
              i;
          if (!isFunction(listener))
            throw TypeError('listener must be a function');
          if (!this._events || !this._events[type])
            return this;
          list = this._events[type];
          length = list.length;
          position = -1;
          if (list === listener || (isFunction(list.listener) && list.listener === listener)) {
            delete this._events[type];
            if (this._events.removeListener)
              this.emit('removeListener', type, listener);
          } else if (isObject(list)) {
            for (i = length; i-- > 0; ) {
              if (list[i] === listener || (list[i].listener && list[i].listener === listener)) {
                position = i;
                break;
              }
            }
            if (position < 0)
              return this;
            if (list.length === 1) {
              list.length = 0;
              delete this._events[type];
            } else {
              list.splice(position, 1);
            }
            if (this._events.removeListener)
              this.emit('removeListener', type, listener);
          }
          return this;
        };
        EventEmitter.prototype.removeAllListeners = function(type) {
          var key,
              listeners;
          if (!this._events)
            return this;
          if (!this._events.removeListener) {
            if (arguments.length === 0)
              this._events = {};
            else if (this._events[type])
              delete this._events[type];
            return this;
          }
          if (arguments.length === 0) {
            for (key in this._events) {
              if (key === 'removeListener')
                continue;
              this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = {};
            return this;
          }
          listeners = this._events[type];
          if (isFunction(listeners)) {
            this.removeListener(type, listeners);
          } else if (listeners) {
            while (listeners.length)
              this.removeListener(type, listeners[listeners.length - 1]);
          }
          delete this._events[type];
          return this;
        };
        EventEmitter.prototype.listeners = function(type) {
          var ret;
          if (!this._events || !this._events[type])
            ret = [];
          else if (isFunction(this._events[type]))
            ret = [this._events[type]];
          else
            ret = this._events[type].slice();
          return ret;
        };
        EventEmitter.prototype.listenerCount = function(type) {
          if (this._events) {
            var evlistener = this._events[type];
            if (isFunction(evlistener))
              return 1;
            else if (evlistener)
              return evlistener.length;
          }
          return 0;
        };
        EventEmitter.listenerCount = function(emitter, type) {
          return emitter.listenerCount(type);
        };
        function isFunction(arg) {
          return typeof arg === 'function';
        }
        function isNumber(arg) {
          return typeof arg === 'number';
        }
        function isObject(arg) {
          return typeof arg === 'object' && arg !== null;
        }
        function isUndefined(arg) {
          return arg === void 0;
        }
      }, {}],
      5: [function(_dereq_, module, exports) {
        (function(global) {
          'use strict';
          var Mutation = global.MutationObserver || global.WebKitMutationObserver;
          var scheduleDrain;
          {
            if (Mutation) {
              var called = 0;
              var observer = new Mutation(nextTick);
              var element = global.document.createTextNode('');
              observer.observe(element, {characterData: true});
              scheduleDrain = function() {
                element.data = (called = ++called % 2);
              };
            } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
              var channel = new global.MessageChannel();
              channel.port1.onmessage = nextTick;
              scheduleDrain = function() {
                channel.port2.postMessage(0);
              };
            } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
              scheduleDrain = function() {
                var scriptEl = global.document.createElement('script');
                scriptEl.onreadystatechange = function() {
                  nextTick();
                  scriptEl.onreadystatechange = null;
                  scriptEl.parentNode.removeChild(scriptEl);
                  scriptEl = null;
                };
                global.document.documentElement.appendChild(scriptEl);
              };
            } else {
              scheduleDrain = function() {
                setTimeout(nextTick, 0);
              };
            }
          }
          var draining;
          var queue = [];
          function nextTick() {
            draining = true;
            var i,
                oldQueue;
            var len = queue.length;
            while (len) {
              oldQueue = queue;
              queue = [];
              i = -1;
              while (++i < len) {
                oldQueue[i]();
              }
              len = queue.length;
            }
            draining = false;
          }
          module.exports = immediate;
          function immediate(task) {
            if (queue.push(task) === 1 && !draining) {
              scheduleDrain();
            }
          }
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {}],
      6: [function(_dereq_, module, exports) {
        if (typeof Object.create === 'function') {
          module.exports = function inherits(ctor, superCtor) {
            ctor.super_ = superCtor;
            ctor.prototype = Object.create(superCtor.prototype, {constructor: {
                value: ctor,
                enumerable: false,
                writable: true,
                configurable: true
              }});
          };
        } else {
          module.exports = function inherits(ctor, superCtor) {
            ctor.super_ = superCtor;
            var TempCtor = function() {};
            TempCtor.prototype = superCtor.prototype;
            ctor.prototype = new TempCtor();
            ctor.prototype.constructor = ctor;
          };
        }
      }, {}],
      7: [function(_dereq_, module, exports) {
        'use strict';
        var immediate = _dereq_(5);
        function INTERNAL() {}
        var handlers = {};
        var REJECTED = ['REJECTED'];
        var FULFILLED = ['FULFILLED'];
        var PENDING = ['PENDING'];
        module.exports = Promise;
        function Promise(resolver) {
          if (typeof resolver !== 'function') {
            throw new TypeError('resolver must be a function');
          }
          this.state = PENDING;
          this.queue = [];
          this.outcome = void 0;
          if (resolver !== INTERNAL) {
            safelyResolveThenable(this, resolver);
          }
        }
        Promise.prototype["catch"] = function(onRejected) {
          return this.then(null, onRejected);
        };
        Promise.prototype.then = function(onFulfilled, onRejected) {
          if (typeof onFulfilled !== 'function' && this.state === FULFILLED || typeof onRejected !== 'function' && this.state === REJECTED) {
            return this;
          }
          var promise = new this.constructor(INTERNAL);
          if (this.state !== PENDING) {
            var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
            unwrap(promise, resolver, this.outcome);
          } else {
            this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
          }
          return promise;
        };
        function QueueItem(promise, onFulfilled, onRejected) {
          this.promise = promise;
          if (typeof onFulfilled === 'function') {
            this.onFulfilled = onFulfilled;
            this.callFulfilled = this.otherCallFulfilled;
          }
          if (typeof onRejected === 'function') {
            this.onRejected = onRejected;
            this.callRejected = this.otherCallRejected;
          }
        }
        QueueItem.prototype.callFulfilled = function(value) {
          handlers.resolve(this.promise, value);
        };
        QueueItem.prototype.otherCallFulfilled = function(value) {
          unwrap(this.promise, this.onFulfilled, value);
        };
        QueueItem.prototype.callRejected = function(value) {
          handlers.reject(this.promise, value);
        };
        QueueItem.prototype.otherCallRejected = function(value) {
          unwrap(this.promise, this.onRejected, value);
        };
        function unwrap(promise, func, value) {
          immediate(function() {
            var returnValue;
            try {
              returnValue = func(value);
            } catch (e) {
              return handlers.reject(promise, e);
            }
            if (returnValue === promise) {
              handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
            } else {
              handlers.resolve(promise, returnValue);
            }
          });
        }
        handlers.resolve = function(self, value) {
          var result = tryCatch(getThen, value);
          if (result.status === 'error') {
            return handlers.reject(self, result.value);
          }
          var thenable = result.value;
          if (thenable) {
            safelyResolveThenable(self, thenable);
          } else {
            self.state = FULFILLED;
            self.outcome = value;
            var i = -1;
            var len = self.queue.length;
            while (++i < len) {
              self.queue[i].callFulfilled(value);
            }
          }
          return self;
        };
        handlers.reject = function(self, error) {
          self.state = REJECTED;
          self.outcome = error;
          var i = -1;
          var len = self.queue.length;
          while (++i < len) {
            self.queue[i].callRejected(error);
          }
          return self;
        };
        function getThen(obj) {
          var then = obj && obj.then;
          if (obj && (typeof obj === 'object' || typeof obj === 'function') && typeof then === 'function') {
            return function appyThen() {
              then.apply(obj, arguments);
            };
          }
        }
        function safelyResolveThenable(self, thenable) {
          var called = false;
          function onError(value) {
            if (called) {
              return;
            }
            called = true;
            handlers.reject(self, value);
          }
          function onSuccess(value) {
            if (called) {
              return;
            }
            called = true;
            handlers.resolve(self, value);
          }
          function tryToUnwrap() {
            thenable(onSuccess, onError);
          }
          var result = tryCatch(tryToUnwrap);
          if (result.status === 'error') {
            onError(result.value);
          }
        }
        function tryCatch(func, value) {
          var out = {};
          try {
            out.value = func(value);
            out.status = 'success';
          } catch (e) {
            out.status = 'error';
            out.value = e;
          }
          return out;
        }
        Promise.resolve = resolve;
        function resolve(value) {
          if (value instanceof this) {
            return value;
          }
          return handlers.resolve(new this(INTERNAL), value);
        }
        Promise.reject = reject;
        function reject(reason) {
          var promise = new this(INTERNAL);
          return handlers.reject(promise, reason);
        }
        Promise.all = all;
        function all(iterable) {
          var self = this;
          if (Object.prototype.toString.call(iterable) !== '[object Array]') {
            return this.reject(new TypeError('must be an array'));
          }
          var len = iterable.length;
          var called = false;
          if (!len) {
            return this.resolve([]);
          }
          var values = new Array(len);
          var resolved = 0;
          var i = -1;
          var promise = new this(INTERNAL);
          while (++i < len) {
            allResolver(iterable[i], i);
          }
          return promise;
          function allResolver(value, i) {
            self.resolve(value).then(resolveFromAll, function(error) {
              if (!called) {
                called = true;
                handlers.reject(promise, error);
              }
            });
            function resolveFromAll(outValue) {
              values[i] = outValue;
              if (++resolved === len && !called) {
                called = true;
                handlers.resolve(promise, values);
              }
            }
          }
        }
        Promise.race = race;
        function race(iterable) {
          var self = this;
          if (Object.prototype.toString.call(iterable) !== '[object Array]') {
            return this.reject(new TypeError('must be an array'));
          }
          var len = iterable.length;
          var called = false;
          if (!len) {
            return this.resolve([]);
          }
          var i = -1;
          var promise = new this(INTERNAL);
          while (++i < len) {
            resolver(iterable[i]);
          }
          return promise;
          function resolver(value) {
            self.resolve(value).then(function(response) {
              if (!called) {
                called = true;
                handlers.resolve(promise, response);
              }
            }, function(error) {
              if (!called) {
                called = true;
                handlers.reject(promise, error);
              }
            });
          }
        }
      }, {"5": 5}],
      8: [function(_dereq_, module, exports) {
        var s = 1000;
        var m = s * 60;
        var h = m * 60;
        var d = h * 24;
        var y = d * 365.25;
        module.exports = function(val, options) {
          options = options || {};
          var type = typeof val;
          if (type === 'string' && val.length > 0) {
            return parse(val);
          } else if (type === 'number' && isNaN(val) === false) {
            return options.long ? fmtLong(val) : fmtShort(val);
          }
          throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
        };
        function parse(str) {
          str = String(str);
          if (str.length > 10000) {
            return;
          }
          var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
          if (!match) {
            return;
          }
          var n = parseFloat(match[1]);
          var type = (match[2] || 'ms').toLowerCase();
          switch (type) {
            case 'years':
            case 'year':
            case 'yrs':
            case 'yr':
            case 'y':
              return n * y;
            case 'days':
            case 'day':
            case 'd':
              return n * d;
            case 'hours':
            case 'hour':
            case 'hrs':
            case 'hr':
            case 'h':
              return n * h;
            case 'minutes':
            case 'minute':
            case 'mins':
            case 'min':
            case 'm':
              return n * m;
            case 'seconds':
            case 'second':
            case 'secs':
            case 'sec':
            case 's':
              return n * s;
            case 'milliseconds':
            case 'millisecond':
            case 'msecs':
            case 'msec':
            case 'ms':
              return n;
            default:
              return undefined;
          }
        }
        function fmtShort(ms) {
          if (ms >= d) {
            return Math.round(ms / d) + 'd';
          }
          if (ms >= h) {
            return Math.round(ms / h) + 'h';
          }
          if (ms >= m) {
            return Math.round(ms / m) + 'm';
          }
          if (ms >= s) {
            return Math.round(ms / s) + 's';
          }
          return ms + 'ms';
        }
        function fmtLong(ms) {
          return plural(ms, d, 'day') || plural(ms, h, 'hour') || plural(ms, m, 'minute') || plural(ms, s, 'second') || ms + ' ms';
        }
        function plural(ms, n, name) {
          if (ms < n) {
            return;
          }
          if (ms < n * 1.5) {
            return Math.floor(ms / n) + ' ' + name;
          }
          return Math.ceil(ms / n) + ' ' + name + 's';
        }
      }, {}],
      9: [function(_dereq_, module, exports) {
        var process = module.exports = {};
        var cachedSetTimeout;
        var cachedClearTimeout;
        function defaultSetTimout() {
          throw new Error('setTimeout has not been defined');
        }
        function defaultClearTimeout() {
          throw new Error('clearTimeout has not been defined');
        }
        (function() {
          try {
            if (typeof setTimeout === 'function') {
              cachedSetTimeout = setTimeout;
            } else {
              cachedSetTimeout = defaultSetTimout;
            }
          } catch (e) {
            cachedSetTimeout = defaultSetTimout;
          }
          try {
            if (typeof clearTimeout === 'function') {
              cachedClearTimeout = clearTimeout;
            } else {
              cachedClearTimeout = defaultClearTimeout;
            }
          } catch (e) {
            cachedClearTimeout = defaultClearTimeout;
          }
        }());
        function runTimeout(fun) {
          if (cachedSetTimeout === setTimeout) {
            return setTimeout(fun, 0);
          }
          if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
          }
          try {
            return cachedSetTimeout(fun, 0);
          } catch (e) {
            try {
              return cachedSetTimeout.call(null, fun, 0);
            } catch (e) {
              return cachedSetTimeout.call(this, fun, 0);
            }
          }
        }
        function runClearTimeout(marker) {
          if (cachedClearTimeout === clearTimeout) {
            return clearTimeout(marker);
          }
          if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
          }
          try {
            return cachedClearTimeout(marker);
          } catch (e) {
            try {
              return cachedClearTimeout.call(null, marker);
            } catch (e) {
              return cachedClearTimeout.call(this, marker);
            }
          }
        }
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;
        function cleanUpNextTick() {
          if (!draining || !currentQueue) {
            return;
          }
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
          var timeout = runTimeout(cleanUpNextTick);
          draining = true;
          var len = queue.length;
          while (len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
              if (currentQueue) {
                currentQueue[queueIndex].run();
              }
            }
            queueIndex = -1;
            len = queue.length;
          }
          currentQueue = null;
          draining = false;
          runClearTimeout(timeout);
        }
        process.nextTick = function(fun) {
          var args = new Array(arguments.length - 1);
          if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
            }
          }
          queue.push(new Item(fun, args));
          if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
          }
        };
        function Item(fun, array) {
          this.fun = fun;
          this.array = array;
        }
        Item.prototype.run = function() {
          this.fun.apply(null, this.array);
        };
        process.title = 'browser';
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = '';
        process.versions = {};
        function noop() {}
        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;
        process.prependListener = noop;
        process.prependOnceListener = noop;
        process.listeners = function(name) {
          return [];
        };
        process.binding = function(name) {
          throw new Error('process.binding is not supported');
        };
        process.cwd = function() {
          return '/';
        };
        process.chdir = function(dir) {
          throw new Error('process.chdir is not supported');
        };
        process.umask = function() {
          return 0;
        };
      }, {}],
      10: [function(_dereq_, module, exports) {
        (function(factory) {
          if (typeof exports === 'object') {
            module.exports = factory();
          } else if (typeof define === 'function' && define.amd) {
            define(factory);
          } else {
            var glob;
            try {
              glob = window;
            } catch (e) {
              glob = self;
            }
            glob.SparkMD5 = factory();
          }
        }(function(undefined) {
          'use strict';
          var add32 = function(a, b) {
            return (a + b) & 0xFFFFFFFF;
          },
              hex_chr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
          function cmn(q, a, b, x, s, t) {
            a = add32(add32(a, q), add32(x, t));
            return add32((a << s) | (a >>> (32 - s)), b);
          }
          function md5cycle(x, k) {
            var a = x[0],
                b = x[1],
                c = x[2],
                d = x[3];
            a += (b & c | ~b & d) + k[0] - 680876936 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[1] - 389564586 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[2] + 606105819 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & c | ~b & d) + k[4] - 176418897 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[5] + 1200080426 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[6] - 1473231341 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[7] - 45705983 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & c | ~b & d) + k[8] + 1770035416 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[9] - 1958414417 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[10] - 42063 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[11] - 1990404162 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & c | ~b & d) + k[12] + 1804603682 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[13] - 40341101 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[14] - 1502002290 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[15] + 1236535329 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & d | c & ~d) + k[1] - 165796510 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[6] - 1069501632 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[11] + 643717713 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[0] - 373897302 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b & d | c & ~d) + k[5] - 701558691 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[10] + 38016083 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[15] - 660478335 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[4] - 405537848 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b & d | c & ~d) + k[9] + 568446438 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[14] - 1019803690 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[3] - 187363961 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[8] + 1163531501 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b & d | c & ~d) + k[13] - 1444681467 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[2] - 51403784 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[7] + 1735328473 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[12] - 1926607734 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b ^ c ^ d) + k[5] - 378558 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[8] - 2022574463 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[11] + 1839030562 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[14] - 35309556 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (b ^ c ^ d) + k[1] - 1530992060 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[4] + 1272893353 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[7] - 155497632 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[10] - 1094730640 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (b ^ c ^ d) + k[13] + 681279174 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[0] - 358537222 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[3] - 722521979 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[6] + 76029189 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (b ^ c ^ d) + k[9] - 640364487 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[12] - 421815835 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[15] + 530742520 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[2] - 995338651 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (c ^ (b | ~d)) + k[0] - 198630844 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[5] - 57434055 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[10] - 1051523 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[15] - 30611744 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            a += (c ^ (b | ~d)) + k[4] - 145523070 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[2] + 718787259 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[9] - 343485551 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            x[0] = a + x[0] | 0;
            x[1] = b + x[1] | 0;
            x[2] = c + x[2] | 0;
            x[3] = d + x[3] | 0;
          }
          function md5blk(s) {
            var md5blks = [],
                i;
            for (i = 0; i < 64; i += 4) {
              md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
            }
            return md5blks;
          }
          function md5blk_array(a) {
            var md5blks = [],
                i;
            for (i = 0; i < 64; i += 4) {
              md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
            }
            return md5blks;
          }
          function md51(s) {
            var n = s.length,
                state = [1732584193, -271733879, -1732584194, 271733878],
                i,
                length,
                tail,
                tmp,
                lo,
                hi;
            for (i = 64; i <= n; i += 64) {
              md5cycle(state, md5blk(s.substring(i - 64, i)));
            }
            s = s.substring(i - 64);
            length = s.length;
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i = 0; i < length; i += 1) {
              tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
            }
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) {
              md5cycle(state, tail);
              for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
              }
            }
            tmp = n * 8;
            tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
            lo = parseInt(tmp[2], 16);
            hi = parseInt(tmp[1], 16) || 0;
            tail[14] = lo;
            tail[15] = hi;
            md5cycle(state, tail);
            return state;
          }
          function md51_array(a) {
            var n = a.length,
                state = [1732584193, -271733879, -1732584194, 271733878],
                i,
                length,
                tail,
                tmp,
                lo,
                hi;
            for (i = 64; i <= n; i += 64) {
              md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
            }
            a = (i - 64) < n ? a.subarray(i - 64) : new Uint8Array(0);
            length = a.length;
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i = 0; i < length; i += 1) {
              tail[i >> 2] |= a[i] << ((i % 4) << 3);
            }
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) {
              md5cycle(state, tail);
              for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
              }
            }
            tmp = n * 8;
            tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
            lo = parseInt(tmp[2], 16);
            hi = parseInt(tmp[1], 16) || 0;
            tail[14] = lo;
            tail[15] = hi;
            md5cycle(state, tail);
            return state;
          }
          function rhex(n) {
            var s = '',
                j;
            for (j = 0; j < 4; j += 1) {
              s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
            }
            return s;
          }
          function hex(x) {
            var i;
            for (i = 0; i < x.length; i += 1) {
              x[i] = rhex(x[i]);
            }
            return x.join('');
          }
          if (hex(md51('hello')) !== '5d41402abc4b2a76b9719d911017c592') {
            add32 = function(x, y) {
              var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                  msw = (x >> 16) + (y >> 16) + (lsw >> 16);
              return (msw << 16) | (lsw & 0xFFFF);
            };
          }
          if (typeof ArrayBuffer !== 'undefined' && !ArrayBuffer.prototype.slice) {
            (function() {
              function clamp(val, length) {
                val = (val | 0) || 0;
                if (val < 0) {
                  return Math.max(val + length, 0);
                }
                return Math.min(val, length);
              }
              ArrayBuffer.prototype.slice = function(from, to) {
                var length = this.byteLength,
                    begin = clamp(from, length),
                    end = length,
                    num,
                    target,
                    targetArray,
                    sourceArray;
                if (to !== undefined) {
                  end = clamp(to, length);
                }
                if (begin > end) {
                  return new ArrayBuffer(0);
                }
                num = end - begin;
                target = new ArrayBuffer(num);
                targetArray = new Uint8Array(target);
                sourceArray = new Uint8Array(this, begin, num);
                targetArray.set(sourceArray);
                return target;
              };
            })();
          }
          function toUtf8(str) {
            if (/[\u0080-\uFFFF]/.test(str)) {
              str = unescape(encodeURIComponent(str));
            }
            return str;
          }
          function utf8Str2ArrayBuffer(str, returnUInt8Array) {
            var length = str.length,
                buff = new ArrayBuffer(length),
                arr = new Uint8Array(buff),
                i;
            for (i = 0; i < length; i += 1) {
              arr[i] = str.charCodeAt(i);
            }
            return returnUInt8Array ? arr : buff;
          }
          function arrayBuffer2Utf8Str(buff) {
            return String.fromCharCode.apply(null, new Uint8Array(buff));
          }
          function concatenateArrayBuffers(first, second, returnUInt8Array) {
            var result = new Uint8Array(first.byteLength + second.byteLength);
            result.set(new Uint8Array(first));
            result.set(new Uint8Array(second), first.byteLength);
            return returnUInt8Array ? result : result.buffer;
          }
          function hexToBinaryString(hex) {
            var bytes = [],
                length = hex.length,
                x;
            for (x = 0; x < length - 1; x += 2) {
              bytes.push(parseInt(hex.substr(x, 2), 16));
            }
            return String.fromCharCode.apply(String, bytes);
          }
          function SparkMD5() {
            this.reset();
          }
          SparkMD5.prototype.append = function(str) {
            this.appendBinary(toUtf8(str));
            return this;
          };
          SparkMD5.prototype.appendBinary = function(contents) {
            this._buff += contents;
            this._length += contents.length;
            var length = this._buff.length,
                i;
            for (i = 64; i <= length; i += 64) {
              md5cycle(this._hash, md5blk(this._buff.substring(i - 64, i)));
            }
            this._buff = this._buff.substring(i - 64);
            return this;
          };
          SparkMD5.prototype.end = function(raw) {
            var buff = this._buff,
                length = buff.length,
                i,
                tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                ret;
            for (i = 0; i < length; i += 1) {
              tail[i >> 2] |= buff.charCodeAt(i) << ((i % 4) << 3);
            }
            this._finish(tail, length);
            ret = hex(this._hash);
            if (raw) {
              ret = hexToBinaryString(ret);
            }
            this.reset();
            return ret;
          };
          SparkMD5.prototype.reset = function() {
            this._buff = '';
            this._length = 0;
            this._hash = [1732584193, -271733879, -1732584194, 271733878];
            return this;
          };
          SparkMD5.prototype.getState = function() {
            return {
              buff: this._buff,
              length: this._length,
              hash: this._hash
            };
          };
          SparkMD5.prototype.setState = function(state) {
            this._buff = state.buff;
            this._length = state.length;
            this._hash = state.hash;
            return this;
          };
          SparkMD5.prototype.destroy = function() {
            delete this._hash;
            delete this._buff;
            delete this._length;
          };
          SparkMD5.prototype._finish = function(tail, length) {
            var i = length,
                tmp,
                lo,
                hi;
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) {
              md5cycle(this._hash, tail);
              for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
              }
            }
            tmp = this._length * 8;
            tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
            lo = parseInt(tmp[2], 16);
            hi = parseInt(tmp[1], 16) || 0;
            tail[14] = lo;
            tail[15] = hi;
            md5cycle(this._hash, tail);
          };
          SparkMD5.hash = function(str, raw) {
            return SparkMD5.hashBinary(toUtf8(str), raw);
          };
          SparkMD5.hashBinary = function(content, raw) {
            var hash = md51(content),
                ret = hex(hash);
            return raw ? hexToBinaryString(ret) : ret;
          };
          SparkMD5.ArrayBuffer = function() {
            this.reset();
          };
          SparkMD5.ArrayBuffer.prototype.append = function(arr) {
            var buff = concatenateArrayBuffers(this._buff.buffer, arr, true),
                length = buff.length,
                i;
            this._length += arr.byteLength;
            for (i = 64; i <= length; i += 64) {
              md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
            }
            this._buff = (i - 64) < length ? new Uint8Array(buff.buffer.slice(i - 64)) : new Uint8Array(0);
            return this;
          };
          SparkMD5.ArrayBuffer.prototype.end = function(raw) {
            var buff = this._buff,
                length = buff.length,
                tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                i,
                ret;
            for (i = 0; i < length; i += 1) {
              tail[i >> 2] |= buff[i] << ((i % 4) << 3);
            }
            this._finish(tail, length);
            ret = hex(this._hash);
            if (raw) {
              ret = hexToBinaryString(ret);
            }
            this.reset();
            return ret;
          };
          SparkMD5.ArrayBuffer.prototype.reset = function() {
            this._buff = new Uint8Array(0);
            this._length = 0;
            this._hash = [1732584193, -271733879, -1732584194, 271733878];
            return this;
          };
          SparkMD5.ArrayBuffer.prototype.getState = function() {
            var state = SparkMD5.prototype.getState.call(this);
            state.buff = arrayBuffer2Utf8Str(state.buff);
            return state;
          };
          SparkMD5.ArrayBuffer.prototype.setState = function(state) {
            state.buff = utf8Str2ArrayBuffer(state.buff, true);
            return SparkMD5.prototype.setState.call(this, state);
          };
          SparkMD5.ArrayBuffer.prototype.destroy = SparkMD5.prototype.destroy;
          SparkMD5.ArrayBuffer.prototype._finish = SparkMD5.prototype._finish;
          SparkMD5.ArrayBuffer.hash = function(arr, raw) {
            var hash = md51_array(new Uint8Array(arr)),
                ret = hex(hash);
            return raw ? hexToBinaryString(ret) : ret;
          };
          return SparkMD5;
        }));
      }, {}],
      11: [function(_dereq_, module, exports) {
        var byteToHex = [];
        for (var i = 0; i < 256; ++i) {
          byteToHex[i] = (i + 0x100).toString(16).substr(1);
        }
        function bytesToUuid(buf, offset) {
          var i = offset || 0;
          var bth = byteToHex;
          return bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]];
        }
        module.exports = bytesToUuid;
      }, {}],
      12: [function(_dereq_, module, exports) {
        (function(global) {
          var rng;
          var crypto = global.crypto || global.msCrypto;
          if (crypto && crypto.getRandomValues) {
            var rnds8 = new Uint8Array(16);
            rng = function whatwgRNG() {
              crypto.getRandomValues(rnds8);
              return rnds8;
            };
          }
          if (!rng) {
            var rnds = new Array(16);
            rng = function() {
              for (var i = 0,
                  r; i < 16; i++) {
                if ((i & 0x03) === 0)
                  r = Math.random() * 0x100000000;
                rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
              }
              return rnds;
            };
          }
          module.exports = rng;
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {}],
      13: [function(_dereq_, module, exports) {
        var rng = _dereq_(12);
        var bytesToUuid = _dereq_(11);
        function v4(options, buf, offset) {
          var i = buf && offset || 0;
          if (typeof(options) == 'string') {
            buf = options == 'binary' ? new Array(16) : null;
            options = null;
          }
          options = options || {};
          var rnds = options.random || (options.rng || rng)();
          rnds[6] = (rnds[6] & 0x0f) | 0x40;
          rnds[8] = (rnds[8] & 0x3f) | 0x80;
          if (buf) {
            for (var ii = 0; ii < 16; ++ii) {
              buf[i + ii] = rnds[ii];
            }
          }
          return buf || bytesToUuid(rnds);
        }
        module.exports = v4;
      }, {
        "11": 11,
        "12": 12
      }],
      14: [function(_dereq_, module, exports) {
        (function(global) {
          'use strict';
          function _interopDefault(ex) {
            return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex;
          }
          var lie = _interopDefault(_dereq_(7));
          var getArguments = _interopDefault(_dereq_(1));
          var events = _dereq_(4);
          var inherits = _interopDefault(_dereq_(6));
          var nextTick = _interopDefault(_dereq_(5));
          var v4 = _interopDefault(_dereq_(13));
          var debug = _interopDefault(_dereq_(2));
          var Md5 = _interopDefault(_dereq_(10));
          var PouchPromise = typeof Promise === 'function' ? Promise : lie;
          function isBinaryObject(object) {
            return (typeof ArrayBuffer !== 'undefined' && object instanceof ArrayBuffer) || (typeof Blob !== 'undefined' && object instanceof Blob);
          }
          function cloneArrayBuffer(buff) {
            if (typeof buff.slice === 'function') {
              return buff.slice(0);
            }
            var target = new ArrayBuffer(buff.byteLength);
            var targetArray = new Uint8Array(target);
            var sourceArray = new Uint8Array(buff);
            targetArray.set(sourceArray);
            return target;
          }
          function cloneBinaryObject(object) {
            if (object instanceof ArrayBuffer) {
              return cloneArrayBuffer(object);
            }
            var size = object.size;
            var type = object.type;
            if (typeof object.slice === 'function') {
              return object.slice(0, size, type);
            }
            return object.webkitSlice(0, size, type);
          }
          var funcToString = Function.prototype.toString;
          var objectCtorString = funcToString.call(Object);
          function isPlainObject(value) {
            var proto = Object.getPrototypeOf(value);
            if (proto === null) {
              return true;
            }
            var Ctor = proto.constructor;
            return (typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
          }
          function clone(object) {
            var newObject;
            var i;
            var len;
            if (!object || typeof object !== 'object') {
              return object;
            }
            if (Array.isArray(object)) {
              newObject = [];
              for (i = 0, len = object.length; i < len; i++) {
                newObject[i] = clone(object[i]);
              }
              return newObject;
            }
            if (object instanceof Date) {
              return object.toISOString();
            }
            if (isBinaryObject(object)) {
              return cloneBinaryObject(object);
            }
            if (!isPlainObject(object)) {
              return object;
            }
            newObject = {};
            for (i in object) {
              if (Object.prototype.hasOwnProperty.call(object, i)) {
                var value = clone(object[i]);
                if (typeof value !== 'undefined') {
                  newObject[i] = value;
                }
              }
            }
            return newObject;
          }
          function once(fun) {
            var called = false;
            return getArguments(function(args) {
              if (called) {
                throw new Error('once called more than once');
              } else {
                called = true;
                fun.apply(this, args);
              }
            });
          }
          function toPromise(func) {
            return getArguments(function(args) {
              args = clone(args);
              var self = this;
              var usedCB = (typeof args[args.length - 1] === 'function') ? args.pop() : false;
              var promise = new PouchPromise(function(fulfill, reject) {
                var resp;
                try {
                  var callback = once(function(err, mesg) {
                    if (err) {
                      reject(err);
                    } else {
                      fulfill(mesg);
                    }
                  });
                  args.push(callback);
                  resp = func.apply(self, args);
                  if (resp && typeof resp.then === 'function') {
                    fulfill(resp);
                  }
                } catch (e) {
                  reject(e);
                }
              });
              if (usedCB) {
                promise.then(function(result) {
                  usedCB(null, result);
                }, usedCB);
              }
              return promise;
            });
          }
          function logApiCall(self, name, args) {
            if (self.constructor.listeners('debug').length) {
              var logArgs = ['api', self.name, name];
              for (var i = 0; i < args.length - 1; i++) {
                logArgs.push(args[i]);
              }
              self.constructor.emit('debug', logArgs);
              var origCallback = args[args.length - 1];
              args[args.length - 1] = function(err, res) {
                var responseArgs = ['api', self.name, name];
                responseArgs = responseArgs.concat(err ? ['error', err] : ['success', res]);
                self.constructor.emit('debug', responseArgs);
                origCallback(err, res);
              };
            }
          }
          function adapterFun(name, callback) {
            return toPromise(getArguments(function(args) {
              if (this._closed) {
                return PouchPromise.reject(new Error('database is closed'));
              }
              if (this._destroyed) {
                return PouchPromise.reject(new Error('database is destroyed'));
              }
              var self = this;
              logApiCall(self, name, args);
              if (!this.taskqueue.isReady) {
                return new PouchPromise(function(fulfill, reject) {
                  self.taskqueue.addTask(function(failed) {
                    if (failed) {
                      reject(failed);
                    } else {
                      fulfill(self[name].apply(self, args));
                    }
                  });
                });
              }
              return callback.apply(this, args);
            }));
          }
          function mangle(key) {
            return '$' + key;
          }
          function unmangle(key) {
            return key.substring(1);
          }
          function Map$1() {
            this._store = {};
          }
          Map$1.prototype.get = function(key) {
            var mangled = mangle(key);
            return this._store[mangled];
          };
          Map$1.prototype.set = function(key, value) {
            var mangled = mangle(key);
            this._store[mangled] = value;
            return true;
          };
          Map$1.prototype.has = function(key) {
            var mangled = mangle(key);
            return mangled in this._store;
          };
          Map$1.prototype["delete"] = function(key) {
            var mangled = mangle(key);
            var res = mangled in this._store;
            delete this._store[mangled];
            return res;
          };
          Map$1.prototype.forEach = function(cb) {
            var keys = Object.keys(this._store);
            for (var i = 0,
                len = keys.length; i < len; i++) {
              var key = keys[i];
              var value = this._store[key];
              key = unmangle(key);
              cb(value, key);
            }
          };
          Object.defineProperty(Map$1.prototype, 'size', {get: function() {
              return Object.keys(this._store).length;
            }});
          function Set$1(array) {
            this._store = new Map$1();
            if (array && Array.isArray(array)) {
              for (var i = 0,
                  len = array.length; i < len; i++) {
                this.add(array[i]);
              }
            }
          }
          Set$1.prototype.add = function(key) {
            return this._store.set(key, true);
          };
          Set$1.prototype.has = function(key) {
            return this._store.has(key);
          };
          Set$1.prototype.forEach = function(cb) {
            this._store.forEach(function(value, key) {
              cb(key);
            });
          };
          Object.defineProperty(Set$1.prototype, 'size', {get: function() {
              return this._store.size;
            }});
          function supportsMapAndSet() {
            if (typeof Symbol === 'undefined' || typeof Map === 'undefined' || typeof Set === 'undefined') {
              return false;
            }
            var prop = Object.getOwnPropertyDescriptor(Map, Symbol.species);
            return prop && 'get' in prop && Map[Symbol.species] === Map;
          }
          var ExportedSet;
          var ExportedMap;
          {
            if (supportsMapAndSet()) {
              ExportedSet = Set;
              ExportedMap = Map;
            } else {
              ExportedSet = Set$1;
              ExportedMap = Map$1;
            }
          }
          function pick(obj, arr) {
            var res = {};
            for (var i = 0,
                len = arr.length; i < len; i++) {
              var prop = arr[i];
              if (prop in obj) {
                res[prop] = obj[prop];
              }
            }
            return res;
          }
          var MAX_NUM_CONCURRENT_REQUESTS = 6;
          function identityFunction(x) {
            return x;
          }
          function formatResultForOpenRevsGet(result) {
            return [{ok: result}];
          }
          function bulkGet(db, opts, callback) {
            var requests = opts.docs;
            var requestsById = new ExportedMap();
            requests.forEach(function(request) {
              if (requestsById.has(request.id)) {
                requestsById.get(request.id).push(request);
              } else {
                requestsById.set(request.id, [request]);
              }
            });
            var numDocs = requestsById.size;
            var numDone = 0;
            var perDocResults = new Array(numDocs);
            function collapseResultsAndFinish() {
              var results = [];
              perDocResults.forEach(function(res) {
                res.docs.forEach(function(info) {
                  results.push({
                    id: res.id,
                    docs: [info]
                  });
                });
              });
              callback(null, {results: results});
            }
            function checkDone() {
              if (++numDone === numDocs) {
                collapseResultsAndFinish();
              }
            }
            function gotResult(docIndex, id, docs) {
              perDocResults[docIndex] = {
                id: id,
                docs: docs
              };
              checkDone();
            }
            var allRequests = [];
            requestsById.forEach(function(value, key) {
              allRequests.push(key);
            });
            var i = 0;
            function nextBatch() {
              if (i >= allRequests.length) {
                return;
              }
              var upTo = Math.min(i + MAX_NUM_CONCURRENT_REQUESTS, allRequests.length);
              var batch = allRequests.slice(i, upTo);
              processBatch(batch, i);
              i += batch.length;
            }
            function processBatch(batch, offset) {
              batch.forEach(function(docId, j) {
                var docIdx = offset + j;
                var docRequests = requestsById.get(docId);
                var docOpts = pick(docRequests[0], ['atts_since', 'attachments']);
                docOpts.open_revs = docRequests.map(function(request) {
                  return request.rev;
                });
                docOpts.open_revs = docOpts.open_revs.filter(identityFunction);
                var formatResult = identityFunction;
                if (docOpts.open_revs.length === 0) {
                  delete docOpts.open_revs;
                  formatResult = formatResultForOpenRevsGet;
                }
                ['revs', 'attachments', 'binary', 'ajax', 'latest'].forEach(function(param) {
                  if (param in opts) {
                    docOpts[param] = opts[param];
                  }
                });
                db.get(docId, docOpts, function(err, res) {
                  var result;
                  if (err) {
                    result = [{error: err}];
                  } else {
                    result = formatResult(res);
                  }
                  gotResult(docIdx, docId, result);
                  nextBatch();
                });
              });
            }
            nextBatch();
          }
          function isChromeApp() {
            return (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined" && typeof chrome.storage.local !== "undefined");
          }
          var hasLocal;
          if (isChromeApp()) {
            hasLocal = false;
          } else {
            try {
              localStorage.setItem('_pouch_check_localstorage', 1);
              hasLocal = !!localStorage.getItem('_pouch_check_localstorage');
            } catch (e) {
              hasLocal = false;
            }
          }
          function hasLocalStorage() {
            return hasLocal;
          }
          inherits(Changes$1, events.EventEmitter);
          function attachBrowserEvents(self) {
            if (isChromeApp()) {
              chrome.storage.onChanged.addListener(function(e) {
                if (e.db_name != null) {
                  self.emit(e.dbName.newValue);
                }
              });
            } else if (hasLocalStorage()) {
              if (typeof addEventListener !== 'undefined') {
                addEventListener("storage", function(e) {
                  self.emit(e.key);
                });
              } else {
                window.attachEvent("storage", function(e) {
                  self.emit(e.key);
                });
              }
            }
          }
          function Changes$1() {
            events.EventEmitter.call(this);
            this._listeners = {};
            attachBrowserEvents(this);
          }
          Changes$1.prototype.addListener = function(dbName, id, db, opts) {
            if (this._listeners[id]) {
              return;
            }
            var self = this;
            var inprogress = false;
            function eventFunction() {
              if (!self._listeners[id]) {
                return;
              }
              if (inprogress) {
                inprogress = 'waiting';
                return;
              }
              inprogress = true;
              var changesOpts = pick(opts, ['style', 'include_docs', 'attachments', 'conflicts', 'filter', 'doc_ids', 'view', 'since', 'query_params', 'binary']);
              function onError() {
                inprogress = false;
              }
              db.changes(changesOpts).on('change', function(c) {
                if (c.seq > opts.since && !opts.cancelled) {
                  opts.since = c.seq;
                  opts.onChange(c);
                }
              }).on('complete', function() {
                if (inprogress === 'waiting') {
                  nextTick(eventFunction);
                }
                inprogress = false;
              }).on('error', onError);
            }
            this._listeners[id] = eventFunction;
            this.on(dbName, eventFunction);
          };
          Changes$1.prototype.removeListener = function(dbName, id) {
            if (!(id in this._listeners)) {
              return;
            }
            events.EventEmitter.prototype.removeListener.call(this, dbName, this._listeners[id]);
            delete this._listeners[id];
          };
          Changes$1.prototype.notifyLocalWindows = function(dbName) {
            if (isChromeApp()) {
              chrome.storage.local.set({dbName: dbName});
            } else if (hasLocalStorage()) {
              localStorage[dbName] = (localStorage[dbName] === "a") ? "b" : "a";
            }
          };
          Changes$1.prototype.notify = function(dbName) {
            this.emit(dbName);
            this.notifyLocalWindows(dbName);
          };
          function guardedConsole(method) {
            if (console !== 'undefined' && method in console) {
              var args = Array.prototype.slice.call(arguments, 1);
              console[method].apply(console, args);
            }
          }
          function randomNumber(min, max) {
            var maxTimeout = 600000;
            min = parseInt(min, 10) || 0;
            max = parseInt(max, 10);
            if (max !== max || max <= min) {
              max = (min || 1) << 1;
            } else {
              max = max + 1;
            }
            if (max > maxTimeout) {
              min = maxTimeout >> 1;
              max = maxTimeout;
            }
            var ratio = Math.random();
            var range = max - min;
            return ~~(range * ratio + min);
          }
          function defaultBackOff(min) {
            var max = 0;
            if (!min) {
              max = 2000;
            }
            return randomNumber(min, max);
          }
          function explainError(status, str) {
            guardedConsole('info', 'The above ' + status + ' is totally normal. ' + str);
          }
          var assign;
          {
            if (typeof Object.assign === 'function') {
              assign = Object.assign;
            } else {
              assign = function(target) {
                var to = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                  var nextSource = arguments[index];
                  if (nextSource != null) {
                    for (var nextKey in nextSource) {
                      if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                      }
                    }
                  }
                }
                return to;
              };
            }
          }
          var $inject_Object_assign = assign;
          inherits(PouchError, Error);
          function PouchError(status, error, reason) {
            Error.call(this, reason);
            this.status = status;
            this.name = error;
            this.message = reason;
            this.error = true;
          }
          PouchError.prototype.toString = function() {
            return JSON.stringify({
              status: this.status,
              name: this.name,
              message: this.message,
              reason: this.reason
            });
          };
          var UNAUTHORIZED = new PouchError(401, 'unauthorized', "Name or password is incorrect.");
          var MISSING_BULK_DOCS = new PouchError(400, 'bad_request', "Missing JSON list of 'docs'");
          var MISSING_DOC = new PouchError(404, 'not_found', 'missing');
          var REV_CONFLICT = new PouchError(409, 'conflict', 'Document update conflict');
          var INVALID_ID = new PouchError(400, 'bad_request', '_id field must contain a string');
          var MISSING_ID = new PouchError(412, 'missing_id', '_id is required for puts');
          var RESERVED_ID = new PouchError(400, 'bad_request', 'Only reserved document ids may start with underscore.');
          var NOT_OPEN = new PouchError(412, 'precondition_failed', 'Database not open');
          var UNKNOWN_ERROR = new PouchError(500, 'unknown_error', 'Database encountered an unknown error');
          var BAD_ARG = new PouchError(500, 'badarg', 'Some query argument is invalid');
          var INVALID_REQUEST = new PouchError(400, 'invalid_request', 'Request was invalid');
          var QUERY_PARSE_ERROR = new PouchError(400, 'query_parse_error', 'Some query parameter is invalid');
          var DOC_VALIDATION = new PouchError(500, 'doc_validation', 'Bad special document member');
          var BAD_REQUEST = new PouchError(400, 'bad_request', 'Something wrong with the request');
          var NOT_AN_OBJECT = new PouchError(400, 'bad_request', 'Document must be a JSON object');
          var DB_MISSING = new PouchError(404, 'not_found', 'Database not found');
          var IDB_ERROR = new PouchError(500, 'indexed_db_went_bad', 'unknown');
          var WSQ_ERROR = new PouchError(500, 'web_sql_went_bad', 'unknown');
          var LDB_ERROR = new PouchError(500, 'levelDB_went_went_bad', 'unknown');
          var FORBIDDEN = new PouchError(403, 'forbidden', 'Forbidden by design doc validate_doc_update function');
          var INVALID_REV = new PouchError(400, 'bad_request', 'Invalid rev format');
          var FILE_EXISTS = new PouchError(412, 'file_exists', 'The database could not be created, the file already exists.');
          var MISSING_STUB = new PouchError(412, 'missing_stub', 'A pre-existing attachment stub wasn\'t found');
          var INVALID_URL = new PouchError(413, 'invalid_url', 'Provided URL is invalid');
          function createError(error, reason) {
            function CustomPouchError(reason) {
              for (var p in error) {
                if (typeof error[p] !== 'function') {
                  this[p] = error[p];
                }
              }
              if (reason !== undefined) {
                this.reason = reason;
              }
            }
            CustomPouchError.prototype = PouchError.prototype;
            return new CustomPouchError(reason);
          }
          function generateErrorFromResponse(err) {
            if (typeof err !== 'object') {
              var data = err;
              err = UNKNOWN_ERROR;
              err.data = data;
            }
            if ('error' in err && err.error === 'conflict') {
              err.name = 'conflict';
              err.status = 409;
            }
            if (!('name' in err)) {
              err.name = err.error || 'unknown';
            }
            if (!('status' in err)) {
              err.status = 500;
            }
            if (!('message' in err)) {
              err.message = err.message || err.reason;
            }
            return err;
          }
          function tryFilter(filter, doc, req) {
            try {
              return !filter(doc, req);
            } catch (err) {
              var msg = 'Filter function threw: ' + err.toString();
              return createError(BAD_REQUEST, msg);
            }
          }
          function filterChange(opts) {
            var req = {};
            var hasFilter = opts.filter && typeof opts.filter === 'function';
            req.query = opts.query_params;
            return function filter(change) {
              if (!change.doc) {
                change.doc = {};
              }
              var filterReturn = hasFilter && tryFilter(opts.filter, change.doc, req);
              if (typeof filterReturn === 'object') {
                return filterReturn;
              }
              if (filterReturn) {
                return false;
              }
              if (!opts.include_docs) {
                delete change.doc;
              } else if (!opts.attachments) {
                for (var att in change.doc._attachments) {
                  if (change.doc._attachments.hasOwnProperty(att)) {
                    change.doc._attachments[att].stub = true;
                  }
                }
              }
              return true;
            };
          }
          function flatten(arrs) {
            var res = [];
            for (var i = 0,
                len = arrs.length; i < len; i++) {
              res = res.concat(arrs[i]);
            }
            return res;
          }
          function f() {}
          var hasName = f.name;
          var res;
          if (hasName) {
            res = function(fun) {
              return fun.name;
            };
          } else {
            res = function(fun) {
              return fun.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
            };
          }
          function invalidIdError(id) {
            var err;
            if (!id) {
              err = createError(MISSING_ID);
            } else if (typeof id !== 'string') {
              err = createError(INVALID_ID);
            } else if (/^_/.test(id) && !(/^_(design|local)/).test(id)) {
              err = createError(RESERVED_ID);
            }
            if (err) {
              throw err;
            }
          }
          function isRemote(db) {
            if (typeof db._remote === 'boolean') {
              return db._remote;
            }
            if (typeof db.type === 'function') {
              guardedConsole('warn', 'db.type() is deprecated and will be removed in ' + 'a future version of PouchDB');
              return db.type() === 'http';
            }
            return false;
          }
          function listenerCount(ee, type) {
            return 'listenerCount' in ee ? ee.listenerCount(type) : events.EventEmitter.listenerCount(ee, type);
          }
          function parseDesignDocFunctionName(s) {
            if (!s) {
              return null;
            }
            var parts = s.split('/');
            if (parts.length === 2) {
              return parts;
            }
            if (parts.length === 1) {
              return [s, s];
            }
            return null;
          }
          function normalizeDesignDocFunctionName(s) {
            var normalized = parseDesignDocFunctionName(s);
            return normalized ? normalized.join('/') : null;
          }
          var keys = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
          var qName = "queryKey";
          var qParser = /(?:^|&)([^&=]*)=?([^&]*)/g;
          var parser = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
          function parseUri(str) {
            var m = parser.exec(str);
            var uri = {};
            var i = 14;
            while (i--) {
              var key = keys[i];
              var value = m[i] || "";
              var encoded = ['user', 'password'].indexOf(key) !== -1;
              uri[key] = encoded ? decodeURIComponent(value) : value;
            }
            uri[qName] = {};
            uri[keys[12]].replace(qParser, function($0, $1, $2) {
              if ($1) {
                uri[qName][$1] = $2;
              }
            });
            return uri;
          }
          function scopeEval(source, scope) {
            var keys = [];
            var values = [];
            for (var key in scope) {
              if (scope.hasOwnProperty(key)) {
                keys.push(key);
                values.push(scope[key]);
              }
            }
            keys.push(source);
            return Function.apply(null, keys).apply(null, values);
          }
          function upsert(db, docId, diffFun) {
            return new PouchPromise(function(fulfill, reject) {
              db.get(docId, function(err, doc) {
                if (err) {
                  if (err.status !== 404) {
                    return reject(err);
                  }
                  doc = {};
                }
                var docRev = doc._rev;
                var newDoc = diffFun(doc);
                if (!newDoc) {
                  return fulfill({
                    updated: false,
                    rev: docRev
                  });
                }
                newDoc._id = docId;
                newDoc._rev = docRev;
                fulfill(tryAndPut(db, newDoc, diffFun));
              });
            });
          }
          function tryAndPut(db, doc, diffFun) {
            return db.put(doc).then(function(res) {
              return {
                updated: true,
                rev: res.rev
              };
            }, function(err) {
              if (err.status !== 409) {
                throw err;
              }
              return upsert(db, doc._id, diffFun);
            });
          }
          function rev() {
            return v4().replace(/-/g, '').toLowerCase();
          }
          var uuid = v4;
          function winningRev(metadata) {
            var winningId;
            var winningPos;
            var winningDeleted;
            var toVisit = metadata.rev_tree.slice();
            var node;
            while ((node = toVisit.pop())) {
              var tree = node.ids;
              var branches = tree[2];
              var pos = node.pos;
              if (branches.length) {
                for (var i = 0,
                    len = branches.length; i < len; i++) {
                  toVisit.push({
                    pos: pos + 1,
                    ids: branches[i]
                  });
                }
                continue;
              }
              var deleted = !!tree[1].deleted;
              var id = tree[0];
              if (!winningId || (winningDeleted !== deleted ? winningDeleted : winningPos !== pos ? winningPos < pos : winningId < id)) {
                winningId = id;
                winningPos = pos;
                winningDeleted = deleted;
              }
            }
            return winningPos + '-' + winningId;
          }
          function traverseRevTree(revs, callback) {
            var toVisit = revs.slice();
            var node;
            while ((node = toVisit.pop())) {
              var pos = node.pos;
              var tree = node.ids;
              var branches = tree[2];
              var newCtx = callback(branches.length === 0, pos, tree[0], node.ctx, tree[1]);
              for (var i = 0,
                  len = branches.length; i < len; i++) {
                toVisit.push({
                  pos: pos + 1,
                  ids: branches[i],
                  ctx: newCtx
                });
              }
            }
          }
          function sortByPos(a, b) {
            return a.pos - b.pos;
          }
          function collectLeaves(revs) {
            var leaves = [];
            traverseRevTree(revs, function(isLeaf, pos, id, acc, opts) {
              if (isLeaf) {
                leaves.push({
                  rev: pos + "-" + id,
                  pos: pos,
                  opts: opts
                });
              }
            });
            leaves.sort(sortByPos).reverse();
            for (var i = 0,
                len = leaves.length; i < len; i++) {
              delete leaves[i].pos;
            }
            return leaves;
          }
          function collectConflicts(metadata) {
            var win = winningRev(metadata);
            var leaves = collectLeaves(metadata.rev_tree);
            var conflicts = [];
            for (var i = 0,
                len = leaves.length; i < len; i++) {
              var leaf = leaves[i];
              if (leaf.rev !== win && !leaf.opts.deleted) {
                conflicts.push(leaf.rev);
              }
            }
            return conflicts;
          }
          function rootToLeaf(revs) {
            var paths = [];
            var toVisit = revs.slice();
            var node;
            while ((node = toVisit.pop())) {
              var pos = node.pos;
              var tree = node.ids;
              var id = tree[0];
              var opts = tree[1];
              var branches = tree[2];
              var isLeaf = branches.length === 0;
              var history = node.history ? node.history.slice() : [];
              history.push({
                id: id,
                opts: opts
              });
              if (isLeaf) {
                paths.push({
                  pos: (pos + 1 - history.length),
                  ids: history
                });
              }
              for (var i = 0,
                  len = branches.length; i < len; i++) {
                toVisit.push({
                  pos: pos + 1,
                  ids: branches[i],
                  history: history
                });
              }
            }
            return paths.reverse();
          }
          function sortByPos$1(a, b) {
            return a.pos - b.pos;
          }
          function binarySearch(arr, item, comparator) {
            var low = 0;
            var high = arr.length;
            var mid;
            while (low < high) {
              mid = (low + high) >>> 1;
              if (comparator(arr[mid], item) < 0) {
                low = mid + 1;
              } else {
                high = mid;
              }
            }
            return low;
          }
          function insertSorted(arr, item, comparator) {
            var idx = binarySearch(arr, item, comparator);
            arr.splice(idx, 0, item);
          }
          function pathToTree(path, numStemmed) {
            var root;
            var leaf;
            for (var i = numStemmed,
                len = path.length; i < len; i++) {
              var node = path[i];
              var currentLeaf = [node.id, node.opts, []];
              if (leaf) {
                leaf[2].push(currentLeaf);
                leaf = currentLeaf;
              } else {
                root = leaf = currentLeaf;
              }
            }
            return root;
          }
          function compareTree(a, b) {
            return a[0] < b[0] ? -1 : 1;
          }
          function mergeTree(in_tree1, in_tree2) {
            var queue = [{
              tree1: in_tree1,
              tree2: in_tree2
            }];
            var conflicts = false;
            while (queue.length > 0) {
              var item = queue.pop();
              var tree1 = item.tree1;
              var tree2 = item.tree2;
              if (tree1[1].status || tree2[1].status) {
                tree1[1].status = (tree1[1].status === 'available' || tree2[1].status === 'available') ? 'available' : 'missing';
              }
              for (var i = 0; i < tree2[2].length; i++) {
                if (!tree1[2][0]) {
                  conflicts = 'new_leaf';
                  tree1[2][0] = tree2[2][i];
                  continue;
                }
                var merged = false;
                for (var j = 0; j < tree1[2].length; j++) {
                  if (tree1[2][j][0] === tree2[2][i][0]) {
                    queue.push({
                      tree1: tree1[2][j],
                      tree2: tree2[2][i]
                    });
                    merged = true;
                  }
                }
                if (!merged) {
                  conflicts = 'new_branch';
                  insertSorted(tree1[2], tree2[2][i], compareTree);
                }
              }
            }
            return {
              conflicts: conflicts,
              tree: in_tree1
            };
          }
          function doMerge(tree, path, dontExpand) {
            var restree = [];
            var conflicts = false;
            var merged = false;
            var res;
            if (!tree.length) {
              return {
                tree: [path],
                conflicts: 'new_leaf'
              };
            }
            for (var i = 0,
                len = tree.length; i < len; i++) {
              var branch = tree[i];
              if (branch.pos === path.pos && branch.ids[0] === path.ids[0]) {
                res = mergeTree(branch.ids, path.ids);
                restree.push({
                  pos: branch.pos,
                  ids: res.tree
                });
                conflicts = conflicts || res.conflicts;
                merged = true;
              } else if (dontExpand !== true) {
                var t1 = branch.pos < path.pos ? branch : path;
                var t2 = branch.pos < path.pos ? path : branch;
                var diff = t2.pos - t1.pos;
                var candidateParents = [];
                var trees = [];
                trees.push({
                  ids: t1.ids,
                  diff: diff,
                  parent: null,
                  parentIdx: null
                });
                while (trees.length > 0) {
                  var item = trees.pop();
                  if (item.diff === 0) {
                    if (item.ids[0] === t2.ids[0]) {
                      candidateParents.push(item);
                    }
                    continue;
                  }
                  var elements = item.ids[2];
                  for (var j = 0,
                      elementsLen = elements.length; j < elementsLen; j++) {
                    trees.push({
                      ids: elements[j],
                      diff: item.diff - 1,
                      parent: item.ids,
                      parentIdx: j
                    });
                  }
                }
                var el = candidateParents[0];
                if (!el) {
                  restree.push(branch);
                } else {
                  res = mergeTree(el.ids, t2.ids);
                  el.parent[2][el.parentIdx] = res.tree;
                  restree.push({
                    pos: t1.pos,
                    ids: t1.ids
                  });
                  conflicts = conflicts || res.conflicts;
                  merged = true;
                }
              } else {
                restree.push(branch);
              }
            }
            if (!merged) {
              restree.push(path);
            }
            restree.sort(sortByPos$1);
            return {
              tree: restree,
              conflicts: conflicts || 'internal_node'
            };
          }
          function stem(tree, depth) {
            var paths = rootToLeaf(tree);
            var stemmedRevs;
            var result;
            for (var i = 0,
                len = paths.length; i < len; i++) {
              var path = paths[i];
              var stemmed = path.ids;
              var node;
              if (stemmed.length > depth) {
                if (!stemmedRevs) {
                  stemmedRevs = {};
                }
                var numStemmed = stemmed.length - depth;
                node = {
                  pos: path.pos + numStemmed,
                  ids: pathToTree(stemmed, numStemmed)
                };
                for (var s = 0; s < numStemmed; s++) {
                  var rev = (path.pos + s) + '-' + stemmed[s].id;
                  stemmedRevs[rev] = true;
                }
              } else {
                node = {
                  pos: path.pos,
                  ids: pathToTree(stemmed, 0)
                };
              }
              if (result) {
                result = doMerge(result, node, true).tree;
              } else {
                result = [node];
              }
            }
            if (stemmedRevs) {
              traverseRevTree(result, function(isLeaf, pos, revHash) {
                delete stemmedRevs[pos + '-' + revHash];
              });
            }
            return {
              tree: result,
              revs: stemmedRevs ? Object.keys(stemmedRevs) : []
            };
          }
          function merge(tree, path, depth) {
            var newTree = doMerge(tree, path);
            var stemmed = stem(newTree.tree, depth);
            return {
              tree: stemmed.tree,
              stemmedRevs: stemmed.revs,
              conflicts: newTree.conflicts
            };
          }
          function getTrees(node) {
            return node.ids;
          }
          function isDeleted(metadata, rev) {
            if (!rev) {
              rev = winningRev(metadata);
            }
            var id = rev.substring(rev.indexOf('-') + 1);
            var toVisit = metadata.rev_tree.map(getTrees);
            var tree;
            while ((tree = toVisit.pop())) {
              if (tree[0] === id) {
                return !!tree[1].deleted;
              }
              toVisit = toVisit.concat(tree[2]);
            }
          }
          function isLocalId(id) {
            return (/^_local/).test(id);
          }
          function latest(rev, metadata) {
            var toVisit = metadata.rev_tree.slice();
            var node;
            while ((node = toVisit.pop())) {
              var pos = node.pos;
              var tree = node.ids;
              var id = tree[0];
              var opts = tree[1];
              var branches = tree[2];
              var isLeaf = branches.length === 0;
              var history = node.history ? node.history.slice() : [];
              history.push({
                id: id,
                pos: pos,
                opts: opts
              });
              if (isLeaf) {
                for (var i = 0,
                    len = history.length; i < len; i++) {
                  var historyNode = history[i];
                  var historyRev = historyNode.pos + '-' + historyNode.id;
                  if (historyRev === rev) {
                    return pos + '-' + id;
                  }
                }
              }
              for (var j = 0,
                  l = branches.length; j < l; j++) {
                toVisit.push({
                  pos: pos + 1,
                  ids: branches[j],
                  history: history
                });
              }
            }
            throw new Error('Unable to resolve latest revision for id ' + metadata.id + ', rev ' + rev);
          }
          inherits(Changes$2, events.EventEmitter);
          function tryCatchInChangeListener(self, change) {
            try {
              self.emit('change', change);
            } catch (e) {
              guardedConsole('error', 'Error in .on("change", function):', e);
            }
          }
          function Changes$2(db, opts, callback) {
            events.EventEmitter.call(this);
            var self = this;
            this.db = db;
            opts = opts ? clone(opts) : {};
            var complete = opts.complete = once(function(err, resp) {
              if (err) {
                if (listenerCount(self, 'error') > 0) {
                  self.emit('error', err);
                }
              } else {
                self.emit('complete', resp);
              }
              self.removeAllListeners();
              db.removeListener('destroyed', onDestroy);
            });
            if (callback) {
              self.on('complete', function(resp) {
                callback(null, resp);
              });
              self.on('error', callback);
            }
            function onDestroy() {
              self.cancel();
            }
            db.once('destroyed', onDestroy);
            opts.onChange = function(change) {
              if (self.isCancelled) {
                return;
              }
              tryCatchInChangeListener(self, change);
            };
            var promise = new PouchPromise(function(fulfill, reject) {
              opts.complete = function(err, res) {
                if (err) {
                  reject(err);
                } else {
                  fulfill(res);
                }
              };
            });
            self.once('cancel', function() {
              db.removeListener('destroyed', onDestroy);
              opts.complete(null, {status: 'cancelled'});
            });
            this.then = promise.then.bind(promise);
            this['catch'] = promise['catch'].bind(promise);
            this.then(function(result) {
              complete(null, result);
            }, complete);
            if (!db.taskqueue.isReady) {
              db.taskqueue.addTask(function(failed) {
                if (failed) {
                  opts.complete(failed);
                } else if (self.isCancelled) {
                  self.emit('cancel');
                } else {
                  self.validateChanges(opts);
                }
              });
            } else {
              self.validateChanges(opts);
            }
          }
          Changes$2.prototype.cancel = function() {
            this.isCancelled = true;
            if (this.db.taskqueue.isReady) {
              this.emit('cancel');
            }
          };
          function processChange(doc, metadata, opts) {
            var changeList = [{rev: doc._rev}];
            if (opts.style === 'all_docs') {
              changeList = collectLeaves(metadata.rev_tree).map(function(x) {
                return {rev: x.rev};
              });
            }
            var change = {
              id: metadata.id,
              changes: changeList,
              doc: doc
            };
            if (isDeleted(metadata, doc._rev)) {
              change.deleted = true;
            }
            if (opts.conflicts) {
              change.doc._conflicts = collectConflicts(metadata);
              if (!change.doc._conflicts.length) {
                delete change.doc._conflicts;
              }
            }
            return change;
          }
          Changes$2.prototype.validateChanges = function(opts) {
            var callback = opts.complete;
            var self = this;
            if (PouchDB$2._changesFilterPlugin) {
              PouchDB$2._changesFilterPlugin.validate(opts, function(err) {
                if (err) {
                  return callback(err);
                }
                self.doChanges(opts);
              });
            } else {
              self.doChanges(opts);
            }
          };
          Changes$2.prototype.doChanges = function(opts) {
            var self = this;
            var callback = opts.complete;
            opts = clone(opts);
            if ('live' in opts && !('continuous' in opts)) {
              opts.continuous = opts.live;
            }
            opts.processChange = processChange;
            if (opts.since === 'latest') {
              opts.since = 'now';
            }
            if (!opts.since) {
              opts.since = 0;
            }
            if (opts.since === 'now') {
              this.db.info().then(function(info) {
                if (self.isCancelled) {
                  callback(null, {status: 'cancelled'});
                  return;
                }
                opts.since = info.update_seq;
                self.doChanges(opts);
              }, callback);
              return;
            }
            if (PouchDB$2._changesFilterPlugin) {
              PouchDB$2._changesFilterPlugin.normalize(opts);
              if (PouchDB$2._changesFilterPlugin.shouldFilter(this, opts)) {
                return PouchDB$2._changesFilterPlugin.filter(this, opts);
              }
            } else {
              ['doc_ids', 'filter', 'selector', 'view'].forEach(function(key) {
                if (key in opts) {
                  guardedConsole('warn', 'The "' + key + '" option was passed in to changes/replicate, ' + 'but pouchdb-changes-filter plugin is not installed, so it ' + 'was ignored. Please install the plugin to enable filtering.');
                }
              });
            }
            if (!('descending' in opts)) {
              opts.descending = false;
            }
            opts.limit = opts.limit === 0 ? 1 : opts.limit;
            opts.complete = callback;
            var newPromise = this.db._changes(opts);
            if (newPromise && typeof newPromise.cancel === 'function') {
              var cancel = self.cancel;
              self.cancel = getArguments(function(args) {
                newPromise.cancel();
                cancel.apply(this, args);
              });
            }
          };
          function compare(left, right) {
            return left < right ? -1 : left > right ? 1 : 0;
          }
          function yankError(callback, docId) {
            return function(err, results) {
              if (err || (results[0] && results[0].error)) {
                err = err || results[0];
                err.docId = docId;
                callback(err);
              } else {
                callback(null, results.length ? results[0] : results);
              }
            };
          }
          function cleanDocs(docs) {
            for (var i = 0; i < docs.length; i++) {
              var doc = docs[i];
              if (doc._deleted) {
                delete doc._attachments;
              } else if (doc._attachments) {
                var atts = Object.keys(doc._attachments);
                for (var j = 0; j < atts.length; j++) {
                  var att = atts[j];
                  doc._attachments[att] = pick(doc._attachments[att], ['data', 'digest', 'content_type', 'length', 'revpos', 'stub']);
                }
              }
            }
          }
          function compareByIdThenRev(a, b) {
            var idCompare = compare(a._id, b._id);
            if (idCompare !== 0) {
              return idCompare;
            }
            var aStart = a._revisions ? a._revisions.start : 0;
            var bStart = b._revisions ? b._revisions.start : 0;
            return compare(aStart, bStart);
          }
          function computeHeight(revs) {
            var height = {};
            var edges = [];
            traverseRevTree(revs, function(isLeaf, pos, id, prnt) {
              var rev$$1 = pos + "-" + id;
              if (isLeaf) {
                height[rev$$1] = 0;
              }
              if (prnt !== undefined) {
                edges.push({
                  from: prnt,
                  to: rev$$1
                });
              }
              return rev$$1;
            });
            edges.reverse();
            edges.forEach(function(edge) {
              if (height[edge.from] === undefined) {
                height[edge.from] = 1 + height[edge.to];
              } else {
                height[edge.from] = Math.min(height[edge.from], 1 + height[edge.to]);
              }
            });
            return height;
          }
          function allDocsKeysQuery(api, opts, callback) {
            var keys = ('limit' in opts) ? opts.keys.slice(opts.skip, opts.limit + opts.skip) : (opts.skip > 0) ? opts.keys.slice(opts.skip) : opts.keys;
            if (opts.descending) {
              keys.reverse();
            }
            if (!keys.length) {
              return api._allDocs({limit: 0}, callback);
            }
            var finalResults = {offset: opts.skip};
            return PouchPromise.all(keys.map(function(key) {
              var subOpts = $inject_Object_assign({
                key: key,
                deleted: 'ok'
              }, opts);
              ['limit', 'skip', 'keys'].forEach(function(optKey) {
                delete subOpts[optKey];
              });
              return new PouchPromise(function(resolve, reject) {
                api._allDocs(subOpts, function(err, res) {
                  if (err) {
                    return reject(err);
                  }
                  finalResults.total_rows = res.total_rows;
                  resolve(res.rows[0] || {
                    key: key,
                    error: 'not_found'
                  });
                });
              });
            })).then(function(results) {
              finalResults.rows = results;
              return finalResults;
            });
          }
          function doNextCompaction(self) {
            var task = self._compactionQueue[0];
            var opts = task.opts;
            var callback = task.callback;
            self.get('_local/compaction')["catch"](function() {
              return false;
            }).then(function(doc) {
              if (doc && doc.last_seq) {
                opts.last_seq = doc.last_seq;
              }
              self._compact(opts, function(err, res) {
                if (err) {
                  callback(err);
                } else {
                  callback(null, res);
                }
                nextTick(function() {
                  self._compactionQueue.shift();
                  if (self._compactionQueue.length) {
                    doNextCompaction(self);
                  }
                });
              });
            });
          }
          function attachmentNameError(name) {
            if (name.charAt(0) === '_') {
              return name + ' is not a valid attachment name, attachment ' + 'names cannot start with \'_\'';
            }
            return false;
          }
          inherits(AbstractPouchDB, events.EventEmitter);
          function AbstractPouchDB() {
            events.EventEmitter.call(this);
          }
          AbstractPouchDB.prototype.post = adapterFun('post', function(doc, opts, callback) {
            if (typeof opts === 'function') {
              callback = opts;
              opts = {};
            }
            if (typeof doc !== 'object' || Array.isArray(doc)) {
              return callback(createError(NOT_AN_OBJECT));
            }
            this.bulkDocs({docs: [doc]}, opts, yankError(callback, doc._id));
          });
          AbstractPouchDB.prototype.put = adapterFun('put', function(doc, opts, cb) {
            if (typeof opts === 'function') {
              cb = opts;
              opts = {};
            }
            if (typeof doc !== 'object' || Array.isArray(doc)) {
              return cb(createError(NOT_AN_OBJECT));
            }
            invalidIdError(doc._id);
            if (isLocalId(doc._id) && typeof this._putLocal === 'function') {
              if (doc._deleted) {
                return this._removeLocal(doc, cb);
              } else {
                return this._putLocal(doc, cb);
              }
            }
            var self = this;
            if (opts.force && doc._rev) {
              transformForceOptionToNewEditsOption();
              putDoc(function(err) {
                var result = err ? null : {
                  ok: true,
                  id: doc._id,
                  rev: doc._rev
                };
                cb(err, result);
              });
            } else {
              putDoc(cb);
            }
            function transformForceOptionToNewEditsOption() {
              var parts = doc._rev.split('-');
              var oldRevId = parts[1];
              var oldRevNum = parseInt(parts[0], 10);
              var newRevNum = oldRevNum + 1;
              var newRevId = rev();
              doc._revisions = {
                start: newRevNum,
                ids: [newRevId, oldRevId]
              };
              doc._rev = newRevNum + '-' + newRevId;
              opts.new_edits = false;
            }
            function putDoc(next) {
              if (typeof self._put === 'function' && opts.new_edits !== false) {
                self._put(doc, opts, next);
              } else {
                self.bulkDocs({docs: [doc]}, opts, yankError(next, doc._id));
              }
            }
          });
          AbstractPouchDB.prototype.putAttachment = adapterFun('putAttachment', function(docId, attachmentId, rev$$1, blob, type) {
            var api = this;
            if (typeof type === 'function') {
              type = blob;
              blob = rev$$1;
              rev$$1 = null;
            }
            if (typeof type === 'undefined') {
              type = blob;
              blob = rev$$1;
              rev$$1 = null;
            }
            if (!type) {
              guardedConsole('warn', 'Attachment', attachmentId, 'on document', docId, 'is missing content_type');
            }
            function createAttachment(doc) {
              var prevrevpos = '_rev' in doc ? parseInt(doc._rev, 10) : 0;
              doc._attachments = doc._attachments || {};
              doc._attachments[attachmentId] = {
                content_type: type,
                data: blob,
                revpos: ++prevrevpos
              };
              return api.put(doc);
            }
            return api.get(docId).then(function(doc) {
              if (doc._rev !== rev$$1) {
                throw createError(REV_CONFLICT);
              }
              return createAttachment(doc);
            }, function(err) {
              if (err.reason === MISSING_DOC.message) {
                return createAttachment({_id: docId});
              } else {
                throw err;
              }
            });
          });
          AbstractPouchDB.prototype.removeAttachment = adapterFun('removeAttachment', function(docId, attachmentId, rev$$1, callback) {
            var self = this;
            self.get(docId, function(err, obj) {
              if (err) {
                callback(err);
                return;
              }
              if (obj._rev !== rev$$1) {
                callback(createError(REV_CONFLICT));
                return;
              }
              if (!obj._attachments) {
                return callback();
              }
              delete obj._attachments[attachmentId];
              if (Object.keys(obj._attachments).length === 0) {
                delete obj._attachments;
              }
              self.put(obj, callback);
            });
          });
          AbstractPouchDB.prototype.remove = adapterFun('remove', function(docOrId, optsOrRev, opts, callback) {
            var doc;
            if (typeof optsOrRev === 'string') {
              doc = {
                _id: docOrId,
                _rev: optsOrRev
              };
              if (typeof opts === 'function') {
                callback = opts;
                opts = {};
              }
            } else {
              doc = docOrId;
              if (typeof optsOrRev === 'function') {
                callback = optsOrRev;
                opts = {};
              } else {
                callback = opts;
                opts = optsOrRev;
              }
            }
            opts = opts || {};
            opts.was_delete = true;
            var newDoc = {
              _id: doc._id,
              _rev: (doc._rev || opts.rev)
            };
            newDoc._deleted = true;
            if (isLocalId(newDoc._id) && typeof this._removeLocal === 'function') {
              return this._removeLocal(doc, callback);
            }
            this.bulkDocs({docs: [newDoc]}, opts, yankError(callback, newDoc._id));
          });
          AbstractPouchDB.prototype.revsDiff = adapterFun('revsDiff', function(req, opts, callback) {
            if (typeof opts === 'function') {
              callback = opts;
              opts = {};
            }
            var ids = Object.keys(req);
            if (!ids.length) {
              return callback(null, {});
            }
            var count = 0;
            var missing = new ExportedMap();
            function addToMissing(id, revId) {
              if (!missing.has(id)) {
                missing.set(id, {missing: []});
              }
              missing.get(id).missing.push(revId);
            }
            function processDoc(id, rev_tree) {
              var missingForId = req[id].slice(0);
              traverseRevTree(rev_tree, function(isLeaf, pos, revHash, ctx, opts) {
                var rev$$1 = pos + '-' + revHash;
                var idx = missingForId.indexOf(rev$$1);
                if (idx === -1) {
                  return;
                }
                missingForId.splice(idx, 1);
                if (opts.status !== 'available') {
                  addToMissing(id, rev$$1);
                }
              });
              missingForId.forEach(function(rev$$1) {
                addToMissing(id, rev$$1);
              });
            }
            ids.map(function(id) {
              this._getRevisionTree(id, function(err, rev_tree) {
                if (err && err.status === 404 && err.message === 'missing') {
                  missing.set(id, {missing: req[id]});
                } else if (err) {
                  return callback(err);
                } else {
                  processDoc(id, rev_tree);
                }
                if (++count === ids.length) {
                  var missingObj = {};
                  missing.forEach(function(value, key) {
                    missingObj[key] = value;
                  });
                  return callback(null, missingObj);
                }
              });
            }, this);
          });
          AbstractPouchDB.prototype.bulkGet = adapterFun('bulkGet', function(opts, callback) {
            bulkGet(this, opts, callback);
          });
          AbstractPouchDB.prototype.compactDocument = adapterFun('compactDocument', function(docId, maxHeight, callback) {
            var self = this;
            this._getRevisionTree(docId, function(err, revTree) {
              if (err) {
                return callback(err);
              }
              var height = computeHeight(revTree);
              var candidates = [];
              var revs = [];
              Object.keys(height).forEach(function(rev$$1) {
                if (height[rev$$1] > maxHeight) {
                  candidates.push(rev$$1);
                }
              });
              traverseRevTree(revTree, function(isLeaf, pos, revHash, ctx, opts) {
                var rev$$1 = pos + '-' + revHash;
                if (opts.status === 'available' && candidates.indexOf(rev$$1) !== -1) {
                  revs.push(rev$$1);
                }
              });
              self._doCompaction(docId, revs, callback);
            });
          });
          AbstractPouchDB.prototype.compact = adapterFun('compact', function(opts, callback) {
            if (typeof opts === 'function') {
              callback = opts;
              opts = {};
            }
            var self = this;
            opts = opts || {};
            self._compactionQueue = self._compactionQueue || [];
            self._compactionQueue.push({
              opts: opts,
              callback: callback
            });
            if (self._compactionQueue.length === 1) {
              doNextCompaction(self);
            }
          });
          AbstractPouchDB.prototype._compact = function(opts, callback) {
            var self = this;
            var changesOpts = {
              return_docs: false,
              last_seq: opts.last_seq || 0
            };
            var promises = [];
            function onChange(row) {
              promises.push(self.compactDocument(row.id, 0));
            }
            function onComplete(resp) {
              var lastSeq = resp.last_seq;
              PouchPromise.all(promises).then(function() {
                return upsert(self, '_local/compaction', function deltaFunc(doc) {
                  if (!doc.last_seq || doc.last_seq < lastSeq) {
                    doc.last_seq = lastSeq;
                    return doc;
                  }
                  return false;
                });
              }).then(function() {
                callback(null, {ok: true});
              })["catch"](callback);
            }
            self.changes(changesOpts).on('change', onChange).on('complete', onComplete).on('error', callback);
          };
          AbstractPouchDB.prototype.get = adapterFun('get', function(id, opts, cb) {
            if (typeof opts === 'function') {
              cb = opts;
              opts = {};
            }
            if (typeof id !== 'string') {
              return cb(createError(INVALID_ID));
            }
            if (isLocalId(id) && typeof this._getLocal === 'function') {
              return this._getLocal(id, cb);
            }
            var leaves = [],
                self = this;
            function finishOpenRevs() {
              var result = [];
              var count = leaves.length;
              if (!count) {
                return cb(null, result);
              }
              leaves.forEach(function(leaf) {
                self.get(id, {
                  rev: leaf,
                  revs: opts.revs,
                  latest: opts.latest,
                  attachments: opts.attachments
                }, function(err, doc) {
                  if (!err) {
                    var existing;
                    for (var i = 0,
                        l = result.length; i < l; i++) {
                      if (result[i].ok && result[i].ok._rev === doc._rev) {
                        existing = true;
                        break;
                      }
                    }
                    if (!existing) {
                      result.push({ok: doc});
                    }
                  } else {
                    result.push({missing: leaf});
                  }
                  count--;
                  if (!count) {
                    cb(null, result);
                  }
                });
              });
            }
            if (opts.open_revs) {
              if (opts.open_revs === "all") {
                this._getRevisionTree(id, function(err, rev_tree) {
                  if (err) {
                    return cb(err);
                  }
                  leaves = collectLeaves(rev_tree).map(function(leaf) {
                    return leaf.rev;
                  });
                  finishOpenRevs();
                });
              } else {
                if (Array.isArray(opts.open_revs)) {
                  leaves = opts.open_revs;
                  for (var i = 0; i < leaves.length; i++) {
                    var l = leaves[i];
                    if (!(typeof(l) === "string" && /^\d+-/.test(l))) {
                      return cb(createError(INVALID_REV));
                    }
                  }
                  finishOpenRevs();
                } else {
                  return cb(createError(UNKNOWN_ERROR, 'function_clause'));
                }
              }
              return;
            }
            return this._get(id, opts, function(err, result) {
              if (err) {
                err.docId = id;
                return cb(err);
              }
              var doc = result.doc;
              var metadata = result.metadata;
              var ctx = result.ctx;
              if (opts.conflicts) {
                var conflicts = collectConflicts(metadata);
                if (conflicts.length) {
                  doc._conflicts = conflicts;
                }
              }
              if (isDeleted(metadata, doc._rev)) {
                doc._deleted = true;
              }
              if (opts.revs || opts.revs_info) {
                var splittedRev = doc._rev.split('-');
                var revNo = parseInt(splittedRev[0], 10);
                var revHash = splittedRev[1];
                var paths = rootToLeaf(metadata.rev_tree);
                var path = null;
                for (var i = 0; i < paths.length; i++) {
                  var currentPath = paths[i];
                  var hashIndex = currentPath.ids.map(function(x) {
                    return x.id;
                  }).indexOf(revHash);
                  var hashFoundAtRevPos = hashIndex === (revNo - 1);
                  if (hashFoundAtRevPos || (!path && hashIndex !== -1)) {
                    path = currentPath;
                  }
                }
                var indexOfRev = path.ids.map(function(x) {
                  return x.id;
                }).indexOf(doc._rev.split('-')[1]) + 1;
                var howMany = path.ids.length - indexOfRev;
                path.ids.splice(indexOfRev, howMany);
                path.ids.reverse();
                if (opts.revs) {
                  doc._revisions = {
                    start: (path.pos + path.ids.length) - 1,
                    ids: path.ids.map(function(rev$$1) {
                      return rev$$1.id;
                    })
                  };
                }
                if (opts.revs_info) {
                  var pos = path.pos + path.ids.length;
                  doc._revs_info = path.ids.map(function(rev$$1) {
                    pos--;
                    return {
                      rev: pos + '-' + rev$$1.id,
                      status: rev$$1.opts.status
                    };
                  });
                }
              }
              if (opts.attachments && doc._attachments) {
                var attachments = doc._attachments;
                var count = Object.keys(attachments).length;
                if (count === 0) {
                  return cb(null, doc);
                }
                Object.keys(attachments).forEach(function(key) {
                  this._getAttachment(doc._id, key, attachments[key], {
                    rev: doc._rev,
                    binary: opts.binary,
                    ctx: ctx
                  }, function(err, data) {
                    var att = doc._attachments[key];
                    att.data = data;
                    delete att.stub;
                    delete att.length;
                    if (!--count) {
                      cb(null, doc);
                    }
                  });
                }, self);
              } else {
                if (doc._attachments) {
                  for (var key in doc._attachments) {
                    if (doc._attachments.hasOwnProperty(key)) {
                      doc._attachments[key].stub = true;
                    }
                  }
                }
                cb(null, doc);
              }
            });
          });
          AbstractPouchDB.prototype.getAttachment = adapterFun('getAttachment', function(docId, attachmentId, opts, callback) {
            var self = this;
            if (opts instanceof Function) {
              callback = opts;
              opts = {};
            }
            this._get(docId, opts, function(err, res) {
              if (err) {
                return callback(err);
              }
              if (res.doc._attachments && res.doc._attachments[attachmentId]) {
                opts.ctx = res.ctx;
                opts.binary = true;
                self._getAttachment(docId, attachmentId, res.doc._attachments[attachmentId], opts, callback);
              } else {
                return callback(createError(MISSING_DOC));
              }
            });
          });
          AbstractPouchDB.prototype.allDocs = adapterFun('allDocs', function(opts, callback) {
            if (typeof opts === 'function') {
              callback = opts;
              opts = {};
            }
            opts.skip = typeof opts.skip !== 'undefined' ? opts.skip : 0;
            if (opts.start_key) {
              opts.startkey = opts.start_key;
            }
            if (opts.end_key) {
              opts.endkey = opts.end_key;
            }
            if ('keys' in opts) {
              if (!Array.isArray(opts.keys)) {
                return callback(new TypeError('options.keys must be an array'));
              }
              var incompatibleOpt = ['startkey', 'endkey', 'key'].filter(function(incompatibleOpt) {
                return incompatibleOpt in opts;
              })[0];
              if (incompatibleOpt) {
                callback(createError(QUERY_PARSE_ERROR, 'Query parameter `' + incompatibleOpt + '` is not compatible with multi-get'));
                return;
              }
              if (!isRemote(this)) {
                return allDocsKeysQuery(this, opts, callback);
              }
            }
            return this._allDocs(opts, callback);
          });
          AbstractPouchDB.prototype.changes = function(opts, callback) {
            if (typeof opts === 'function') {
              callback = opts;
              opts = {};
            }
            return new Changes$2(this, opts, callback);
          };
          AbstractPouchDB.prototype.close = adapterFun('close', function(callback) {
            this._closed = true;
            this.emit('closed');
            return this._close(callback);
          });
          AbstractPouchDB.prototype.info = adapterFun('info', function(callback) {
            var self = this;
            this._info(function(err, info) {
              if (err) {
                return callback(err);
              }
              info.db_name = info.db_name || self.name;
              info.auto_compaction = !!(self.auto_compaction && !isRemote(self));
              info.adapter = self.adapter;
              callback(null, info);
            });
          });
          AbstractPouchDB.prototype.id = adapterFun('id', function(callback) {
            return this._id(callback);
          });
          AbstractPouchDB.prototype.type = function() {
            return (typeof this._type === 'function') ? this._type() : this.adapter;
          };
          AbstractPouchDB.prototype.bulkDocs = adapterFun('bulkDocs', function(req, opts, callback) {
            if (typeof opts === 'function') {
              callback = opts;
              opts = {};
            }
            opts = opts || {};
            if (Array.isArray(req)) {
              req = {docs: req};
            }
            if (!req || !req.docs || !Array.isArray(req.docs)) {
              return callback(createError(MISSING_BULK_DOCS));
            }
            for (var i = 0; i < req.docs.length; ++i) {
              if (typeof req.docs[i] !== 'object' || Array.isArray(req.docs[i])) {
                return callback(createError(NOT_AN_OBJECT));
              }
            }
            var attachmentError;
            req.docs.forEach(function(doc) {
              if (doc._attachments) {
                Object.keys(doc._attachments).forEach(function(name) {
                  attachmentError = attachmentError || attachmentNameError(name);
                  if (!doc._attachments[name].content_type) {
                    guardedConsole('warn', 'Attachment', name, 'on document', doc._id, 'is missing content_type');
                  }
                });
              }
            });
            if (attachmentError) {
              return callback(createError(BAD_REQUEST, attachmentError));
            }
            if (!('new_edits' in opts)) {
              if ('new_edits' in req) {
                opts.new_edits = req.new_edits;
              } else {
                opts.new_edits = true;
              }
            }
            var adapter = this;
            if (!opts.new_edits && !isRemote(adapter)) {
              req.docs.sort(compareByIdThenRev);
            }
            cleanDocs(req.docs);
            var ids = req.docs.map(function(doc) {
              return doc._id;
            });
            return this._bulkDocs(req, opts, function(err, res) {
              if (err) {
                return callback(err);
              }
              if (!opts.new_edits) {
                res = res.filter(function(x) {
                  return x.error;
                });
              }
              if (!isRemote(adapter)) {
                for (var i = 0,
                    l = res.length; i < l; i++) {
                  res[i].id = res[i].id || ids[i];
                }
              }
              callback(null, res);
            });
          });
          AbstractPouchDB.prototype.registerDependentDatabase = adapterFun('registerDependentDatabase', function(dependentDb, callback) {
            var depDB = new this.constructor(dependentDb, this.__opts);
            function diffFun(doc) {
              doc.dependentDbs = doc.dependentDbs || {};
              if (doc.dependentDbs[dependentDb]) {
                return false;
              }
              doc.dependentDbs[dependentDb] = true;
              return doc;
            }
            upsert(this, '_local/_pouch_dependentDbs', diffFun).then(function() {
              callback(null, {db: depDB});
            })["catch"](callback);
          });
          AbstractPouchDB.prototype.destroy = adapterFun('destroy', function(opts, callback) {
            if (typeof opts === 'function') {
              callback = opts;
              opts = {};
            }
            var self = this;
            var usePrefix = 'use_prefix' in self ? self.use_prefix : true;
            function destroyDb() {
              self._destroy(opts, function(err, resp) {
                if (err) {
                  return callback(err);
                }
                self._destroyed = true;
                self.emit('destroyed');
                callback(null, resp || {'ok': true});
              });
            }
            if (isRemote(self)) {
              return destroyDb();
            }
            self.get('_local/_pouch_dependentDbs', function(err, localDoc) {
              if (err) {
                if (err.status !== 404) {
                  return callback(err);
                } else {
                  return destroyDb();
                }
              }
              var dependentDbs = localDoc.dependentDbs;
              var PouchDB = self.constructor;
              var deletedMap = Object.keys(dependentDbs).map(function(name) {
                var trueName = usePrefix ? name.replace(new RegExp('^' + PouchDB.prefix), '') : name;
                return new PouchDB(trueName, self.__opts).destroy();
              });
              PouchPromise.all(deletedMap).then(destroyDb, callback);
            });
          });
          function TaskQueue$1() {
            this.isReady = false;
            this.failed = false;
            this.queue = [];
          }
          TaskQueue$1.prototype.execute = function() {
            var fun;
            if (this.failed) {
              while ((fun = this.queue.shift())) {
                fun(this.failed);
              }
            } else {
              while ((fun = this.queue.shift())) {
                fun();
              }
            }
          };
          TaskQueue$1.prototype.fail = function(err) {
            this.failed = err;
            this.execute();
          };
          TaskQueue$1.prototype.ready = function(db) {
            this.isReady = true;
            this.db = db;
            this.execute();
          };
          TaskQueue$1.prototype.addTask = function(fun) {
            this.queue.push(fun);
            if (this.failed) {
              this.execute();
            }
          };
          function parseAdapter(name, opts) {
            var match = name.match(/([a-z-]*):\/\/(.*)/);
            if (match) {
              return {
                name: /https?/.test(match[1]) ? match[1] + '://' + match[2] : match[2],
                adapter: match[1]
              };
            }
            var adapters = PouchDB$2.adapters;
            var preferredAdapters = PouchDB$2.preferredAdapters;
            var prefix = PouchDB$2.prefix;
            var adapterName = opts.adapter;
            if (!adapterName) {
              for (var i = 0; i < preferredAdapters.length; ++i) {
                adapterName = preferredAdapters[i];
                if (adapterName === 'idb' && 'websql' in adapters && hasLocalStorage() && localStorage['_pouch__websqldb_' + prefix + name]) {
                  guardedConsole('log', 'PouchDB is downgrading "' + name + '" to WebSQL to' + ' avoid data loss, because it was already opened with WebSQL.');
                  continue;
                }
                break;
              }
            }
            var adapter = adapters[adapterName];
            var usePrefix = (adapter && 'use_prefix' in adapter) ? adapter.use_prefix : true;
            return {
              name: usePrefix ? (prefix + name) : name,
              adapter: adapterName
            };
          }
          function prepareForDestruction(self) {
            function onDestroyed(from_constructor) {
              self.removeListener('closed', onClosed);
              if (!from_constructor) {
                self.constructor.emit('destroyed', self.name);
              }
            }
            function onClosed() {
              self.removeListener('destroyed', onDestroyed);
              self.constructor.emit('unref', self);
            }
            self.once('destroyed', onDestroyed);
            self.once('closed', onClosed);
            self.constructor.emit('ref', self);
          }
          inherits(PouchDB$2, AbstractPouchDB);
          function PouchDB$2(name, opts) {
            if (!(this instanceof PouchDB$2)) {
              return new PouchDB$2(name, opts);
            }
            var self = this;
            opts = opts || {};
            if (name && typeof name === 'object') {
              opts = name;
              name = opts.name;
              delete opts.name;
            }
            this.__opts = opts = clone(opts);
            self.auto_compaction = opts.auto_compaction;
            self.prefix = PouchDB$2.prefix;
            if (typeof name !== 'string') {
              throw new Error('Missing/invalid DB name');
            }
            var prefixedName = (opts.prefix || '') + name;
            var backend = parseAdapter(prefixedName, opts);
            opts.name = backend.name;
            opts.adapter = opts.adapter || backend.adapter;
            self.name = name;
            self._adapter = opts.adapter;
            PouchDB$2.emit('debug', ['adapter', 'Picked adapter: ', opts.adapter]);
            if (!PouchDB$2.adapters[opts.adapter] || !PouchDB$2.adapters[opts.adapter].valid()) {
              throw new Error('Invalid Adapter: ' + opts.adapter);
            }
            AbstractPouchDB.call(self);
            self.taskqueue = new TaskQueue$1();
            self.adapter = opts.adapter;
            PouchDB$2.adapters[opts.adapter].call(self, opts, function(err) {
              if (err) {
                return self.taskqueue.fail(err);
              }
              prepareForDestruction(self);
              self.emit('created', self);
              PouchDB$2.emit('created', self.name);
              self.taskqueue.ready(self);
            });
          }
          PouchDB$2.adapters = {};
          PouchDB$2.preferredAdapters = [];
          PouchDB$2.prefix = '_pouch_';
          var eventEmitter = new events.EventEmitter();
          function setUpEventEmitter(Pouch) {
            Object.keys(events.EventEmitter.prototype).forEach(function(key) {
              if (typeof events.EventEmitter.prototype[key] === 'function') {
                Pouch[key] = eventEmitter[key].bind(eventEmitter);
              }
            });
            var destructListeners = Pouch._destructionListeners = new ExportedMap();
            Pouch.on('ref', function onConstructorRef(db) {
              if (!destructListeners.has(db.name)) {
                destructListeners.set(db.name, []);
              }
              destructListeners.get(db.name).push(db);
            });
            Pouch.on('unref', function onConstructorUnref(db) {
              if (!destructListeners.has(db.name)) {
                return;
              }
              var dbList = destructListeners.get(db.name);
              var pos = dbList.indexOf(db);
              if (pos < 0) {
                return;
              }
              dbList.splice(pos, 1);
              if (dbList.length > 1) {
                destructListeners.set(db.name, dbList);
              } else {
                destructListeners["delete"](db.name);
              }
            });
            Pouch.on('destroyed', function onConstructorDestroyed(name) {
              if (!destructListeners.has(name)) {
                return;
              }
              var dbList = destructListeners.get(name);
              destructListeners["delete"](name);
              dbList.forEach(function(db) {
                db.emit('destroyed', true);
              });
            });
          }
          setUpEventEmitter(PouchDB$2);
          PouchDB$2.adapter = function(id, obj, addToPreferredAdapters) {
            if (obj.valid()) {
              PouchDB$2.adapters[id] = obj;
              if (addToPreferredAdapters) {
                PouchDB$2.preferredAdapters.push(id);
              }
            }
          };
          PouchDB$2.plugin = function(obj) {
            if (typeof obj === 'function') {
              obj(PouchDB$2);
            } else if (typeof obj !== 'object' || Object.keys(obj).length === 0) {
              throw new Error('Invalid plugin: got "' + obj + '", expected an object or a function');
            } else {
              Object.keys(obj).forEach(function(id) {
                PouchDB$2.prototype[id] = obj[id];
              });
            }
            if (this.__defaults) {
              PouchDB$2.__defaults = $inject_Object_assign({}, this.__defaults);
            }
            return PouchDB$2;
          };
          PouchDB$2.defaults = function(defaultOpts) {
            function PouchAlt(name, opts) {
              if (!(this instanceof PouchAlt)) {
                return new PouchAlt(name, opts);
              }
              opts = opts || {};
              if (name && typeof name === 'object') {
                opts = name;
                name = opts.name;
                delete opts.name;
              }
              opts = $inject_Object_assign({}, PouchAlt.__defaults, opts);
              PouchDB$2.call(this, name, opts);
            }
            inherits(PouchAlt, PouchDB$2);
            PouchAlt.preferredAdapters = PouchDB$2.preferredAdapters.slice();
            Object.keys(PouchDB$2).forEach(function(key) {
              if (!(key in PouchAlt)) {
                PouchAlt[key] = PouchDB$2[key];
              }
            });
            PouchAlt.__defaults = $inject_Object_assign({}, this.__defaults, defaultOpts);
            return PouchAlt;
          };
          var version = "6.3.2";
          function debugPouch(PouchDB) {
            PouchDB.debug = debug;
            var logs = {};
            PouchDB.on('debug', function(args) {
              var logId = args[0];
              var logArgs = args.slice(1);
              if (!logs[logId]) {
                logs[logId] = debug('pouchdb:' + logId);
              }
              logs[logId].apply(null, logArgs);
            });
          }
          function getFieldFromDoc(doc, parsedField) {
            var value = doc;
            for (var i = 0,
                len = parsedField.length; i < len; i++) {
              var key = parsedField[i];
              value = value[key];
              if (!value) {
                break;
              }
            }
            return value;
          }
          function compare$1(left, right) {
            return left < right ? -1 : left > right ? 1 : 0;
          }
          function parseField(fieldName) {
            var fields = [];
            var current = '';
            for (var i = 0,
                len = fieldName.length; i < len; i++) {
              var ch = fieldName[i];
              if (ch === '.') {
                if (i > 0 && fieldName[i - 1] === '\\') {
                  current = current.substring(0, current.length - 1) + '.';
                } else {
                  fields.push(current);
                  current = '';
                }
              } else {
                current += ch;
              }
            }
            fields.push(current);
            return fields;
          }
          var combinationFields = ['$or', '$nor', '$not'];
          function isCombinationalField(field) {
            return combinationFields.indexOf(field) > -1;
          }
          function getKey(obj) {
            return Object.keys(obj)[0];
          }
          function getValue(obj) {
            return obj[getKey(obj)];
          }
          function mergeAndedSelectors(selectors) {
            var res = {};
            selectors.forEach(function(selector) {
              Object.keys(selector).forEach(function(field) {
                var matcher = selector[field];
                if (typeof matcher !== 'object') {
                  matcher = {$eq: matcher};
                }
                if (isCombinationalField(field)) {
                  if (matcher instanceof Array) {
                    res[field] = matcher.map(function(m) {
                      return mergeAndedSelectors([m]);
                    });
                  } else {
                    res[field] = mergeAndedSelectors([matcher]);
                  }
                } else {
                  var fieldMatchers = res[field] = res[field] || {};
                  Object.keys(matcher).forEach(function(operator) {
                    var value = matcher[operator];
                    if (operator === '$gt' || operator === '$gte') {
                      return mergeGtGte(operator, value, fieldMatchers);
                    } else if (operator === '$lt' || operator === '$lte') {
                      return mergeLtLte(operator, value, fieldMatchers);
                    } else if (operator === '$ne') {
                      return mergeNe(value, fieldMatchers);
                    } else if (operator === '$eq') {
                      return mergeEq(value, fieldMatchers);
                    }
                    fieldMatchers[operator] = value;
                  });
                }
              });
            });
            return res;
          }
          function mergeGtGte(operator, value, fieldMatchers) {
            if (typeof fieldMatchers.$eq !== 'undefined') {
              return;
            }
            if (typeof fieldMatchers.$gte !== 'undefined') {
              if (operator === '$gte') {
                if (value > fieldMatchers.$gte) {
                  fieldMatchers.$gte = value;
                }
              } else {
                if (value >= fieldMatchers.$gte) {
                  delete fieldMatchers.$gte;
                  fieldMatchers.$gt = value;
                }
              }
            } else if (typeof fieldMatchers.$gt !== 'undefined') {
              if (operator === '$gte') {
                if (value > fieldMatchers.$gt) {
                  delete fieldMatchers.$gt;
                  fieldMatchers.$gte = value;
                }
              } else {
                if (value > fieldMatchers.$gt) {
                  fieldMatchers.$gt = value;
                }
              }
            } else {
              fieldMatchers[operator] = value;
            }
          }
          function mergeLtLte(operator, value, fieldMatchers) {
            if (typeof fieldMatchers.$eq !== 'undefined') {
              return;
            }
            if (typeof fieldMatchers.$lte !== 'undefined') {
              if (operator === '$lte') {
                if (value < fieldMatchers.$lte) {
                  fieldMatchers.$lte = value;
                }
              } else {
                if (value <= fieldMatchers.$lte) {
                  delete fieldMatchers.$lte;
                  fieldMatchers.$lt = value;
                }
              }
            } else if (typeof fieldMatchers.$lt !== 'undefined') {
              if (operator === '$lte') {
                if (value < fieldMatchers.$lt) {
                  delete fieldMatchers.$lt;
                  fieldMatchers.$lte = value;
                }
              } else {
                if (value < fieldMatchers.$lt) {
                  fieldMatchers.$lt = value;
                }
              }
            } else {
              fieldMatchers[operator] = value;
            }
          }
          function mergeNe(value, fieldMatchers) {
            if ('$ne' in fieldMatchers) {
              fieldMatchers.$ne.push(value);
            } else {
              fieldMatchers.$ne = [value];
            }
          }
          function mergeEq(value, fieldMatchers) {
            delete fieldMatchers.$gt;
            delete fieldMatchers.$gte;
            delete fieldMatchers.$lt;
            delete fieldMatchers.$lte;
            delete fieldMatchers.$ne;
            fieldMatchers.$eq = value;
          }
          function massageSelector(input) {
            var result = clone(input);
            var wasAnded = false;
            if ('$and' in result) {
              result = mergeAndedSelectors(result['$and']);
              wasAnded = true;
            }
            ['$or', '$nor'].forEach(function(orOrNor) {
              if (orOrNor in result) {
                result[orOrNor].forEach(function(subSelector) {
                  var fields = Object.keys(subSelector);
                  for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    var matcher = subSelector[field];
                    if (typeof matcher !== 'object' || matcher === null) {
                      subSelector[field] = {$eq: matcher};
                    }
                  }
                });
              }
            });
            if ('$not' in result) {
              result['$not'] = mergeAndedSelectors([result['$not']]);
            }
            var fields = Object.keys(result);
            for (var i = 0; i < fields.length; i++) {
              var field = fields[i];
              var matcher = result[field];
              if (typeof matcher !== 'object' || matcher === null) {
                matcher = {$eq: matcher};
              } else if ('$ne' in matcher && !wasAnded) {
                matcher.$ne = [matcher.$ne];
              }
              result[field] = matcher;
            }
            return result;
          }
          function pad(str, padWith, upToLength) {
            var padding = '';
            var targetLength = upToLength - str.length;
            while (padding.length < targetLength) {
              padding += padWith;
            }
            return padding;
          }
          function padLeft(str, padWith, upToLength) {
            var padding = pad(str, padWith, upToLength);
            return padding + str;
          }
          var MIN_MAGNITUDE = -324;
          var MAGNITUDE_DIGITS = 3;
          var SEP = '';
          function collate(a, b) {
            if (a === b) {
              return 0;
            }
            a = normalizeKey(a);
            b = normalizeKey(b);
            var ai = collationIndex(a);
            var bi = collationIndex(b);
            if ((ai - bi) !== 0) {
              return ai - bi;
            }
            switch (typeof a) {
              case 'number':
                return a - b;
              case 'boolean':
                return a < b ? -1 : 1;
              case 'string':
                return stringCollate(a, b);
            }
            return Array.isArray(a) ? arrayCollate(a, b) : objectCollate(a, b);
          }
          function normalizeKey(key) {
            switch (typeof key) {
              case 'undefined':
                return null;
              case 'number':
                if (key === Infinity || key === -Infinity || isNaN(key)) {
                  return null;
                }
                return key;
              case 'object':
                var origKey = key;
                if (Array.isArray(key)) {
                  var len = key.length;
                  key = new Array(len);
                  for (var i = 0; i < len; i++) {
                    key[i] = normalizeKey(origKey[i]);
                  }
                } else if (key instanceof Date) {
                  return key.toJSON();
                } else if (key !== null) {
                  key = {};
                  for (var k in origKey) {
                    if (origKey.hasOwnProperty(k)) {
                      var val = origKey[k];
                      if (typeof val !== 'undefined') {
                        key[k] = normalizeKey(val);
                      }
                    }
                  }
                }
            }
            return key;
          }
          function indexify(key) {
            if (key !== null) {
              switch (typeof key) {
                case 'boolean':
                  return key ? 1 : 0;
                case 'number':
                  return numToIndexableString(key);
                case 'string':
                  return key.replace(/\u0002/g, '\u0002\u0002').replace(/\u0001/g, '\u0001\u0002').replace(/\u0000/g, '\u0001\u0001');
                case 'object':
                  var isArray = Array.isArray(key);
                  var arr = isArray ? key : Object.keys(key);
                  var i = -1;
                  var len = arr.length;
                  var result = '';
                  if (isArray) {
                    while (++i < len) {
                      result += toIndexableString(arr[i]);
                    }
                  } else {
                    while (++i < len) {
                      var objKey = arr[i];
                      result += toIndexableString(objKey) + toIndexableString(key[objKey]);
                    }
                  }
                  return result;
              }
            }
            return '';
          }
          function toIndexableString(key) {
            var zero = '\u0000';
            key = normalizeKey(key);
            return collationIndex(key) + SEP + indexify(key) + zero;
          }
          function arrayCollate(a, b) {
            var len = Math.min(a.length, b.length);
            for (var i = 0; i < len; i++) {
              var sort = collate(a[i], b[i]);
              if (sort !== 0) {
                return sort;
              }
            }
            return (a.length === b.length) ? 0 : (a.length > b.length) ? 1 : -1;
          }
          function stringCollate(a, b) {
            return (a === b) ? 0 : ((a > b) ? 1 : -1);
          }
          function objectCollate(a, b) {
            var ak = Object.keys(a),
                bk = Object.keys(b);
            var len = Math.min(ak.length, bk.length);
            for (var i = 0; i < len; i++) {
              var sort = collate(ak[i], bk[i]);
              if (sort !== 0) {
                return sort;
              }
              sort = collate(a[ak[i]], b[bk[i]]);
              if (sort !== 0) {
                return sort;
              }
            }
            return (ak.length === bk.length) ? 0 : (ak.length > bk.length) ? 1 : -1;
          }
          function collationIndex(x) {
            var id = ['boolean', 'number', 'string', 'object'];
            var idx = id.indexOf(typeof x);
            if (~idx) {
              if (x === null) {
                return 1;
              }
              if (Array.isArray(x)) {
                return 5;
              }
              return idx < 3 ? (idx + 2) : (idx + 3);
            }
            if (Array.isArray(x)) {
              return 5;
            }
          }
          function numToIndexableString(num) {
            if (num === 0) {
              return '1';
            }
            var expFormat = num.toExponential().split(/e\+?/);
            var magnitude = parseInt(expFormat[1], 10);
            var neg = num < 0;
            var result = neg ? '0' : '2';
            var magForComparison = ((neg ? -magnitude : magnitude) - MIN_MAGNITUDE);
            var magString = padLeft((magForComparison).toString(), '0', MAGNITUDE_DIGITS);
            result += SEP + magString;
            var factor = Math.abs(parseFloat(expFormat[0]));
            if (neg) {
              factor = 10 - factor;
            }
            var factorStr = factor.toFixed(20);
            factorStr = factorStr.replace(/\.?0+$/, '');
            result += SEP + factorStr;
            return result;
          }
          function createFieldSorter(sort) {
            function getFieldValuesAsArray(doc) {
              return sort.map(function(sorting) {
                var fieldName = getKey(sorting);
                var parsedField = parseField(fieldName);
                var docFieldValue = getFieldFromDoc(doc, parsedField);
                return docFieldValue;
              });
            }
            return function(aRow, bRow) {
              var aFieldValues = getFieldValuesAsArray(aRow.doc);
              var bFieldValues = getFieldValuesAsArray(bRow.doc);
              var collation = collate(aFieldValues, bFieldValues);
              if (collation !== 0) {
                return collation;
              }
              return compare$1(aRow.doc._id, bRow.doc._id);
            };
          }
          function filterInMemoryFields(rows, requestDef, inMemoryFields) {
            rows = rows.filter(function(row) {
              return rowFilter(row.doc, requestDef.selector, inMemoryFields);
            });
            if (requestDef.sort) {
              var fieldSorter = createFieldSorter(requestDef.sort);
              rows = rows.sort(fieldSorter);
              if (typeof requestDef.sort[0] !== 'string' && getValue(requestDef.sort[0]) === 'desc') {
                rows = rows.reverse();
              }
            }
            if ('limit' in requestDef || 'skip' in requestDef) {
              var skip = requestDef.skip || 0;
              var limit = ('limit' in requestDef ? requestDef.limit : rows.length) + skip;
              rows = rows.slice(skip, limit);
            }
            return rows;
          }
          function rowFilter(doc, selector, inMemoryFields) {
            return inMemoryFields.every(function(field) {
              var matcher = selector[field];
              var parsedField = parseField(field);
              var docFieldValue = getFieldFromDoc(doc, parsedField);
              if (isCombinationalField(field)) {
                return matchCominationalSelector(field, matcher, doc);
              }
              return matchSelector(matcher, doc, parsedField, docFieldValue);
            });
          }
          function matchSelector(matcher, doc, parsedField, docFieldValue) {
            if (!matcher) {
              return true;
            }
            return Object.keys(matcher).every(function(userOperator) {
              var userValue = matcher[userOperator];
              return match(userOperator, doc, userValue, parsedField, docFieldValue);
            });
          }
          function matchCominationalSelector(field, matcher, doc) {
            if (field === '$or') {
              return matcher.some(function(orMatchers) {
                return rowFilter(doc, orMatchers, Object.keys(orMatchers));
              });
            }
            if (field === '$not') {
              return !rowFilter(doc, matcher, Object.keys(matcher));
            }
            return !matcher.find(function(orMatchers) {
              return rowFilter(doc, orMatchers, Object.keys(orMatchers));
            });
          }
          function match(userOperator, doc, userValue, parsedField, docFieldValue) {
            if (!matchers[userOperator]) {
              throw new Error('unknown operator "' + userOperator + '" - should be one of $eq, $lte, $lt, $gt, $gte, $exists, $ne, $in, ' + '$nin, $size, $mod, $regex, $elemMatch, $type, $allMatch or $all');
            }
            return matchers[userOperator](doc, userValue, parsedField, docFieldValue);
          }
          function fieldExists(docFieldValue) {
            return typeof docFieldValue !== 'undefined' && docFieldValue !== null;
          }
          function fieldIsNotUndefined(docFieldValue) {
            return typeof docFieldValue !== 'undefined';
          }
          function modField(docFieldValue, userValue) {
            var divisor = userValue[0];
            var mod = userValue[1];
            if (divisor === 0) {
              throw new Error('Bad divisor, cannot divide by zero');
            }
            if (parseInt(divisor, 10) !== divisor) {
              throw new Error('Divisor is not an integer');
            }
            if (parseInt(mod, 10) !== mod) {
              throw new Error('Modulus is not an integer');
            }
            if (parseInt(docFieldValue, 10) !== docFieldValue) {
              return false;
            }
            return docFieldValue % divisor === mod;
          }
          function arrayContainsValue(docFieldValue, userValue) {
            return userValue.some(function(val) {
              if (docFieldValue instanceof Array) {
                return docFieldValue.indexOf(val) > -1;
              }
              return docFieldValue === val;
            });
          }
          function arrayContainsAllValues(docFieldValue, userValue) {
            return userValue.every(function(val) {
              return docFieldValue.indexOf(val) > -1;
            });
          }
          function arraySize(docFieldValue, userValue) {
            return docFieldValue.length === userValue;
          }
          function regexMatch(docFieldValue, userValue) {
            var re = new RegExp(userValue);
            return re.test(docFieldValue);
          }
          function typeMatch(docFieldValue, userValue) {
            switch (userValue) {
              case 'null':
                return docFieldValue === null;
              case 'boolean':
                return typeof(docFieldValue) === 'boolean';
              case 'number':
                return typeof(docFieldValue) === 'number';
              case 'string':
                return typeof(docFieldValue) === 'string';
              case 'array':
                return docFieldValue instanceof Array;
              case 'object':
                return ({}).toString.call(docFieldValue) === '[object Object]';
            }
            throw new Error(userValue + ' not supported as a type.' + 'Please use one of object, string, array, number, boolean or null.');
          }
          var matchers = {
            '$elemMatch': function(doc, userValue, parsedField, docFieldValue) {
              if (!Array.isArray(docFieldValue)) {
                return false;
              }
              if (docFieldValue.length === 0) {
                return false;
              }
              if (typeof docFieldValue[0] === 'object') {
                return docFieldValue.some(function(val) {
                  return rowFilter(val, userValue, Object.keys(userValue));
                });
              }
              return docFieldValue.some(function(val) {
                return matchSelector(userValue, doc, parsedField, val);
              });
            },
            '$allMatch': function(doc, userValue, parsedField, docFieldValue) {
              if (!Array.isArray(docFieldValue)) {
                return false;
              }
              if (docFieldValue.length === 0) {
                return false;
              }
              if (typeof docFieldValue[0] === 'object') {
                return docFieldValue.every(function(val) {
                  return rowFilter(val, userValue, Object.keys(userValue));
                });
              }
              return docFieldValue.every(function(val) {
                return matchSelector(userValue, doc, parsedField, val);
              });
            },
            '$eq': function(doc, userValue, parsedField, docFieldValue) {
              return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) === 0;
            },
            '$gte': function(doc, userValue, parsedField, docFieldValue) {
              return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) >= 0;
            },
            '$gt': function(doc, userValue, parsedField, docFieldValue) {
              return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) > 0;
            },
            '$lte': function(doc, userValue, parsedField, docFieldValue) {
              return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) <= 0;
            },
            '$lt': function(doc, userValue, parsedField, docFieldValue) {
              return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) < 0;
            },
            '$exists': function(doc, userValue, parsedField, docFieldValue) {
              if (userValue) {
                return fieldIsNotUndefined(docFieldValue);
              }
              return !fieldIsNotUndefined(docFieldValue);
            },
            '$mod': function(doc, userValue, parsedField, docFieldValue) {
              return fieldExists(docFieldValue) && modField(docFieldValue, userValue);
            },
            '$ne': function(doc, userValue, parsedField, docFieldValue) {
              return userValue.every(function(neValue) {
                return collate(docFieldValue, neValue) !== 0;
              });
            },
            '$in': function(doc, userValue, parsedField, docFieldValue) {
              return fieldExists(docFieldValue) && arrayContainsValue(docFieldValue, userValue);
            },
            '$nin': function(doc, userValue, parsedField, docFieldValue) {
              return fieldExists(docFieldValue) && !arrayContainsValue(docFieldValue, userValue);
            },
            '$size': function(doc, userValue, parsedField, docFieldValue) {
              return fieldExists(docFieldValue) && arraySize(docFieldValue, userValue);
            },
            '$all': function(doc, userValue, parsedField, docFieldValue) {
              return Array.isArray(docFieldValue) && arrayContainsAllValues(docFieldValue, userValue);
            },
            '$regex': function(doc, userValue, parsedField, docFieldValue) {
              return fieldExists(docFieldValue) && regexMatch(docFieldValue, userValue);
            },
            '$type': function(doc, userValue, parsedField, docFieldValue) {
              return typeMatch(docFieldValue, userValue);
            }
          };
          function matchesSelector(doc, selector) {
            if (typeof selector !== 'object') {
              throw new Error('Selector error: expected a JSON object');
            }
            selector = massageSelector(selector);
            var row = {'doc': doc};
            var rowsMatched = filterInMemoryFields([row], {'selector': selector}, Object.keys(selector));
            return rowsMatched && rowsMatched.length === 1;
          }
          function evalFilter(input) {
            return scopeEval('"use strict";\nreturn ' + input + ';', {});
          }
          function evalView(input) {
            var code = ['return function(doc) {', '  "use strict";', '  var emitted = false;', '  var emit = function (a, b) {', '    emitted = true;', '  };', '  var view = ' + input + ';', '  view(doc);', '  if (emitted) {', '    return true;', '  }', '};'].join('\n');
            return scopeEval(code, {});
          }
          function validate(opts, callback) {
            if (opts.selector) {
              if (opts.filter && opts.filter !== '_selector') {
                var filterName = typeof opts.filter === 'string' ? opts.filter : 'function';
                return callback(new Error('selector invalid for filter "' + filterName + '"'));
              }
            }
            callback();
          }
          function normalize(opts) {
            if (opts.view && !opts.filter) {
              opts.filter = '_view';
            }
            if (opts.selector && !opts.filter) {
              opts.filter = '_selector';
            }
            if (opts.filter && typeof opts.filter === 'string') {
              if (opts.filter === '_view') {
                opts.view = normalizeDesignDocFunctionName(opts.view);
              } else {
                opts.filter = normalizeDesignDocFunctionName(opts.filter);
              }
            }
          }
          function shouldFilter(changesHandler, opts) {
            return opts.filter && typeof opts.filter === 'string' && !opts.doc_ids && !isRemote(changesHandler.db);
          }
          function filter(changesHandler, opts) {
            var callback = opts.complete;
            if (opts.filter === '_view') {
              if (!opts.view || typeof opts.view !== 'string') {
                var err = createError(BAD_REQUEST, '`view` filter parameter not found or invalid.');
                return callback(err);
              }
              var viewName = parseDesignDocFunctionName(opts.view);
              changesHandler.db.get('_design/' + viewName[0], function(err, ddoc) {
                if (changesHandler.isCancelled) {
                  return callback(null, {status: 'cancelled'});
                }
                if (err) {
                  return callback(generateErrorFromResponse(err));
                }
                var mapFun = ddoc && ddoc.views && ddoc.views[viewName[1]] && ddoc.views[viewName[1]].map;
                if (!mapFun) {
                  return callback(createError(MISSING_DOC, (ddoc.views ? 'missing json key: ' + viewName[1] : 'missing json key: views')));
                }
                opts.filter = evalView(mapFun);
                changesHandler.doChanges(opts);
              });
            } else if (opts.selector) {
              opts.filter = function(doc) {
                return matchesSelector(doc, opts.selector);
              };
              changesHandler.doChanges(opts);
            } else {
              var filterName = parseDesignDocFunctionName(opts.filter);
              changesHandler.db.get('_design/' + filterName[0], function(err, ddoc) {
                if (changesHandler.isCancelled) {
                  return callback(null, {status: 'cancelled'});
                }
                if (err) {
                  return callback(generateErrorFromResponse(err));
                }
                var filterFun = ddoc && ddoc.filters && ddoc.filters[filterName[1]];
                if (!filterFun) {
                  return callback(createError(MISSING_DOC, ((ddoc && ddoc.filters) ? 'missing json key: ' + filterName[1] : 'missing json key: filters')));
                }
                opts.filter = evalFilter(filterFun);
                changesHandler.doChanges(opts);
              });
            }
          }
          function applyChangesFilterPlugin(PouchDB) {
            PouchDB._changesFilterPlugin = {
              validate: validate,
              normalize: normalize,
              shouldFilter: shouldFilter,
              filter: filter
            };
          }
          PouchDB$2.plugin(debugPouch);
          PouchDB$2.plugin(applyChangesFilterPlugin);
          PouchDB$2.version = version;
          var thisAtob = function(str) {
            return atob(str);
          };
          var thisBtoa = function(str) {
            return btoa(str);
          };
          function createBlob(parts, properties) {
            parts = parts || [];
            properties = properties || {};
            try {
              return new Blob(parts, properties);
            } catch (e) {
              if (e.name !== "TypeError") {
                throw e;
              }
              var Builder = typeof BlobBuilder !== 'undefined' ? BlobBuilder : typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder : typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder : WebKitBlobBuilder;
              var builder = new Builder();
              for (var i = 0; i < parts.length; i += 1) {
                builder.append(parts[i]);
              }
              return builder.getBlob(properties.type);
            }
          }
          function binaryStringToArrayBuffer(bin) {
            var length = bin.length;
            var buf = new ArrayBuffer(length);
            var arr = new Uint8Array(buf);
            for (var i = 0; i < length; i++) {
              arr[i] = bin.charCodeAt(i);
            }
            return buf;
          }
          function binStringToBluffer(binString, type) {
            return createBlob([binaryStringToArrayBuffer(binString)], {type: type});
          }
          function b64ToBluffer(b64, type) {
            return binStringToBluffer(thisAtob(b64), type);
          }
          function arrayBufferToBinaryString(buffer) {
            var binary = '';
            var bytes = new Uint8Array(buffer);
            var length = bytes.byteLength;
            for (var i = 0; i < length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            return binary;
          }
          function readAsBinaryString(blob, callback) {
            if (typeof FileReader === 'undefined') {
              return callback(arrayBufferToBinaryString(new FileReaderSync().readAsArrayBuffer(blob)));
            }
            var reader = new FileReader();
            var hasBinaryString = typeof reader.readAsBinaryString === 'function';
            reader.onloadend = function(e) {
              var result = e.target.result || '';
              if (hasBinaryString) {
                return callback(result);
              }
              callback(arrayBufferToBinaryString(result));
            };
            if (hasBinaryString) {
              reader.readAsBinaryString(blob);
            } else {
              reader.readAsArrayBuffer(blob);
            }
          }
          function blobToBinaryString(blobOrBuffer, callback) {
            readAsBinaryString(blobOrBuffer, function(bin) {
              callback(bin);
            });
          }
          function blobToBase64(blobOrBuffer, callback) {
            blobToBinaryString(blobOrBuffer, function(base64) {
              callback(thisBtoa(base64));
            });
          }
          function readAsArrayBuffer(blob, callback) {
            if (typeof FileReader === 'undefined') {
              return callback(new FileReaderSync().readAsArrayBuffer(blob));
            }
            var reader = new FileReader();
            reader.onloadend = function(e) {
              var result = e.target.result || new ArrayBuffer(0);
              callback(result);
            };
            reader.readAsArrayBuffer(blob);
          }
          var DOC_STORE = 'docs';
          var META_STORE = 'meta';
          function idbError(callback) {
            return function(evt) {
              var message = 'unknown_error';
              if (evt.target && evt.target.error) {
                message = evt.target.error.name || evt.target.error.message;
              }
              callback(createError(IDB_ERROR, message, evt.type));
            };
          }
          function processAttachment(name, src, doc, isBinary) {
            delete doc._attachments[name].stub;
            if (isBinary) {
              doc._attachments[name].data = src.attachments[doc._attachments[name].digest].data;
              return PouchPromise.resolve();
            }
            return new PouchPromise(function(resolve) {
              var data = src.attachments[doc._attachments[name].digest].data;
              readAsBinaryString(data, function(binString) {
                doc._attachments[name].data = thisBtoa(binString);
                delete doc._attachments[name].length;
                resolve();
              });
            });
          }
          function openTransactionSafely(idb, stores, mode) {
            try {
              return {txn: idb.transaction(stores, mode)};
            } catch (err) {
              return {error: err};
            }
          }
          var IDB_VERSION = 1;
          function createSchema(db) {
            var docStore = db.createObjectStore(DOC_STORE, {keyPath: 'id'});
            docStore.createIndex('seq', 'seq', {unique: true});
            db.createObjectStore(META_STORE, {keyPath: 'id'});
          }
          var setup = function(openDatabases, api, opts) {
            if (opts.name in openDatabases) {
              return openDatabases[opts.name];
            }
            openDatabases[opts.name] = new PouchPromise(function(resolve) {
              var req = opts.storage ? indexedDB.open(opts.name, {
                version: IDB_VERSION,
                storage: opts.storage
              }) : indexedDB.open(opts.name, IDB_VERSION);
              req.onupgradeneeded = function(e) {
                var db = e.target.result;
                if (e.oldVersion < 1) {
                  createSchema(db);
                }
              };
              req.onsuccess = function(e) {
                var idb = e.target.result;
                idb.onabort = function(e) {
                  console.error('Database has a global failure', e.target.error);
                  delete openDatabases[opts.name];
                  idb.close();
                };
                var metadata = {id: META_STORE};
                var txn = idb.transaction([META_STORE], 'readwrite');
                txn.oncomplete = function() {
                  resolve({
                    idb: idb,
                    metadata: metadata
                  });
                };
                var metaStore = txn.objectStore(META_STORE);
                metaStore.get(META_STORE).onsuccess = function(e) {
                  metadata = e.target.result || metadata;
                  if (!('doc_count' in metadata)) {
                    metadata.doc_count = 0;
                  }
                  if (!('seq' in metadata)) {
                    metadata.seq = 0;
                  }
                  if (!('db_uuid' in metadata)) {
                    metadata.db_uuid = uuid();
                    metaStore.put(metadata);
                  }
                };
              };
            });
            return openDatabases[opts.name];
          };
          var info = function(db, metadata, callback) {
            callback(null, {
              doc_count: metadata.doc_count,
              update_seq: metadata.seq
            });
          };
          var get = function(db, id, opts, callback) {
            var openTxn = openTransactionSafely(db, [DOC_STORE], 'readonly');
            if (openTxn.error) {
              return callback(openTxn.error);
            }
            openTxn.txn.objectStore(DOC_STORE).get(id).onsuccess = function(e) {
              var doc = e.target.result;
              var rev;
              if (!opts.rev) {
                rev = (doc && doc.rev);
              } else {
                rev = opts.latest ? latest(opts.rev, doc.metadata) : opts.rev;
              }
              if (!doc || (doc.deleted && !opts.rev) || !(rev in doc.revs)) {
                callback(createError(MISSING_DOC, 'missing'));
                return;
              }
              var result = doc.revs[rev].data;
              result._id = doc.id;
              result._rev = rev;
              callback(null, {
                doc: result,
                metadata: doc,
                ctx: openTxn
              });
            };
          };
          var getAttachment = function(db, docId, attachId, opts, cb) {
            var openTxn = openTransactionSafely(db, [DOC_STORE], 'readonly');
            if (openTxn.error) {
              return cb(openTxn.error);
            }
            var attachment;
            openTxn.txn.objectStore(DOC_STORE).get(docId).onsuccess = function(e) {
              var doc = e.target.result;
              var rev = opts.rev ? doc.revs[opts.rev].data : doc.data;
              var digest = rev._attachments[attachId].digest;
              attachment = doc.attachments[digest].data;
            };
            openTxn.txn.oncomplete = function() {
              if (opts.binary) {
                cb(null, attachment);
              } else {
                readAsBinaryString(attachment, function(binString) {
                  cb(null, thisBtoa(binString));
                });
              }
            };
            openTxn.txn.onabort = cb;
          };
          function toObject(array) {
            return array.reduce(function(obj, item) {
              obj[item] = true;
              return obj;
            }, {});
          }
          var reservedWords = toObject(['_id', '_rev', '_attachments', '_deleted', '_revisions', '_revs_info', '_conflicts', '_deleted_conflicts', '_local_seq', '_rev_tree', '_replication_id', '_replication_state', '_replication_state_time', '_replication_state_reason', '_replication_stats', '_removed']);
          var dataWords = toObject(['_attachments', '_replication_id', '_replication_state', '_replication_state_time', '_replication_state_reason', '_replication_stats']);
          function parseRevisionInfo(rev$$1) {
            if (!/^\d+-./.test(rev$$1)) {
              return createError(INVALID_REV);
            }
            var idx = rev$$1.indexOf('-');
            var left = rev$$1.substring(0, idx);
            var right = rev$$1.substring(idx + 1);
            return {
              prefix: parseInt(left, 10),
              id: right
            };
          }
          function makeRevTreeFromRevisions(revisions, opts) {
            var pos = revisions.start - revisions.ids.length + 1;
            var revisionIds = revisions.ids;
            var ids = [revisionIds[0], opts, []];
            for (var i = 1,
                len = revisionIds.length; i < len; i++) {
              ids = [revisionIds[i], {status: 'missing'}, [ids]];
            }
            return [{
              pos: pos,
              ids: ids
            }];
          }
          function parseDoc(doc, newEdits) {
            var nRevNum;
            var newRevId;
            var revInfo;
            var opts = {status: 'available'};
            if (doc._deleted) {
              opts.deleted = true;
            }
            if (newEdits) {
              if (!doc._id) {
                doc._id = uuid();
              }
              newRevId = rev();
              if (doc._rev) {
                revInfo = parseRevisionInfo(doc._rev);
                if (revInfo.error) {
                  return revInfo;
                }
                doc._rev_tree = [{
                  pos: revInfo.prefix,
                  ids: [revInfo.id, {status: 'missing'}, [[newRevId, opts, []]]]
                }];
                nRevNum = revInfo.prefix + 1;
              } else {
                doc._rev_tree = [{
                  pos: 1,
                  ids: [newRevId, opts, []]
                }];
                nRevNum = 1;
              }
            } else {
              if (doc._revisions) {
                doc._rev_tree = makeRevTreeFromRevisions(doc._revisions, opts);
                nRevNum = doc._revisions.start;
                newRevId = doc._revisions.ids[0];
              }
              if (!doc._rev_tree) {
                revInfo = parseRevisionInfo(doc._rev);
                if (revInfo.error) {
                  return revInfo;
                }
                nRevNum = revInfo.prefix;
                newRevId = revInfo.id;
                doc._rev_tree = [{
                  pos: nRevNum,
                  ids: [newRevId, opts, []]
                }];
              }
            }
            invalidIdError(doc._id);
            doc._rev = nRevNum + '-' + newRevId;
            var result = {
              metadata: {},
              data: {}
            };
            for (var key in doc) {
              if (Object.prototype.hasOwnProperty.call(doc, key)) {
                var specialKey = key[0] === '_';
                if (specialKey && !reservedWords[key]) {
                  var error = createError(DOC_VALIDATION, key);
                  error.message = DOC_VALIDATION.message + ': ' + key;
                  throw error;
                } else if (specialKey && !dataWords[key]) {
                  result.metadata[key.slice(1)] = doc[key];
                } else {
                  result.data[key] = doc[key];
                }
              }
            }
            return result;
          }
          var setImmediateShim = global.setImmediate || global.setTimeout;
          var MD5_CHUNK_SIZE = 32768;
          function rawToBase64(raw) {
            return thisBtoa(raw);
          }
          function sliceBlob(blob, start, end) {
            if (blob.webkitSlice) {
              return blob.webkitSlice(start, end);
            }
            return blob.slice(start, end);
          }
          function appendBlob(buffer, blob, start, end, callback) {
            if (start > 0 || end < blob.size) {
              blob = sliceBlob(blob, start, end);
            }
            readAsArrayBuffer(blob, function(arrayBuffer) {
              buffer.append(arrayBuffer);
              callback();
            });
          }
          function appendString(buffer, string, start, end, callback) {
            if (start > 0 || end < string.length) {
              string = string.substring(start, end);
            }
            buffer.appendBinary(string);
            callback();
          }
          function binaryMd5(data, callback) {
            var inputIsString = typeof data === 'string';
            var len = inputIsString ? data.length : data.size;
            var chunkSize = Math.min(MD5_CHUNK_SIZE, len);
            var chunks = Math.ceil(len / chunkSize);
            var currentChunk = 0;
            var buffer = inputIsString ? new Md5() : new Md5.ArrayBuffer();
            var append = inputIsString ? appendString : appendBlob;
            function next() {
              setImmediateShim(loadNextChunk);
            }
            function done() {
              var raw = buffer.end(true);
              var base64 = rawToBase64(raw);
              callback(base64);
              buffer.destroy();
            }
            function loadNextChunk() {
              var start = currentChunk * chunkSize;
              var end = start + chunkSize;
              currentChunk++;
              if (currentChunk < chunks) {
                append(buffer, data, start, end, next);
              } else {
                append(buffer, data, start, end, done);
              }
            }
            loadNextChunk();
          }
          var bulkDocs = function(db, req, opts, metadata, dbOpts, idbChanges, callback) {
            var txn;
            var error;
            var results = [];
            var docs = [];
            var lastWriteIndex;
            var revsLimit = dbOpts.revs_limit || 1000;
            function docsRevsLimit(doc) {
              return /^_local/.test(doc.id) ? 1 : revsLimit;
            }
            function rootIsMissing(doc) {
              return doc.rev_tree[0].ids[1].status === 'missing';
            }
            function parseBase64(data) {
              try {
                return atob(data);
              } catch (e) {
                return {error: createError(BAD_ARG, 'Attachment is not a valid base64 string')};
              }
            }
            function fetchExistingDocs(txn, docs) {
              var fetched = 0;
              var oldDocs = {};
              function readDone(e) {
                if (e.target.result) {
                  oldDocs[e.target.result.id] = e.target.result;
                }
                if (++fetched === docs.length) {
                  processDocs(txn, docs, oldDocs);
                }
              }
              docs.forEach(function(doc) {
                txn.objectStore(DOC_STORE).get(doc.id).onsuccess = readDone;
              });
            }
            function processDocs(txn, docs, oldDocs) {
              docs.forEach(function(doc, i) {
                var newDoc;
                if ('was_delete' in opts && !(oldDocs.hasOwnProperty(doc.id))) {
                  newDoc = createError(MISSING_DOC, 'deleted');
                } else if (opts.new_edits && !oldDocs.hasOwnProperty(doc.id) && rootIsMissing(doc)) {
                  newDoc = createError(REV_CONFLICT);
                } else if (oldDocs.hasOwnProperty(doc.id)) {
                  newDoc = update(txn, doc, oldDocs[doc.id]);
                  if (newDoc == false) {
                    return;
                  }
                } else {
                  var merged = merge([], doc.rev_tree[0], docsRevsLimit(doc));
                  doc.rev_tree = merged.tree;
                  doc.stemmedRevs = merged.stemmedRevs;
                  newDoc = doc;
                  newDoc.isNewDoc = true;
                  newDoc.wasDeleted = doc.revs[doc.rev].deleted ? 1 : 0;
                }
                if (newDoc.error) {
                  results[i] = newDoc;
                } else {
                  oldDocs[newDoc.id] = newDoc;
                  lastWriteIndex = i;
                  write(txn, newDoc, i);
                }
              });
            }
            function convertDocFormat(doc) {
              var newDoc = {
                id: doc.metadata.id,
                rev: doc.metadata.rev,
                rev_tree: doc.metadata.rev_tree,
                writtenRev: doc.metadata.rev,
                revs: doc.metadata.revs || {}
              };
              newDoc.revs[newDoc.rev] = {
                data: doc.data,
                deleted: doc.metadata.deleted
              };
              return newDoc;
            }
            function update(txn, doc, oldDoc) {
              if (doc.rev in oldDoc.revs) {
                return false;
              }
              var isRoot = /^1-/.test(doc.rev);
              if (oldDoc.deleted && !doc.deleted && opts.new_edits && isRoot) {
                var tmp = doc.revs[doc.rev].data;
                tmp._rev = oldDoc.rev;
                tmp._id = oldDoc.id;
                doc = convertDocFormat(parseDoc(tmp, opts.new_edits));
              }
              var merged = merge(oldDoc.rev_tree, doc.rev_tree[0], docsRevsLimit(doc));
              doc.stemmedRevs = merged.stemmedRevs;
              doc.rev_tree = merged.tree;
              var revs = oldDoc.revs;
              revs[doc.rev] = doc.revs[doc.rev];
              doc.revs = revs;
              doc.attachments = oldDoc.attachments;
              var inConflict = opts.new_edits && (((oldDoc.deleted && doc.deleted) || (!oldDoc.deleted && merged.conflicts !== 'new_leaf') || (oldDoc.deleted && !doc.deleted && merged.conflicts === 'new_branch')));
              if (inConflict) {
                return createError(REV_CONFLICT);
              }
              doc.wasDeleted = oldDoc.deleted;
              return doc;
            }
            function write(txn, doc, i) {
              var winningRev$$1 = winningRev(doc);
              var isLocal = /^_local/.test(doc.id);
              doc.data = doc.revs[winningRev$$1].data;
              doc.rev = winningRev$$1;
              doc.deleted = doc.revs[winningRev$$1].deleted ? 1 : 0;
              if (!isLocal) {
                doc.seq = ++metadata.seq;
                var delta = 0;
                if (doc.isNewDoc) {
                  delta = doc.deleted ? 0 : 1;
                } else if (doc.wasDeleted !== doc.deleted) {
                  delta = doc.deleted ? -1 : 1;
                }
                metadata.doc_count += delta;
              }
              delete doc.isNewDoc;
              delete doc.wasDeleted;
              if (doc.stemmedRevs) {
                doc.stemmedRevs.forEach(function(rev) {
                  delete doc.revs[rev];
                });
              }
              delete doc.stemmedRevs;
              if (!('attachments' in doc)) {
                doc.attachments = {};
              }
              if (doc.data._attachments) {
                for (var k in doc.data._attachments) {
                  var attachment = doc.data._attachments[k];
                  if (attachment.stub) {
                    if (!(attachment.digest in doc.attachments)) {
                      error = createError(MISSING_STUB);
                      txn.abort();
                      return;
                    }
                    doc.attachments[attachment.digest].revs[doc.writtenRev] = true;
                  } else {
                    doc.attachments[attachment.digest] = attachment;
                    doc.attachments[attachment.digest].revs = {};
                    doc.attachments[attachment.digest].revs[doc.writtenRev] = true;
                    doc.data._attachments[k] = {
                      stub: true,
                      digest: attachment.digest,
                      content_type: attachment.content_type,
                      length: attachment.length,
                      revpos: parseInt(doc.writtenRev, 10)
                    };
                  }
                }
              }
              delete doc.writtenRev;
              if (isLocal && doc.deleted) {
                txn.objectStore(DOC_STORE)["delete"](doc.id).onsuccess = function() {
                  results[i] = {
                    ok: true,
                    id: doc.id,
                    rev: '0-0'
                  };
                };
                updateSeq(i);
                return;
              }
              txn.objectStore(DOC_STORE).put(doc).onsuccess = function() {
                results[i] = {
                  ok: true,
                  id: doc.id,
                  rev: doc.rev
                };
                updateSeq(i);
              };
            }
            function updateSeq(i) {
              if (i === lastWriteIndex) {
                txn.objectStore(META_STORE).put(metadata);
              }
            }
            function preProcessAttachment(attachment) {
              if (attachment.stub) {
                return PouchPromise.resolve(attachment);
              }
              var binData;
              if (typeof attachment.data === 'string') {
                binData = parseBase64(attachment.data);
                if (binData.error) {
                  return PouchPromise.reject(binData.error);
                }
                attachment.data = binStringToBluffer(binData, attachment.content_type);
              } else {
                binData = attachment.data;
              }
              return new PouchPromise(function(resolve) {
                binaryMd5(binData, function(result) {
                  attachment.digest = 'md5-' + result;
                  attachment.length = binData.size || binData.length || 0;
                  resolve(attachment);
                });
              });
            }
            function preProcessAttachments() {
              var promises = docs.map(function(doc) {
                var data = doc.revs[doc.rev].data;
                if (!data._attachments) {
                  return PouchPromise.resolve(data);
                }
                var attachments = Object.keys(data._attachments).map(function(k) {
                  data._attachments[k].name = k;
                  return preProcessAttachment(data._attachments[k]);
                });
                return PouchPromise.all(attachments).then(function(newAttachments) {
                  var processed = {};
                  newAttachments.forEach(function(attachment) {
                    processed[attachment.name] = attachment;
                    delete attachment.name;
                  });
                  data._attachments = processed;
                  return data;
                });
              });
              return PouchPromise.all(promises);
            }
            for (var i = 0,
                len = req.docs.length; i < len; i++) {
              var result;
              try {
                result = parseDoc(req.docs[i], opts.new_edits);
              } catch (err) {
                result = err;
              }
              if (result.error) {
                return callback(result);
              }
              var newDoc = {
                id: result.metadata.id,
                rev: result.metadata.rev,
                rev_tree: result.metadata.rev_tree,
                revs: {}
              };
              newDoc.revs[newDoc.rev] = {
                data: result.data,
                deleted: result.metadata.deleted
              };
              docs.push(convertDocFormat(result));
            }
            preProcessAttachments().then(function() {
              txn = db.transaction([DOC_STORE, META_STORE], 'readwrite');
              txn.onabort = function() {
                callback(error);
              };
              txn.ontimeout = idbError(callback);
              txn.oncomplete = function() {
                idbChanges.notify(dbOpts.name);
                callback(null, results);
              };
              fetchExistingDocs(txn, docs);
            })["catch"](function(err) {
              callback(err);
            });
          };
          function createKeyRange(start, end, inclusiveEnd, key, descending) {
            try {
              if (start && end) {
                if (descending) {
                  return IDBKeyRange.bound(end, start, !inclusiveEnd, false);
                } else {
                  return IDBKeyRange.bound(start, end, false, !inclusiveEnd);
                }
              } else if (start) {
                if (descending) {
                  return IDBKeyRange.upperBound(start);
                } else {
                  return IDBKeyRange.lowerBound(start);
                }
              } else if (end) {
                if (descending) {
                  return IDBKeyRange.lowerBound(end, !inclusiveEnd);
                } else {
                  return IDBKeyRange.upperBound(end, !inclusiveEnd);
                }
              } else if (key) {
                return IDBKeyRange.only(key);
              }
            } catch (e) {
              return {error: e};
            }
            return null;
          }
          function handleKeyRangeError(opts, metadata, err, callback) {
            if (err.name === "DataError" && err.code === 0) {
              return callback(null, {
                total_rows: metadata.doc_count,
                offset: opts.skip,
                rows: []
              });
            }
            callback(createError(IDB_ERROR, err.name, err.message));
          }
          var allDocs = function(idb, metadata, opts, callback) {
            if (opts.limit === 0) {
              return callback(null, {
                total_rows: metadata.doc_count,
                offset: opts.skip,
                rows: []
              });
            }
            var results = [];
            var processing = [];
            var start = 'startkey' in opts ? opts.startkey : false;
            var end = 'endkey' in opts ? opts.endkey : false;
            var key = 'key' in opts ? opts.key : false;
            var skip = opts.skip || 0;
            var limit = typeof opts.limit === 'number' ? opts.limit : -1;
            var inclusiveEnd = opts.inclusive_end !== false;
            var descending = 'descending' in opts && opts.descending ? 'prev' : null;
            var keyRange = createKeyRange(start, end, inclusiveEnd, key, descending);
            if (keyRange && keyRange.error) {
              return handleKeyRangeError(opts, metadata, keyRange.error, callback);
            }
            var txn = idb.transaction([DOC_STORE], 'readonly');
            var docStore = txn.objectStore(DOC_STORE);
            var cursor = descending ? docStore.openCursor(keyRange, descending) : docStore.openCursor(keyRange);
            cursor.onsuccess = function(e) {
              var doc = e.target.result && e.target.result.value;
              if (!doc) {
                return;
              }
              if (/^_local/.test(doc.id)) {
                return e.target.result["continue"]();
              }
              var row = {
                id: doc.id,
                key: doc.id,
                value: {rev: doc.rev}
              };
              function include_doc(row, doc) {
                row.doc = doc.data;
                row.doc._id = doc.id;
                row.doc._rev = doc.rev;
                if (opts.conflicts) {
                  var conflicts = collectConflicts(doc);
                  if (conflicts.length) {
                    row.doc._conflicts = conflicts;
                  }
                }
                if (opts.attachments && doc.data._attachments) {
                  for (var name in doc.data._attachments) {
                    processing.push(processAttachment(name, doc, row.doc, opts.binary));
                  }
                }
              }
              var deleted = doc.deleted;
              if (opts.deleted === 'ok') {
                results.push(row);
                if (deleted) {
                  row.value.deleted = true;
                  row.doc = null;
                } else if (opts.include_docs) {
                  include_doc(row, doc);
                }
              } else if (!deleted && skip-- <= 0) {
                results.push(row);
                if (opts.include_docs) {
                  include_doc(row, doc);
                }
                if (--limit === 0) {
                  return;
                }
              }
              e.target.result["continue"]();
            };
            txn.oncomplete = function() {
              PouchPromise.all(processing).then(function() {
                callback(null, {
                  total_rows: metadata.doc_count,
                  offset: 0,
                  rows: results
                });
              });
            };
          };
          var changes = function(idb, idbChanges, api, dbOpts, opts) {
            if (opts.continuous) {
              var id = dbOpts.name + ':' + uuid();
              idbChanges.addListener(dbOpts.name, id, api, opts);
              idbChanges.notify(dbOpts.name);
              return {cancel: function() {
                  idbChanges.removeListener(dbOpts.name, id);
                }};
            }
            var limit = 'limit' in opts ? opts.limit : -1;
            if (limit === 0) {
              limit = 1;
            }
            var returnDocs = 'return_docs' in opts ? opts.return_docs : 'returnDocs' in opts ? opts.returnDocs : true;
            var openTxn = openTransactionSafely(idb, [DOC_STORE], 'readonly');
            if (openTxn.error) {
              return opts.complete(openTxn.error);
            }
            var store = openTxn.txn.objectStore(DOC_STORE).index('seq');
            var filter = filterChange(opts);
            var received = 0;
            var lastSeq = opts.since || 0;
            var results = [];
            var processing = [];
            function onReqSuccess(e) {
              if (!e.target.result) {
                return;
              }
              var cursor = e.target.result;
              var doc = cursor.value;
              doc.data._id = doc.id;
              doc.data._rev = doc.rev;
              if (doc.deleted) {
                doc.data._deleted = true;
              }
              if (opts.doc_ids && opts.doc_ids.indexOf(doc.id) === -1) {
                return cursor["continue"]();
              }
              var change = opts.processChange(doc.data, doc, opts);
              change.seq = doc.seq;
              lastSeq = doc.seq;
              var filtered = filter(change);
              if (typeof filtered === 'object') {
                return opts.complete(filtered);
              }
              if (filtered) {
                received++;
                if (returnDocs) {
                  results.push(change);
                }
                if (opts.include_docs && opts.attachments && doc.data._attachments) {
                  var promises = [];
                  for (var name in doc.data._attachments) {
                    var p = processAttachment(name, doc, change.doc, opts.binary);
                    promises.push(p);
                    processing.push(p);
                  }
                  PouchPromise.all(promises).then(function() {
                    opts.onChange(change);
                  });
                } else {
                  opts.onChange(change);
                }
              }
              if (received !== limit) {
                cursor["continue"]();
              }
            }
            function onTxnComplete() {
              PouchPromise.all(processing).then(function() {
                opts.complete(null, {
                  results: results,
                  last_seq: lastSeq
                });
              });
            }
            var req;
            if (opts.descending) {
              req = store.openCursor(null, 'prev');
            } else {
              req = store.openCursor(IDBKeyRange.lowerBound(opts.since, true));
            }
            openTxn.txn.oncomplete = onTxnComplete;
            req.onsuccess = onReqSuccess;
          };
          var getRevisionTree = function(db, id, callback) {
            var txn = db.transaction([DOC_STORE], 'readonly');
            var req = txn.objectStore(DOC_STORE).get(id);
            req.onsuccess = function(e) {
              if (!e.target.result) {
                callback(createError(MISSING_DOC));
              } else {
                callback(null, e.target.result.rev_tree);
              }
            };
          };
          var doCompaction = function(idb, id, revs, callback) {
            var txn = idb.transaction([DOC_STORE], 'readwrite');
            txn.objectStore(DOC_STORE).get(id).onsuccess = function(e) {
              var doc = e.target.result;
              traverseRevTree(doc.rev_tree, function(isLeaf, pos, revHash, ctx, opts) {
                var rev = pos + '-' + revHash;
                if (revs.indexOf(rev) !== -1) {
                  opts.status = 'missing';
                }
              });
              var attachments = [];
              revs.forEach(function(rev) {
                if (rev in doc.revs) {
                  if (doc.revs[rev].data._attachments) {
                    for (var k in doc.revs[rev].data._attachments) {
                      attachments.push(doc.revs[rev].data._attachments[k].digest);
                    }
                  }
                  delete doc.revs[rev];
                }
              });
              attachments.forEach(function(digest) {
                revs.forEach(function(rev) {
                  delete doc.attachments[digest].revs[rev];
                });
                if (!Object.keys(doc.attachments[digest].revs).length) {
                  delete doc.attachments[digest];
                }
              });
              txn.objectStore(DOC_STORE).put(doc);
            };
            txn.oncomplete = function() {
              callback();
            };
          };
          var destroy = function(dbOpts, openDatabases, idbChanges, callback) {
            idbChanges.removeAllListeners(dbOpts.name);
            function doDestroy() {
              var req = indexedDB.deleteDatabase(dbOpts.name);
              req.onsuccess = function() {
                delete openDatabases[dbOpts.name];
                callback(null, {ok: true});
              };
            }
            if (dbOpts.name in openDatabases) {
              openDatabases[dbOpts.name].then(function(res) {
                res.idb.close();
                doDestroy();
              });
            } else {
              doDestroy();
            }
          };
          var ADAPTER_NAME = 'indexeddb';
          var idbChanges = new Changes$1();
          var openDatabases = {};
          function IdbPouch(dbOpts, callback) {
            var api = this;
            var metadata = {};
            var $ = function(fun) {
              return function() {
                var args = Array.prototype.slice.call(arguments);
                setup(openDatabases, api, dbOpts).then(function(res) {
                  metadata = res.metadata;
                  args.unshift(res.idb);
                  fun.apply(api, args);
                });
              };
            };
            api._remote = false;
            api.type = function() {
              return ADAPTER_NAME;
            };
            api._id = $(function(idb, cb) {
              cb(null, metadata.db_uuid);
            });
            api._info = $(function(idb, cb) {
              return info(idb, metadata, cb);
            });
            api._get = $(get);
            api._bulkDocs = $(function(idb, req, opts, callback) {
              return bulkDocs(idb, req, opts, metadata, dbOpts, idbChanges, callback);
            });
            api._allDocs = $(function(idb, opts, cb) {
              return allDocs(idb, metadata, opts, cb);
            });
            api._getAttachment = $(function(idb, docId, attachId, attachment, opts, cb) {
              return getAttachment(idb, docId, attachId, opts, cb);
            });
            api._changes = $(function(idb, opts) {
              return changes(idb, idbChanges, api, dbOpts, opts);
            });
            api._getRevisionTree = $(getRevisionTree);
            api._doCompaction = $(doCompaction);
            api._destroy = function(opts, callback) {
              return destroy(dbOpts, openDatabases, idbChanges, callback);
            };
            api._close = $(function(db, cb) {
              delete openDatabases[dbOpts.name];
              db.close();
              cb();
            });
            setTimeout(function() {
              callback(null, api);
            });
          }
          IdbPouch.valid = function() {
            return true;
          };
          var idbPouch = function(PouchDB) {
            PouchDB.adapter(ADAPTER_NAME, IdbPouch, true);
          };
          function wrappedFetch() {
            var wrappedPromise = {};
            var promise = new PouchPromise(function(resolve, reject) {
              wrappedPromise.resolve = resolve;
              wrappedPromise.reject = reject;
            });
            var args = new Array(arguments.length);
            for (var i = 0; i < args.length; i++) {
              args[i] = arguments[i];
            }
            wrappedPromise.promise = promise;
            PouchPromise.resolve().then(function() {
              return fetch.apply(null, args);
            }).then(function(response) {
              wrappedPromise.resolve(response);
            })["catch"](function(error) {
              wrappedPromise.reject(error);
            });
            return wrappedPromise;
          }
          function fetchRequest(options, callback) {
            var wrappedPromise,
                timer,
                response;
            var headers = new Headers();
            var fetchOptions = {
              method: options.method,
              credentials: 'include',
              headers: headers
            };
            if (options.json) {
              headers.set('Accept', 'application/json');
              headers.set('Content-Type', options.headers['Content-Type'] || 'application/json');
            }
            if (options.body && options.processData && typeof options.body !== 'string') {
              fetchOptions.body = JSON.stringify(options.body);
            } else if ('body' in options) {
              fetchOptions.body = options.body;
            } else {
              fetchOptions.body = null;
            }
            Object.keys(options.headers).forEach(function(key) {
              if (options.headers.hasOwnProperty(key)) {
                headers.set(key, options.headers[key]);
              }
            });
            wrappedPromise = wrappedFetch(options.url, fetchOptions);
            if (options.timeout > 0) {
              timer = setTimeout(function() {
                wrappedPromise.reject(new Error('Load timeout for resource: ' + options.url));
              }, options.timeout);
            }
            wrappedPromise.promise.then(function(fetchResponse) {
              response = {statusCode: fetchResponse.status};
              if (options.timeout > 0) {
                clearTimeout(timer);
              }
              if (response.statusCode >= 200 && response.statusCode < 300) {
                return options.binary ? fetchResponse.blob() : fetchResponse.text();
              }
              return fetchResponse.json();
            }).then(function(result) {
              if (response.statusCode >= 200 && response.statusCode < 300) {
                callback(null, response, result);
              } else {
                result.status = response.statusCode;
                callback(result);
              }
            })["catch"](function(error) {
              if (!error) {
                error = new Error('canceled');
              }
              callback(error);
            });
            return {abort: wrappedPromise.reject};
          }
          function xhRequest(options, callback) {
            var xhr,
                timer;
            var timedout = false;
            var abortReq = function() {
              xhr.abort();
              cleanUp();
            };
            var timeoutReq = function() {
              timedout = true;
              xhr.abort();
              cleanUp();
            };
            var ret = {abort: abortReq};
            var cleanUp = function() {
              clearTimeout(timer);
              ret.abort = function() {};
              if (xhr) {
                xhr.onprogress = undefined;
                if (xhr.upload) {
                  xhr.upload.onprogress = undefined;
                }
                xhr.onreadystatechange = undefined;
                xhr = undefined;
              }
            };
            if (options.xhr) {
              xhr = new options.xhr();
            } else {
              xhr = new XMLHttpRequest();
            }
            try {
              xhr.open(options.method, options.url);
            } catch (exception) {
              return callback(new Error(exception.name || 'Url is invalid'));
            }
            xhr.withCredentials = ('withCredentials' in options) ? options.withCredentials : true;
            if (options.method === 'GET') {
              delete options.headers['Content-Type'];
            } else if (options.json) {
              options.headers.Accept = 'application/json';
              options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
              if (options.body && options.processData && typeof options.body !== "string") {
                options.body = JSON.stringify(options.body);
              }
            }
            if (options.binary) {
              xhr.responseType = 'arraybuffer';
            }
            if (!('body' in options)) {
              options.body = null;
            }
            for (var key in options.headers) {
              if (options.headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, options.headers[key]);
              }
            }
            if (options.timeout > 0) {
              timer = setTimeout(timeoutReq, options.timeout);
              xhr.onprogress = function() {
                clearTimeout(timer);
                if (xhr.readyState !== 4) {
                  timer = setTimeout(timeoutReq, options.timeout);
                }
              };
              if (typeof xhr.upload !== 'undefined') {
                xhr.upload.onprogress = xhr.onprogress;
              }
            }
            xhr.onreadystatechange = function() {
              if (xhr.readyState !== 4) {
                return;
              }
              var response = {statusCode: xhr.status};
              if (xhr.status >= 200 && xhr.status < 300) {
                var data;
                if (options.binary) {
                  data = createBlob([xhr.response || ''], {type: xhr.getResponseHeader('Content-Type')});
                } else {
                  data = xhr.responseText;
                }
                callback(null, response, data);
              } else {
                var err = {};
                if (timedout) {
                  err = new Error('ETIMEDOUT');
                  err.code = 'ETIMEDOUT';
                } else if (typeof xhr.response === 'string') {
                  try {
                    err = JSON.parse(xhr.response);
                  } catch (e) {}
                }
                err.status = xhr.status;
                callback(err);
              }
              cleanUp();
            };
            if (options.body && (options.body instanceof Blob)) {
              readAsArrayBuffer(options.body, function(arrayBuffer) {
                xhr.send(arrayBuffer);
              });
            } else {
              xhr.send(options.body);
            }
            return ret;
          }
          function testXhr() {
            try {
              new XMLHttpRequest();
              return true;
            } catch (err) {
              return false;
            }
          }
          var hasXhr = testXhr();
          function ajax$1(options, callback) {
            if (!false && (hasXhr || options.xhr)) {
              return xhRequest(options, callback);
            } else {
              return fetchRequest(options, callback);
            }
          }
          var res$2 = function() {};
          function defaultBody() {
            return '';
          }
          function ajaxCore$1(options, callback) {
            options = clone(options);
            var defaultOptions = {
              method: "GET",
              headers: {},
              json: true,
              processData: true,
              timeout: 10000,
              cache: false
            };
            options = $inject_Object_assign(defaultOptions, options);
            function onSuccess(obj, resp, cb) {
              if (!options.binary && options.json && typeof obj === 'string') {
                try {
                  obj = JSON.parse(obj);
                } catch (e) {
                  return cb(e);
                }
              }
              if (Array.isArray(obj)) {
                obj = obj.map(function(v) {
                  if (v.error || v.missing) {
                    return generateErrorFromResponse(v);
                  } else {
                    return v;
                  }
                });
              }
              if (options.binary) {
                res$2(obj, resp);
              }
              cb(null, obj, resp);
            }
            if (options.json) {
              if (!options.binary) {
                options.headers.Accept = 'application/json';
              }
              options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
            }
            if (options.binary) {
              options.encoding = null;
              options.json = false;
            }
            if (!options.processData) {
              options.json = false;
            }
            return ajax$1(options, function(err, response, body) {
              if (err) {
                return callback(generateErrorFromResponse(err));
              }
              var error;
              var content_type = response.headers && response.headers['content-type'];
              var data = body || defaultBody();
              if (!options.binary && (options.json || !options.processData) && typeof data !== 'object' && (/json/.test(content_type) || (/^[\s]*\{/.test(data) && /\}[\s]*$/.test(data)))) {
                try {
                  data = JSON.parse(data.toString());
                } catch (e) {}
              }
              if (response.statusCode >= 200 && response.statusCode < 300) {
                onSuccess(data, response, callback);
              } else {
                error = generateErrorFromResponse(data);
                error.status = response.statusCode;
                callback(error);
              }
            });
          }
          function ajax(opts, callback) {
            var ua = (navigator && navigator.userAgent) ? navigator.userAgent.toLowerCase() : '';
            var isSafari = ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
            var isIE = ua.indexOf('msie') !== -1;
            var isEdge = ua.indexOf('edge') !== -1;
            var shouldCacheBust = (isSafari || ((isIE || isEdge) && opts.method === 'GET'));
            var cache = 'cache' in opts ? opts.cache : true;
            var isBlobUrl = /^blob:/.test(opts.url);
            if (!isBlobUrl && (shouldCacheBust || !cache)) {
              var hasArgs = opts.url.indexOf('?') !== -1;
              opts.url += (hasArgs ? '&' : '?') + '_nonce=' + Date.now();
            }
            return ajaxCore$1(opts, callback);
          }
          function pool(promiseFactories, limit) {
            return new PouchPromise(function(resolve, reject) {
              var running = 0;
              var current = 0;
              var done = 0;
              var len = promiseFactories.length;
              var err;
              function runNext() {
                running++;
                promiseFactories[current++]().then(onSuccess, onError);
              }
              function doNext() {
                if (++done === len) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                } else {
                  runNextBatch();
                }
              }
              function onSuccess() {
                running--;
                doNext();
              }
              function onError(thisErr) {
                running--;
                err = err || thisErr;
                doNext();
              }
              function runNextBatch() {
                while (running < limit && current < len) {
                  runNext();
                }
              }
              runNextBatch();
            });
          }
          var CHANGES_BATCH_SIZE = 25;
          var MAX_SIMULTANEOUS_REVS = 50;
          var CHANGES_TIMEOUT_BUFFER = 5000;
          var DEFAULT_HEARTBEAT = 10000;
          var supportsBulkGetMap = {};
          function readAttachmentsAsBlobOrBuffer(row) {
            var atts = row.doc && row.doc._attachments;
            if (!atts) {
              return;
            }
            Object.keys(atts).forEach(function(filename) {
              var att = atts[filename];
              att.data = b64ToBluffer(att.data, att.content_type);
            });
          }
          function encodeDocId(id) {
            if (/^_design/.test(id)) {
              return '_design/' + encodeURIComponent(id.slice(8));
            }
            if (/^_local/.test(id)) {
              return '_local/' + encodeURIComponent(id.slice(7));
            }
            return encodeURIComponent(id);
          }
          function preprocessAttachments$2(doc) {
            if (!doc._attachments || !Object.keys(doc._attachments)) {
              return PouchPromise.resolve();
            }
            return PouchPromise.all(Object.keys(doc._attachments).map(function(key) {
              var attachment = doc._attachments[key];
              if (attachment.data && typeof attachment.data !== 'string') {
                return new PouchPromise(function(resolve) {
                  blobToBase64(attachment.data, resolve);
                }).then(function(b64) {
                  attachment.data = b64;
                });
              }
            }));
          }
          function hasUrlPrefix(opts) {
            if (!opts.prefix) {
              return false;
            }
            var protocol = parseUri(opts.prefix).protocol;
            return protocol === 'http' || protocol === 'https';
          }
          function getHost(name, opts) {
            if (hasUrlPrefix(opts)) {
              var dbName = opts.name.substr(opts.prefix.length);
              name = opts.prefix + encodeURIComponent(dbName);
            }
            var uri = parseUri(name);
            if (uri.user || uri.password) {
              uri.auth = {
                username: uri.user,
                password: uri.password
              };
            }
            var parts = uri.path.replace(/(^\/|\/$)/g, '').split('/');
            uri.db = parts.pop();
            if (uri.db.indexOf('%') === -1) {
              uri.db = encodeURIComponent(uri.db);
            }
            uri.path = parts.join('/');
            return uri;
          }
          function genDBUrl(opts, path) {
            return genUrl(opts, opts.db + '/' + path);
          }
          function genUrl(opts, path) {
            var pathDel = !opts.path ? '' : '/';
            return opts.protocol + '://' + opts.host + (opts.port ? (':' + opts.port) : '') + '/' + opts.path + pathDel + path;
          }
          function paramsToStr(params) {
            return '?' + Object.keys(params).map(function(k) {
              return k + '=' + encodeURIComponent(params[k]);
            }).join('&');
          }
          function HttpPouch(opts, callback) {
            var api = this;
            var host = getHost(opts.name, opts);
            var dbUrl = genDBUrl(host, '');
            opts = clone(opts);
            var ajaxOpts = opts.ajax || {};
            if (opts.auth || host.auth) {
              var nAuth = opts.auth || host.auth;
              var str = nAuth.username + ':' + nAuth.password;
              var token = thisBtoa(unescape(encodeURIComponent(str)));
              ajaxOpts.headers = ajaxOpts.headers || {};
              ajaxOpts.headers.Authorization = 'Basic ' + token;
            }
            api._ajax = ajax;
            function ajax$$1(userOpts, options, callback) {
              var reqAjax = userOpts.ajax || {};
              var reqOpts = $inject_Object_assign(clone(ajaxOpts), reqAjax, options);
              var defaultHeaders = clone(ajaxOpts.headers || {});
              reqOpts.headers = $inject_Object_assign(defaultHeaders, reqAjax.headers, options.headers || {});
              if (api.constructor.listeners('debug').length) {
                api.constructor.emit('debug', ['http', reqOpts.method, reqOpts.url]);
              }
              return api._ajax(reqOpts, callback);
            }
            function ajaxPromise(userOpts, opts) {
              return new PouchPromise(function(resolve, reject) {
                ajax$$1(userOpts, opts, function(err, res) {
                  if (err) {
                    return reject(err);
                  }
                  resolve(res);
                });
              });
            }
            function adapterFun$$1(name, fun) {
              return adapterFun(name, getArguments(function(args) {
                setup().then(function() {
                  return fun.apply(this, args);
                })["catch"](function(e) {
                  var callback = args.pop();
                  callback(e);
                });
              }));
            }
            var setupPromise;
            function setup() {
              if (opts.skipSetup || opts.skip_setup) {
                return PouchPromise.resolve();
              }
              if (setupPromise) {
                return setupPromise;
              }
              var checkExists = {
                method: 'GET',
                url: dbUrl
              };
              setupPromise = ajaxPromise({}, checkExists)["catch"](function(err) {
                if (err && err.status && err.status === 404) {
                  explainError(404, 'PouchDB is just detecting if the remote exists.');
                  return ajaxPromise({}, {
                    method: 'PUT',
                    url: dbUrl
                  });
                } else {
                  return PouchPromise.reject(err);
                }
              })["catch"](function(err) {
                if (err && err.status && err.status === 412) {
                  return true;
                }
                return PouchPromise.reject(err);
              });
              setupPromise["catch"](function() {
                setupPromise = null;
              });
              return setupPromise;
            }
            nextTick(function() {
              callback(null, api);
            });
            api._remote = true;
            api.type = function() {
              return 'http';
            };
            api.id = adapterFun$$1('id', function(callback) {
              ajax$$1({}, {
                method: 'GET',
                url: genUrl(host, '')
              }, function(err, result) {
                var uuid$$1 = (result && result.uuid) ? (result.uuid + host.db) : genDBUrl(host, '');
                callback(null, uuid$$1);
              });
            });
            api.request = adapterFun$$1('request', function(options, callback) {
              options.url = genDBUrl(host, options.url);
              ajax$$1({}, options, callback);
            });
            api.compact = adapterFun$$1('compact', function(opts, callback) {
              if (typeof opts === 'function') {
                callback = opts;
                opts = {};
              }
              opts = clone(opts);
              ajax$$1(opts, {
                url: genDBUrl(host, '_compact'),
                method: 'POST'
              }, function() {
                function ping() {
                  api.info(function(err, res) {
                    if (res && !res.compact_running) {
                      callback(null, {ok: true});
                    } else {
                      setTimeout(ping, opts.interval || 200);
                    }
                  });
                }
                ping();
              });
            });
            api.bulkGet = adapterFun('bulkGet', function(opts, callback) {
              var self = this;
              function doBulkGet(cb) {
                var params = {};
                if (opts.revs) {
                  params.revs = true;
                }
                if (opts.attachments) {
                  params.attachments = true;
                }
                if (opts.latest) {
                  params.latest = true;
                }
                ajax$$1(opts, {
                  url: genDBUrl(host, '_bulk_get' + paramsToStr(params)),
                  method: 'POST',
                  body: {docs: opts.docs}
                }, cb);
              }
              function doBulkGetShim() {
                var batchSize = MAX_SIMULTANEOUS_REVS;
                var numBatches = Math.ceil(opts.docs.length / batchSize);
                var numDone = 0;
                var results = new Array(numBatches);
                function onResult(batchNum) {
                  return function(err, res) {
                    results[batchNum] = res.results;
                    if (++numDone === numBatches) {
                      callback(null, {results: flatten(results)});
                    }
                  };
                }
                for (var i = 0; i < numBatches; i++) {
                  var subOpts = pick(opts, ['revs', 'attachments', 'latest']);
                  subOpts.ajax = ajaxOpts;
                  subOpts.docs = opts.docs.slice(i * batchSize, Math.min(opts.docs.length, (i + 1) * batchSize));
                  bulkGet(self, subOpts, onResult(i));
                }
              }
              var dbUrl = genUrl(host, '');
              var supportsBulkGet = supportsBulkGetMap[dbUrl];
              if (typeof supportsBulkGet !== 'boolean') {
                doBulkGet(function(err, res) {
                  if (err) {
                    supportsBulkGetMap[dbUrl] = false;
                    explainError(err.status, 'PouchDB is just detecting if the remote ' + 'supports the _bulk_get API.');
                    doBulkGetShim();
                  } else {
                    supportsBulkGetMap[dbUrl] = true;
                    callback(null, res);
                  }
                });
              } else if (supportsBulkGet) {
                doBulkGet(callback);
              } else {
                doBulkGetShim();
              }
            });
            api._info = function(callback) {
              setup().then(function() {
                ajax$$1({}, {
                  method: 'GET',
                  url: genDBUrl(host, '')
                }, function(err, res) {
                  if (err) {
                    return callback(err);
                  }
                  res.host = genDBUrl(host, '');
                  callback(null, res);
                });
              })["catch"](callback);
            };
            api.get = adapterFun$$1('get', function(id, opts, callback) {
              if (typeof opts === 'function') {
                callback = opts;
                opts = {};
              }
              opts = clone(opts);
              var params = {};
              if (opts.revs) {
                params.revs = true;
              }
              if (opts.revs_info) {
                params.revs_info = true;
              }
              if (opts.latest) {
                params.latest = true;
              }
              if (opts.open_revs) {
                if (opts.open_revs !== "all") {
                  opts.open_revs = JSON.stringify(opts.open_revs);
                }
                params.open_revs = opts.open_revs;
              }
              if (opts.rev) {
                params.rev = opts.rev;
              }
              if (opts.conflicts) {
                params.conflicts = opts.conflicts;
              }
              id = encodeDocId(id);
              var options = {
                method: 'GET',
                url: genDBUrl(host, id + paramsToStr(params))
              };
              function fetchAttachments(doc) {
                var atts = doc._attachments;
                var filenames = atts && Object.keys(atts);
                if (!atts || !filenames.length) {
                  return;
                }
                function fetch(filename) {
                  var att = atts[filename];
                  var path = encodeDocId(doc._id) + '/' + encodeAttachmentId(filename) + '?rev=' + doc._rev;
                  return ajaxPromise(opts, {
                    method: 'GET',
                    url: genDBUrl(host, path),
                    binary: true
                  }).then(function(blob) {
                    if (opts.binary) {
                      return blob;
                    }
                    return new PouchPromise(function(resolve) {
                      blobToBase64(blob, resolve);
                    });
                  }).then(function(data) {
                    delete att.stub;
                    delete att.length;
                    att.data = data;
                  });
                }
                var promiseFactories = filenames.map(function(filename) {
                  return function() {
                    return fetch(filename);
                  };
                });
                return pool(promiseFactories, 5);
              }
              function fetchAllAttachments(docOrDocs) {
                if (Array.isArray(docOrDocs)) {
                  return PouchPromise.all(docOrDocs.map(function(doc) {
                    if (doc.ok) {
                      return fetchAttachments(doc.ok);
                    }
                  }));
                }
                return fetchAttachments(docOrDocs);
              }
              ajaxPromise(opts, options).then(function(res) {
                return PouchPromise.resolve().then(function() {
                  if (opts.attachments) {
                    return fetchAllAttachments(res);
                  }
                }).then(function() {
                  callback(null, res);
                });
              })["catch"](function(e) {
                e.docId = id;
                callback(e);
              });
            });
            api.remove = adapterFun$$1('remove', function(docOrId, optsOrRev, opts, callback) {
              var doc;
              if (typeof optsOrRev === 'string') {
                doc = {
                  _id: docOrId,
                  _rev: optsOrRev
                };
                if (typeof opts === 'function') {
                  callback = opts;
                  opts = {};
                }
              } else {
                doc = docOrId;
                if (typeof optsOrRev === 'function') {
                  callback = optsOrRev;
                  opts = {};
                } else {
                  callback = opts;
                  opts = optsOrRev;
                }
              }
              var rev$$1 = (doc._rev || opts.rev);
              ajax$$1(opts, {
                method: 'DELETE',
                url: genDBUrl(host, encodeDocId(doc._id)) + '?rev=' + rev$$1
              }, callback);
            });
            function encodeAttachmentId(attachmentId) {
              return attachmentId.split("/").map(encodeURIComponent).join("/");
            }
            api.getAttachment = adapterFun$$1('getAttachment', function(docId, attachmentId, opts, callback) {
              if (typeof opts === 'function') {
                callback = opts;
                opts = {};
              }
              var params = opts.rev ? ('?rev=' + opts.rev) : '';
              var url = genDBUrl(host, encodeDocId(docId)) + '/' + encodeAttachmentId(attachmentId) + params;
              ajax$$1(opts, {
                method: 'GET',
                url: url,
                binary: true
              }, callback);
            });
            api.removeAttachment = adapterFun$$1('removeAttachment', function(docId, attachmentId, rev$$1, callback) {
              var url = genDBUrl(host, encodeDocId(docId) + '/' + encodeAttachmentId(attachmentId)) + '?rev=' + rev$$1;
              ajax$$1({}, {
                method: 'DELETE',
                url: url
              }, callback);
            });
            api.putAttachment = adapterFun$$1('putAttachment', function(docId, attachmentId, rev$$1, blob, type, callback) {
              if (typeof type === 'function') {
                callback = type;
                type = blob;
                blob = rev$$1;
                rev$$1 = null;
              }
              var id = encodeDocId(docId) + '/' + encodeAttachmentId(attachmentId);
              var url = genDBUrl(host, id);
              if (rev$$1) {
                url += '?rev=' + rev$$1;
              }
              if (typeof blob === 'string') {
                var binary;
                try {
                  binary = thisAtob(blob);
                } catch (err) {
                  return callback(createError(BAD_ARG, 'Attachment is not a valid base64 string'));
                }
                blob = binary ? binStringToBluffer(binary, type) : '';
              }
              var opts = {
                headers: {'Content-Type': type},
                method: 'PUT',
                url: url,
                processData: false,
                body: blob,
                timeout: ajaxOpts.timeout || 60000
              };
              ajax$$1({}, opts, callback);
            });
            api._bulkDocs = function(req, opts, callback) {
              req.new_edits = opts.new_edits;
              setup().then(function() {
                return PouchPromise.all(req.docs.map(preprocessAttachments$2));
              }).then(function() {
                ajax$$1(opts, {
                  method: 'POST',
                  url: genDBUrl(host, '_bulk_docs'),
                  timeout: opts.timeout,
                  body: req
                }, function(err, results) {
                  if (err) {
                    return callback(err);
                  }
                  results.forEach(function(result) {
                    result.ok = true;
                  });
                  callback(null, results);
                });
              })["catch"](callback);
            };
            api._put = function(doc, opts, callback) {
              setup().then(function() {
                return preprocessAttachments$2(doc);
              }).then(function() {
                ajax$$1(opts, {
                  method: 'PUT',
                  url: genDBUrl(host, encodeDocId(doc._id)),
                  body: doc
                }, function(err, result) {
                  if (err) {
                    err.docId = doc && doc._id;
                    return callback(err);
                  }
                  callback(null, result);
                });
              })["catch"](callback);
            };
            api.allDocs = adapterFun$$1('allDocs', function(opts, callback) {
              if (typeof opts === 'function') {
                callback = opts;
                opts = {};
              }
              opts = clone(opts);
              var params = {};
              var body;
              var method = 'GET';
              if (opts.conflicts) {
                params.conflicts = true;
              }
              if (opts.descending) {
                params.descending = true;
              }
              if (opts.include_docs) {
                params.include_docs = true;
              }
              if (opts.attachments) {
                params.attachments = true;
              }
              if (opts.key) {
                params.key = JSON.stringify(opts.key);
              }
              if (opts.start_key) {
                opts.startkey = opts.start_key;
              }
              if (opts.startkey) {
                params.startkey = JSON.stringify(opts.startkey);
              }
              if (opts.end_key) {
                opts.endkey = opts.end_key;
              }
              if (opts.endkey) {
                params.endkey = JSON.stringify(opts.endkey);
              }
              if (typeof opts.inclusive_end !== 'undefined') {
                params.inclusive_end = !!opts.inclusive_end;
              }
              if (typeof opts.limit !== 'undefined') {
                params.limit = opts.limit;
              }
              if (typeof opts.skip !== 'undefined') {
                params.skip = opts.skip;
              }
              var paramStr = paramsToStr(params);
              if (typeof opts.keys !== 'undefined') {
                method = 'POST';
                body = {keys: opts.keys};
              }
              ajaxPromise(opts, {
                method: method,
                url: genDBUrl(host, '_all_docs' + paramStr),
                body: body
              }).then(function(res) {
                if (opts.include_docs && opts.attachments && opts.binary) {
                  res.rows.forEach(readAttachmentsAsBlobOrBuffer);
                }
                callback(null, res);
              })["catch"](callback);
            });
            api._changes = function(opts) {
              var batchSize = 'batch_size' in opts ? opts.batch_size : CHANGES_BATCH_SIZE;
              opts = clone(opts);
              if (opts.continuous && !('heartbeat' in opts)) {
                opts.heartbeat = DEFAULT_HEARTBEAT;
              }
              var requestTimeout = ('timeout' in opts) ? opts.timeout : ('timeout' in ajaxOpts) ? ajaxOpts.timeout : 30 * 1000;
              if ('timeout' in opts && opts.timeout && (requestTimeout - opts.timeout) < CHANGES_TIMEOUT_BUFFER) {
                requestTimeout = opts.timeout + CHANGES_TIMEOUT_BUFFER;
              }
              if ('heartbeat' in opts && opts.heartbeat && (requestTimeout - opts.heartbeat) < CHANGES_TIMEOUT_BUFFER) {
                requestTimeout = opts.heartbeat + CHANGES_TIMEOUT_BUFFER;
              }
              var params = {};
              if ('timeout' in opts && opts.timeout) {
                params.timeout = opts.timeout;
              }
              var limit = (typeof opts.limit !== 'undefined') ? opts.limit : false;
              var returnDocs;
              if ('return_docs' in opts) {
                returnDocs = opts.return_docs;
              } else if ('returnDocs' in opts) {
                returnDocs = opts.returnDocs;
              } else {
                returnDocs = true;
              }
              var leftToFetch = limit;
              if (opts.style) {
                params.style = opts.style;
              }
              if (opts.include_docs || opts.filter && typeof opts.filter === 'function') {
                params.include_docs = true;
              }
              if (opts.attachments) {
                params.attachments = true;
              }
              if (opts.continuous) {
                params.feed = 'longpoll';
              }
              if (opts.conflicts) {
                params.conflicts = true;
              }
              if (opts.descending) {
                params.descending = true;
              }
              if ('heartbeat' in opts) {
                if (opts.heartbeat) {
                  params.heartbeat = opts.heartbeat;
                }
              }
              if (opts.filter && typeof opts.filter === 'string') {
                params.filter = opts.filter;
              }
              if (opts.view && typeof opts.view === 'string') {
                params.filter = '_view';
                params.view = opts.view;
              }
              if (opts.query_params && typeof opts.query_params === 'object') {
                for (var param_name in opts.query_params) {
                  if (opts.query_params.hasOwnProperty(param_name)) {
                    params[param_name] = opts.query_params[param_name];
                  }
                }
              }
              var method = 'GET';
              var body;
              if (opts.doc_ids) {
                params.filter = '_doc_ids';
                method = 'POST';
                body = {doc_ids: opts.doc_ids};
              } else if (opts.selector) {
                params.filter = '_selector';
                method = 'POST';
                body = {selector: opts.selector};
              }
              var xhr;
              var lastFetchedSeq;
              var fetch = function(since, callback) {
                if (opts.aborted) {
                  return;
                }
                params.since = since;
                if (typeof params.since === "object") {
                  params.since = JSON.stringify(params.since);
                }
                if (opts.descending) {
                  if (limit) {
                    params.limit = leftToFetch;
                  }
                } else {
                  params.limit = (!limit || leftToFetch > batchSize) ? batchSize : leftToFetch;
                }
                var xhrOpts = {
                  method: method,
                  url: genDBUrl(host, '_changes' + paramsToStr(params)),
                  timeout: requestTimeout,
                  body: body
                };
                lastFetchedSeq = since;
                if (opts.aborted) {
                  return;
                }
                setup().then(function() {
                  xhr = ajax$$1(opts, xhrOpts, callback);
                })["catch"](callback);
              };
              var results = {results: []};
              var fetched = function(err, res) {
                if (opts.aborted) {
                  return;
                }
                var raw_results_length = 0;
                if (res && res.results) {
                  raw_results_length = res.results.length;
                  results.last_seq = res.last_seq;
                  var req = {};
                  req.query = opts.query_params;
                  res.results = res.results.filter(function(c) {
                    leftToFetch--;
                    var ret = filterChange(opts)(c);
                    if (ret) {
                      if (opts.include_docs && opts.attachments && opts.binary) {
                        readAttachmentsAsBlobOrBuffer(c);
                      }
                      if (returnDocs) {
                        results.results.push(c);
                      }
                      opts.onChange(c);
                    }
                    return ret;
                  });
                } else if (err) {
                  opts.aborted = true;
                  opts.complete(err);
                  return;
                }
                if (res && res.last_seq) {
                  lastFetchedSeq = res.last_seq;
                }
                var finished = (limit && leftToFetch <= 0) || (res && raw_results_length < batchSize) || (opts.descending);
                if ((opts.continuous && !(limit && leftToFetch <= 0)) || !finished) {
                  nextTick(function() {
                    fetch(lastFetchedSeq, fetched);
                  });
                } else {
                  opts.complete(null, results);
                }
              };
              fetch(opts.since || 0, fetched);
              return {cancel: function() {
                  opts.aborted = true;
                  if (xhr) {
                    xhr.abort();
                  }
                }};
            };
            api.revsDiff = adapterFun$$1('revsDiff', function(req, opts, callback) {
              if (typeof opts === 'function') {
                callback = opts;
                opts = {};
              }
              ajax$$1(opts, {
                method: 'POST',
                url: genDBUrl(host, '_revs_diff'),
                body: req
              }, callback);
            });
            api._close = function(callback) {
              callback();
            };
            api._destroy = function(options, callback) {
              ajax$$1(options, {
                url: genDBUrl(host, ''),
                method: 'DELETE'
              }, function(err, resp) {
                if (err && err.status && err.status !== 404) {
                  return callback(err);
                }
                callback(null, resp);
              });
            };
          }
          HttpPouch.valid = function() {
            return true;
          };
          var httpPouch = function(PouchDB) {
            PouchDB.adapter('http', HttpPouch, false);
            PouchDB.adapter('https', HttpPouch, false);
          };
          function isGenOne(rev$$1) {
            return /^1-/.test(rev$$1);
          }
          function fileHasChanged(localDoc, remoteDoc, filename) {
            return !localDoc._attachments || !localDoc._attachments[filename] || localDoc._attachments[filename].digest !== remoteDoc._attachments[filename].digest;
          }
          function getDocAttachments(db, doc) {
            var filenames = Object.keys(doc._attachments);
            return PouchPromise.all(filenames.map(function(filename) {
              return db.getAttachment(doc._id, filename, {rev: doc._rev});
            }));
          }
          function getDocAttachmentsFromTargetOrSource(target, src, doc) {
            var doCheckForLocalAttachments = isRemote(src) && !isRemote(target);
            var filenames = Object.keys(doc._attachments);
            if (!doCheckForLocalAttachments) {
              return getDocAttachments(src, doc);
            }
            return target.get(doc._id).then(function(localDoc) {
              return PouchPromise.all(filenames.map(function(filename) {
                if (fileHasChanged(localDoc, doc, filename)) {
                  return src.getAttachment(doc._id, filename);
                }
                return target.getAttachment(localDoc._id, filename);
              }));
            })["catch"](function(error) {
              if (error.status !== 404) {
                throw error;
              }
              return getDocAttachments(src, doc);
            });
          }
          function createBulkGetOpts(diffs) {
            var requests = [];
            Object.keys(diffs).forEach(function(id) {
              var missingRevs = diffs[id].missing;
              missingRevs.forEach(function(missingRev) {
                requests.push({
                  id: id,
                  rev: missingRev
                });
              });
            });
            return {
              docs: requests,
              revs: true,
              latest: true
            };
          }
          function getDocs(src, target, diffs, state) {
            diffs = clone(diffs);
            var resultDocs = [],
                ok = true;
            function getAllDocs() {
              var bulkGetOpts = createBulkGetOpts(diffs);
              if (!bulkGetOpts.docs.length) {
                return;
              }
              return src.bulkGet(bulkGetOpts).then(function(bulkGetResponse) {
                if (state.cancelled) {
                  throw new Error('cancelled');
                }
                return PouchPromise.all(bulkGetResponse.results.map(function(bulkGetInfo) {
                  return PouchPromise.all(bulkGetInfo.docs.map(function(doc) {
                    var remoteDoc = doc.ok;
                    if (doc.error) {
                      ok = false;
                    }
                    if (!remoteDoc || !remoteDoc._attachments) {
                      return remoteDoc;
                    }
                    return getDocAttachmentsFromTargetOrSource(target, src, remoteDoc).then(function(attachments) {
                      var filenames = Object.keys(remoteDoc._attachments);
                      attachments.forEach(function(attachment, i) {
                        var att = remoteDoc._attachments[filenames[i]];
                        delete att.stub;
                        delete att.length;
                        att.data = attachment;
                      });
                      return remoteDoc;
                    });
                  }));
                })).then(function(results) {
                  resultDocs = resultDocs.concat(flatten(results).filter(Boolean));
                });
              });
            }
            function hasAttachments(doc) {
              return doc._attachments && Object.keys(doc._attachments).length > 0;
            }
            function hasConflicts(doc) {
              return doc._conflicts && doc._conflicts.length > 0;
            }
            function fetchRevisionOneDocs(ids) {
              return src.allDocs({
                keys: ids,
                include_docs: true,
                conflicts: true
              }).then(function(res) {
                if (state.cancelled) {
                  throw new Error('cancelled');
                }
                res.rows.forEach(function(row) {
                  if (row.deleted || !row.doc || !isGenOne(row.value.rev) || hasAttachments(row.doc) || hasConflicts(row.doc)) {
                    return;
                  }
                  if (row.doc._conflicts) {
                    delete row.doc._conflicts;
                  }
                  resultDocs.push(row.doc);
                  delete diffs[row.id];
                });
              });
            }
            function getRevisionOneDocs() {
              var ids = Object.keys(diffs).filter(function(id) {
                var missing = diffs[id].missing;
                return missing.length === 1 && isGenOne(missing[0]);
              });
              if (ids.length > 0) {
                return fetchRevisionOneDocs(ids);
              }
            }
            function returnResult() {
              return {
                ok: ok,
                docs: resultDocs
              };
            }
            return PouchPromise.resolve().then(getRevisionOneDocs).then(getAllDocs).then(returnResult);
          }
          var CHECKPOINT_VERSION = 1;
          var REPLICATOR = "pouchdb";
          var CHECKPOINT_HISTORY_SIZE = 5;
          var LOWEST_SEQ = 0;
          function updateCheckpoint(db, id, checkpoint, session, returnValue) {
            return db.get(id)["catch"](function(err) {
              if (err.status === 404) {
                if (db.adapter === 'http' || db.adapter === 'https') {
                  explainError(404, 'PouchDB is just checking if a remote checkpoint exists.');
                }
                return {
                  session_id: session,
                  _id: id,
                  history: [],
                  replicator: REPLICATOR,
                  version: CHECKPOINT_VERSION
                };
              }
              throw err;
            }).then(function(doc) {
              if (returnValue.cancelled) {
                return;
              }
              if (doc.last_seq === checkpoint) {
                return;
              }
              doc.history = (doc.history || []).filter(function(item) {
                return item.session_id !== session;
              });
              doc.history.unshift({
                last_seq: checkpoint,
                session_id: session
              });
              doc.history = doc.history.slice(0, CHECKPOINT_HISTORY_SIZE);
              doc.version = CHECKPOINT_VERSION;
              doc.replicator = REPLICATOR;
              doc.session_id = session;
              doc.last_seq = checkpoint;
              return db.put(doc)["catch"](function(err) {
                if (err.status === 409) {
                  return updateCheckpoint(db, id, checkpoint, session, returnValue);
                }
                throw err;
              });
            });
          }
          function Checkpointer(src, target, id, returnValue, opts) {
            this.src = src;
            this.target = target;
            this.id = id;
            this.returnValue = returnValue;
            this.opts = opts;
          }
          Checkpointer.prototype.writeCheckpoint = function(checkpoint, session) {
            var self = this;
            return this.updateTarget(checkpoint, session).then(function() {
              return self.updateSource(checkpoint, session);
            });
          };
          Checkpointer.prototype.updateTarget = function(checkpoint, session) {
            if (this.opts.writeTargetCheckpoint) {
              return updateCheckpoint(this.target, this.id, checkpoint, session, this.returnValue);
            } else {
              return PouchPromise.resolve(true);
            }
          };
          Checkpointer.prototype.updateSource = function(checkpoint, session) {
            if (this.opts.writeSourceCheckpoint) {
              var self = this;
              if (this.readOnlySource) {
                return PouchPromise.resolve(true);
              }
              return updateCheckpoint(this.src, this.id, checkpoint, session, this.returnValue)["catch"](function(err) {
                if (isForbiddenError(err)) {
                  self.readOnlySource = true;
                  return true;
                }
                throw err;
              });
            } else {
              return PouchPromise.resolve(true);
            }
          };
          var comparisons = {
            "undefined": function(targetDoc, sourceDoc) {
              if (collate(targetDoc.last_seq, sourceDoc.last_seq) === 0) {
                return sourceDoc.last_seq;
              }
              return 0;
            },
            "1": function(targetDoc, sourceDoc) {
              return compareReplicationLogs(sourceDoc, targetDoc).last_seq;
            }
          };
          Checkpointer.prototype.getCheckpoint = function() {
            var self = this;
            return self.target.get(self.id).then(function(targetDoc) {
              if (self.readOnlySource) {
                return PouchPromise.resolve(targetDoc.last_seq);
              }
              return self.src.get(self.id).then(function(sourceDoc) {
                if (targetDoc.version !== sourceDoc.version) {
                  return LOWEST_SEQ;
                }
                var version;
                if (targetDoc.version) {
                  version = targetDoc.version.toString();
                } else {
                  version = "undefined";
                }
                if (version in comparisons) {
                  return comparisons[version](targetDoc, sourceDoc);
                }
                return LOWEST_SEQ;
              }, function(err) {
                if (err.status === 404 && targetDoc.last_seq) {
                  return self.src.put({
                    _id: self.id,
                    last_seq: LOWEST_SEQ
                  }).then(function() {
                    return LOWEST_SEQ;
                  }, function(err) {
                    if (isForbiddenError(err)) {
                      self.readOnlySource = true;
                      return targetDoc.last_seq;
                    }
                    return LOWEST_SEQ;
                  });
                }
                throw err;
              });
            })["catch"](function(err) {
              if (err.status !== 404) {
                throw err;
              }
              return LOWEST_SEQ;
            });
          };
          function compareReplicationLogs(srcDoc, tgtDoc) {
            if (srcDoc.session_id === tgtDoc.session_id) {
              return {
                last_seq: srcDoc.last_seq,
                history: srcDoc.history
              };
            }
            return compareReplicationHistory(srcDoc.history, tgtDoc.history);
          }
          function compareReplicationHistory(sourceHistory, targetHistory) {
            var S = sourceHistory[0];
            var sourceRest = sourceHistory.slice(1);
            var T = targetHistory[0];
            var targetRest = targetHistory.slice(1);
            if (!S || targetHistory.length === 0) {
              return {
                last_seq: LOWEST_SEQ,
                history: []
              };
            }
            var sourceId = S.session_id;
            if (hasSessionId(sourceId, targetHistory)) {
              return {
                last_seq: S.last_seq,
                history: sourceHistory
              };
            }
            var targetId = T.session_id;
            if (hasSessionId(targetId, sourceRest)) {
              return {
                last_seq: T.last_seq,
                history: targetRest
              };
            }
            return compareReplicationHistory(sourceRest, targetRest);
          }
          function hasSessionId(sessionId, history) {
            var props = history[0];
            var rest = history.slice(1);
            if (!sessionId || history.length === 0) {
              return false;
            }
            if (sessionId === props.session_id) {
              return true;
            }
            return hasSessionId(sessionId, rest);
          }
          function isForbiddenError(err) {
            return typeof err.status === 'number' && Math.floor(err.status / 100) === 4;
          }
          var STARTING_BACK_OFF = 0;
          function backOff(opts, returnValue, error, callback) {
            if (opts.retry === false) {
              returnValue.emit('error', error);
              returnValue.removeAllListeners();
              return;
            }
            if (typeof opts.back_off_function !== 'function') {
              opts.back_off_function = defaultBackOff;
            }
            returnValue.emit('requestError', error);
            if (returnValue.state === 'active' || returnValue.state === 'pending') {
              returnValue.emit('paused', error);
              returnValue.state = 'stopped';
              var backOffSet = function backoffTimeSet() {
                opts.current_back_off = STARTING_BACK_OFF;
              };
              var removeBackOffSetter = function removeBackOffTimeSet() {
                returnValue.removeListener('active', backOffSet);
              };
              returnValue.once('paused', removeBackOffSetter);
              returnValue.once('active', backOffSet);
            }
            opts.current_back_off = opts.current_back_off || STARTING_BACK_OFF;
            opts.current_back_off = opts.back_off_function(opts.current_back_off);
            setTimeout(callback, opts.current_back_off);
          }
          function sortObjectPropertiesByKey(queryParams) {
            return Object.keys(queryParams).sort(collate).reduce(function(result, key) {
              result[key] = queryParams[key];
              return result;
            }, {});
          }
          function generateReplicationId(src, target, opts) {
            var docIds = opts.doc_ids ? opts.doc_ids.sort(collate) : '';
            var filterFun = opts.filter ? opts.filter.toString() : '';
            var queryParams = '';
            var filterViewName = '';
            var selector = '';
            if (opts.selector) {
              selector = JSON.stringify(opts.selector);
            }
            if (opts.filter && opts.query_params) {
              queryParams = JSON.stringify(sortObjectPropertiesByKey(opts.query_params));
            }
            if (opts.filter && opts.filter === '_view') {
              filterViewName = opts.view.toString();
            }
            return PouchPromise.all([src.id(), target.id()]).then(function(res) {
              var queryData = res[0] + res[1] + filterFun + filterViewName + queryParams + docIds + selector;
              return new PouchPromise(function(resolve) {
                binaryMd5(queryData, resolve);
              });
            }).then(function(md5sum) {
              md5sum = md5sum.replace(/\//g, '.').replace(/\+/g, '_');
              return '_local/' + md5sum;
            });
          }
          function replicate(src, target, opts, returnValue, result) {
            var batches = [];
            var currentBatch;
            var pendingBatch = {
              seq: 0,
              changes: [],
              docs: []
            };
            var writingCheckpoint = false;
            var changesCompleted = false;
            var replicationCompleted = false;
            var last_seq = 0;
            var continuous = opts.continuous || opts.live || false;
            var batch_size = opts.batch_size || 100;
            var batches_limit = opts.batches_limit || 10;
            var changesPending = false;
            var doc_ids = opts.doc_ids;
            var selector = opts.selector;
            var repId;
            var checkpointer;
            var changedDocs = [];
            var session = uuid();
            result = result || {
              ok: true,
              start_time: new Date(),
              docs_read: 0,
              docs_written: 0,
              doc_write_failures: 0,
              errors: []
            };
            var changesOpts = {};
            returnValue.ready(src, target);
            function initCheckpointer() {
              if (checkpointer) {
                return PouchPromise.resolve();
              }
              return generateReplicationId(src, target, opts).then(function(res) {
                repId = res;
                var checkpointOpts = {};
                if (opts.checkpoint === false) {
                  checkpointOpts = {
                    writeSourceCheckpoint: false,
                    writeTargetCheckpoint: false
                  };
                } else if (opts.checkpoint === 'source') {
                  checkpointOpts = {
                    writeSourceCheckpoint: true,
                    writeTargetCheckpoint: false
                  };
                } else if (opts.checkpoint === 'target') {
                  checkpointOpts = {
                    writeSourceCheckpoint: false,
                    writeTargetCheckpoint: true
                  };
                } else {
                  checkpointOpts = {
                    writeSourceCheckpoint: true,
                    writeTargetCheckpoint: true
                  };
                }
                checkpointer = new Checkpointer(src, target, repId, returnValue, checkpointOpts);
              });
            }
            function writeDocs() {
              changedDocs = [];
              if (currentBatch.docs.length === 0) {
                return;
              }
              var docs = currentBatch.docs;
              var bulkOpts = {timeout: opts.timeout};
              return target.bulkDocs({
                docs: docs,
                new_edits: false
              }, bulkOpts).then(function(res) {
                if (returnValue.cancelled) {
                  completeReplication();
                  throw new Error('cancelled');
                }
                var errorsById = Object.create(null);
                res.forEach(function(res) {
                  if (res.error) {
                    errorsById[res.id] = res;
                  }
                });
                var errorsNo = Object.keys(errorsById).length;
                result.doc_write_failures += errorsNo;
                result.docs_written += docs.length - errorsNo;
                docs.forEach(function(doc) {
                  var error = errorsById[doc._id];
                  if (error) {
                    result.errors.push(error);
                    if (error.name === 'unauthorized' || error.name === 'forbidden') {
                      returnValue.emit('denied', clone(error));
                    } else {
                      throw error;
                    }
                  } else {
                    changedDocs.push(doc);
                  }
                });
              }, function(err) {
                result.doc_write_failures += docs.length;
                throw err;
              });
            }
            function finishBatch() {
              if (currentBatch.error) {
                throw new Error('There was a problem getting docs.');
              }
              result.last_seq = last_seq = currentBatch.seq;
              var outResult = clone(result);
              if (changedDocs.length) {
                outResult.docs = changedDocs;
                returnValue.emit('change', outResult);
              }
              writingCheckpoint = true;
              return checkpointer.writeCheckpoint(currentBatch.seq, session).then(function() {
                writingCheckpoint = false;
                if (returnValue.cancelled) {
                  completeReplication();
                  throw new Error('cancelled');
                }
                currentBatch = undefined;
                getChanges();
              })["catch"](function(err) {
                onCheckpointError(err);
                throw err;
              });
            }
            function getDiffs() {
              var diff = {};
              currentBatch.changes.forEach(function(change) {
                if (change.id === "_user/") {
                  return;
                }
                diff[change.id] = change.changes.map(function(x) {
                  return x.rev;
                });
              });
              return target.revsDiff(diff).then(function(diffs) {
                if (returnValue.cancelled) {
                  completeReplication();
                  throw new Error('cancelled');
                }
                currentBatch.diffs = diffs;
              });
            }
            function getBatchDocs() {
              return getDocs(src, target, currentBatch.diffs, returnValue).then(function(got) {
                currentBatch.error = !got.ok;
                got.docs.forEach(function(doc) {
                  delete currentBatch.diffs[doc._id];
                  result.docs_read++;
                  currentBatch.docs.push(doc);
                });
              });
            }
            function startNextBatch() {
              if (returnValue.cancelled || currentBatch) {
                return;
              }
              if (batches.length === 0) {
                processPendingBatch(true);
                return;
              }
              currentBatch = batches.shift();
              getDiffs().then(getBatchDocs).then(writeDocs).then(finishBatch).then(startNextBatch)["catch"](function(err) {
                abortReplication('batch processing terminated with error', err);
              });
            }
            function processPendingBatch(immediate) {
              if (pendingBatch.changes.length === 0) {
                if (batches.length === 0 && !currentBatch) {
                  if ((continuous && changesOpts.live) || changesCompleted) {
                    returnValue.state = 'pending';
                    returnValue.emit('paused');
                  }
                  if (changesCompleted) {
                    completeReplication();
                  }
                }
                return;
              }
              if (immediate || changesCompleted || pendingBatch.changes.length >= batch_size) {
                batches.push(pendingBatch);
                pendingBatch = {
                  seq: 0,
                  changes: [],
                  docs: []
                };
                if (returnValue.state === 'pending' || returnValue.state === 'stopped') {
                  returnValue.state = 'active';
                  returnValue.emit('active');
                }
                startNextBatch();
              }
            }
            function abortReplication(reason, err) {
              if (replicationCompleted) {
                return;
              }
              if (!err.message) {
                err.message = reason;
              }
              result.ok = false;
              result.status = 'aborting';
              batches = [];
              pendingBatch = {
                seq: 0,
                changes: [],
                docs: []
              };
              completeReplication(err);
            }
            function completeReplication(fatalError) {
              if (replicationCompleted) {
                return;
              }
              if (returnValue.cancelled) {
                result.status = 'cancelled';
                if (writingCheckpoint) {
                  return;
                }
              }
              result.status = result.status || 'complete';
              result.end_time = new Date();
              result.last_seq = last_seq;
              replicationCompleted = true;
              if (fatalError) {
                fatalError = createError(fatalError);
                fatalError.result = result;
                if (fatalError.name === 'unauthorized' || fatalError.name === 'forbidden') {
                  returnValue.emit('error', fatalError);
                  returnValue.removeAllListeners();
                } else {
                  backOff(opts, returnValue, fatalError, function() {
                    replicate(src, target, opts, returnValue);
                  });
                }
              } else {
                returnValue.emit('complete', result);
                returnValue.removeAllListeners();
              }
            }
            function onChange(change) {
              if (returnValue.cancelled) {
                return completeReplication();
              }
              var filter = filterChange(opts)(change);
              if (!filter) {
                return;
              }
              pendingBatch.seq = change.seq;
              pendingBatch.changes.push(change);
              processPendingBatch(batches.length === 0 && changesOpts.live);
            }
            function onChangesComplete(changes) {
              changesPending = false;
              if (returnValue.cancelled) {
                return completeReplication();
              }
              if (changes.results.length > 0) {
                changesOpts.since = changes.last_seq;
                getChanges();
                processPendingBatch(true);
              } else {
                var complete = function() {
                  if (continuous) {
                    changesOpts.live = true;
                    getChanges();
                  } else {
                    changesCompleted = true;
                  }
                  processPendingBatch(true);
                };
                if (!currentBatch && changes.results.length === 0) {
                  writingCheckpoint = true;
                  checkpointer.writeCheckpoint(changes.last_seq, session).then(function() {
                    writingCheckpoint = false;
                    result.last_seq = last_seq = changes.last_seq;
                    complete();
                  })["catch"](onCheckpointError);
                } else {
                  complete();
                }
              }
            }
            function onChangesError(err) {
              changesPending = false;
              if (returnValue.cancelled) {
                return completeReplication();
              }
              abortReplication('changes rejected', err);
            }
            function getChanges() {
              if (!(!changesPending && !changesCompleted && batches.length < batches_limit)) {
                return;
              }
              changesPending = true;
              function abortChanges() {
                changes.cancel();
              }
              function removeListener() {
                returnValue.removeListener('cancel', abortChanges);
              }
              if (returnValue._changes) {
                returnValue.removeListener('cancel', returnValue._abortChanges);
                returnValue._changes.cancel();
              }
              returnValue.once('cancel', abortChanges);
              var changes = src.changes(changesOpts).on('change', onChange);
              changes.then(removeListener, removeListener);
              changes.then(onChangesComplete)["catch"](onChangesError);
              if (opts.retry) {
                returnValue._changes = changes;
                returnValue._abortChanges = abortChanges;
              }
            }
            function startChanges() {
              initCheckpointer().then(function() {
                if (returnValue.cancelled) {
                  completeReplication();
                  return;
                }
                return checkpointer.getCheckpoint().then(function(checkpoint) {
                  last_seq = checkpoint;
                  changesOpts = {
                    since: last_seq,
                    limit: batch_size,
                    batch_size: batch_size,
                    style: 'all_docs',
                    doc_ids: doc_ids,
                    selector: selector,
                    return_docs: true
                  };
                  if (opts.filter) {
                    if (typeof opts.filter !== 'string') {
                      changesOpts.include_docs = true;
                    } else {
                      changesOpts.filter = opts.filter;
                    }
                  }
                  if ('heartbeat' in opts) {
                    changesOpts.heartbeat = opts.heartbeat;
                  }
                  if ('timeout' in opts) {
                    changesOpts.timeout = opts.timeout;
                  }
                  if (opts.query_params) {
                    changesOpts.query_params = opts.query_params;
                  }
                  if (opts.view) {
                    changesOpts.view = opts.view;
                  }
                  getChanges();
                });
              })["catch"](function(err) {
                abortReplication('getCheckpoint rejected with ', err);
              });
            }
            function onCheckpointError(err) {
              writingCheckpoint = false;
              abortReplication('writeCheckpoint completed with error', err);
            }
            if (returnValue.cancelled) {
              completeReplication();
              return;
            }
            if (!returnValue._addedListeners) {
              returnValue.once('cancel', completeReplication);
              if (typeof opts.complete === 'function') {
                returnValue.once('error', opts.complete);
                returnValue.once('complete', function(result) {
                  opts.complete(null, result);
                });
              }
              returnValue._addedListeners = true;
            }
            if (typeof opts.since === 'undefined') {
              startChanges();
            } else {
              initCheckpointer().then(function() {
                writingCheckpoint = true;
                return checkpointer.writeCheckpoint(opts.since, session);
              }).then(function() {
                writingCheckpoint = false;
                if (returnValue.cancelled) {
                  completeReplication();
                  return;
                }
                last_seq = opts.since;
                startChanges();
              })["catch"](onCheckpointError);
            }
          }
          inherits(Replication, events.EventEmitter);
          function Replication() {
            events.EventEmitter.call(this);
            this.cancelled = false;
            this.state = 'pending';
            var self = this;
            var promise = new PouchPromise(function(fulfill, reject) {
              self.once('complete', fulfill);
              self.once('error', reject);
            });
            self.then = function(resolve, reject) {
              return promise.then(resolve, reject);
            };
            self["catch"] = function(reject) {
              return promise["catch"](reject);
            };
            self["catch"](function() {});
          }
          Replication.prototype.cancel = function() {
            this.cancelled = true;
            this.state = 'cancelled';
            this.emit('cancel');
          };
          Replication.prototype.ready = function(src, target) {
            var self = this;
            if (self._readyCalled) {
              return;
            }
            self._readyCalled = true;
            function onDestroy() {
              self.cancel();
            }
            src.once('destroyed', onDestroy);
            target.once('destroyed', onDestroy);
            function cleanup() {
              src.removeListener('destroyed', onDestroy);
              target.removeListener('destroyed', onDestroy);
            }
            self.once('complete', cleanup);
          };
          function toPouch(db, opts) {
            var PouchConstructor = opts.PouchConstructor;
            if (typeof db === 'string') {
              return new PouchConstructor(db, opts);
            } else {
              return db;
            }
          }
          function replicateWrapper(src, target, opts, callback) {
            if (typeof opts === 'function') {
              callback = opts;
              opts = {};
            }
            if (typeof opts === 'undefined') {
              opts = {};
            }
            if (opts.doc_ids && !Array.isArray(opts.doc_ids)) {
              throw createError(BAD_REQUEST, "`doc_ids` filter parameter is not a list.");
            }
            opts.complete = callback;
            opts = clone(opts);
            opts.continuous = opts.continuous || opts.live;
            opts.retry = ('retry' in opts) ? opts.retry : false;
            opts.PouchConstructor = opts.PouchConstructor || this;
            var replicateRet = new Replication(opts);
            var srcPouch = toPouch(src, opts);
            var targetPouch = toPouch(target, opts);
            replicate(srcPouch, targetPouch, opts, replicateRet);
            return replicateRet;
          }
          inherits(Sync, events.EventEmitter);
          function sync$1(src, target, opts, callback) {
            if (typeof opts === 'function') {
              callback = opts;
              opts = {};
            }
            if (typeof opts === 'undefined') {
              opts = {};
            }
            opts = clone(opts);
            opts.PouchConstructor = opts.PouchConstructor || this;
            src = toPouch(src, opts);
            target = toPouch(target, opts);
            return new Sync(src, target, opts, callback);
          }
          function Sync(src, target, opts, callback) {
            var self = this;
            this.canceled = false;
            var optsPush = opts.push ? $inject_Object_assign({}, opts, opts.push) : opts;
            var optsPull = opts.pull ? $inject_Object_assign({}, opts, opts.pull) : opts;
            this.push = replicateWrapper(src, target, optsPush);
            this.pull = replicateWrapper(target, src, optsPull);
            this.pushPaused = true;
            this.pullPaused = true;
            function pullChange(change) {
              self.emit('change', {
                direction: 'pull',
                change: change
              });
            }
            function pushChange(change) {
              self.emit('change', {
                direction: 'push',
                change: change
              });
            }
            function pushDenied(doc) {
              self.emit('denied', {
                direction: 'push',
                doc: doc
              });
            }
            function pullDenied(doc) {
              self.emit('denied', {
                direction: 'pull',
                doc: doc
              });
            }
            function pushPaused() {
              self.pushPaused = true;
              if (self.pullPaused) {
                self.emit('paused');
              }
            }
            function pullPaused() {
              self.pullPaused = true;
              if (self.pushPaused) {
                self.emit('paused');
              }
            }
            function pushActive() {
              self.pushPaused = false;
              if (self.pullPaused) {
                self.emit('active', {direction: 'push'});
              }
            }
            function pullActive() {
              self.pullPaused = false;
              if (self.pushPaused) {
                self.emit('active', {direction: 'pull'});
              }
            }
            var removed = {};
            function removeAll(type) {
              return function(event, func) {
                var isChange = event === 'change' && (func === pullChange || func === pushChange);
                var isDenied = event === 'denied' && (func === pullDenied || func === pushDenied);
                var isPaused = event === 'paused' && (func === pullPaused || func === pushPaused);
                var isActive = event === 'active' && (func === pullActive || func === pushActive);
                if (isChange || isDenied || isPaused || isActive) {
                  if (!(event in removed)) {
                    removed[event] = {};
                  }
                  removed[event][type] = true;
                  if (Object.keys(removed[event]).length === 2) {
                    self.removeAllListeners(event);
                  }
                }
              };
            }
            if (opts.live) {
              this.push.on('complete', self.pull.cancel.bind(self.pull));
              this.pull.on('complete', self.push.cancel.bind(self.push));
            }
            function addOneListener(ee, event, listener) {
              if (ee.listeners(event).indexOf(listener) == -1) {
                ee.on(event, listener);
              }
            }
            this.on('newListener', function(event) {
              if (event === 'change') {
                addOneListener(self.pull, 'change', pullChange);
                addOneListener(self.push, 'change', pushChange);
              } else if (event === 'denied') {
                addOneListener(self.pull, 'denied', pullDenied);
                addOneListener(self.push, 'denied', pushDenied);
              } else if (event === 'active') {
                addOneListener(self.pull, 'active', pullActive);
                addOneListener(self.push, 'active', pushActive);
              } else if (event === 'paused') {
                addOneListener(self.pull, 'paused', pullPaused);
                addOneListener(self.push, 'paused', pushPaused);
              }
            });
            this.on('removeListener', function(event) {
              if (event === 'change') {
                self.pull.removeListener('change', pullChange);
                self.push.removeListener('change', pushChange);
              } else if (event === 'denied') {
                self.pull.removeListener('denied', pullDenied);
                self.push.removeListener('denied', pushDenied);
              } else if (event === 'active') {
                self.pull.removeListener('active', pullActive);
                self.push.removeListener('active', pushActive);
              } else if (event === 'paused') {
                self.pull.removeListener('paused', pullPaused);
                self.push.removeListener('paused', pushPaused);
              }
            });
            this.pull.on('removeListener', removeAll('pull'));
            this.push.on('removeListener', removeAll('push'));
            var promise = PouchPromise.all([this.push, this.pull]).then(function(resp) {
              var out = {
                push: resp[0],
                pull: resp[1]
              };
              self.emit('complete', out);
              if (callback) {
                callback(null, out);
              }
              self.removeAllListeners();
              return out;
            }, function(err) {
              self.cancel();
              if (callback) {
                callback(err);
              } else {
                self.emit('error', err);
              }
              self.removeAllListeners();
              if (callback) {
                throw err;
              }
            });
            this.then = function(success, err) {
              return promise.then(success, err);
            };
            this["catch"] = function(err) {
              return promise["catch"](err);
            };
          }
          Sync.prototype.cancel = function() {
            if (!this.canceled) {
              this.canceled = true;
              this.push.cancel();
              this.pull.cancel();
            }
          };
          function replication(PouchDB) {
            PouchDB.replicate = replicateWrapper;
            PouchDB.sync = sync$1;
            Object.defineProperty(PouchDB.prototype, 'replicate', {get: function() {
                var self = this;
                return {
                  from: function(other, opts, callback) {
                    return self.constructor.replicate(other, self, opts, callback);
                  },
                  to: function(other, opts, callback) {
                    return self.constructor.replicate(self, other, opts, callback);
                  }
                };
              }});
            PouchDB.prototype.sync = function(dbName, opts, callback) {
              return this.constructor.sync(this, dbName, opts, callback);
            };
          }
          var next = PouchDB$2.plugin(idbPouch).plugin(httpPouch).plugin(replication);
          module.exports = next;
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {
        "1": 1,
        "10": 10,
        "13": 13,
        "2": 2,
        "4": 4,
        "5": 5,
        "6": 6,
        "7": 7
      }]
    }, {}, [14])(14);
  });
})(require('process'));
