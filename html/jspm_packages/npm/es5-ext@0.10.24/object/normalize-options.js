/* */ 
(function(process) {
  "use strict";
  var isValue = require('./is-value');
  var forEach = Array.prototype.forEach,
      create = Object.create;
  var process = function(src, obj) {
    var key;
    for (key in src)
      obj[key] = src[key];
  };
  module.exports = function(opts1) {
    var result = create(null);
    forEach.call(arguments, function(options) {
      if (!isValue(options))
        return;
      process(Object(options), result);
    });
    return result;
  };
})(require('process'));
