/* */ 
"use strict";
var toInteger = require('../../number/to-integer'),
    validValue = require('../../object/valid-value');
module.exports = function(pos) {
  var str = String(validValue(this)),
      size = str.length,
      cuFirst,
      cuSecond,
      nextPos,
      len;
  pos = toInteger(pos);
  if (pos <= -1 || pos >= size)
    return "";
  pos |= 0;
  cuFirst = str.charCodeAt(pos);
  nextPos = pos + 1;
  len = 1;
  if (cuFirst >= 0xd800 && cuFirst <= 0xdbff && size > nextPos) {
    cuSecond = str.charCodeAt(nextPos);
    if (cuSecond >= 0xdc00 && cuSecond <= 0xdfff)
      len = 2;
  }
  return str.slice(pos, pos + len);
};
