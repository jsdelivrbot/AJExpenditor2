/* */ 
"use strict";
var SubArray = require('../../_sub-array-dummy-safe');
module.exports = function() {
  return (new SubArray()).slice() instanceof SubArray;
};
