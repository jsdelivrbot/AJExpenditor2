/* */ 
(function(process) {
  'use strict';
  exports.__esModule = true;
  var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');
  var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);
  var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');
  var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
  var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');
  var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);
  var _inherits2 = require('babel-runtime/helpers/inherits');
  var _inherits3 = _interopRequireDefault(_inherits2);
  var _extends2 = require('babel-runtime/helpers/extends');
  var _extends3 = _interopRequireDefault(_extends2);
  var _contains = require('dom-helpers/query/contains');
  var _contains2 = _interopRequireDefault(_contains);
  var _react = require('react');
  var _react2 = _interopRequireDefault(_react);
  var _propTypes = require('prop-types');
  var _propTypes2 = _interopRequireDefault(_propTypes);
  var _reactDom = require('react-dom');
  var _reactDom2 = _interopRequireDefault(_reactDom);
  var _warning = require('warning');
  var _warning2 = _interopRequireDefault(_warning);
  var _Overlay = require('./Overlay');
  var _Overlay2 = _interopRequireDefault(_Overlay);
  var _createChainedFunction = require('./utils/createChainedFunction');
  var _createChainedFunction2 = _interopRequireDefault(_createChainedFunction);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {'default': obj};
  }
  function isOneOf(one, of) {
    if (Array.isArray(of)) {
      return of.indexOf(one) >= 0;
    }
    return one === of;
  }
  var triggerType = _propTypes2['default'].oneOf(['click', 'hover', 'focus']);
  var propTypes = (0, _extends3['default'])({}, _Overlay2['default'].propTypes, {
    trigger: _propTypes2['default'].oneOfType([triggerType, _propTypes2['default'].arrayOf(triggerType)]),
    delay: _propTypes2['default'].number,
    delayShow: _propTypes2['default'].number,
    delayHide: _propTypes2['default'].number,
    defaultOverlayShown: _propTypes2['default'].bool,
    overlay: _propTypes2['default'].node.isRequired,
    onBlur: _propTypes2['default'].func,
    onClick: _propTypes2['default'].func,
    onFocus: _propTypes2['default'].func,
    onMouseOut: _propTypes2['default'].func,
    onMouseOver: _propTypes2['default'].func,
    target: _propTypes2['default'].oneOf([null]),
    onHide: _propTypes2['default'].oneOf([null]),
    show: _propTypes2['default'].oneOf([null])
  });
  var defaultProps = {
    defaultOverlayShown: false,
    trigger: ['hover', 'focus']
  };
  var OverlayTrigger = function(_React$Component) {
    (0, _inherits3['default'])(OverlayTrigger, _React$Component);
    function OverlayTrigger(props, context) {
      (0, _classCallCheck3['default'])(this, OverlayTrigger);
      var _this = (0, _possibleConstructorReturn3['default'])(this, _React$Component.call(this, props, context));
      _this.handleToggle = _this.handleToggle.bind(_this);
      _this.handleDelayedShow = _this.handleDelayedShow.bind(_this);
      _this.handleDelayedHide = _this.handleDelayedHide.bind(_this);
      _this.handleHide = _this.handleHide.bind(_this);
      _this.handleMouseOver = function(e) {
        return _this.handleMouseOverOut(_this.handleDelayedShow, e);
      };
      _this.handleMouseOut = function(e) {
        return _this.handleMouseOverOut(_this.handleDelayedHide, e);
      };
      _this._mountNode = null;
      _this.state = {show: props.defaultOverlayShown};
      return _this;
    }
    OverlayTrigger.prototype.componentDidMount = function componentDidMount() {
      this._mountNode = document.createElement('div');
      this.renderOverlay();
    };
    OverlayTrigger.prototype.componentDidUpdate = function componentDidUpdate() {
      this.renderOverlay();
    };
    OverlayTrigger.prototype.componentWillUnmount = function componentWillUnmount() {
      _reactDom2['default'].unmountComponentAtNode(this._mountNode);
      this._mountNode = null;
      clearTimeout(this._hoverShowDelay);
      clearTimeout(this._hoverHideDelay);
    };
    OverlayTrigger.prototype.handleToggle = function handleToggle() {
      if (this.state.show) {
        this.hide();
      } else {
        this.show();
      }
    };
    OverlayTrigger.prototype.handleDelayedShow = function handleDelayedShow() {
      var _this2 = this;
      if (this._hoverHideDelay != null) {
        clearTimeout(this._hoverHideDelay);
        this._hoverHideDelay = null;
        return;
      }
      if (this.state.show || this._hoverShowDelay != null) {
        return;
      }
      var delay = this.props.delayShow != null ? this.props.delayShow : this.props.delay;
      if (!delay) {
        this.show();
        return;
      }
      this._hoverShowDelay = setTimeout(function() {
        _this2._hoverShowDelay = null;
        _this2.show();
      }, delay);
    };
    OverlayTrigger.prototype.handleDelayedHide = function handleDelayedHide() {
      var _this3 = this;
      if (this._hoverShowDelay != null) {
        clearTimeout(this._hoverShowDelay);
        this._hoverShowDelay = null;
        return;
      }
      if (!this.state.show || this._hoverHideDelay != null) {
        return;
      }
      var delay = this.props.delayHide != null ? this.props.delayHide : this.props.delay;
      if (!delay) {
        this.hide();
        return;
      }
      this._hoverHideDelay = setTimeout(function() {
        _this3._hoverHideDelay = null;
        _this3.hide();
      }, delay);
    };
    OverlayTrigger.prototype.handleMouseOverOut = function handleMouseOverOut(handler, e) {
      var target = e.currentTarget;
      var related = e.relatedTarget || e.nativeEvent.toElement;
      if (!related || related !== target && !(0, _contains2['default'])(target, related)) {
        handler(e);
      }
    };
    OverlayTrigger.prototype.handleHide = function handleHide() {
      this.hide();
    };
    OverlayTrigger.prototype.show = function show() {
      this.setState({show: true});
    };
    OverlayTrigger.prototype.hide = function hide() {
      this.setState({show: false});
    };
    OverlayTrigger.prototype.makeOverlay = function makeOverlay(overlay, props) {
      return _react2['default'].createElement(_Overlay2['default'], (0, _extends3['default'])({}, props, {
        show: this.state.show,
        onHide: this.handleHide,
        target: this
      }), overlay);
    };
    OverlayTrigger.prototype.renderOverlay = function renderOverlay() {
      _reactDom2['default'].unstable_renderSubtreeIntoContainer(this, this._overlay, this._mountNode);
    };
    OverlayTrigger.prototype.render = function render() {
      var _props = this.props,
          trigger = _props.trigger,
          overlay = _props.overlay,
          children = _props.children,
          onBlur = _props.onBlur,
          onClick = _props.onClick,
          onFocus = _props.onFocus,
          onMouseOut = _props.onMouseOut,
          onMouseOver = _props.onMouseOver,
          props = (0, _objectWithoutProperties3['default'])(_props, ['trigger', 'overlay', 'children', 'onBlur', 'onClick', 'onFocus', 'onMouseOut', 'onMouseOver']);
      delete props.delay;
      delete props.delayShow;
      delete props.delayHide;
      delete props.defaultOverlayShown;
      var child = _react2['default'].Children.only(children);
      var childProps = child.props;
      var triggerProps = {};
      if (this.state.show) {
        triggerProps['aria-describedby'] = overlay.props.id;
      }
      triggerProps.onClick = (0, _createChainedFunction2['default'])(childProps.onClick, onClick);
      if (isOneOf('click', trigger)) {
        triggerProps.onClick = (0, _createChainedFunction2['default'])(triggerProps.onClick, this.handleToggle);
      }
      if (isOneOf('hover', trigger)) {
        process.env.NODE_ENV !== 'production' ? (0, _warning2['default'])(!(trigger === 'hover'), '[react-bootstrap] Specifying only the `"hover"` trigger limits the ' + 'visibility of the overlay to just mouse users. Consider also ' + 'including the `"focus"` trigger so that touch and keyboard only ' + 'users can see the overlay as well.') : void 0;
        triggerProps.onMouseOver = (0, _createChainedFunction2['default'])(childProps.onMouseOver, onMouseOver, this.handleMouseOver);
        triggerProps.onMouseOut = (0, _createChainedFunction2['default'])(childProps.onMouseOut, onMouseOut, this.handleMouseOut);
      }
      if (isOneOf('focus', trigger)) {
        triggerProps.onFocus = (0, _createChainedFunction2['default'])(childProps.onFocus, onFocus, this.handleDelayedShow);
        triggerProps.onBlur = (0, _createChainedFunction2['default'])(childProps.onBlur, onBlur, this.handleDelayedHide);
      }
      this._overlay = this.makeOverlay(overlay, props);
      return (0, _react.cloneElement)(child, triggerProps);
    };
    return OverlayTrigger;
  }(_react2['default'].Component);
  OverlayTrigger.propTypes = propTypes;
  OverlayTrigger.defaultProps = defaultProps;
  exports['default'] = OverlayTrigger;
  module.exports = exports['default'];
})(require('process'));
