/* */ 
'use strict';
Object.defineProperty(exports, "__esModule", {value: true});
var _style = require('dom-helpers/style');
var _style2 = _interopRequireDefault(_style);
var _class = require('dom-helpers/class');
var _class2 = _interopRequireDefault(_class);
var _scrollbarSize = require('dom-helpers/util/scrollbarSize');
var _scrollbarSize2 = _interopRequireDefault(_scrollbarSize);
var _isOverflowing = require('./utils/isOverflowing');
var _isOverflowing2 = _interopRequireDefault(_isOverflowing);
var _manageAriaHidden = require('./utils/manageAriaHidden');
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function findIndexOf(arr, cb) {
  var idx = -1;
  arr.some(function(d, i) {
    if (cb(d, i)) {
      idx = i;
      return true;
    }
  });
  return idx;
}
function findContainer(data, modal) {
  return findIndexOf(data, function(d) {
    return d.modals.indexOf(modal) !== -1;
  });
}
function setContainerStyle(state, container) {
  var style = {overflow: 'hidden'};
  state.style = {
    overflow: container.style.overflow,
    paddingRight: container.style.paddingRight
  };
  if (state.overflowing) {
    style.paddingRight = parseInt((0, _style2.default)(container, 'paddingRight') || 0, 10) + (0, _scrollbarSize2.default)() + 'px';
  }
  (0, _style2.default)(container, style);
}
function removeContainerStyle(_ref, container) {
  var style = _ref.style;
  Object.keys(style).forEach(function(key) {
    return container.style[key] = style[key];
  });
}
var ModalManager = function ModalManager() {
  var _this = this;
  var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var _ref2$hideSiblingNode = _ref2.hideSiblingNodes;
  var hideSiblingNodes = _ref2$hideSiblingNode === undefined ? true : _ref2$hideSiblingNode;
  var _ref2$handleContainer = _ref2.handleContainerOverflow;
  var handleContainerOverflow = _ref2$handleContainer === undefined ? true : _ref2$handleContainer;
  _classCallCheck(this, ModalManager);
  this.add = function(modal, container, className) {
    var modalIdx = _this.modals.indexOf(modal);
    var containerIdx = _this.containers.indexOf(container);
    if (modalIdx !== -1) {
      return modalIdx;
    }
    modalIdx = _this.modals.length;
    _this.modals.push(modal);
    if (_this.hideSiblingNodes) {
      (0, _manageAriaHidden.hideSiblings)(container, modal.mountNode);
    }
    if (containerIdx !== -1) {
      _this.data[containerIdx].modals.push(modal);
      return modalIdx;
    }
    var data = {
      modals: [modal],
      classes: className ? className.split(/\s+/) : [],
      overflowing: (0, _isOverflowing2.default)(container)
    };
    if (_this.handleContainerOverflow) {
      setContainerStyle(data, container);
    }
    data.classes.forEach(_class2.default.addClass.bind(null, container));
    _this.containers.push(container);
    _this.data.push(data);
    return modalIdx;
  };
  this.remove = function(modal) {
    var modalIdx = _this.modals.indexOf(modal);
    if (modalIdx === -1) {
      return;
    }
    var containerIdx = findContainer(_this.data, modal);
    var data = _this.data[containerIdx];
    var container = _this.containers[containerIdx];
    data.modals.splice(data.modals.indexOf(modal), 1);
    _this.modals.splice(modalIdx, 1);
    if (data.modals.length === 0) {
      data.classes.forEach(_class2.default.removeClass.bind(null, container));
      if (_this.handleContainerOverflow) {
        removeContainerStyle(data, container);
      }
      if (_this.hideSiblingNodes) {
        (0, _manageAriaHidden.showSiblings)(container, modal.mountNode);
      }
      _this.containers.splice(containerIdx, 1);
      _this.data.splice(containerIdx, 1);
    } else if (_this.hideSiblingNodes) {
      (0, _manageAriaHidden.ariaHidden)(false, data.modals[data.modals.length - 1].mountNode);
    }
  };
  this.isTopModal = function(modal) {
    return !!_this.modals.length && _this.modals[_this.modals.length - 1] === modal;
  };
  this.hideSiblingNodes = hideSiblingNodes;
  this.handleContainerOverflow = handleContainerOverflow;
  this.modals = [];
  this.containers = [];
  this.data = [];
};
exports.default = ModalManager;
module.exports = exports['default'];
