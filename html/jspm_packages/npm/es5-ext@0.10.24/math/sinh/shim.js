/* */ 
"use strict";
var expm1 = require('../expm1/index'),
    abs = Math.abs,
    exp = Math.exp,
    e = Math.E;
module.exports = function(value) {
  if (isNaN(value))
    return NaN;
  value = Number(value);
  if (value === 0)
    return value;
  if (!isFinite(value))
    return value;
  if (abs(value) < 1)
    return (expm1(value) - expm1(-value)) / 2;
  return (exp(value - 1) - exp(-value - 1)) * e / 2;
};
