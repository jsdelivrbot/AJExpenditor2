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
var _propTypes = require('prop-types');
var _propTypes2 = _interopRequireDefault(_propTypes);
var _CarouselCaption = require('./CarouselCaption');
var _CarouselCaption2 = _interopRequireDefault(_CarouselCaption);
var _CarouselItem = require('./CarouselItem');
var _CarouselItem2 = _interopRequireDefault(_CarouselItem);
var _Glyphicon = require('./Glyphicon');
var _Glyphicon2 = _interopRequireDefault(_Glyphicon);
var _SafeAnchor = require('./SafeAnchor');
var _SafeAnchor2 = _interopRequireDefault(_SafeAnchor);
var _bootstrapUtils = require('./utils/bootstrapUtils');
var _ValidComponentChildren = require('./utils/ValidComponentChildren');
var _ValidComponentChildren2 = _interopRequireDefault(_ValidComponentChildren);
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {'default': obj};
}
var propTypes = {
  slide: _propTypes2['default'].bool,
  indicators: _propTypes2['default'].bool,
  interval: _propTypes2['default'].number,
  controls: _propTypes2['default'].bool,
  pauseOnHover: _propTypes2['default'].bool,
  wrap: _propTypes2['default'].bool,
  onSelect: _propTypes2['default'].func,
  onSlideEnd: _propTypes2['default'].func,
  activeIndex: _propTypes2['default'].number,
  defaultActiveIndex: _propTypes2['default'].number,
  direction: _propTypes2['default'].oneOf(['prev', 'next']),
  prevIcon: _propTypes2['default'].node,
  prevLabel: _propTypes2['default'].string,
  nextIcon: _propTypes2['default'].node,
  nextLabel: _propTypes2['default'].string
};
var defaultProps = {
  slide: true,
  interval: 5000,
  pauseOnHover: true,
  wrap: true,
  indicators: true,
  controls: true,
  prevIcon: _react2['default'].createElement(_Glyphicon2['default'], {glyph: 'chevron-left'}),
  prevLabel: 'Previous',
  nextIcon: _react2['default'].createElement(_Glyphicon2['default'], {glyph: 'chevron-right'}),
  nextLabel: 'Next'
};
var Carousel = function(_React$Component) {
  (0, _inherits3['default'])(Carousel, _React$Component);
  function Carousel(props, context) {
    (0, _classCallCheck3['default'])(this, Carousel);
    var _this = (0, _possibleConstructorReturn3['default'])(this, _React$Component.call(this, props, context));
    _this.handleMouseOver = _this.handleMouseOver.bind(_this);
    _this.handleMouseOut = _this.handleMouseOut.bind(_this);
    _this.handlePrev = _this.handlePrev.bind(_this);
    _this.handleNext = _this.handleNext.bind(_this);
    _this.handleItemAnimateOutEnd = _this.handleItemAnimateOutEnd.bind(_this);
    var defaultActiveIndex = props.defaultActiveIndex;
    _this.state = {
      activeIndex: defaultActiveIndex != null ? defaultActiveIndex : 0,
      previousActiveIndex: null,
      direction: null
    };
    _this.isUnmounted = false;
    return _this;
  }
  Carousel.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    var activeIndex = this.getActiveIndex();
    if (nextProps.activeIndex != null && nextProps.activeIndex !== activeIndex) {
      clearTimeout(this.timeout);
      this.setState({
        previousActiveIndex: activeIndex,
        direction: nextProps.direction != null ? nextProps.direction : this.getDirection(activeIndex, nextProps.activeIndex)
      });
    }
  };
  Carousel.prototype.componentDidMount = function componentDidMount() {
    this.waitForNext();
  };
  Carousel.prototype.componentWillUnmount = function componentWillUnmount() {
    clearTimeout(this.timeout);
    this.isUnmounted = true;
  };
  Carousel.prototype.handleMouseOver = function handleMouseOver() {
    if (this.props.pauseOnHover) {
      this.pause();
    }
  };
  Carousel.prototype.handleMouseOut = function handleMouseOut() {
    if (this.isPaused) {
      this.play();
    }
  };
  Carousel.prototype.handlePrev = function handlePrev(e) {
    var index = this.getActiveIndex() - 1;
    if (index < 0) {
      if (!this.props.wrap) {
        return;
      }
      index = _ValidComponentChildren2['default'].count(this.props.children) - 1;
    }
    this.select(index, e, 'prev');
  };
  Carousel.prototype.handleNext = function handleNext(e) {
    var index = this.getActiveIndex() + 1;
    var count = _ValidComponentChildren2['default'].count(this.props.children);
    if (index > count - 1) {
      if (!this.props.wrap) {
        return;
      }
      index = 0;
    }
    this.select(index, e, 'next');
  };
  Carousel.prototype.handleItemAnimateOutEnd = function handleItemAnimateOutEnd() {
    var _this2 = this;
    this.setState({
      previousActiveIndex: null,
      direction: null
    }, function() {
      _this2.waitForNext();
      if (_this2.props.onSlideEnd) {
        _this2.props.onSlideEnd();
      }
    });
  };
  Carousel.prototype.getActiveIndex = function getActiveIndex() {
    var activeIndexProp = this.props.activeIndex;
    return activeIndexProp != null ? activeIndexProp : this.state.activeIndex;
  };
  Carousel.prototype.getDirection = function getDirection(prevIndex, index) {
    if (prevIndex === index) {
      return null;
    }
    return prevIndex > index ? 'prev' : 'next';
  };
  Carousel.prototype.select = function select(index, e, direction) {
    clearTimeout(this.timeout);
    if (this.isUnmounted) {
      return;
    }
    var previousActiveIndex = this.props.slide ? this.getActiveIndex() : null;
    direction = direction || this.getDirection(previousActiveIndex, index);
    var onSelect = this.props.onSelect;
    if (onSelect) {
      if (onSelect.length > 1) {
        if (e) {
          e.persist();
          e.direction = direction;
        } else {
          e = {direction: direction};
        }
        onSelect(index, e);
      } else {
        onSelect(index);
      }
    }
    if (this.props.activeIndex == null && index !== previousActiveIndex) {
      if (this.state.previousActiveIndex != null) {
        return;
      }
      this.setState({
        activeIndex: index,
        previousActiveIndex: previousActiveIndex,
        direction: direction
      });
    }
  };
  Carousel.prototype.waitForNext = function waitForNext() {
    var _props = this.props,
        slide = _props.slide,
        interval = _props.interval,
        activeIndexProp = _props.activeIndex;
    if (!this.isPaused && slide && interval && activeIndexProp == null) {
      this.timeout = setTimeout(this.handleNext, interval);
    }
  };
  Carousel.prototype.pause = function pause() {
    this.isPaused = true;
    clearTimeout(this.timeout);
  };
  Carousel.prototype.play = function play() {
    this.isPaused = false;
    this.waitForNext();
  };
  Carousel.prototype.renderIndicators = function renderIndicators(children, activeIndex, bsProps) {
    var _this3 = this;
    var indicators = [];
    _ValidComponentChildren2['default'].forEach(children, function(child, index) {
      indicators.push(_react2['default'].createElement('li', {
        key: index,
        className: index === activeIndex ? 'active' : null,
        onClick: function onClick(e) {
          return _this3.select(index, e);
        }
      }), ' ');
    });
    return _react2['default'].createElement('ol', {className: (0, _bootstrapUtils.prefix)(bsProps, 'indicators')}, indicators);
  };
  Carousel.prototype.renderControls = function renderControls(properties) {
    var wrap = properties.wrap,
        children = properties.children,
        activeIndex = properties.activeIndex,
        prevIcon = properties.prevIcon,
        nextIcon = properties.nextIcon,
        bsProps = properties.bsProps,
        prevLabel = properties.prevLabel,
        nextLabel = properties.nextLabel;
    var controlClassName = (0, _bootstrapUtils.prefix)(bsProps, 'control');
    var count = _ValidComponentChildren2['default'].count(children);
    return [(wrap || activeIndex !== 0) && _react2['default'].createElement(_SafeAnchor2['default'], {
      key: 'prev',
      className: (0, _classnames2['default'])(controlClassName, 'left'),
      onClick: this.handlePrev
    }, prevIcon, prevLabel && _react2['default'].createElement('span', {className: 'sr-only'}, prevLabel)), (wrap || activeIndex !== count - 1) && _react2['default'].createElement(_SafeAnchor2['default'], {
      key: 'next',
      className: (0, _classnames2['default'])(controlClassName, 'right'),
      onClick: this.handleNext
    }, nextIcon, nextLabel && _react2['default'].createElement('span', {className: 'sr-only'}, nextLabel))];
  };
  Carousel.prototype.render = function render() {
    var _this4 = this;
    var _props2 = this.props,
        slide = _props2.slide,
        indicators = _props2.indicators,
        controls = _props2.controls,
        wrap = _props2.wrap,
        prevIcon = _props2.prevIcon,
        prevLabel = _props2.prevLabel,
        nextIcon = _props2.nextIcon,
        nextLabel = _props2.nextLabel,
        className = _props2.className,
        children = _props2.children,
        props = (0, _objectWithoutProperties3['default'])(_props2, ['slide', 'indicators', 'controls', 'wrap', 'prevIcon', 'prevLabel', 'nextIcon', 'nextLabel', 'className', 'children']);
    var _state = this.state,
        previousActiveIndex = _state.previousActiveIndex,
        direction = _state.direction;
    var _splitBsPropsAndOmit = (0, _bootstrapUtils.splitBsPropsAndOmit)(props, ['interval', 'pauseOnHover', 'onSelect', 'onSlideEnd', 'activeIndex', 'defaultActiveIndex', 'direction']),
        bsProps = _splitBsPropsAndOmit[0],
        elementProps = _splitBsPropsAndOmit[1];
    var activeIndex = this.getActiveIndex();
    var classes = (0, _extends3['default'])({}, (0, _bootstrapUtils.getClassSet)(bsProps), {slide: slide});
    return _react2['default'].createElement('div', (0, _extends3['default'])({}, elementProps, {
      className: (0, _classnames2['default'])(className, classes),
      onMouseOver: this.handleMouseOver,
      onMouseOut: this.handleMouseOut
    }), indicators && this.renderIndicators(children, activeIndex, bsProps), _react2['default'].createElement('div', {className: (0, _bootstrapUtils.prefix)(bsProps, 'inner')}, _ValidComponentChildren2['default'].map(children, function(child, index) {
      var active = index === activeIndex;
      var previousActive = slide && index === previousActiveIndex;
      return (0, _react.cloneElement)(child, {
        active: active,
        index: index,
        animateOut: previousActive,
        animateIn: active && previousActiveIndex != null && slide,
        direction: direction,
        onAnimateOutEnd: previousActive ? _this4.handleItemAnimateOutEnd : null
      });
    })), controls && this.renderControls({
      wrap: wrap,
      children: children,
      activeIndex: activeIndex,
      prevIcon: prevIcon,
      prevLabel: prevLabel,
      nextIcon: nextIcon,
      nextLabel: nextLabel,
      bsProps: bsProps
    }));
  };
  return Carousel;
}(_react2['default'].Component);
Carousel.propTypes = propTypes;
Carousel.defaultProps = defaultProps;
Carousel.Caption = _CarouselCaption2['default'];
Carousel.Item = _CarouselItem2['default'];
exports['default'] = (0, _bootstrapUtils.bsClass)('carousel', Carousel);
module.exports = exports['default'];
