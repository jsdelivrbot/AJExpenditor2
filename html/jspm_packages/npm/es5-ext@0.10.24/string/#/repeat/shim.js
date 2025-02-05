/* */ 
"use strict";
var value = require('../../../object/valid-value'),
    toInteger = require('../../../number/to-integer');
module.exports = function(count) {
  var str = String(value(this)),
      result;
  count = toInteger(count);
  if (count < 0)
    throw new RangeError("Count must be >= 0");
  if (!isFinite(count))
    throw new RangeError("Count must be < ∞");
  if (!count)
    return "";
  if (count === 1)
    return str;
  result = "";
  if (count & 1)
    result += str;
  while ((count >>>= 1))
    str += str;
  return result + str;
};
