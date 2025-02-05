/* */ 
"use strict";
var toInteger = require('../../../number/to-integer'),
    validValue = require('../../../object/valid-value');
module.exports = function(pos) {
  var str = String(validValue(this)),
      length = str.length,
      first,
      second;
  pos = toInteger(pos);
  if (pos < 0 || pos >= length)
    return undefined;
  first = str.charCodeAt(pos);
  if (first >= 0xd800 && first <= 0xdbff && length > pos + 1) {
    second = str.charCodeAt(pos + 1);
    if (second >= 0xdc00 && second <= 0xdfff) {
      return (first - 0xd800) * 0x400 + second - 0xdc00 + 0x10000;
    }
  }
  return first;
};
