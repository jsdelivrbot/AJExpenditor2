/* */ 
'use strict';
var create = require('./_object-create');
var descriptor = require('./_property-desc');
var setToStringTag = require('./_set-to-string-tag');
var IteratorPrototype = {};
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function() {
  return this;
});
module.exports = function(Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};