/* */ 
const {tokens} = require('../tokenTypes');
const {SPACE,
  COMMA,
  LENGTH,
  NUMBER,
  ANGLE} = tokens;
const oneOfType = (tokenType) => (functionStream) => {
  const value = functionStream.expect(tokenType);
  functionStream.expectEmpty();
  return value;
};
const singleNumber = oneOfType(NUMBER);
const singleLength = oneOfType(LENGTH);
const singleAngle = oneOfType(ANGLE);
const xyTransformFactory = (tokenType) => (key, valueIfOmitted) => (functionStream) => {
  const x = functionStream.expect(tokenType);
  let y;
  if (functionStream.hasTokens()) {
    functionStream.expect(COMMA);
    y = functionStream.expect(tokenType);
  } else if (valueIfOmitted !== undefined) {
    y = valueIfOmitted;
  } else {
    return x;
  }
  functionStream.expectEmpty();
  return [{[`${key}Y`]: y}, {[`${key}X`]: x}];
};
const xyNumber = xyTransformFactory(NUMBER);
const xyLength = xyTransformFactory(LENGTH);
const xyAngle = xyTransformFactory(ANGLE);
const partTransforms = {
  perspective: singleNumber,
  scale: xyNumber('scale'),
  scaleX: singleNumber,
  scaleY: singleNumber,
  translate: xyLength('translate', 0),
  translateX: singleLength,
  translateY: singleLength,
  rotate: singleAngle,
  rotateX: singleAngle,
  rotateY: singleAngle,
  rotateZ: singleAngle,
  skewX: singleAngle,
  skewY: singleAngle,
  skew: xyAngle('skew', '0deg')
};
module.exports = (tokenStream) => {
  let transforms = [];
  let didParseFirst = false;
  while (tokenStream.hasTokens()) {
    if (didParseFirst)
      tokenStream.expect(SPACE);
    const functionStream = tokenStream.expectFunction();
    const transformName = functionStream.parent.value;
    let transformedValues = partTransforms[transformName](functionStream);
    if (!Array.isArray(transformedValues)) {
      transformedValues = [{[transformName]: transformedValues}];
    }
    transforms = transformedValues.concat(transforms);
    didParseFirst = true;
  }
  return transforms;
};
