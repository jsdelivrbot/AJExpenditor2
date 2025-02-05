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
  require('./root');
  var _cssSyntaxError = require('./css-syntax-error');
  var _cssSyntaxError2 = _interopRequireDefault(_cssSyntaxError);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  var sequence = 0;
  var Input = function() {
    function Input(css) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      _classCallCheck(this, Input);
      this.css = css.toString();
      if (this.css[0] === '\uFEFF' || this.css[0] === '\uFFFE') {
        this.css = this.css.slice(1);
      }
      if (opts.from) {
        if (/^\w+:\/\//.test(opts.from)) {
          this.file = opts.from;
        } else {
          this.file = path.resolve(opts.from);
        }
      }
      if (!this.file) {
        sequence += 1;
        this.id = '<input css ' + sequence + '>';
      }
      if (this.map)
        this.map.file = this.from;
    }
    Input.prototype.error = function error(message, line, column) {
      var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var result = void 0;
      var origin = this.origin(line, column);
      if (origin) {
        result = new _cssSyntaxError2.default(message, origin.line, origin.column, origin.source, origin.file, opts.plugin);
      } else {
        result = new _cssSyntaxError2.default(message, line, column, this.css, this.file, opts.plugin);
      }
      result.input = {
        line: line,
        column: column,
        source: this.css
      };
      if (this.file)
        result.input.file = this.file;
      return result;
    };
    Input.prototype.origin = function origin(line, column) {
      if (!this.map)
        return false;
      var consumer = this.map.consumer();
      var from = consumer.originalPositionFor({
        line: line,
        column: column
      });
      if (!from.source)
        return false;
      var result = {
        file: this.mapResolve(from.source),
        line: from.line,
        column: from.column
      };
      var source = consumer.sourceContentFor(from.source);
      if (source)
        result.source = source;
      return result;
    };
    Input.prototype.mapResolve = function mapResolve(file) {
      if (/^\w+:\/\//.test(file)) {
        return file;
      } else {
        return path.resolve(this.map.consumer().sourceRoot || '.', file);
      }
    };
    _createClass(Input, [{
      key: 'from',
      get: function get() {
        return this.file || this.id;
      }
    }]);
    return Input;
  }();
  exports.default = Input;
  module.exports = exports['default'];
})(require('process'));
