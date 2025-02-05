/* */ 
(function(process) {
  'use strict';
  exports.__esModule = true;
  var _createClass = function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps)
        defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();
  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
  } : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };
  var _stringify2 = require('./stringify');
  var _stringify3 = _interopRequireDefault(_stringify2);
  var _warnOnce = require('./warn-once');
  var _warnOnce2 = _interopRequireDefault(_warnOnce);
  var _result = require('./result');
  var _result2 = _interopRequireDefault(_result);
  var _parse = require('./parse');
  var _parse2 = _interopRequireDefault(_parse);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function isPromise(obj) {
    return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && typeof obj.then === 'function';
  }
  var LazyResult = function() {
    function LazyResult(processor, css, opts) {
      _classCallCheck(this, LazyResult);
      this.stringified = false;
      this.processed = false;
      var root = void 0;
      if ((typeof css === 'undefined' ? 'undefined' : _typeof(css)) === 'object' && css.type === 'root') {
        root = css;
      } else if (css instanceof LazyResult || css instanceof _result2.default) {
        root = css.root;
        if (css.map) {
          if (typeof opts.map === 'undefined')
            opts.map = {};
          if (!opts.map.inline)
            opts.map.inline = false;
          opts.map.prev = css.map;
        }
      } else {
        var parser = _parse2.default;
        if (opts.syntax)
          parser = opts.syntax.parse;
        if (opts.parser)
          parser = opts.parser;
        if (parser.parse)
          parser = parser.parse;
        try {
          root = parser(css, opts);
        } catch (error) {
          this.error = error;
        }
      }
      this.result = new _result2.default(processor, root, opts);
    }
    LazyResult.prototype.warnings = function warnings() {
      return this.sync().warnings();
    };
    LazyResult.prototype.toString = function toString() {
      return this.css;
    };
    LazyResult.prototype.then = function then(onFulfilled, onRejected) {
      return this.async().then(onFulfilled, onRejected);
    };
    LazyResult.prototype.catch = function _catch(onRejected) {
      return this.async().catch(onRejected);
    };
    LazyResult.prototype.handleError = function handleError(error, plugin) {
      try {
        this.error = error;
        if (error.name === 'CssSyntaxError' && !error.plugin) {
          error.plugin = plugin.postcssPlugin;
          error.setMessage();
        } else if (plugin.postcssVersion) {
          var pluginName = plugin.postcssPlugin;
          var pluginVer = plugin.postcssVersion;
          var runtimeVer = this.result.processor.version;
          var a = pluginVer.split('.');
          var b = runtimeVer.split('.');
          if (a[0] !== b[0] || parseInt(a[1]) > parseInt(b[1])) {
            (0, _warnOnce2.default)('Your current PostCSS version ' + 'is ' + runtimeVer + ', but ' + pluginName + ' ' + 'uses ' + pluginVer + '. Perhaps this is ' + 'the source of the error below.');
          }
        }
      } catch (err) {
        if (console && console.error)
          console.error(err);
      }
    };
    LazyResult.prototype.asyncTick = function asyncTick(resolve, reject) {
      var _this = this;
      if (this.plugin >= this.processor.plugins.length) {
        this.processed = true;
        return resolve();
      }
      try {
        var plugin = this.processor.plugins[this.plugin];
        var promise = this.run(plugin);
        this.plugin += 1;
        if (isPromise(promise)) {
          promise.then(function() {
            _this.asyncTick(resolve, reject);
          }).catch(function(error) {
            _this.handleError(error, plugin);
            _this.processed = true;
            reject(error);
          });
        } else {
          this.asyncTick(resolve, reject);
        }
      } catch (error) {
        this.processed = true;
        reject(error);
      }
    };
    LazyResult.prototype.async = function async() {
      var _this2 = this;
      if (this.processed) {
        return new Promise(function(resolve, reject) {
          if (_this2.error) {
            reject(_this2.error);
          } else {
            resolve(_this2.stringify());
          }
        });
      }
      if (this.processing) {
        return this.processing;
      }
      this.processing = new Promise(function(resolve, reject) {
        if (_this2.error)
          return reject(_this2.error);
        _this2.plugin = 0;
        _this2.asyncTick(resolve, reject);
      }).then(function() {
        _this2.processed = true;
        return _this2.stringify();
      });
      return this.processing;
    };
    LazyResult.prototype.sync = function sync() {
      var _this3 = this;
      if (this.processed)
        return this.result;
      this.processed = true;
      if (this.processing) {
        throw new Error('Use process(css).then(cb) to work with async plugins');
      }
      if (this.error)
        throw this.error;
      this.result.processor.plugins.forEach(function(plugin) {
        var promise = _this3.run(plugin);
        if (isPromise(promise)) {
          throw new Error('Use process(css).then(cb) to work with async plugins');
        }
      });
      return this.result;
    };
    LazyResult.prototype.run = function run(plugin) {
      this.result.lastPlugin = plugin;
      try {
        return plugin(this.result.root, this.result);
      } catch (error) {
        this.handleError(error, plugin);
        throw error;
      }
    };
    LazyResult.prototype.stringify = function stringify() {
      if (this.stringified)
        return this.result;
      this.stringified = true;
      this.sync();
      var opts = this.result.opts;
      var str = _stringify3.default;
      if (opts.syntax)
        str = opts.syntax.stringify;
      if (opts.stringifier)
        str = opts.stringifier;
      if (str.stringify)
        str = str.stringify;
      var result = '';
      str(this.root, function(i) {
        result += i;
      });
      this.result.css = result;
      return this.result;
    };
    _createClass(LazyResult, [{
      key: 'processor',
      get: function get() {
        return this.result.processor;
      }
    }, {
      key: 'opts',
      get: function get() {
        return this.result.opts;
      }
    }, {
      key: 'css',
      get: function get() {
        return this.stringify().css;
      }
    }, {
      key: 'content',
      get: function get() {
        return this.stringify().content;
      }
    }, {
      key: 'map',
      get: function get() {
        return this.stringify().map;
      }
    }, {
      key: 'root',
      get: function get() {
        return this.sync().root;
      }
    }, {
      key: 'messages',
      get: function get() {
        return this.sync().messages;
      }
    }]);
    return LazyResult;
  }();
  exports.default = LazyResult;
  module.exports = exports['default'];
})(require('process'));
