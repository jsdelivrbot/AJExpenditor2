/* */ 
'use strict';
exports.__esModule = true;
var _extends2 = require('babel-runtime/helpers/extends');
var _extends3 = _interopRequireDefault(_extends2);
var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');
var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);
var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');
var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);
var _inherits2 = require('babel-runtime/helpers/inherits');
var _inherits3 = _interopRequireDefault(_inherits2);
var _classnames = require('classnames');
var _classnames2 = _interopRequireDefault(_classnames);
var _react = require('react');
var _react2 = _interopRequireDefault(_react);
var _BreadcrumbItem = require('./BreadcrumbItem');
var _BreadcrumbItem2 = _interopRequireDefault(_BreadcrumbItem);
var _bootstrapUtils = require('./utils/bootstrapUtils');
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {'default': obj};
}
var Breadcrumb = function(_React$Component) {
  (0, _inherits3['default'])(Breadcrumb, _React$Component);
  function Breadcrumb() {
    (0, _classCallCheck3['default'])(this, Breadcrumb);
    return (0, _possibleConstructorReturn3['default'])(this, _React$Component.apply(this, arguments));
  }
  Breadcrumb.prototype.render = function render() {
    var _props = this.props,
        className = _props.className,
        props = (0, _objectWithoutProperties3['default'])(_props, ['className']);
    var _splitBsProps = (0, _bootstrapUtils.splitBsProps)(props),
        bsProps = _splitBsProps[0],
        elementProps = _splitBsProps[1];
    var classes = (0, _bootstrapUtils.getClassSet)(bsProps);
    return _react2['default'].createElement('ol', (0, _extends3['default'])({}, elementProps, {
      role: 'navigation',
      'aria-label': 'breadcrumbs',
      className: (0, _classnames2['default'])(className, classes)
    }));
  };
  return Breadcrumb;
}(_react2['default'].Component);
Breadcrumb.Item = _BreadcrumbItem2['default'];
exports['default'] = (0, _bootstrapUtils.bsClass)('breadcrumb', Breadcrumb);
module.exports = exports['default'];
