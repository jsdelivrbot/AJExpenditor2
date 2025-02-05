/* */ 
"use strict";
var iteratorSymbol = require('es6-symbol').iterator,
    isArguments = require('../../function/is-arguments'),
    isFunction = require('../../function/is-function'),
    toPosInt = require('../../number/to-pos-integer'),
    callable = require('../../object/valid-callable'),
    validValue = require('../../object/valid-value'),
    isValue = require('../../object/is-value'),
    isString = require('../../string/is-string'),
    isArray = Array.isArray,
    call = Function.prototype.call,
    desc = {
      configurable: true,
      enumerable: true,
      writable: true,
      value: null
    },
    defineProperty = Object.defineProperty;
module.exports = function(arrayLike) {
  var mapFn = arguments[1],
      thisArg = arguments[2],
      Context,
      i,
      j,
      arr,
      length,
      code,
      iterator,
      result,
      getIterator,
      value;
  arrayLike = Object(validValue(arrayLike));
  if (isValue(mapFn))
    callable(mapFn);
  if (!this || this === Array || !isFunction(this)) {
    if (!mapFn) {
      if (isArguments(arrayLike)) {
        length = arrayLike.length;
        if (length !== 1)
          return Array.apply(null, arrayLike);
        arr = new Array(1);
        arr[0] = arrayLike[0];
        return arr;
      }
      if (isArray(arrayLike)) {
        arr = new Array(length = arrayLike.length);
        for (i = 0; i < length; ++i)
          arr[i] = arrayLike[i];
        return arr;
      }
    }
    arr = [];
  } else {
    Context = this;
  }
  if (!isArray(arrayLike)) {
    if ((getIterator = arrayLike[iteratorSymbol]) !== undefined) {
      iterator = callable(getIterator).call(arrayLike);
      if (Context)
        arr = new Context();
      result = iterator.next();
      i = 0;
      while (!result.done) {
        value = mapFn ? call.call(mapFn, thisArg, result.value, i) : result.value;
        if (Context) {
          desc.value = value;
          defineProperty(arr, i, desc);
        } else {
          arr[i] = value;
        }
        result = iterator.next();
        ++i;
      }
      length = i;
    } else if (isString(arrayLike)) {
      length = arrayLike.length;
      if (Context)
        arr = new Context();
      for (i = 0, j = 0; i < length; ++i) {
        value = arrayLike[i];
        if (i + 1 < length) {
          code = value.charCodeAt(0);
          if (code >= 0xd800 && code <= 0xdbff)
            value += arrayLike[++i];
        }
        value = mapFn ? call.call(mapFn, thisArg, value, j) : value;
        if (Context) {
          desc.value = value;
          defineProperty(arr, j, desc);
        } else {
          arr[j] = value;
        }
        ++j;
      }
      length = j;
    }
  }
  if (length === undefined) {
    length = toPosInt(arrayLike.length);
    if (Context)
      arr = new Context(length);
    for (i = 0; i < length; ++i) {
      value = mapFn ? call.call(mapFn, thisArg, arrayLike[i], i) : arrayLike[i];
      if (Context) {
        desc.value = value;
        defineProperty(arr, i, desc);
      } else {
        arr[i] = value;
      }
    }
  }
  if (Context) {
    desc.value = null;
    arr.length = length;
  }
  return arr;
};
