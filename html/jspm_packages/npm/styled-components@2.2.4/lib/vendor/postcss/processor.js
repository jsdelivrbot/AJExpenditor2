/* */ 
(function(Buffer, process) {
  'use strict';
  exports.__esModule = true;
  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
  } : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };
  var _lazyResult = require('./lazy-result');
  var _lazyResult2 = _interopRequireDefault(_lazyResult);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  var Processor = function() {
    function Processor() {
      var plugins = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      _classCallCheck(this, Processor);
      this.version = '5.2.0';
      this.plugins = this.normalize(plugins);
    }
    Processor.prototype.use = function use(plugin) {
      this.plugins = this.plugins.concat(this.normalize([plugin]));
      return this;
    };
    Processor.prototype.process = function process(css) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return new _lazyResult2.default(this, css, opts);
    };
    Processor.prototype.normalize = function normalize(plugins) {
      var normalized = [];
      plugins.forEach(function(i) {
        if (i.postcss)
          i = i.postcss;
        if ((typeof i === 'undefined' ? 'undefined' : _typeof(i)) === 'object' && Array.isArray(i.plugins)) {
          normalized = normalized.concat(i.plugins);
        } else if (typeof i === 'function') {
          normalized.push(i);
        } else {
          throw new Error(i + ' is not a PostCSS plugin');
        }
      });
      return normalized;
    };
    return Processor;
  }();
  exports.default = Processor;
  module.exports = exports['default'];
})(require('buffer').Buffer, require('process'));
