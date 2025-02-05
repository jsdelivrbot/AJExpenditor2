/* */ 
'use strict';
exports.__esModule = true;
var _extends3 = require('babel-runtime/helpers/extends');
var _extends4 = _interopRequireDefault(_extends3);
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
var _propTypes = require('prop-types');
var _propTypes2 = _interopRequireDefault(_propTypes);
var _elementType = require('prop-types-extra/lib/elementType');
var _elementType2 = _interopRequireDefault(_elementType);
var _uncontrollable = require('uncontrollable');
var _uncontrollable2 = _interopRequireDefault(_uncontrollable);
var _Grid = require('./Grid');
var _Grid2 = _interopRequireDefault(_Grid);
var _NavbarBrand = require('./NavbarBrand');
var _NavbarBrand2 = _interopRequireDefault(_NavbarBrand);
var _NavbarCollapse = require('./NavbarCollapse');
var _NavbarCollapse2 = _interopRequireDefault(_NavbarCollapse);
var _NavbarHeader = require('./NavbarHeader');
var _NavbarHeader2 = _interopRequireDefault(_NavbarHeader);
var _NavbarToggle = require('./NavbarToggle');
var _NavbarToggle2 = _interopRequireDefault(_NavbarToggle);
var _bootstrapUtils = require('./utils/bootstrapUtils');
var _StyleConfig = require('./utils/StyleConfig');
var _createChainedFunction = require('./utils/createChainedFunction');
var _createChainedFunction2 = _interopRequireDefault(_createChainedFunction);
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {'default': obj};
}
var propTypes = {
  fixedTop: _propTypes2['default'].bool,
  fixedBottom: _propTypes2['default'].bool,
  staticTop: _propTypes2['default'].bool,
  inverse: _propTypes2['default'].bool,
  fluid: _propTypes2['default'].bool,
  componentClass: _elementType2['default'],
  onToggle: _propTypes2['default'].func,
  onSelect: _propTypes2['default'].func,
  collapseOnSelect: _propTypes2['default'].bool,
  expanded: _propTypes2['default'].bool,
  role: _propTypes2['default'].string
};
var defaultProps = {
  componentClass: 'nav',
  fixedTop: false,
  fixedBottom: false,
  staticTop: false,
  inverse: false,
  fluid: false,
  collapseOnSelect: false
};
var childContextTypes = {$bs_navbar: _propTypes2['default'].shape({
    bsClass: _propTypes2['default'].string,
    expanded: _propTypes2['default'].bool,
    onToggle: _propTypes2['default'].func.isRequired,
    onSelect: _propTypes2['default'].func
  })};
var Navbar = function(_React$Component) {
  (0, _inherits3['default'])(Navbar, _React$Component);
  function Navbar(props, context) {
    (0, _classCallCheck3['default'])(this, Navbar);
    var _this = (0, _possibleConstructorReturn3['default'])(this, _React$Component.call(this, props, context));
    _this.handleToggle = _this.handleToggle.bind(_this);
    _this.handleCollapse = _this.handleCollapse.bind(_this);
    return _this;
  }
  Navbar.prototype.getChildContext = function getChildContext() {
    var _props = this.props,
        bsClass = _props.bsClass,
        expanded = _props.expanded,
        onSelect = _props.onSelect,
        collapseOnSelect = _props.collapseOnSelect;
    return {$bs_navbar: {
        bsClass: bsClass,
        expanded: expanded,
        onToggle: this.handleToggle,
        onSelect: (0, _createChainedFunction2['default'])(onSelect, collapseOnSelect ? this.handleCollapse : null)
      }};
  };
  Navbar.prototype.handleCollapse = function handleCollapse() {
    var _props2 = this.props,
        onToggle = _props2.onToggle,
        expanded = _props2.expanded;
    if (expanded) {
      onToggle(false);
    }
  };
  Navbar.prototype.handleToggle = function handleToggle() {
    var _props3 = this.props,
        onToggle = _props3.onToggle,
        expanded = _props3.expanded;
    onToggle(!expanded);
  };
  Navbar.prototype.render = function render() {
    var _extends2;
    var _props4 = this.props,
        Component = _props4.componentClass,
        fixedTop = _props4.fixedTop,
        fixedBottom = _props4.fixedBottom,
        staticTop = _props4.staticTop,
        inverse = _props4.inverse,
        fluid = _props4.fluid,
        className = _props4.className,
        children = _props4.children,
        props = (0, _objectWithoutProperties3['default'])(_props4, ['componentClass', 'fixedTop', 'fixedBottom', 'staticTop', 'inverse', 'fluid', 'className', 'children']);
    var _splitBsPropsAndOmit = (0, _bootstrapUtils.splitBsPropsAndOmit)(props, ['expanded', 'onToggle', 'onSelect', 'collapseOnSelect']),
        bsProps = _splitBsPropsAndOmit[0],
        elementProps = _splitBsPropsAndOmit[1];
    if (elementProps.role === undefined && Component !== 'nav') {
      elementProps.role = 'navigation';
    }
    if (inverse) {
      bsProps.bsStyle = _StyleConfig.Style.INVERSE;
    }
    var classes = (0, _extends4['default'])({}, (0, _bootstrapUtils.getClassSet)(bsProps), (_extends2 = {}, _extends2[(0, _bootstrapUtils.prefix)(bsProps, 'fixed-top')] = fixedTop, _extends2[(0, _bootstrapUtils.prefix)(bsProps, 'fixed-bottom')] = fixedBottom, _extends2[(0, _bootstrapUtils.prefix)(bsProps, 'static-top')] = staticTop, _extends2));
    return _react2['default'].createElement(Component, (0, _extends4['default'])({}, elementProps, {className: (0, _classnames2['default'])(className, classes)}), _react2['default'].createElement(_Grid2['default'], {fluid: fluid}, children));
  };
  return Navbar;
}(_react2['default'].Component);
Navbar.propTypes = propTypes;
Navbar.defaultProps = defaultProps;
Navbar.childContextTypes = childContextTypes;
(0, _bootstrapUtils.bsClass)('navbar', Navbar);
var UncontrollableNavbar = (0, _uncontrollable2['default'])(Navbar, {expanded: 'onToggle'});
function createSimpleWrapper(tag, suffix, displayName) {
  var Wrapper = function Wrapper(_ref, _ref2) {
    var _ref2$$bs_navbar = _ref2.$bs_navbar,
        navbarProps = _ref2$$bs_navbar === undefined ? {bsClass: 'navbar'} : _ref2$$bs_navbar;
    var Component = _ref.componentClass,
        className = _ref.className,
        pullRight = _ref.pullRight,
        pullLeft = _ref.pullLeft,
        props = (0, _objectWithoutProperties3['default'])(_ref, ['componentClass', 'className', 'pullRight', 'pullLeft']);
    return _react2['default'].createElement(Component, (0, _extends4['default'])({}, props, {className: (0, _classnames2['default'])(className, (0, _bootstrapUtils.prefix)(navbarProps, suffix), pullRight && (0, _bootstrapUtils.prefix)(navbarProps, 'right'), pullLeft && (0, _bootstrapUtils.prefix)(navbarProps, 'left'))}));
  };
  Wrapper.displayName = displayName;
  Wrapper.propTypes = {
    componentClass: _elementType2['default'],
    pullRight: _propTypes2['default'].bool,
    pullLeft: _propTypes2['default'].bool
  };
  Wrapper.defaultProps = {
    componentClass: tag,
    pullRight: false,
    pullLeft: false
  };
  Wrapper.contextTypes = {$bs_navbar: _propTypes2['default'].shape({bsClass: _propTypes2['default'].string})};
  return Wrapper;
}
UncontrollableNavbar.Brand = _NavbarBrand2['default'];
UncontrollableNavbar.Header = _NavbarHeader2['default'];
UncontrollableNavbar.Toggle = _NavbarToggle2['default'];
UncontrollableNavbar.Collapse = _NavbarCollapse2['default'];
UncontrollableNavbar.Form = createSimpleWrapper('div', 'form', 'NavbarForm');
UncontrollableNavbar.Text = createSimpleWrapper('p', 'text', 'NavbarText');
UncontrollableNavbar.Link = createSimpleWrapper('a', 'link', 'NavbarLink');
exports['default'] = (0, _bootstrapUtils.bsStyles)([_StyleConfig.Style.DEFAULT, _StyleConfig.Style.INVERSE], _StyleConfig.Style.DEFAULT, UncontrollableNavbar);
module.exports = exports['default'];
