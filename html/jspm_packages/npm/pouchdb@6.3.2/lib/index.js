/* */ 
(function(Buffer, process) {
  'use strict';
  function _interopDefault(ex) {
    return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex;
  }
  var lie = _interopDefault(require('lie'));
  var getArguments = _interopDefault(require('argsarray'));
  var cloneBuffer = _interopDefault(require('clone-buffer'));
  var events = require('events');
  var events__default = _interopDefault(events);
  var inherits = _interopDefault(require('inherits'));
  var v4 = _interopDefault(require('uuid/v4'));
  var debug = _interopDefault(require('debug'));
  var vm = _interopDefault(require('vm'));
  var levelup = _interopDefault(require('levelup'));
  var ltgt = _interopDefault(require('ltgt'));
  var Codec = _interopDefault(require('level-codec'));
  var ReadableStreamCore = _interopDefault(require('readable-stream'));
  var through2 = require('through2');
  var Deque = _interopDefault(require('double-ended-queue'));
  var bufferFrom = _interopDefault(require('buffer-from'));
  var crypto = _interopDefault(require('crypto'));
  var vuvuzela = _interopDefault(require('vuvuzela'));
  var fs = _interopDefault(require('fs'));
  var path = _interopDefault(require('path'));
  var LevelWriteStream = _interopDefault(require('level-write-stream'));
  var PouchPromise$1 = typeof Promise === 'function' ? Promise : lie;
  function isBinaryObject(object) {
    return object instanceof Buffer;
  }
  var funcToString = Function.prototype.toString;
  var objectCtorString = funcToString.call(Object);
  function isPlainObject(value) {
    var proto = Object.getPrototypeOf(value);
    if (proto === null) {
      return true;
    }
    var Ctor = proto.constructor;
    return (typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
  }
  function clone(object) {
    var newObject;
    var i;
    var len;
    if (!object || typeof object !== 'object') {
      return object;
    }
    if (Array.isArray(object)) {
      newObject = [];
      for (i = 0, len = object.length; i < len; i++) {
        newObject[i] = clone(object[i]);
      }
      return newObject;
    }
    if (object instanceof Date) {
      return object.toISOString();
    }
    if (isBinaryObject(object)) {
      return cloneBuffer(object);
    }
    if (!isPlainObject(object)) {
      return object;
    }
    newObject = {};
    for (i in object) {
      if (Object.prototype.hasOwnProperty.call(object, i)) {
        var value = clone(object[i]);
        if (typeof value !== 'undefined') {
          newObject[i] = value;
        }
      }
    }
    return newObject;
  }
  function once(fun) {
    var called = false;
    return getArguments(function(args) {
      if (called) {
        throw new Error('once called more than once');
      } else {
        called = true;
        fun.apply(this, args);
      }
    });
  }
  function toPromise(func) {
    return getArguments(function(args) {
      args = clone(args);
      var self = this;
      var usedCB = (typeof args[args.length - 1] === 'function') ? args.pop() : false;
      var promise = new PouchPromise$1(function(fulfill, reject) {
        var resp;
        try {
          var callback = once(function(err, mesg) {
            if (err) {
              reject(err);
            } else {
              fulfill(mesg);
            }
          });
          args.push(callback);
          resp = func.apply(self, args);
          if (resp && typeof resp.then === 'function') {
            fulfill(resp);
          }
        } catch (e) {
          reject(e);
        }
      });
      if (usedCB) {
        promise.then(function(result) {
          usedCB(null, result);
        }, usedCB);
      }
      return promise;
    });
  }
  function logApiCall(self, name, args) {
    if (self.constructor.listeners('debug').length) {
      var logArgs = ['api', self.name, name];
      for (var i = 0; i < args.length - 1; i++) {
        logArgs.push(args[i]);
      }
      self.constructor.emit('debug', logArgs);
      var origCallback = args[args.length - 1];
      args[args.length - 1] = function(err, res) {
        var responseArgs = ['api', self.name, name];
        responseArgs = responseArgs.concat(err ? ['error', err] : ['success', res]);
        self.constructor.emit('debug', responseArgs);
        origCallback(err, res);
      };
    }
  }
  function adapterFun(name, callback) {
    return toPromise(getArguments(function(args) {
      if (this._closed) {
        return PouchPromise$1.reject(new Error('database is closed'));
      }
      if (this._destroyed) {
        return PouchPromise$1.reject(new Error('database is destroyed'));
      }
      var self = this;
      logApiCall(self, name, args);
      if (!this.taskqueue.isReady) {
        return new PouchPromise$1(function(fulfill, reject) {
          self.taskqueue.addTask(function(failed) {
            if (failed) {
              reject(failed);
            } else {
              fulfill(self[name].apply(self, args));
            }
          });
        });
      }
      return callback.apply(this, args);
    }));
  }
  function mangle(key) {
    return '$' + key;
  }
  function unmangle(key) {
    return key.substring(1);
  }
  function Map$1() {
    this._store = {};
  }
  Map$1.prototype.get = function(key) {
    var mangled = mangle(key);
    return this._store[mangled];
  };
  Map$1.prototype.set = function(key, value) {
    var mangled = mangle(key);
    this._store[mangled] = value;
    return true;
  };
  Map$1.prototype.has = function(key) {
    var mangled = mangle(key);
    return mangled in this._store;
  };
  Map$1.prototype.delete = function(key) {
    var mangled = mangle(key);
    var res = mangled in this._store;
    delete this._store[mangled];
    return res;
  };
  Map$1.prototype.forEach = function(cb) {
    var keys = Object.keys(this._store);
    for (var i = 0,
        len = keys.length; i < len; i++) {
      var key = keys[i];
      var value = this._store[key];
      key = unmangle(key);
      cb(value, key);
    }
  };
  Object.defineProperty(Map$1.prototype, 'size', {get: function() {
      return Object.keys(this._store).length;
    }});
  function Set$1(array) {
    this._store = new Map$1();
    if (array && Array.isArray(array)) {
      for (var i = 0,
          len = array.length; i < len; i++) {
        this.add(array[i]);
      }
    }
  }
  Set$1.prototype.add = function(key) {
    return this._store.set(key, true);
  };
  Set$1.prototype.has = function(key) {
    return this._store.has(key);
  };
  Set$1.prototype.forEach = function(cb) {
    this._store.forEach(function(value, key) {
      cb(key);
    });
  };
  Object.defineProperty(Set$1.prototype, 'size', {get: function() {
      return this._store.size;
    }});
  function supportsMapAndSet() {
    if (typeof Symbol === 'undefined' || typeof Map === 'undefined' || typeof Set === 'undefined') {
      return false;
    }
    var prop = Object.getOwnPropertyDescriptor(Map, Symbol.species);
    return prop && 'get' in prop && Map[Symbol.species] === Map;
  }
  var ExportedSet;
  var ExportedMap;
  {
    if (supportsMapAndSet()) {
      ExportedSet = Set;
      ExportedMap = Map;
    } else {
      ExportedSet = Set$1;
      ExportedMap = Map$1;
    }
  }
  function pick(obj$$1, arr) {
    var res = {};
    for (var i = 0,
        len = arr.length; i < len; i++) {
      var prop = arr[i];
      if (prop in obj$$1) {
        res[prop] = obj$$1[prop];
      }
    }
    return res;
  }
  var MAX_NUM_CONCURRENT_REQUESTS = 6;
  function identityFunction(x) {
    return x;
  }
  function formatResultForOpenRevsGet(result) {
    return [{ok: result}];
  }
  function bulkGet(db, opts, callback) {
    var requests = opts.docs;
    var requestsById = new ExportedMap();
    requests.forEach(function(request) {
      if (requestsById.has(request.id)) {
        requestsById.get(request.id).push(request);
      } else {
        requestsById.set(request.id, [request]);
      }
    });
    var numDocs = requestsById.size;
    var numDone = 0;
    var perDocResults = new Array(numDocs);
    function collapseResultsAndFinish() {
      var results = [];
      perDocResults.forEach(function(res) {
        res.docs.forEach(function(info) {
          results.push({
            id: res.id,
            docs: [info]
          });
        });
      });
      callback(null, {results: results});
    }
    function checkDone() {
      if (++numDone === numDocs) {
        collapseResultsAndFinish();
      }
    }
    function gotResult(docIndex, id, docs) {
      perDocResults[docIndex] = {
        id: id,
        docs: docs
      };
      checkDone();
    }
    var allRequests = [];
    requestsById.forEach(function(value, key) {
      allRequests.push(key);
    });
    var i = 0;
    function nextBatch() {
      if (i >= allRequests.length) {
        return;
      }
      var upTo = Math.min(i + MAX_NUM_CONCURRENT_REQUESTS, allRequests.length);
      var batch = allRequests.slice(i, upTo);
      processBatch(batch, i);
      i += batch.length;
    }
    function processBatch(batch, offset) {
      batch.forEach(function(docId, j) {
        var docIdx = offset + j;
        var docRequests = requestsById.get(docId);
        var docOpts = pick(docRequests[0], ['atts_since', 'attachments']);
        docOpts.open_revs = docRequests.map(function(request) {
          return request.rev;
        });
        docOpts.open_revs = docOpts.open_revs.filter(identityFunction);
        var formatResult = identityFunction;
        if (docOpts.open_revs.length === 0) {
          delete docOpts.open_revs;
          formatResult = formatResultForOpenRevsGet;
        }
        ['revs', 'attachments', 'binary', 'ajax', 'latest'].forEach(function(param) {
          if (param in opts) {
            docOpts[param] = opts[param];
          }
        });
        db.get(docId, docOpts, function(err, res) {
          var result;
          if (err) {
            result = [{error: err}];
          } else {
            result = formatResult(res);
          }
          gotResult(docIdx, docId, result);
          nextBatch();
        });
      });
    }
    nextBatch();
  }
  function isChromeApp() {
    return false;
  }
  function hasLocalStorage() {
    return false;
  }
  function nextTick(fn) {
    process.nextTick(fn);
  }
  inherits(Changes, events.EventEmitter);
  function attachBrowserEvents(self) {
    if (isChromeApp()) {
      chrome.storage.onChanged.addListener(function(e) {
        if (e.db_name != null) {
          self.emit(e.dbName.newValue);
        }
      });
    } else if (hasLocalStorage()) {
      if (typeof addEventListener !== 'undefined') {
        addEventListener("storage", function(e) {
          self.emit(e.key);
        });
      } else {
        window.attachEvent("storage", function(e) {
          self.emit(e.key);
        });
      }
    }
  }
  function Changes() {
    events.EventEmitter.call(this);
    this._listeners = {};
    attachBrowserEvents(this);
  }
  Changes.prototype.addListener = function(dbName, id, db, opts) {
    if (this._listeners[id]) {
      return;
    }
    var self = this;
    var inprogress = false;
    function eventFunction() {
      if (!self._listeners[id]) {
        return;
      }
      if (inprogress) {
        inprogress = 'waiting';
        return;
      }
      inprogress = true;
      var changesOpts = pick(opts, ['style', 'include_docs', 'attachments', 'conflicts', 'filter', 'doc_ids', 'view', 'since', 'query_params', 'binary']);
      function onError() {
        inprogress = false;
      }
      db.changes(changesOpts).on('change', function(c) {
        if (c.seq > opts.since && !opts.cancelled) {
          opts.since = c.seq;
          opts.onChange(c);
        }
      }).on('complete', function() {
        if (inprogress === 'waiting') {
          nextTick(eventFunction);
        }
        inprogress = false;
      }).on('error', onError);
    }
    this._listeners[id] = eventFunction;
    this.on(dbName, eventFunction);
  };
  Changes.prototype.removeListener = function(dbName, id) {
    if (!(id in this._listeners)) {
      return;
    }
    events.EventEmitter.prototype.removeListener.call(this, dbName, this._listeners[id]);
    delete this._listeners[id];
  };
  Changes.prototype.notifyLocalWindows = function(dbName) {
    if (isChromeApp()) {
      chrome.storage.local.set({dbName: dbName});
    } else if (hasLocalStorage()) {
      localStorage[dbName] = (localStorage[dbName] === "a") ? "b" : "a";
    }
  };
  Changes.prototype.notify = function(dbName) {
    this.emit(dbName);
    this.notifyLocalWindows(dbName);
  };
  function guardedConsole(method) {
    if (console !== 'undefined' && method in console) {
      var args = Array.prototype.slice.call(arguments, 1);
      console[method].apply(console, args);
    }
  }
  function randomNumber(min, max) {
    var maxTimeout = 600000;
    min = parseInt(min, 10) || 0;
    max = parseInt(max, 10);
    if (max !== max || max <= min) {
      max = (min || 1) << 1;
    } else {
      max = max + 1;
    }
    if (max > maxTimeout) {
      min = maxTimeout >> 1;
      max = maxTimeout;
    }
    var ratio = Math.random();
    var range = max - min;
    return ~~(range * ratio + min);
  }
  function defaultBackOff(min) {
    var max = 0;
    if (!min) {
      max = 2000;
    }
    return randomNumber(min, max);
  }
  var res = function() {};
  var assign;
  {
    if (typeof Object.assign === 'function') {
      assign = Object.assign;
    } else {
      assign = function(target) {
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];
          if (nextSource != null) {
            for (var nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      };
    }
  }
  var $inject_Object_assign = assign;
  inherits(PouchError, Error);
  function PouchError(status, error, reason) {
    Error.call(this, reason);
    this.status = status;
    this.name = error;
    this.message = reason;
    this.error = true;
  }
  PouchError.prototype.toString = function() {
    return JSON.stringify({
      status: this.status,
      name: this.name,
      message: this.message,
      reason: this.reason
    });
  };
  var UNAUTHORIZED = new PouchError(401, 'unauthorized', "Name or password is incorrect.");
  var MISSING_BULK_DOCS = new PouchError(400, 'bad_request', "Missing JSON list of 'docs'");
  var MISSING_DOC = new PouchError(404, 'not_found', 'missing');
  var REV_CONFLICT = new PouchError(409, 'conflict', 'Document update conflict');
  var INVALID_ID = new PouchError(400, 'bad_request', '_id field must contain a string');
  var MISSING_ID = new PouchError(412, 'missing_id', '_id is required for puts');
  var RESERVED_ID = new PouchError(400, 'bad_request', 'Only reserved document ids may start with underscore.');
  var NOT_OPEN = new PouchError(412, 'precondition_failed', 'Database not open');
  var UNKNOWN_ERROR = new PouchError(500, 'unknown_error', 'Database encountered an unknown error');
  var BAD_ARG = new PouchError(500, 'badarg', 'Some query argument is invalid');
  var INVALID_REQUEST = new PouchError(400, 'invalid_request', 'Request was invalid');
  var QUERY_PARSE_ERROR = new PouchError(400, 'query_parse_error', 'Some query parameter is invalid');
  var DOC_VALIDATION = new PouchError(500, 'doc_validation', 'Bad special document member');
  var BAD_REQUEST = new PouchError(400, 'bad_request', 'Something wrong with the request');
  var NOT_AN_OBJECT = new PouchError(400, 'bad_request', 'Document must be a JSON object');
  var DB_MISSING = new PouchError(404, 'not_found', 'Database not found');
  var IDB_ERROR = new PouchError(500, 'indexed_db_went_bad', 'unknown');
  var WSQ_ERROR = new PouchError(500, 'web_sql_went_bad', 'unknown');
  var LDB_ERROR = new PouchError(500, 'levelDB_went_went_bad', 'unknown');
  var FORBIDDEN = new PouchError(403, 'forbidden', 'Forbidden by design doc validate_doc_update function');
  var INVALID_REV = new PouchError(400, 'bad_request', 'Invalid rev format');
  var FILE_EXISTS = new PouchError(412, 'file_exists', 'The database could not be created, the file already exists.');
  var MISSING_STUB = new PouchError(412, 'missing_stub', 'A pre-existing attachment stub wasn\'t found');
  var INVALID_URL = new PouchError(413, 'invalid_url', 'Provided URL is invalid');
  function createError(error, reason) {
    function CustomPouchError(reason) {
      for (var p in error) {
        if (typeof error[p] !== 'function') {
          this[p] = error[p];
        }
      }
      if (reason !== undefined) {
        this.reason = reason;
      }
    }
    CustomPouchError.prototype = PouchError.prototype;
    return new CustomPouchError(reason);
  }
  function generateErrorFromResponse(err) {
    if (typeof err !== 'object') {
      var data = err;
      err = UNKNOWN_ERROR;
      err.data = data;
    }
    if ('error' in err && err.error === 'conflict') {
      err.name = 'conflict';
      err.status = 409;
    }
    if (!('name' in err)) {
      err.name = err.error || 'unknown';
    }
    if (!('status' in err)) {
      err.status = 500;
    }
    if (!('message' in err)) {
      err.message = err.message || err.reason;
    }
    return err;
  }
  function tryFilter(filter, doc, req) {
    try {
      return !filter(doc, req);
    } catch (err) {
      var msg = 'Filter function threw: ' + err.toString();
      return createError(BAD_REQUEST, msg);
    }
  }
  function filterChange(opts) {
    var req = {};
    var hasFilter = opts.filter && typeof opts.filter === 'function';
    req.query = opts.query_params;
    return function filter(change) {
      if (!change.doc) {
        change.doc = {};
      }
      var filterReturn = hasFilter && tryFilter(opts.filter, change.doc, req);
      if (typeof filterReturn === 'object') {
        return filterReturn;
      }
      if (filterReturn) {
        return false;
      }
      if (!opts.include_docs) {
        delete change.doc;
      } else if (!opts.attachments) {
        for (var att in change.doc._attachments) {
          if (change.doc._attachments.hasOwnProperty(att)) {
            change.doc._attachments[att].stub = true;
          }
        }
      }
      return true;
    };
  }
  function flatten(arrs) {
    var res = [];
    for (var i = 0,
        len = arrs.length; i < len; i++) {
      res = res.concat(arrs[i]);
    }
    return res;
  }
  function f() {}
  var hasName = f.name;
  var res$1;
  if (hasName) {
    res$1 = function(fun) {
      return fun.name;
    };
  } else {
    res$1 = function(fun) {
      return fun.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
    };
  }
  var functionName = res$1;
  function invalidIdError(id) {
    var err;
    if (!id) {
      err = createError(MISSING_ID);
    } else if (typeof id !== 'string') {
      err = createError(INVALID_ID);
    } else if (/^_/.test(id) && !(/^_(design|local)/).test(id)) {
      err = createError(RESERVED_ID);
    }
    if (err) {
      throw err;
    }
  }
  function isRemote(db) {
    if (typeof db._remote === 'boolean') {
      return db._remote;
    }
    if (typeof db.type === 'function') {
      guardedConsole('warn', 'db.type() is deprecated and will be removed in ' + 'a future version of PouchDB');
      return db.type() === 'http';
    }
    return false;
  }
  function listenerCount(ee, type) {
    return 'listenerCount' in ee ? ee.listenerCount(type) : events.EventEmitter.listenerCount(ee, type);
  }
  function parseDesignDocFunctionName(s) {
    if (!s) {
      return null;
    }
    var parts = s.split('/');
    if (parts.length === 2) {
      return parts;
    }
    if (parts.length === 1) {
      return [s, s];
    }
    return null;
  }
  function normalizeDesignDocFunctionName(s) {
    var normalized = parseDesignDocFunctionName(s);
    return normalized ? normalized.join('/') : null;
  }
  var keys = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
  var qName = "queryKey";
  var qParser = /(?:^|&)([^&=]*)=?([^&]*)/g;
  var parser = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
  function parseUri(str) {
    var m = parser.exec(str);
    var uri = {};
    var i = 14;
    while (i--) {
      var key = keys[i];
      var value = m[i] || "";
      var encoded = ['user', 'password'].indexOf(key) !== -1;
      uri[key] = encoded ? decodeURIComponent(value) : value;
    }
    uri[qName] = {};
    uri[keys[12]].replace(qParser, function($0, $1, $2) {
      if ($1) {
        uri[qName][$1] = $2;
      }
    });
    return uri;
  }
  function upsert(db, docId, diffFun) {
    return new PouchPromise$1(function(fulfill, reject) {
      db.get(docId, function(err, doc) {
        if (err) {
          if (err.status !== 404) {
            return reject(err);
          }
          doc = {};
        }
        var docRev = doc._rev;
        var newDoc = diffFun(doc);
        if (!newDoc) {
          return fulfill({
            updated: false,
            rev: docRev
          });
        }
        newDoc._id = docId;
        newDoc._rev = docRev;
        fulfill(tryAndPut(db, newDoc, diffFun));
      });
    });
  }
  function tryAndPut(db, doc, diffFun) {
    return db.put(doc).then(function(res) {
      return {
        updated: true,
        rev: res.rev
      };
    }, function(err) {
      if (err.status !== 409) {
        throw err;
      }
      return upsert(db, doc._id, diffFun);
    });
  }
  function rev() {
    return v4().replace(/-/g, '').toLowerCase();
  }
  var uuid = v4;
  function winningRev(metadata) {
    var winningId;
    var winningPos;
    var winningDeleted;
    var toVisit = metadata.rev_tree.slice();
    var node;
    while ((node = toVisit.pop())) {
      var tree = node.ids;
      var branches = tree[2];
      var pos = node.pos;
      if (branches.length) {
        for (var i = 0,
            len = branches.length; i < len; i++) {
          toVisit.push({
            pos: pos + 1,
            ids: branches[i]
          });
        }
        continue;
      }
      var deleted = !!tree[1].deleted;
      var id = tree[0];
      if (!winningId || (winningDeleted !== deleted ? winningDeleted : winningPos !== pos ? winningPos < pos : winningId < id)) {
        winningId = id;
        winningPos = pos;
        winningDeleted = deleted;
      }
    }
    return winningPos + '-' + winningId;
  }
  function traverseRevTree(revs, callback) {
    var toVisit = revs.slice();
    var node;
    while ((node = toVisit.pop())) {
      var pos = node.pos;
      var tree = node.ids;
      var branches = tree[2];
      var newCtx = callback(branches.length === 0, pos, tree[0], node.ctx, tree[1]);
      for (var i = 0,
          len = branches.length; i < len; i++) {
        toVisit.push({
          pos: pos + 1,
          ids: branches[i],
          ctx: newCtx
        });
      }
    }
  }
  function sortByPos(a, b) {
    return a.pos - b.pos;
  }
  function collectLeaves(revs) {
    var leaves = [];
    traverseRevTree(revs, function(isLeaf, pos, id, acc, opts) {
      if (isLeaf) {
        leaves.push({
          rev: pos + "-" + id,
          pos: pos,
          opts: opts
        });
      }
    });
    leaves.sort(sortByPos).reverse();
    for (var i = 0,
        len = leaves.length; i < len; i++) {
      delete leaves[i].pos;
    }
    return leaves;
  }
  function collectConflicts(metadata) {
    var win = winningRev(metadata);
    var leaves = collectLeaves(metadata.rev_tree);
    var conflicts = [];
    for (var i = 0,
        len = leaves.length; i < len; i++) {
      var leaf = leaves[i];
      if (leaf.rev !== win && !leaf.opts.deleted) {
        conflicts.push(leaf.rev);
      }
    }
    return conflicts;
  }
  function compactTree(metadata) {
    var revs = [];
    traverseRevTree(metadata.rev_tree, function(isLeaf, pos, revHash, ctx, opts) {
      if (opts.status === 'available' && !isLeaf) {
        revs.push(pos + '-' + revHash);
        opts.status = 'missing';
      }
    });
    return revs;
  }
  function rootToLeaf(revs) {
    var paths = [];
    var toVisit = revs.slice();
    var node;
    while ((node = toVisit.pop())) {
      var pos = node.pos;
      var tree = node.ids;
      var id = tree[0];
      var opts = tree[1];
      var branches = tree[2];
      var isLeaf = branches.length === 0;
      var history = node.history ? node.history.slice() : [];
      history.push({
        id: id,
        opts: opts
      });
      if (isLeaf) {
        paths.push({
          pos: (pos + 1 - history.length),
          ids: history
        });
      }
      for (var i = 0,
          len = branches.length; i < len; i++) {
        toVisit.push({
          pos: pos + 1,
          ids: branches[i],
          history: history
        });
      }
    }
    return paths.reverse();
  }
  function sortByPos$1(a, b) {
    return a.pos - b.pos;
  }
  function binarySearch(arr, item, comparator) {
    var low = 0;
    var high = arr.length;
    var mid;
    while (low < high) {
      mid = (low + high) >>> 1;
      if (comparator(arr[mid], item) < 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }
  function insertSorted(arr, item, comparator) {
    var idx = binarySearch(arr, item, comparator);
    arr.splice(idx, 0, item);
  }
  function pathToTree(path$$1, numStemmed) {
    var root;
    var leaf;
    for (var i = numStemmed,
        len = path$$1.length; i < len; i++) {
      var node = path$$1[i];
      var currentLeaf = [node.id, node.opts, []];
      if (leaf) {
        leaf[2].push(currentLeaf);
        leaf = currentLeaf;
      } else {
        root = leaf = currentLeaf;
      }
    }
    return root;
  }
  function compareTree(a, b) {
    return a[0] < b[0] ? -1 : 1;
  }
  function mergeTree(in_tree1, in_tree2) {
    var queue = [{
      tree1: in_tree1,
      tree2: in_tree2
    }];
    var conflicts = false;
    while (queue.length > 0) {
      var item = queue.pop();
      var tree1 = item.tree1;
      var tree2 = item.tree2;
      if (tree1[1].status || tree2[1].status) {
        tree1[1].status = (tree1[1].status === 'available' || tree2[1].status === 'available') ? 'available' : 'missing';
      }
      for (var i = 0; i < tree2[2].length; i++) {
        if (!tree1[2][0]) {
          conflicts = 'new_leaf';
          tree1[2][0] = tree2[2][i];
          continue;
        }
        var merged = false;
        for (var j = 0; j < tree1[2].length; j++) {
          if (tree1[2][j][0] === tree2[2][i][0]) {
            queue.push({
              tree1: tree1[2][j],
              tree2: tree2[2][i]
            });
            merged = true;
          }
        }
        if (!merged) {
          conflicts = 'new_branch';
          insertSorted(tree1[2], tree2[2][i], compareTree);
        }
      }
    }
    return {
      conflicts: conflicts,
      tree: in_tree1
    };
  }
  function doMerge(tree, path$$1, dontExpand) {
    var restree = [];
    var conflicts = false;
    var merged = false;
    var res;
    if (!tree.length) {
      return {
        tree: [path$$1],
        conflicts: 'new_leaf'
      };
    }
    for (var i = 0,
        len = tree.length; i < len; i++) {
      var branch = tree[i];
      if (branch.pos === path$$1.pos && branch.ids[0] === path$$1.ids[0]) {
        res = mergeTree(branch.ids, path$$1.ids);
        restree.push({
          pos: branch.pos,
          ids: res.tree
        });
        conflicts = conflicts || res.conflicts;
        merged = true;
      } else if (dontExpand !== true) {
        var t1 = branch.pos < path$$1.pos ? branch : path$$1;
        var t2 = branch.pos < path$$1.pos ? path$$1 : branch;
        var diff = t2.pos - t1.pos;
        var candidateParents = [];
        var trees = [];
        trees.push({
          ids: t1.ids,
          diff: diff,
          parent: null,
          parentIdx: null
        });
        while (trees.length > 0) {
          var item = trees.pop();
          if (item.diff === 0) {
            if (item.ids[0] === t2.ids[0]) {
              candidateParents.push(item);
            }
            continue;
          }
          var elements = item.ids[2];
          for (var j = 0,
              elementsLen = elements.length; j < elementsLen; j++) {
            trees.push({
              ids: elements[j],
              diff: item.diff - 1,
              parent: item.ids,
              parentIdx: j
            });
          }
        }
        var el = candidateParents[0];
        if (!el) {
          restree.push(branch);
        } else {
          res = mergeTree(el.ids, t2.ids);
          el.parent[2][el.parentIdx] = res.tree;
          restree.push({
            pos: t1.pos,
            ids: t1.ids
          });
          conflicts = conflicts || res.conflicts;
          merged = true;
        }
      } else {
        restree.push(branch);
      }
    }
    if (!merged) {
      restree.push(path$$1);
    }
    restree.sort(sortByPos$1);
    return {
      tree: restree,
      conflicts: conflicts || 'internal_node'
    };
  }
  function stem(tree, depth) {
    var paths = rootToLeaf(tree);
    var stemmedRevs;
    var result;
    for (var i = 0,
        len = paths.length; i < len; i++) {
      var path$$1 = paths[i];
      var stemmed = path$$1.ids;
      var node;
      if (stemmed.length > depth) {
        if (!stemmedRevs) {
          stemmedRevs = {};
        }
        var numStemmed = stemmed.length - depth;
        node = {
          pos: path$$1.pos + numStemmed,
          ids: pathToTree(stemmed, numStemmed)
        };
        for (var s = 0; s < numStemmed; s++) {
          var rev = (path$$1.pos + s) + '-' + stemmed[s].id;
          stemmedRevs[rev] = true;
        }
      } else {
        node = {
          pos: path$$1.pos,
          ids: pathToTree(stemmed, 0)
        };
      }
      if (result) {
        result = doMerge(result, node, true).tree;
      } else {
        result = [node];
      }
    }
    if (stemmedRevs) {
      traverseRevTree(result, function(isLeaf, pos, revHash) {
        delete stemmedRevs[pos + '-' + revHash];
      });
    }
    return {
      tree: result,
      revs: stemmedRevs ? Object.keys(stemmedRevs) : []
    };
  }
  function merge(tree, path$$1, depth) {
    var newTree = doMerge(tree, path$$1);
    var stemmed = stem(newTree.tree, depth);
    return {
      tree: stemmed.tree,
      stemmedRevs: stemmed.revs,
      conflicts: newTree.conflicts
    };
  }
  function revExists(revs, rev) {
    var toVisit = revs.slice();
    var splitRev = rev.split('-');
    var targetPos = parseInt(splitRev[0], 10);
    var targetId = splitRev[1];
    var node;
    while ((node = toVisit.pop())) {
      if (node.pos === targetPos && node.ids[0] === targetId) {
        return true;
      }
      var branches = node.ids[2];
      for (var i = 0,
          len = branches.length; i < len; i++) {
        toVisit.push({
          pos: node.pos + 1,
          ids: branches[i]
        });
      }
    }
    return false;
  }
  function getTrees(node) {
    return node.ids;
  }
  function isDeleted(metadata, rev) {
    if (!rev) {
      rev = winningRev(metadata);
    }
    var id = rev.substring(rev.indexOf('-') + 1);
    var toVisit = metadata.rev_tree.map(getTrees);
    var tree;
    while ((tree = toVisit.pop())) {
      if (tree[0] === id) {
        return !!tree[1].deleted;
      }
      toVisit = toVisit.concat(tree[2]);
    }
  }
  function isLocalId(id) {
    return (/^_local/).test(id);
  }
  function latest(rev, metadata) {
    var toVisit = metadata.rev_tree.slice();
    var node;
    while ((node = toVisit.pop())) {
      var pos = node.pos;
      var tree = node.ids;
      var id = tree[0];
      var opts = tree[1];
      var branches = tree[2];
      var isLeaf = branches.length === 0;
      var history = node.history ? node.history.slice() : [];
      history.push({
        id: id,
        pos: pos,
        opts: opts
      });
      if (isLeaf) {
        for (var i = 0,
            len = history.length; i < len; i++) {
          var historyNode = history[i];
          var historyRev = historyNode.pos + '-' + historyNode.id;
          if (historyRev === rev) {
            return pos + '-' + id;
          }
        }
      }
      for (var j = 0,
          l = branches.length; j < l; j++) {
        toVisit.push({
          pos: pos + 1,
          ids: branches[j],
          history: history
        });
      }
    }
    throw new Error('Unable to resolve latest revision for id ' + metadata.id + ', rev ' + rev);
  }
  inherits(Changes$2, events.EventEmitter);
  function tryCatchInChangeListener(self, change) {
    try {
      self.emit('change', change);
    } catch (e) {
      guardedConsole('error', 'Error in .on("change", function):', e);
    }
  }
  function Changes$2(db, opts, callback) {
    events.EventEmitter.call(this);
    var self = this;
    this.db = db;
    opts = opts ? clone(opts) : {};
    var complete = opts.complete = once(function(err, resp) {
      if (err) {
        if (listenerCount(self, 'error') > 0) {
          self.emit('error', err);
        }
      } else {
        self.emit('complete', resp);
      }
      self.removeAllListeners();
      db.removeListener('destroyed', onDestroy);
    });
    if (callback) {
      self.on('complete', function(resp) {
        callback(null, resp);
      });
      self.on('error', callback);
    }
    function onDestroy() {
      self.cancel();
    }
    db.once('destroyed', onDestroy);
    opts.onChange = function(change) {
      if (self.isCancelled) {
        return;
      }
      tryCatchInChangeListener(self, change);
    };
    var promise = new PouchPromise$1(function(fulfill, reject) {
      opts.complete = function(err, res$$1) {
        if (err) {
          reject(err);
        } else {
          fulfill(res$$1);
        }
      };
    });
    self.once('cancel', function() {
      db.removeListener('destroyed', onDestroy);
      opts.complete(null, {status: 'cancelled'});
    });
    this.then = promise.then.bind(promise);
    this['catch'] = promise['catch'].bind(promise);
    this.then(function(result) {
      complete(null, result);
    }, complete);
    if (!db.taskqueue.isReady) {
      db.taskqueue.addTask(function(failed) {
        if (failed) {
          opts.complete(failed);
        } else if (self.isCancelled) {
          self.emit('cancel');
        } else {
          self.validateChanges(opts);
        }
      });
    } else {
      self.validateChanges(opts);
    }
  }
  Changes$2.prototype.cancel = function() {
    this.isCancelled = true;
    if (this.db.taskqueue.isReady) {
      this.emit('cancel');
    }
  };
  function processChange(doc, metadata, opts) {
    var changeList = [{rev: doc._rev}];
    if (opts.style === 'all_docs') {
      changeList = collectLeaves(metadata.rev_tree).map(function(x) {
        return {rev: x.rev};
      });
    }
    var change = {
      id: metadata.id,
      changes: changeList,
      doc: doc
    };
    if (isDeleted(metadata, doc._rev)) {
      change.deleted = true;
    }
    if (opts.conflicts) {
      change.doc._conflicts = collectConflicts(metadata);
      if (!change.doc._conflicts.length) {
        delete change.doc._conflicts;
      }
    }
    return change;
  }
  Changes$2.prototype.validateChanges = function(opts) {
    var callback = opts.complete;
    var self = this;
    if (PouchDB$5._changesFilterPlugin) {
      PouchDB$5._changesFilterPlugin.validate(opts, function(err) {
        if (err) {
          return callback(err);
        }
        self.doChanges(opts);
      });
    } else {
      self.doChanges(opts);
    }
  };
  Changes$2.prototype.doChanges = function(opts) {
    var self = this;
    var callback = opts.complete;
    opts = clone(opts);
    if ('live' in opts && !('continuous' in opts)) {
      opts.continuous = opts.live;
    }
    opts.processChange = processChange;
    if (opts.since === 'latest') {
      opts.since = 'now';
    }
    if (!opts.since) {
      opts.since = 0;
    }
    if (opts.since === 'now') {
      this.db.info().then(function(info) {
        if (self.isCancelled) {
          callback(null, {status: 'cancelled'});
          return;
        }
        opts.since = info.update_seq;
        self.doChanges(opts);
      }, callback);
      return;
    }
    if (PouchDB$5._changesFilterPlugin) {
      PouchDB$5._changesFilterPlugin.normalize(opts);
      if (PouchDB$5._changesFilterPlugin.shouldFilter(this, opts)) {
        return PouchDB$5._changesFilterPlugin.filter(this, opts);
      }
    } else {
      ['doc_ids', 'filter', 'selector', 'view'].forEach(function(key) {
        if (key in opts) {
          guardedConsole('warn', 'The "' + key + '" option was passed in to changes/replicate, ' + 'but pouchdb-changes-filter plugin is not installed, so it ' + 'was ignored. Please install the plugin to enable filtering.');
        }
      });
    }
    if (!('descending' in opts)) {
      opts.descending = false;
    }
    opts.limit = opts.limit === 0 ? 1 : opts.limit;
    opts.complete = callback;
    var newPromise = this.db._changes(opts);
    if (newPromise && typeof newPromise.cancel === 'function') {
      var cancel = self.cancel;
      self.cancel = getArguments(function(args) {
        newPromise.cancel();
        cancel.apply(this, args);
      });
    }
  };
  function compare(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
  }
  function yankError(callback, docId) {
    return function(err, results) {
      if (err || (results[0] && results[0].error)) {
        err = err || results[0];
        err.docId = docId;
        callback(err);
      } else {
        callback(null, results.length ? results[0] : results);
      }
    };
  }
  function cleanDocs(docs) {
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];
      if (doc._deleted) {
        delete doc._attachments;
      } else if (doc._attachments) {
        var atts = Object.keys(doc._attachments);
        for (var j = 0; j < atts.length; j++) {
          var att = atts[j];
          doc._attachments[att] = pick(doc._attachments[att], ['data', 'digest', 'content_type', 'length', 'revpos', 'stub']);
        }
      }
    }
  }
  function compareByIdThenRev(a, b) {
    var idCompare = compare(a._id, b._id);
    if (idCompare !== 0) {
      return idCompare;
    }
    var aStart = a._revisions ? a._revisions.start : 0;
    var bStart = b._revisions ? b._revisions.start : 0;
    return compare(aStart, bStart);
  }
  function computeHeight(revs) {
    var height = {};
    var edges = [];
    traverseRevTree(revs, function(isLeaf, pos, id, prnt) {
      var rev$$1 = pos + "-" + id;
      if (isLeaf) {
        height[rev$$1] = 0;
      }
      if (prnt !== undefined) {
        edges.push({
          from: prnt,
          to: rev$$1
        });
      }
      return rev$$1;
    });
    edges.reverse();
    edges.forEach(function(edge) {
      if (height[edge.from] === undefined) {
        height[edge.from] = 1 + height[edge.to];
      } else {
        height[edge.from] = Math.min(height[edge.from], 1 + height[edge.to]);
      }
    });
    return height;
  }
  function allDocsKeysQuery(api, opts, callback) {
    var keys = ('limit' in opts) ? opts.keys.slice(opts.skip, opts.limit + opts.skip) : (opts.skip > 0) ? opts.keys.slice(opts.skip) : opts.keys;
    if (opts.descending) {
      keys.reverse();
    }
    if (!keys.length) {
      return api._allDocs({limit: 0}, callback);
    }
    var finalResults = {offset: opts.skip};
    return PouchPromise$1.all(keys.map(function(key) {
      var subOpts = $inject_Object_assign({
        key: key,
        deleted: 'ok'
      }, opts);
      ['limit', 'skip', 'keys'].forEach(function(optKey) {
        delete subOpts[optKey];
      });
      return new PouchPromise$1(function(resolve, reject) {
        api._allDocs(subOpts, function(err, res$$1) {
          if (err) {
            return reject(err);
          }
          finalResults.total_rows = res$$1.total_rows;
          resolve(res$$1.rows[0] || {
            key: key,
            error: 'not_found'
          });
        });
      });
    })).then(function(results) {
      finalResults.rows = results;
      return finalResults;
    });
  }
  function doNextCompaction(self) {
    var task = self._compactionQueue[0];
    var opts = task.opts;
    var callback = task.callback;
    self.get('_local/compaction').catch(function() {
      return false;
    }).then(function(doc) {
      if (doc && doc.last_seq) {
        opts.last_seq = doc.last_seq;
      }
      self._compact(opts, function(err, res$$1) {
        if (err) {
          callback(err);
        } else {
          callback(null, res$$1);
        }
        nextTick(function() {
          self._compactionQueue.shift();
          if (self._compactionQueue.length) {
            doNextCompaction(self);
          }
        });
      });
    });
  }
  function attachmentNameError(name) {
    if (name.charAt(0) === '_') {
      return name + ' is not a valid attachment name, attachment ' + 'names cannot start with \'_\'';
    }
    return false;
  }
  inherits(AbstractPouchDB, events.EventEmitter);
  function AbstractPouchDB() {
    events.EventEmitter.call(this);
  }
  AbstractPouchDB.prototype.post = adapterFun('post', function(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (typeof doc !== 'object' || Array.isArray(doc)) {
      return callback(createError(NOT_AN_OBJECT));
    }
    this.bulkDocs({docs: [doc]}, opts, yankError(callback, doc._id));
  });
  AbstractPouchDB.prototype.put = adapterFun('put', function(doc, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = {};
    }
    if (typeof doc !== 'object' || Array.isArray(doc)) {
      return cb(createError(NOT_AN_OBJECT));
    }
    invalidIdError(doc._id);
    if (isLocalId(doc._id) && typeof this._putLocal === 'function') {
      if (doc._deleted) {
        return this._removeLocal(doc, cb);
      } else {
        return this._putLocal(doc, cb);
      }
    }
    var self = this;
    if (opts.force && doc._rev) {
      transformForceOptionToNewEditsOption();
      putDoc(function(err) {
        var result = err ? null : {
          ok: true,
          id: doc._id,
          rev: doc._rev
        };
        cb(err, result);
      });
    } else {
      putDoc(cb);
    }
    function transformForceOptionToNewEditsOption() {
      var parts = doc._rev.split('-');
      var oldRevId = parts[1];
      var oldRevNum = parseInt(parts[0], 10);
      var newRevNum = oldRevNum + 1;
      var newRevId = rev();
      doc._revisions = {
        start: newRevNum,
        ids: [newRevId, oldRevId]
      };
      doc._rev = newRevNum + '-' + newRevId;
      opts.new_edits = false;
    }
    function putDoc(next) {
      if (typeof self._put === 'function' && opts.new_edits !== false) {
        self._put(doc, opts, next);
      } else {
        self.bulkDocs({docs: [doc]}, opts, yankError(next, doc._id));
      }
    }
  });
  AbstractPouchDB.prototype.putAttachment = adapterFun('putAttachment', function(docId, attachmentId, rev$$1, blob, type) {
    var api = this;
    if (typeof type === 'function') {
      type = blob;
      blob = rev$$1;
      rev$$1 = null;
    }
    if (typeof type === 'undefined') {
      type = blob;
      blob = rev$$1;
      rev$$1 = null;
    }
    if (!type) {
      guardedConsole('warn', 'Attachment', attachmentId, 'on document', docId, 'is missing content_type');
    }
    function createAttachment(doc) {
      var prevrevpos = '_rev' in doc ? parseInt(doc._rev, 10) : 0;
      doc._attachments = doc._attachments || {};
      doc._attachments[attachmentId] = {
        content_type: type,
        data: blob,
        revpos: ++prevrevpos
      };
      return api.put(doc);
    }
    return api.get(docId).then(function(doc) {
      if (doc._rev !== rev$$1) {
        throw createError(REV_CONFLICT);
      }
      return createAttachment(doc);
    }, function(err) {
      if (err.reason === MISSING_DOC.message) {
        return createAttachment({_id: docId});
      } else {
        throw err;
      }
    });
  });
  AbstractPouchDB.prototype.removeAttachment = adapterFun('removeAttachment', function(docId, attachmentId, rev$$1, callback) {
    var self = this;
    self.get(docId, function(err, obj$$1) {
      if (err) {
        callback(err);
        return;
      }
      if (obj$$1._rev !== rev$$1) {
        callback(createError(REV_CONFLICT));
        return;
      }
      if (!obj$$1._attachments) {
        return callback();
      }
      delete obj$$1._attachments[attachmentId];
      if (Object.keys(obj$$1._attachments).length === 0) {
        delete obj$$1._attachments;
      }
      self.put(obj$$1, callback);
    });
  });
  AbstractPouchDB.prototype.remove = adapterFun('remove', function(docOrId, optsOrRev, opts, callback) {
    var doc;
    if (typeof optsOrRev === 'string') {
      doc = {
        _id: docOrId,
        _rev: optsOrRev
      };
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
    } else {
      doc = docOrId;
      if (typeof optsOrRev === 'function') {
        callback = optsOrRev;
        opts = {};
      } else {
        callback = opts;
        opts = optsOrRev;
      }
    }
    opts = opts || {};
    opts.was_delete = true;
    var newDoc = {
      _id: doc._id,
      _rev: (doc._rev || opts.rev)
    };
    newDoc._deleted = true;
    if (isLocalId(newDoc._id) && typeof this._removeLocal === 'function') {
      return this._removeLocal(doc, callback);
    }
    this.bulkDocs({docs: [newDoc]}, opts, yankError(callback, newDoc._id));
  });
  AbstractPouchDB.prototype.revsDiff = adapterFun('revsDiff', function(req, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var ids = Object.keys(req);
    if (!ids.length) {
      return callback(null, {});
    }
    var count = 0;
    var missing = new ExportedMap();
    function addToMissing(id, revId) {
      if (!missing.has(id)) {
        missing.set(id, {missing: []});
      }
      missing.get(id).missing.push(revId);
    }
    function processDoc(id, rev_tree) {
      var missingForId = req[id].slice(0);
      traverseRevTree(rev_tree, function(isLeaf, pos, revHash, ctx, opts) {
        var rev$$1 = pos + '-' + revHash;
        var idx = missingForId.indexOf(rev$$1);
        if (idx === -1) {
          return;
        }
        missingForId.splice(idx, 1);
        if (opts.status !== 'available') {
          addToMissing(id, rev$$1);
        }
      });
      missingForId.forEach(function(rev$$1) {
        addToMissing(id, rev$$1);
      });
    }
    ids.map(function(id) {
      this._getRevisionTree(id, function(err, rev_tree) {
        if (err && err.status === 404 && err.message === 'missing') {
          missing.set(id, {missing: req[id]});
        } else if (err) {
          return callback(err);
        } else {
          processDoc(id, rev_tree);
        }
        if (++count === ids.length) {
          var missingObj = {};
          missing.forEach(function(value, key) {
            missingObj[key] = value;
          });
          return callback(null, missingObj);
        }
      });
    }, this);
  });
  AbstractPouchDB.prototype.bulkGet = adapterFun('bulkGet', function(opts, callback) {
    bulkGet(this, opts, callback);
  });
  AbstractPouchDB.prototype.compactDocument = adapterFun('compactDocument', function(docId, maxHeight, callback) {
    var self = this;
    this._getRevisionTree(docId, function(err, revTree) {
      if (err) {
        return callback(err);
      }
      var height = computeHeight(revTree);
      var candidates = [];
      var revs = [];
      Object.keys(height).forEach(function(rev$$1) {
        if (height[rev$$1] > maxHeight) {
          candidates.push(rev$$1);
        }
      });
      traverseRevTree(revTree, function(isLeaf, pos, revHash, ctx, opts) {
        var rev$$1 = pos + '-' + revHash;
        if (opts.status === 'available' && candidates.indexOf(rev$$1) !== -1) {
          revs.push(rev$$1);
        }
      });
      self._doCompaction(docId, revs, callback);
    });
  });
  AbstractPouchDB.prototype.compact = adapterFun('compact', function(opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var self = this;
    opts = opts || {};
    self._compactionQueue = self._compactionQueue || [];
    self._compactionQueue.push({
      opts: opts,
      callback: callback
    });
    if (self._compactionQueue.length === 1) {
      doNextCompaction(self);
    }
  });
  AbstractPouchDB.prototype._compact = function(opts, callback) {
    var self = this;
    var changesOpts = {
      return_docs: false,
      last_seq: opts.last_seq || 0
    };
    var promises = [];
    function onChange(row) {
      promises.push(self.compactDocument(row.id, 0));
    }
    function onComplete(resp) {
      var lastSeq = resp.last_seq;
      PouchPromise$1.all(promises).then(function() {
        return upsert(self, '_local/compaction', function deltaFunc(doc) {
          if (!doc.last_seq || doc.last_seq < lastSeq) {
            doc.last_seq = lastSeq;
            return doc;
          }
          return false;
        });
      }).then(function() {
        callback(null, {ok: true});
      }).catch(callback);
    }
    self.changes(changesOpts).on('change', onChange).on('complete', onComplete).on('error', callback);
  };
  AbstractPouchDB.prototype.get = adapterFun('get', function(id, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
      opts = {};
    }
    if (typeof id !== 'string') {
      return cb(createError(INVALID_ID));
    }
    if (isLocalId(id) && typeof this._getLocal === 'function') {
      return this._getLocal(id, cb);
    }
    var leaves = [],
        self = this;
    function finishOpenRevs() {
      var result = [];
      var count = leaves.length;
      if (!count) {
        return cb(null, result);
      }
      leaves.forEach(function(leaf) {
        self.get(id, {
          rev: leaf,
          revs: opts.revs,
          latest: opts.latest,
          attachments: opts.attachments
        }, function(err, doc) {
          if (!err) {
            var existing;
            for (var i = 0,
                l = result.length; i < l; i++) {
              if (result[i].ok && result[i].ok._rev === doc._rev) {
                existing = true;
                break;
              }
            }
            if (!existing) {
              result.push({ok: doc});
            }
          } else {
            result.push({missing: leaf});
          }
          count--;
          if (!count) {
            cb(null, result);
          }
        });
      });
    }
    if (opts.open_revs) {
      if (opts.open_revs === "all") {
        this._getRevisionTree(id, function(err, rev_tree) {
          if (err) {
            return cb(err);
          }
          leaves = collectLeaves(rev_tree).map(function(leaf) {
            return leaf.rev;
          });
          finishOpenRevs();
        });
      } else {
        if (Array.isArray(opts.open_revs)) {
          leaves = opts.open_revs;
          for (var i = 0; i < leaves.length; i++) {
            var l = leaves[i];
            if (!(typeof(l) === "string" && /^\d+-/.test(l))) {
              return cb(createError(INVALID_REV));
            }
          }
          finishOpenRevs();
        } else {
          return cb(createError(UNKNOWN_ERROR, 'function_clause'));
        }
      }
      return;
    }
    return this._get(id, opts, function(err, result) {
      if (err) {
        err.docId = id;
        return cb(err);
      }
      var doc = result.doc;
      var metadata = result.metadata;
      var ctx = result.ctx;
      if (opts.conflicts) {
        var conflicts = collectConflicts(metadata);
        if (conflicts.length) {
          doc._conflicts = conflicts;
        }
      }
      if (isDeleted(metadata, doc._rev)) {
        doc._deleted = true;
      }
      if (opts.revs || opts.revs_info) {
        var splittedRev = doc._rev.split('-');
        var revNo = parseInt(splittedRev[0], 10);
        var revHash = splittedRev[1];
        var paths = rootToLeaf(metadata.rev_tree);
        var path$$1 = null;
        for (var i = 0; i < paths.length; i++) {
          var currentPath = paths[i];
          var hashIndex = currentPath.ids.map(function(x) {
            return x.id;
          }).indexOf(revHash);
          var hashFoundAtRevPos = hashIndex === (revNo - 1);
          if (hashFoundAtRevPos || (!path$$1 && hashIndex !== -1)) {
            path$$1 = currentPath;
          }
        }
        var indexOfRev = path$$1.ids.map(function(x) {
          return x.id;
        }).indexOf(doc._rev.split('-')[1]) + 1;
        var howMany = path$$1.ids.length - indexOfRev;
        path$$1.ids.splice(indexOfRev, howMany);
        path$$1.ids.reverse();
        if (opts.revs) {
          doc._revisions = {
            start: (path$$1.pos + path$$1.ids.length) - 1,
            ids: path$$1.ids.map(function(rev$$1) {
              return rev$$1.id;
            })
          };
        }
        if (opts.revs_info) {
          var pos = path$$1.pos + path$$1.ids.length;
          doc._revs_info = path$$1.ids.map(function(rev$$1) {
            pos--;
            return {
              rev: pos + '-' + rev$$1.id,
              status: rev$$1.opts.status
            };
          });
        }
      }
      if (opts.attachments && doc._attachments) {
        var attachments = doc._attachments;
        var count = Object.keys(attachments).length;
        if (count === 0) {
          return cb(null, doc);
        }
        Object.keys(attachments).forEach(function(key) {
          this._getAttachment(doc._id, key, attachments[key], {
            rev: doc._rev,
            binary: opts.binary,
            ctx: ctx
          }, function(err, data) {
            var att = doc._attachments[key];
            att.data = data;
            delete att.stub;
            delete att.length;
            if (!--count) {
              cb(null, doc);
            }
          });
        }, self);
      } else {
        if (doc._attachments) {
          for (var key in doc._attachments) {
            if (doc._attachments.hasOwnProperty(key)) {
              doc._attachments[key].stub = true;
            }
          }
        }
        cb(null, doc);
      }
    });
  });
  AbstractPouchDB.prototype.getAttachment = adapterFun('getAttachment', function(docId, attachmentId, opts, callback) {
    var self = this;
    if (opts instanceof Function) {
      callback = opts;
      opts = {};
    }
    this._get(docId, opts, function(err, res$$1) {
      if (err) {
        return callback(err);
      }
      if (res$$1.doc._attachments && res$$1.doc._attachments[attachmentId]) {
        opts.ctx = res$$1.ctx;
        opts.binary = true;
        self._getAttachment(docId, attachmentId, res$$1.doc._attachments[attachmentId], opts, callback);
      } else {
        return callback(createError(MISSING_DOC));
      }
    });
  });
  AbstractPouchDB.prototype.allDocs = adapterFun('allDocs', function(opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts.skip = typeof opts.skip !== 'undefined' ? opts.skip : 0;
    if (opts.start_key) {
      opts.startkey = opts.start_key;
    }
    if (opts.end_key) {
      opts.endkey = opts.end_key;
    }
    if ('keys' in opts) {
      if (!Array.isArray(opts.keys)) {
        return callback(new TypeError('options.keys must be an array'));
      }
      var incompatibleOpt = ['startkey', 'endkey', 'key'].filter(function(incompatibleOpt) {
        return incompatibleOpt in opts;
      })[0];
      if (incompatibleOpt) {
        callback(createError(QUERY_PARSE_ERROR, 'Query parameter `' + incompatibleOpt + '` is not compatible with multi-get'));
        return;
      }
      if (!isRemote(this)) {
        return allDocsKeysQuery(this, opts, callback);
      }
    }
    return this._allDocs(opts, callback);
  });
  AbstractPouchDB.prototype.changes = function(opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return new Changes$2(this, opts, callback);
  };
  AbstractPouchDB.prototype.close = adapterFun('close', function(callback) {
    this._closed = true;
    this.emit('closed');
    return this._close(callback);
  });
  AbstractPouchDB.prototype.info = adapterFun('info', function(callback) {
    var self = this;
    this._info(function(err, info) {
      if (err) {
        return callback(err);
      }
      info.db_name = info.db_name || self.name;
      info.auto_compaction = !!(self.auto_compaction && !isRemote(self));
      info.adapter = self.adapter;
      callback(null, info);
    });
  });
  AbstractPouchDB.prototype.id = adapterFun('id', function(callback) {
    return this._id(callback);
  });
  AbstractPouchDB.prototype.type = function() {
    return (typeof this._type === 'function') ? this._type() : this.adapter;
  };
  AbstractPouchDB.prototype.bulkDocs = adapterFun('bulkDocs', function(req, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = opts || {};
    if (Array.isArray(req)) {
      req = {docs: req};
    }
    if (!req || !req.docs || !Array.isArray(req.docs)) {
      return callback(createError(MISSING_BULK_DOCS));
    }
    for (var i = 0; i < req.docs.length; ++i) {
      if (typeof req.docs[i] !== 'object' || Array.isArray(req.docs[i])) {
        return callback(createError(NOT_AN_OBJECT));
      }
    }
    var attachmentError;
    req.docs.forEach(function(doc) {
      if (doc._attachments) {
        Object.keys(doc._attachments).forEach(function(name) {
          attachmentError = attachmentError || attachmentNameError(name);
          if (!doc._attachments[name].content_type) {
            guardedConsole('warn', 'Attachment', name, 'on document', doc._id, 'is missing content_type');
          }
        });
      }
    });
    if (attachmentError) {
      return callback(createError(BAD_REQUEST, attachmentError));
    }
    if (!('new_edits' in opts)) {
      if ('new_edits' in req) {
        opts.new_edits = req.new_edits;
      } else {
        opts.new_edits = true;
      }
    }
    var adapter = this;
    if (!opts.new_edits && !isRemote(adapter)) {
      req.docs.sort(compareByIdThenRev);
    }
    cleanDocs(req.docs);
    var ids = req.docs.map(function(doc) {
      return doc._id;
    });
    return this._bulkDocs(req, opts, function(err, res$$1) {
      if (err) {
        return callback(err);
      }
      if (!opts.new_edits) {
        res$$1 = res$$1.filter(function(x) {
          return x.error;
        });
      }
      if (!isRemote(adapter)) {
        for (var i = 0,
            l = res$$1.length; i < l; i++) {
          res$$1[i].id = res$$1[i].id || ids[i];
        }
      }
      callback(null, res$$1);
    });
  });
  AbstractPouchDB.prototype.registerDependentDatabase = adapterFun('registerDependentDatabase', function(dependentDb, callback) {
    var depDB = new this.constructor(dependentDb, this.__opts);
    function diffFun(doc) {
      doc.dependentDbs = doc.dependentDbs || {};
      if (doc.dependentDbs[dependentDb]) {
        return false;
      }
      doc.dependentDbs[dependentDb] = true;
      return doc;
    }
    upsert(this, '_local/_pouch_dependentDbs', diffFun).then(function() {
      callback(null, {db: depDB});
    }).catch(callback);
  });
  AbstractPouchDB.prototype.destroy = adapterFun('destroy', function(opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var self = this;
    var usePrefix = 'use_prefix' in self ? self.use_prefix : true;
    function destroyDb() {
      self._destroy(opts, function(err, resp) {
        if (err) {
          return callback(err);
        }
        self._destroyed = true;
        self.emit('destroyed');
        callback(null, resp || {'ok': true});
      });
    }
    if (isRemote(self)) {
      return destroyDb();
    }
    self.get('_local/_pouch_dependentDbs', function(err, localDoc) {
      if (err) {
        if (err.status !== 404) {
          return callback(err);
        } else {
          return destroyDb();
        }
      }
      var dependentDbs = localDoc.dependentDbs;
      var PouchDB = self.constructor;
      var deletedMap = Object.keys(dependentDbs).map(function(name) {
        var trueName = usePrefix ? name.replace(new RegExp('^' + PouchDB.prefix), '') : name;
        return new PouchDB(trueName, self.__opts).destroy();
      });
      PouchPromise$1.all(deletedMap).then(destroyDb, callback);
    });
  });
  function TaskQueue$1() {
    this.isReady = false;
    this.failed = false;
    this.queue = [];
  }
  TaskQueue$1.prototype.execute = function() {
    var fun;
    if (this.failed) {
      while ((fun = this.queue.shift())) {
        fun(this.failed);
      }
    } else {
      while ((fun = this.queue.shift())) {
        fun();
      }
    }
  };
  TaskQueue$1.prototype.fail = function(err) {
    this.failed = err;
    this.execute();
  };
  TaskQueue$1.prototype.ready = function(db) {
    this.isReady = true;
    this.db = db;
    this.execute();
  };
  TaskQueue$1.prototype.addTask = function(fun) {
    this.queue.push(fun);
    if (this.failed) {
      this.execute();
    }
  };
  function parseAdapter(name, opts) {
    var match = name.match(/([a-z-]*):\/\/(.*)/);
    if (match) {
      return {
        name: /https?/.test(match[1]) ? match[1] + '://' + match[2] : match[2],
        adapter: match[1]
      };
    }
    var adapters = PouchDB$5.adapters;
    var preferredAdapters = PouchDB$5.preferredAdapters;
    var prefix = PouchDB$5.prefix;
    var adapterName = opts.adapter;
    if (!adapterName) {
      for (var i = 0; i < preferredAdapters.length; ++i) {
        adapterName = preferredAdapters[i];
        if (adapterName === 'idb' && 'websql' in adapters && hasLocalStorage() && localStorage['_pouch__websqldb_' + prefix + name]) {
          guardedConsole('log', 'PouchDB is downgrading "' + name + '" to WebSQL to' + ' avoid data loss, because it was already opened with WebSQL.');
          continue;
        }
        break;
      }
    }
    var adapter = adapters[adapterName];
    var usePrefix = (adapter && 'use_prefix' in adapter) ? adapter.use_prefix : true;
    return {
      name: usePrefix ? (prefix + name) : name,
      adapter: adapterName
    };
  }
  function prepareForDestruction(self) {
    function onDestroyed(from_constructor) {
      self.removeListener('closed', onClosed);
      if (!from_constructor) {
        self.constructor.emit('destroyed', self.name);
      }
    }
    function onClosed() {
      self.removeListener('destroyed', onDestroyed);
      self.constructor.emit('unref', self);
    }
    self.once('destroyed', onDestroyed);
    self.once('closed', onClosed);
    self.constructor.emit('ref', self);
  }
  inherits(PouchDB$5, AbstractPouchDB);
  function PouchDB$5(name, opts) {
    if (!(this instanceof PouchDB$5)) {
      return new PouchDB$5(name, opts);
    }
    var self = this;
    opts = opts || {};
    if (name && typeof name === 'object') {
      opts = name;
      name = opts.name;
      delete opts.name;
    }
    this.__opts = opts = clone(opts);
    self.auto_compaction = opts.auto_compaction;
    self.prefix = PouchDB$5.prefix;
    if (typeof name !== 'string') {
      throw new Error('Missing/invalid DB name');
    }
    var prefixedName = (opts.prefix || '') + name;
    var backend = parseAdapter(prefixedName, opts);
    opts.name = backend.name;
    opts.adapter = opts.adapter || backend.adapter;
    self.name = name;
    self._adapter = opts.adapter;
    PouchDB$5.emit('debug', ['adapter', 'Picked adapter: ', opts.adapter]);
    if (!PouchDB$5.adapters[opts.adapter] || !PouchDB$5.adapters[opts.adapter].valid()) {
      throw new Error('Invalid Adapter: ' + opts.adapter);
    }
    AbstractPouchDB.call(self);
    self.taskqueue = new TaskQueue$1();
    self.adapter = opts.adapter;
    PouchDB$5.adapters[opts.adapter].call(self, opts, function(err) {
      if (err) {
        return self.taskqueue.fail(err);
      }
      prepareForDestruction(self);
      self.emit('created', self);
      PouchDB$5.emit('created', self.name);
      self.taskqueue.ready(self);
    });
  }
  PouchDB$5.adapters = {};
  PouchDB$5.preferredAdapters = [];
  PouchDB$5.prefix = '_pouch_';
  var eventEmitter = new events.EventEmitter();
  function setUpEventEmitter(Pouch) {
    Object.keys(events.EventEmitter.prototype).forEach(function(key) {
      if (typeof events.EventEmitter.prototype[key] === 'function') {
        Pouch[key] = eventEmitter[key].bind(eventEmitter);
      }
    });
    var destructListeners = Pouch._destructionListeners = new ExportedMap();
    Pouch.on('ref', function onConstructorRef(db) {
      if (!destructListeners.has(db.name)) {
        destructListeners.set(db.name, []);
      }
      destructListeners.get(db.name).push(db);
    });
    Pouch.on('unref', function onConstructorUnref(db) {
      if (!destructListeners.has(db.name)) {
        return;
      }
      var dbList = destructListeners.get(db.name);
      var pos = dbList.indexOf(db);
      if (pos < 0) {
        return;
      }
      dbList.splice(pos, 1);
      if (dbList.length > 1) {
        destructListeners.set(db.name, dbList);
      } else {
        destructListeners.delete(db.name);
      }
    });
    Pouch.on('destroyed', function onConstructorDestroyed(name) {
      if (!destructListeners.has(name)) {
        return;
      }
      var dbList = destructListeners.get(name);
      destructListeners.delete(name);
      dbList.forEach(function(db) {
        db.emit('destroyed', true);
      });
    });
  }
  setUpEventEmitter(PouchDB$5);
  PouchDB$5.adapter = function(id, obj$$1, addToPreferredAdapters) {
    if (obj$$1.valid()) {
      PouchDB$5.adapters[id] = obj$$1;
      if (addToPreferredAdapters) {
        PouchDB$5.preferredAdapters.push(id);
      }
    }
  };
  PouchDB$5.plugin = function(obj$$1) {
    if (typeof obj$$1 === 'function') {
      obj$$1(PouchDB$5);
    } else if (typeof obj$$1 !== 'object' || Object.keys(obj$$1).length === 0) {
      throw new Error('Invalid plugin: got "' + obj$$1 + '", expected an object or a function');
    } else {
      Object.keys(obj$$1).forEach(function(id) {
        PouchDB$5.prototype[id] = obj$$1[id];
      });
    }
    if (this.__defaults) {
      PouchDB$5.__defaults = $inject_Object_assign({}, this.__defaults);
    }
    return PouchDB$5;
  };
  PouchDB$5.defaults = function(defaultOpts) {
    function PouchAlt(name, opts) {
      if (!(this instanceof PouchAlt)) {
        return new PouchAlt(name, opts);
      }
      opts = opts || {};
      if (name && typeof name === 'object') {
        opts = name;
        name = opts.name;
        delete opts.name;
      }
      opts = $inject_Object_assign({}, PouchAlt.__defaults, opts);
      PouchDB$5.call(this, name, opts);
    }
    inherits(PouchAlt, PouchDB$5);
    PouchAlt.preferredAdapters = PouchDB$5.preferredAdapters.slice();
    Object.keys(PouchDB$5).forEach(function(key) {
      if (!(key in PouchAlt)) {
        PouchAlt[key] = PouchDB$5[key];
      }
    });
    PouchAlt.__defaults = $inject_Object_assign({}, this.__defaults, defaultOpts);
    return PouchAlt;
  };
  var version = "6.3.2";
  function debugPouch(PouchDB) {
    PouchDB.debug = debug;
    var logs = {};
    PouchDB.on('debug', function(args) {
      var logId = args[0];
      var logArgs = args.slice(1);
      if (!logs[logId]) {
        logs[logId] = debug('pouchdb:' + logId);
      }
      logs[logId].apply(null, logArgs);
    });
  }
  function getFieldFromDoc(doc, parsedField) {
    var value = doc;
    for (var i = 0,
        len = parsedField.length; i < len; i++) {
      var key = parsedField[i];
      value = value[key];
      if (!value) {
        break;
      }
    }
    return value;
  }
  function compare$1(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
  }
  function parseField(fieldName) {
    var fields = [];
    var current = '';
    for (var i = 0,
        len = fieldName.length; i < len; i++) {
      var ch = fieldName[i];
      if (ch === '.') {
        if (i > 0 && fieldName[i - 1] === '\\') {
          current = current.substring(0, current.length - 1) + '.';
        } else {
          fields.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  }
  var combinationFields = ['$or', '$nor', '$not'];
  function isCombinationalField(field) {
    return combinationFields.indexOf(field) > -1;
  }
  function getKey(obj$$1) {
    return Object.keys(obj$$1)[0];
  }
  function getValue(obj$$1) {
    return obj$$1[getKey(obj$$1)];
  }
  function mergeAndedSelectors(selectors) {
    var res$$1 = {};
    selectors.forEach(function(selector) {
      Object.keys(selector).forEach(function(field) {
        var matcher = selector[field];
        if (typeof matcher !== 'object') {
          matcher = {$eq: matcher};
        }
        if (isCombinationalField(field)) {
          if (matcher instanceof Array) {
            res$$1[field] = matcher.map(function(m) {
              return mergeAndedSelectors([m]);
            });
          } else {
            res$$1[field] = mergeAndedSelectors([matcher]);
          }
        } else {
          var fieldMatchers = res$$1[field] = res$$1[field] || {};
          Object.keys(matcher).forEach(function(operator) {
            var value = matcher[operator];
            if (operator === '$gt' || operator === '$gte') {
              return mergeGtGte(operator, value, fieldMatchers);
            } else if (operator === '$lt' || operator === '$lte') {
              return mergeLtLte(operator, value, fieldMatchers);
            } else if (operator === '$ne') {
              return mergeNe(value, fieldMatchers);
            } else if (operator === '$eq') {
              return mergeEq(value, fieldMatchers);
            }
            fieldMatchers[operator] = value;
          });
        }
      });
    });
    return res$$1;
  }
  function mergeGtGte(operator, value, fieldMatchers) {
    if (typeof fieldMatchers.$eq !== 'undefined') {
      return;
    }
    if (typeof fieldMatchers.$gte !== 'undefined') {
      if (operator === '$gte') {
        if (value > fieldMatchers.$gte) {
          fieldMatchers.$gte = value;
        }
      } else {
        if (value >= fieldMatchers.$gte) {
          delete fieldMatchers.$gte;
          fieldMatchers.$gt = value;
        }
      }
    } else if (typeof fieldMatchers.$gt !== 'undefined') {
      if (operator === '$gte') {
        if (value > fieldMatchers.$gt) {
          delete fieldMatchers.$gt;
          fieldMatchers.$gte = value;
        }
      } else {
        if (value > fieldMatchers.$gt) {
          fieldMatchers.$gt = value;
        }
      }
    } else {
      fieldMatchers[operator] = value;
    }
  }
  function mergeLtLte(operator, value, fieldMatchers) {
    if (typeof fieldMatchers.$eq !== 'undefined') {
      return;
    }
    if (typeof fieldMatchers.$lte !== 'undefined') {
      if (operator === '$lte') {
        if (value < fieldMatchers.$lte) {
          fieldMatchers.$lte = value;
        }
      } else {
        if (value <= fieldMatchers.$lte) {
          delete fieldMatchers.$lte;
          fieldMatchers.$lt = value;
        }
      }
    } else if (typeof fieldMatchers.$lt !== 'undefined') {
      if (operator === '$lte') {
        if (value < fieldMatchers.$lt) {
          delete fieldMatchers.$lt;
          fieldMatchers.$lte = value;
        }
      } else {
        if (value < fieldMatchers.$lt) {
          fieldMatchers.$lt = value;
        }
      }
    } else {
      fieldMatchers[operator] = value;
    }
  }
  function mergeNe(value, fieldMatchers) {
    if ('$ne' in fieldMatchers) {
      fieldMatchers.$ne.push(value);
    } else {
      fieldMatchers.$ne = [value];
    }
  }
  function mergeEq(value, fieldMatchers) {
    delete fieldMatchers.$gt;
    delete fieldMatchers.$gte;
    delete fieldMatchers.$lt;
    delete fieldMatchers.$lte;
    delete fieldMatchers.$ne;
    fieldMatchers.$eq = value;
  }
  function massageSelector(input) {
    var result = clone(input);
    var wasAnded = false;
    if ('$and' in result) {
      result = mergeAndedSelectors(result['$and']);
      wasAnded = true;
    }
    ['$or', '$nor'].forEach(function(orOrNor) {
      if (orOrNor in result) {
        result[orOrNor].forEach(function(subSelector) {
          var fields = Object.keys(subSelector);
          for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var matcher = subSelector[field];
            if (typeof matcher !== 'object' || matcher === null) {
              subSelector[field] = {$eq: matcher};
            }
          }
        });
      }
    });
    if ('$not' in result) {
      result['$not'] = mergeAndedSelectors([result['$not']]);
    }
    var fields = Object.keys(result);
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var matcher = result[field];
      if (typeof matcher !== 'object' || matcher === null) {
        matcher = {$eq: matcher};
      } else if ('$ne' in matcher && !wasAnded) {
        matcher.$ne = [matcher.$ne];
      }
      result[field] = matcher;
    }
    return result;
  }
  function pad(str, padWith, upToLength) {
    var padding = '';
    var targetLength = upToLength - str.length;
    while (padding.length < targetLength) {
      padding += padWith;
    }
    return padding;
  }
  function padLeft(str, padWith, upToLength) {
    var padding = pad(str, padWith, upToLength);
    return padding + str;
  }
  var MIN_MAGNITUDE = -324;
  var MAGNITUDE_DIGITS = 3;
  var SEP = '';
  function collate(a, b) {
    if (a === b) {
      return 0;
    }
    a = normalizeKey(a);
    b = normalizeKey(b);
    var ai = collationIndex(a);
    var bi = collationIndex(b);
    if ((ai - bi) !== 0) {
      return ai - bi;
    }
    switch (typeof a) {
      case 'number':
        return a - b;
      case 'boolean':
        return a < b ? -1 : 1;
      case 'string':
        return stringCollate(a, b);
    }
    return Array.isArray(a) ? arrayCollate(a, b) : objectCollate(a, b);
  }
  function normalizeKey(key) {
    switch (typeof key) {
      case 'undefined':
        return null;
      case 'number':
        if (key === Infinity || key === -Infinity || isNaN(key)) {
          return null;
        }
        return key;
      case 'object':
        var origKey = key;
        if (Array.isArray(key)) {
          var len = key.length;
          key = new Array(len);
          for (var i = 0; i < len; i++) {
            key[i] = normalizeKey(origKey[i]);
          }
        } else if (key instanceof Date) {
          return key.toJSON();
        } else if (key !== null) {
          key = {};
          for (var k in origKey) {
            if (origKey.hasOwnProperty(k)) {
              var val = origKey[k];
              if (typeof val !== 'undefined') {
                key[k] = normalizeKey(val);
              }
            }
          }
        }
    }
    return key;
  }
  function indexify(key) {
    if (key !== null) {
      switch (typeof key) {
        case 'boolean':
          return key ? 1 : 0;
        case 'number':
          return numToIndexableString(key);
        case 'string':
          return key.replace(/\u0002/g, '\u0002\u0002').replace(/\u0001/g, '\u0001\u0002').replace(/\u0000/g, '\u0001\u0001');
        case 'object':
          var isArray = Array.isArray(key);
          var arr = isArray ? key : Object.keys(key);
          var i = -1;
          var len = arr.length;
          var result = '';
          if (isArray) {
            while (++i < len) {
              result += toIndexableString(arr[i]);
            }
          } else {
            while (++i < len) {
              var objKey = arr[i];
              result += toIndexableString(objKey) + toIndexableString(key[objKey]);
            }
          }
          return result;
      }
    }
    return '';
  }
  function toIndexableString(key) {
    var zero = '\u0000';
    key = normalizeKey(key);
    return collationIndex(key) + SEP + indexify(key) + zero;
  }
  function parseNumber(str, i) {
    var originalIdx = i;
    var num;
    var zero = str[i] === '1';
    if (zero) {
      num = 0;
      i++;
    } else {
      var neg = str[i] === '0';
      i++;
      var numAsString = '';
      var magAsString = str.substring(i, i + MAGNITUDE_DIGITS);
      var magnitude = parseInt(magAsString, 10) + MIN_MAGNITUDE;
      if (neg) {
        magnitude = -magnitude;
      }
      i += MAGNITUDE_DIGITS;
      while (true) {
        var ch = str[i];
        if (ch === '\u0000') {
          break;
        } else {
          numAsString += ch;
        }
        i++;
      }
      numAsString = numAsString.split('.');
      if (numAsString.length === 1) {
        num = parseInt(numAsString, 10);
      } else {
        num = parseFloat(numAsString[0] + '.' + numAsString[1]);
      }
      if (neg) {
        num = num - 10;
      }
      if (magnitude !== 0) {
        num = parseFloat(num + 'e' + magnitude);
      }
    }
    return {
      num: num,
      length: i - originalIdx
    };
  }
  function pop(stack, metaStack) {
    var obj$$1 = stack.pop();
    if (metaStack.length) {
      var lastMetaElement = metaStack[metaStack.length - 1];
      if (obj$$1 === lastMetaElement.element) {
        metaStack.pop();
        lastMetaElement = metaStack[metaStack.length - 1];
      }
      var element = lastMetaElement.element;
      var lastElementIndex = lastMetaElement.index;
      if (Array.isArray(element)) {
        element.push(obj$$1);
      } else if (lastElementIndex === stack.length - 2) {
        var key = stack.pop();
        element[key] = obj$$1;
      } else {
        stack.push(obj$$1);
      }
    }
  }
  function parseIndexableString(str) {
    var stack = [];
    var metaStack = [];
    var i = 0;
    while (true) {
      var collationIndex = str[i++];
      if (collationIndex === '\u0000') {
        if (stack.length === 1) {
          return stack.pop();
        } else {
          pop(stack, metaStack);
          continue;
        }
      }
      switch (collationIndex) {
        case '1':
          stack.push(null);
          break;
        case '2':
          stack.push(str[i] === '1');
          i++;
          break;
        case '3':
          var parsedNum = parseNumber(str, i);
          stack.push(parsedNum.num);
          i += parsedNum.length;
          break;
        case '4':
          var parsedStr = '';
          while (true) {
            var ch = str[i];
            if (ch === '\u0000') {
              break;
            }
            parsedStr += ch;
            i++;
          }
          parsedStr = parsedStr.replace(/\u0001\u0001/g, '\u0000').replace(/\u0001\u0002/g, '\u0001').replace(/\u0002\u0002/g, '\u0002');
          stack.push(parsedStr);
          break;
        case '5':
          var arrayElement = {
            element: [],
            index: stack.length
          };
          stack.push(arrayElement.element);
          metaStack.push(arrayElement);
          break;
        case '6':
          var objElement = {
            element: {},
            index: stack.length
          };
          stack.push(objElement.element);
          metaStack.push(objElement);
          break;
        default:
          throw new Error('bad collationIndex or unexpectedly reached end of input: ' + collationIndex);
      }
    }
  }
  function arrayCollate(a, b) {
    var len = Math.min(a.length, b.length);
    for (var i = 0; i < len; i++) {
      var sort = collate(a[i], b[i]);
      if (sort !== 0) {
        return sort;
      }
    }
    return (a.length === b.length) ? 0 : (a.length > b.length) ? 1 : -1;
  }
  function stringCollate(a, b) {
    return (a === b) ? 0 : ((a > b) ? 1 : -1);
  }
  function objectCollate(a, b) {
    var ak = Object.keys(a),
        bk = Object.keys(b);
    var len = Math.min(ak.length, bk.length);
    for (var i = 0; i < len; i++) {
      var sort = collate(ak[i], bk[i]);
      if (sort !== 0) {
        return sort;
      }
      sort = collate(a[ak[i]], b[bk[i]]);
      if (sort !== 0) {
        return sort;
      }
    }
    return (ak.length === bk.length) ? 0 : (ak.length > bk.length) ? 1 : -1;
  }
  function collationIndex(x) {
    var id = ['boolean', 'number', 'string', 'object'];
    var idx = id.indexOf(typeof x);
    if (~idx) {
      if (x === null) {
        return 1;
      }
      if (Array.isArray(x)) {
        return 5;
      }
      return idx < 3 ? (idx + 2) : (idx + 3);
    }
    if (Array.isArray(x)) {
      return 5;
    }
  }
  function numToIndexableString(num) {
    if (num === 0) {
      return '1';
    }
    var expFormat = num.toExponential().split(/e\+?/);
    var magnitude = parseInt(expFormat[1], 10);
    var neg = num < 0;
    var result = neg ? '0' : '2';
    var magForComparison = ((neg ? -magnitude : magnitude) - MIN_MAGNITUDE);
    var magString = padLeft((magForComparison).toString(), '0', MAGNITUDE_DIGITS);
    result += SEP + magString;
    var factor = Math.abs(parseFloat(expFormat[0]));
    if (neg) {
      factor = 10 - factor;
    }
    var factorStr = factor.toFixed(20);
    factorStr = factorStr.replace(/\.?0+$/, '');
    result += SEP + factorStr;
    return result;
  }
  function createFieldSorter(sort) {
    function getFieldValuesAsArray(doc) {
      return sort.map(function(sorting) {
        var fieldName = getKey(sorting);
        var parsedField = parseField(fieldName);
        var docFieldValue = getFieldFromDoc(doc, parsedField);
        return docFieldValue;
      });
    }
    return function(aRow, bRow) {
      var aFieldValues = getFieldValuesAsArray(aRow.doc);
      var bFieldValues = getFieldValuesAsArray(bRow.doc);
      var collation = collate(aFieldValues, bFieldValues);
      if (collation !== 0) {
        return collation;
      }
      return compare$1(aRow.doc._id, bRow.doc._id);
    };
  }
  function filterInMemoryFields(rows, requestDef, inMemoryFields) {
    rows = rows.filter(function(row) {
      return rowFilter(row.doc, requestDef.selector, inMemoryFields);
    });
    if (requestDef.sort) {
      var fieldSorter = createFieldSorter(requestDef.sort);
      rows = rows.sort(fieldSorter);
      if (typeof requestDef.sort[0] !== 'string' && getValue(requestDef.sort[0]) === 'desc') {
        rows = rows.reverse();
      }
    }
    if ('limit' in requestDef || 'skip' in requestDef) {
      var skip = requestDef.skip || 0;
      var limit = ('limit' in requestDef ? requestDef.limit : rows.length) + skip;
      rows = rows.slice(skip, limit);
    }
    return rows;
  }
  function rowFilter(doc, selector, inMemoryFields) {
    return inMemoryFields.every(function(field) {
      var matcher = selector[field];
      var parsedField = parseField(field);
      var docFieldValue = getFieldFromDoc(doc, parsedField);
      if (isCombinationalField(field)) {
        return matchCominationalSelector(field, matcher, doc);
      }
      return matchSelector(matcher, doc, parsedField, docFieldValue);
    });
  }
  function matchSelector(matcher, doc, parsedField, docFieldValue) {
    if (!matcher) {
      return true;
    }
    return Object.keys(matcher).every(function(userOperator) {
      var userValue = matcher[userOperator];
      return match(userOperator, doc, userValue, parsedField, docFieldValue);
    });
  }
  function matchCominationalSelector(field, matcher, doc) {
    if (field === '$or') {
      return matcher.some(function(orMatchers) {
        return rowFilter(doc, orMatchers, Object.keys(orMatchers));
      });
    }
    if (field === '$not') {
      return !rowFilter(doc, matcher, Object.keys(matcher));
    }
    return !matcher.find(function(orMatchers) {
      return rowFilter(doc, orMatchers, Object.keys(orMatchers));
    });
  }
  function match(userOperator, doc, userValue, parsedField, docFieldValue) {
    if (!matchers[userOperator]) {
      throw new Error('unknown operator "' + userOperator + '" - should be one of $eq, $lte, $lt, $gt, $gte, $exists, $ne, $in, ' + '$nin, $size, $mod, $regex, $elemMatch, $type, $allMatch or $all');
    }
    return matchers[userOperator](doc, userValue, parsedField, docFieldValue);
  }
  function fieldExists(docFieldValue) {
    return typeof docFieldValue !== 'undefined' && docFieldValue !== null;
  }
  function fieldIsNotUndefined(docFieldValue) {
    return typeof docFieldValue !== 'undefined';
  }
  function modField(docFieldValue, userValue) {
    var divisor = userValue[0];
    var mod = userValue[1];
    if (divisor === 0) {
      throw new Error('Bad divisor, cannot divide by zero');
    }
    if (parseInt(divisor, 10) !== divisor) {
      throw new Error('Divisor is not an integer');
    }
    if (parseInt(mod, 10) !== mod) {
      throw new Error('Modulus is not an integer');
    }
    if (parseInt(docFieldValue, 10) !== docFieldValue) {
      return false;
    }
    return docFieldValue % divisor === mod;
  }
  function arrayContainsValue(docFieldValue, userValue) {
    return userValue.some(function(val) {
      if (docFieldValue instanceof Array) {
        return docFieldValue.indexOf(val) > -1;
      }
      return docFieldValue === val;
    });
  }
  function arrayContainsAllValues(docFieldValue, userValue) {
    return userValue.every(function(val) {
      return docFieldValue.indexOf(val) > -1;
    });
  }
  function arraySize(docFieldValue, userValue) {
    return docFieldValue.length === userValue;
  }
  function regexMatch(docFieldValue, userValue) {
    var re = new RegExp(userValue);
    return re.test(docFieldValue);
  }
  function typeMatch(docFieldValue, userValue) {
    switch (userValue) {
      case 'null':
        return docFieldValue === null;
      case 'boolean':
        return typeof(docFieldValue) === 'boolean';
      case 'number':
        return typeof(docFieldValue) === 'number';
      case 'string':
        return typeof(docFieldValue) === 'string';
      case 'array':
        return docFieldValue instanceof Array;
      case 'object':
        return ({}).toString.call(docFieldValue) === '[object Object]';
    }
    throw new Error(userValue + ' not supported as a type.' + 'Please use one of object, string, array, number, boolean or null.');
  }
  var matchers = {
    '$elemMatch': function(doc, userValue, parsedField, docFieldValue) {
      if (!Array.isArray(docFieldValue)) {
        return false;
      }
      if (docFieldValue.length === 0) {
        return false;
      }
      if (typeof docFieldValue[0] === 'object') {
        return docFieldValue.some(function(val) {
          return rowFilter(val, userValue, Object.keys(userValue));
        });
      }
      return docFieldValue.some(function(val) {
        return matchSelector(userValue, doc, parsedField, val);
      });
    },
    '$allMatch': function(doc, userValue, parsedField, docFieldValue) {
      if (!Array.isArray(docFieldValue)) {
        return false;
      }
      if (docFieldValue.length === 0) {
        return false;
      }
      if (typeof docFieldValue[0] === 'object') {
        return docFieldValue.every(function(val) {
          return rowFilter(val, userValue, Object.keys(userValue));
        });
      }
      return docFieldValue.every(function(val) {
        return matchSelector(userValue, doc, parsedField, val);
      });
    },
    '$eq': function(doc, userValue, parsedField, docFieldValue) {
      return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) === 0;
    },
    '$gte': function(doc, userValue, parsedField, docFieldValue) {
      return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) >= 0;
    },
    '$gt': function(doc, userValue, parsedField, docFieldValue) {
      return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) > 0;
    },
    '$lte': function(doc, userValue, parsedField, docFieldValue) {
      return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) <= 0;
    },
    '$lt': function(doc, userValue, parsedField, docFieldValue) {
      return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) < 0;
    },
    '$exists': function(doc, userValue, parsedField, docFieldValue) {
      if (userValue) {
        return fieldIsNotUndefined(docFieldValue);
      }
      return !fieldIsNotUndefined(docFieldValue);
    },
    '$mod': function(doc, userValue, parsedField, docFieldValue) {
      return fieldExists(docFieldValue) && modField(docFieldValue, userValue);
    },
    '$ne': function(doc, userValue, parsedField, docFieldValue) {
      return userValue.every(function(neValue) {
        return collate(docFieldValue, neValue) !== 0;
      });
    },
    '$in': function(doc, userValue, parsedField, docFieldValue) {
      return fieldExists(docFieldValue) && arrayContainsValue(docFieldValue, userValue);
    },
    '$nin': function(doc, userValue, parsedField, docFieldValue) {
      return fieldExists(docFieldValue) && !arrayContainsValue(docFieldValue, userValue);
    },
    '$size': function(doc, userValue, parsedField, docFieldValue) {
      return fieldExists(docFieldValue) && arraySize(docFieldValue, userValue);
    },
    '$all': function(doc, userValue, parsedField, docFieldValue) {
      return Array.isArray(docFieldValue) && arrayContainsAllValues(docFieldValue, userValue);
    },
    '$regex': function(doc, userValue, parsedField, docFieldValue) {
      return fieldExists(docFieldValue) && regexMatch(docFieldValue, userValue);
    },
    '$type': function(doc, userValue, parsedField, docFieldValue) {
      return typeMatch(docFieldValue, userValue);
    }
  };
  function matchesSelector(doc, selector) {
    if (typeof selector !== 'object') {
      throw new Error('Selector error: expected a JSON object');
    }
    selector = massageSelector(selector);
    var row = {'doc': doc};
    var rowsMatched = filterInMemoryFields([row], {'selector': selector}, Object.keys(selector));
    return rowsMatched && rowsMatched.length === 1;
  }
  function evalFilter(input) {
    var code = '(function() {\n"use strict";\nreturn ' + input + '\n})()';
    return vm.runInNewContext(code);
  }
  function evalView(input) {
    var code = ['"use strict";', 'var emitted = false;', 'var emit = function (a, b) {', '  emitted = true;', '};', 'var view = ' + input + ';', 'view(doc);', 'if (emitted) {', '  return true;', '}'].join('\n');
    return vm.runInNewContext('(function(doc) {\n' + code + '\n})');
  }
  function validate(opts, callback) {
    if (opts.selector) {
      if (opts.filter && opts.filter !== '_selector') {
        var filterName = typeof opts.filter === 'string' ? opts.filter : 'function';
        return callback(new Error('selector invalid for filter "' + filterName + '"'));
      }
    }
    callback();
  }
  function normalize(opts) {
    if (opts.view && !opts.filter) {
      opts.filter = '_view';
    }
    if (opts.selector && !opts.filter) {
      opts.filter = '_selector';
    }
    if (opts.filter && typeof opts.filter === 'string') {
      if (opts.filter === '_view') {
        opts.view = normalizeDesignDocFunctionName(opts.view);
      } else {
        opts.filter = normalizeDesignDocFunctionName(opts.filter);
      }
    }
  }
  function shouldFilter(changesHandler, opts) {
    return opts.filter && typeof opts.filter === 'string' && !opts.doc_ids && !isRemote(changesHandler.db);
  }
  function filter(changesHandler, opts) {
    var callback = opts.complete;
    if (opts.filter === '_view') {
      if (!opts.view || typeof opts.view !== 'string') {
        var err = createError(BAD_REQUEST, '`view` filter parameter not found or invalid.');
        return callback(err);
      }
      var viewName = parseDesignDocFunctionName(opts.view);
      changesHandler.db.get('_design/' + viewName[0], function(err, ddoc) {
        if (changesHandler.isCancelled) {
          return callback(null, {status: 'cancelled'});
        }
        if (err) {
          return callback(generateErrorFromResponse(err));
        }
        var mapFun = ddoc && ddoc.views && ddoc.views[viewName[1]] && ddoc.views[viewName[1]].map;
        if (!mapFun) {
          return callback(createError(MISSING_DOC, (ddoc.views ? 'missing json key: ' + viewName[1] : 'missing json key: views')));
        }
        opts.filter = evalView(mapFun);
        changesHandler.doChanges(opts);
      });
    } else if (opts.selector) {
      opts.filter = function(doc) {
        return matchesSelector(doc, opts.selector);
      };
      changesHandler.doChanges(opts);
    } else {
      var filterName = parseDesignDocFunctionName(opts.filter);
      changesHandler.db.get('_design/' + filterName[0], function(err, ddoc) {
        if (changesHandler.isCancelled) {
          return callback(null, {status: 'cancelled'});
        }
        if (err) {
          return callback(generateErrorFromResponse(err));
        }
        var filterFun = ddoc && ddoc.filters && ddoc.filters[filterName[1]];
        if (!filterFun) {
          return callback(createError(MISSING_DOC, ((ddoc && ddoc.filters) ? 'missing json key: ' + filterName[1] : 'missing json key: filters')));
        }
        opts.filter = evalFilter(filterFun);
        changesHandler.doChanges(opts);
      });
    }
  }
  function applyChangesFilterPlugin(PouchDB) {
    PouchDB._changesFilterPlugin = {
      validate: validate,
      normalize: normalize,
      shouldFilter: shouldFilter,
      filter: filter
    };
  }
  PouchDB$5.plugin(debugPouch);
  PouchDB$5.plugin(applyChangesFilterPlugin);
  PouchDB$5.version = version;
  function isFunction(f) {
    return 'function' === typeof f;
  }
  function getPrefix(db) {
    if (isFunction(db.prefix)) {
      return db.prefix();
    }
    return db;
  }
  function clone$2(_obj) {
    var obj$$1 = {};
    for (var k in _obj) {
      obj$$1[k] = _obj[k];
    }
    return obj$$1;
  }
  function nut(db, precodec, codec) {
    function encodePrefix(prefix, key, opts1, opts2) {
      return precodec.encode([prefix, codec.encodeKey(key, opts1, opts2)]);
    }
    function addEncodings(op, prefix) {
      if (prefix && prefix.options) {
        op.keyEncoding = op.keyEncoding || prefix.options.keyEncoding;
        op.valueEncoding = op.valueEncoding || prefix.options.valueEncoding;
      }
      return op;
    }
    db.open(function() {});
    return {
      apply: function(ops, opts, cb) {
        opts = opts || {};
        var batch = [];
        var i = -1;
        var len = ops.length;
        while (++i < len) {
          var op = ops[i];
          addEncodings(op, op.prefix);
          op.prefix = getPrefix(op.prefix);
          batch.push({
            key: encodePrefix(op.prefix, op.key, opts, op),
            value: op.type !== 'del' && codec.encodeValue(op.value, opts, op),
            type: op.type
          });
        }
        db.db.batch(batch, opts, cb);
      },
      get: function(key, prefix, opts, cb) {
        opts.asBuffer = codec.valueAsBuffer(opts);
        return db.db.get(encodePrefix(prefix, key, opts), opts, function(err, value) {
          if (err) {
            cb(err);
          } else {
            cb(null, codec.decodeValue(value, opts));
          }
        });
      },
      createDecoder: function(opts) {
        return function(key, value) {
          return {
            key: codec.decodeKey(precodec.decode(key)[1], opts),
            value: codec.decodeValue(value, opts)
          };
        };
      },
      isClosed: function isClosed() {
        return db.isClosed();
      },
      close: function close(cb) {
        return db.close(cb);
      },
      iterator: function(_opts) {
        var opts = clone$2(_opts || {});
        var prefix = _opts.prefix || [];
        function encodeKey(key) {
          return encodePrefix(prefix, key, opts, {});
        }
        ltgt.toLtgt(_opts, opts, encodeKey, precodec.lowerBound, precodec.upperBound);
        opts.prefix = null;
        opts.keyAsBuffer = opts.valueAsBuffer = false;
        if ('number' !== typeof opts.limit) {
          opts.limit = -1;
        }
        opts.keyAsBuffer = precodec.buffer;
        opts.valueAsBuffer = codec.valueAsBuffer(opts);
        function wrapIterator(iterator) {
          return {
            next: function(cb) {
              return iterator.next(cb);
            },
            end: function(cb) {
              iterator.end(cb);
            }
          };
        }
        return wrapIterator(db.db.iterator(opts));
      }
    };
  }
  function NotFoundError() {
    Error.call(this);
  }
  inherits(NotFoundError, Error);
  NotFoundError.prototype.name = 'NotFoundError';
  var EventEmitter$1 = events__default.EventEmitter;
  var version$1 = "6.5.4";
  var NOT_FOUND_ERROR = new NotFoundError();
  var sublevel$1 = function(nut, prefix, createStream, options) {
    var emitter = new EventEmitter$1();
    emitter.sublevels = {};
    emitter.options = options;
    emitter.version = version$1;
    emitter.methods = {};
    prefix = prefix || [];
    function mergeOpts(opts) {
      var o = {};
      var k;
      if (options) {
        for (k in options) {
          if (typeof options[k] !== 'undefined') {
            o[k] = options[k];
          }
        }
      }
      if (opts) {
        for (k in opts) {
          if (typeof opts[k] !== 'undefined') {
            o[k] = opts[k];
          }
        }
      }
      return o;
    }
    emitter.put = function(key, value, opts, cb) {
      if ('function' === typeof opts) {
        cb = opts;
        opts = {};
      }
      nut.apply([{
        key: key,
        value: value,
        prefix: prefix.slice(),
        type: 'put'
      }], mergeOpts(opts), function(err) {
        if (err) {
          return cb(err);
        }
        emitter.emit('put', key, value);
        cb(null);
      });
    };
    emitter.prefix = function() {
      return prefix.slice();
    };
    emitter.batch = function(ops, opts, cb) {
      if ('function' === typeof opts) {
        cb = opts;
        opts = {};
      }
      ops = ops.map(function(op) {
        return {
          key: op.key,
          value: op.value,
          prefix: op.prefix || prefix,
          keyEncoding: op.keyEncoding,
          valueEncoding: op.valueEncoding,
          type: op.type
        };
      });
      nut.apply(ops, mergeOpts(opts), function(err) {
        if (err) {
          return cb(err);
        }
        emitter.emit('batch', ops);
        cb(null);
      });
    };
    emitter.get = function(key, opts, cb) {
      if ('function' === typeof opts) {
        cb = opts;
        opts = {};
      }
      nut.get(key, prefix, mergeOpts(opts), function(err, value) {
        if (err) {
          cb(NOT_FOUND_ERROR);
        } else {
          cb(null, value);
        }
      });
    };
    emitter.sublevel = function(name, opts) {
      return emitter.sublevels[name] = emitter.sublevels[name] || sublevel$1(nut, prefix.concat(name), createStream, mergeOpts(opts));
    };
    emitter.readStream = emitter.createReadStream = function(opts) {
      opts = mergeOpts(opts);
      opts.prefix = prefix;
      var stream;
      var it = nut.iterator(opts);
      stream = createStream(opts, nut.createDecoder(opts));
      stream.setIterator(it);
      return stream;
    };
    emitter.close = function(cb) {
      nut.close(cb);
    };
    emitter.isOpen = nut.isOpen;
    emitter.isClosed = nut.isClosed;
    return emitter;
  };
  var Readable = ReadableStreamCore.Readable;
  function ReadStream(options, makeData) {
    if (!(this instanceof ReadStream)) {
      return new ReadStream(options, makeData);
    }
    Readable.call(this, {
      objectMode: true,
      highWaterMark: options.highWaterMark
    });
    this._waiting = false;
    this._options = options;
    this._makeData = makeData;
  }
  inherits(ReadStream, Readable);
  ReadStream.prototype.setIterator = function(it) {
    this._iterator = it;
    if (this._destroyed) {
      return it.end(function() {});
    }
    if (this._waiting) {
      this._waiting = false;
      return this._read();
    }
    return this;
  };
  ReadStream.prototype._read = function read() {
    var self = this;
    if (self._destroyed) {
      return;
    }
    if (!self._iterator) {
      return this._waiting = true;
    }
    self._iterator.next(function(err, key, value) {
      if (err || (key === undefined && value === undefined)) {
        if (!err && !self._destroyed) {
          self.push(null);
        }
        return self._cleanup(err);
      }
      value = self._makeData(key, value);
      if (!self._destroyed) {
        self.push(value);
      }
    });
  };
  ReadStream.prototype._cleanup = function(err) {
    if (this._destroyed) {
      return;
    }
    this._destroyed = true;
    var self = this;
    if (err) {
      self.emit('error', err);
    }
    if (self._iterator) {
      self._iterator.end(function() {
        self._iterator = null;
        self.emit('close');
      });
    } else {
      self.emit('close');
    }
  };
  ReadStream.prototype.destroy = function() {
    this._cleanup();
  };
  var precodec = {
    encode: function(decodedKey) {
      return '\xff' + decodedKey[0] + '\xff' + decodedKey[1];
    },
    decode: function(encodedKeyAsBuffer) {
      var str = encodedKeyAsBuffer.toString();
      var idx = str.indexOf('\xff', 1);
      return [str.substring(1, idx), str.substring(idx + 1)];
    },
    lowerBound: '\x00',
    upperBound: '\xff'
  };
  var codec = new Codec();
  function sublevelPouch(db) {
    return sublevel$1(nut(db, precodec, codec), [], ReadStream, db.options);
  }
  function toObject(array) {
    return array.reduce(function(obj$$1, item) {
      obj$$1[item] = true;
      return obj$$1;
    }, {});
  }
  var reservedWords = toObject(['_id', '_rev', '_attachments', '_deleted', '_revisions', '_revs_info', '_conflicts', '_deleted_conflicts', '_local_seq', '_rev_tree', '_replication_id', '_replication_state', '_replication_state_time', '_replication_state_reason', '_replication_stats', '_removed']);
  var dataWords = toObject(['_attachments', '_replication_id', '_replication_state', '_replication_state_time', '_replication_state_reason', '_replication_stats']);
  function parseRevisionInfo(rev$$1) {
    if (!/^\d+-./.test(rev$$1)) {
      return createError(INVALID_REV);
    }
    var idx = rev$$1.indexOf('-');
    var left = rev$$1.substring(0, idx);
    var right = rev$$1.substring(idx + 1);
    return {
      prefix: parseInt(left, 10),
      id: right
    };
  }
  function makeRevTreeFromRevisions(revisions, opts) {
    var pos = revisions.start - revisions.ids.length + 1;
    var revisionIds = revisions.ids;
    var ids = [revisionIds[0], opts, []];
    for (var i = 1,
        len = revisionIds.length; i < len; i++) {
      ids = [revisionIds[i], {status: 'missing'}, [ids]];
    }
    return [{
      pos: pos,
      ids: ids
    }];
  }
  function parseDoc(doc, newEdits) {
    var nRevNum;
    var newRevId;
    var revInfo;
    var opts = {status: 'available'};
    if (doc._deleted) {
      opts.deleted = true;
    }
    if (newEdits) {
      if (!doc._id) {
        doc._id = uuid();
      }
      newRevId = rev();
      if (doc._rev) {
        revInfo = parseRevisionInfo(doc._rev);
        if (revInfo.error) {
          return revInfo;
        }
        doc._rev_tree = [{
          pos: revInfo.prefix,
          ids: [revInfo.id, {status: 'missing'}, [[newRevId, opts, []]]]
        }];
        nRevNum = revInfo.prefix + 1;
      } else {
        doc._rev_tree = [{
          pos: 1,
          ids: [newRevId, opts, []]
        }];
        nRevNum = 1;
      }
    } else {
      if (doc._revisions) {
        doc._rev_tree = makeRevTreeFromRevisions(doc._revisions, opts);
        nRevNum = doc._revisions.start;
        newRevId = doc._revisions.ids[0];
      }
      if (!doc._rev_tree) {
        revInfo = parseRevisionInfo(doc._rev);
        if (revInfo.error) {
          return revInfo;
        }
        nRevNum = revInfo.prefix;
        newRevId = revInfo.id;
        doc._rev_tree = [{
          pos: nRevNum,
          ids: [newRevId, opts, []]
        }];
      }
    }
    invalidIdError(doc._id);
    doc._rev = nRevNum + '-' + newRevId;
    var result = {
      metadata: {},
      data: {}
    };
    for (var key in doc) {
      if (Object.prototype.hasOwnProperty.call(doc, key)) {
        var specialKey = key[0] === '_';
        if (specialKey && !reservedWords[key]) {
          var error = createError(DOC_VALIDATION, key);
          error.message = DOC_VALIDATION.message + ': ' + key;
          throw error;
        } else if (specialKey && !dataWords[key]) {
          result.metadata[key.slice(1)] = doc[key];
        } else {
          result.data[key] = doc[key];
        }
      }
    }
    return result;
  }
  function thisAtob(str) {
    var base64 = new Buffer(str, 'base64');
    if (base64.toString('base64') !== str) {
      throw new Error("attachment is not a valid base64 string");
    }
    return base64.toString('binary');
  }
  function thisBtoa(str) {
    return bufferFrom(str, 'binary').toString('base64');
  }
  function typedBuffer(binString, buffType, type) {
    var buff = bufferFrom(binString, buffType);
    buff.type = type;
    return buff;
  }
  function b64ToBluffer(b64, type) {
    return typedBuffer(b64, 'base64', type);
  }
  function binStringToBluffer(binString, type) {
    return typedBuffer(binString, 'binary', type);
  }
  function blobToBase64(blobOrBuffer, callback) {
    callback(blobOrBuffer.toString('base64'));
  }
  function binaryMd5(data, callback) {
    var base64 = crypto.createHash('md5').update(data, 'binary').digest('base64');
    callback(base64);
  }
  function stringMd5(string) {
    return crypto.createHash('md5').update(string, 'binary').digest('hex');
  }
  function updateDoc(revLimit, prev, docInfo, results, i, cb, writeDoc, newEdits) {
    if (revExists(prev.rev_tree, docInfo.metadata.rev)) {
      results[i] = docInfo;
      return cb();
    }
    var previousWinningRev = prev.winningRev || winningRev(prev);
    var previouslyDeleted = 'deleted' in prev ? prev.deleted : isDeleted(prev, previousWinningRev);
    var deleted = 'deleted' in docInfo.metadata ? docInfo.metadata.deleted : isDeleted(docInfo.metadata);
    var isRoot = /^1-/.test(docInfo.metadata.rev);
    if (previouslyDeleted && !deleted && newEdits && isRoot) {
      var newDoc = docInfo.data;
      newDoc._rev = previousWinningRev;
      newDoc._id = docInfo.metadata.id;
      docInfo = parseDoc(newDoc, newEdits);
    }
    var merged = merge(prev.rev_tree, docInfo.metadata.rev_tree[0], revLimit);
    var inConflict = newEdits && (((previouslyDeleted && deleted && merged.conflicts !== 'new_leaf') || (!previouslyDeleted && merged.conflicts !== 'new_leaf') || (previouslyDeleted && !deleted && merged.conflicts === 'new_branch')));
    if (inConflict) {
      var err = createError(REV_CONFLICT);
      results[i] = err;
      return cb();
    }
    var newRev = docInfo.metadata.rev;
    docInfo.metadata.rev_tree = merged.tree;
    docInfo.stemmedRevs = merged.stemmedRevs || [];
    if (prev.rev_map) {
      docInfo.metadata.rev_map = prev.rev_map;
    }
    var winningRev$$1 = winningRev(docInfo.metadata);
    var winningRevIsDeleted = isDeleted(docInfo.metadata, winningRev$$1);
    var delta = (previouslyDeleted === winningRevIsDeleted) ? 0 : previouslyDeleted < winningRevIsDeleted ? -1 : 1;
    var newRevIsDeleted;
    if (newRev === winningRev$$1) {
      newRevIsDeleted = winningRevIsDeleted;
    } else {
      newRevIsDeleted = isDeleted(docInfo.metadata, newRev);
    }
    writeDoc(docInfo, winningRev$$1, winningRevIsDeleted, newRevIsDeleted, true, delta, i, cb);
  }
  function rootIsMissing(docInfo) {
    return docInfo.metadata.rev_tree[0].ids[1].status === 'missing';
  }
  function processDocs(revLimit, docInfos, api, fetchedDocs, tx, results, writeDoc, opts, overallCallback) {
    revLimit = revLimit || 1000;
    function insertDoc(docInfo, resultsIdx, callback) {
      var winningRev$$1 = winningRev(docInfo.metadata);
      var deleted = isDeleted(docInfo.metadata, winningRev$$1);
      if ('was_delete' in opts && deleted) {
        results[resultsIdx] = createError(MISSING_DOC, 'deleted');
        return callback();
      }
      var inConflict = newEdits && rootIsMissing(docInfo);
      if (inConflict) {
        var err = createError(REV_CONFLICT);
        results[resultsIdx] = err;
        return callback();
      }
      var delta = deleted ? 0 : 1;
      writeDoc(docInfo, winningRev$$1, deleted, deleted, false, delta, resultsIdx, callback);
    }
    var newEdits = opts.new_edits;
    var idsToDocs = new ExportedMap();
    var docsDone = 0;
    var docsToDo = docInfos.length;
    function checkAllDocsDone() {
      if (++docsDone === docsToDo && overallCallback) {
        overallCallback();
      }
    }
    docInfos.forEach(function(currentDoc, resultsIdx) {
      if (currentDoc._id && isLocalId(currentDoc._id)) {
        var fun = currentDoc._deleted ? '_removeLocal' : '_putLocal';
        api[fun](currentDoc, {ctx: tx}, function(err, res) {
          results[resultsIdx] = err || res;
          checkAllDocsDone();
        });
        return;
      }
      var id = currentDoc.metadata.id;
      if (idsToDocs.has(id)) {
        docsToDo--;
        idsToDocs.get(id).push([currentDoc, resultsIdx]);
      } else {
        idsToDocs.set(id, [[currentDoc, resultsIdx]]);
      }
    });
    idsToDocs.forEach(function(docs, id) {
      var numDone = 0;
      function docWritten() {
        if (++numDone < docs.length) {
          nextDoc();
        } else {
          checkAllDocsDone();
        }
      }
      function nextDoc() {
        var value = docs[numDone];
        var currentDoc = value[0];
        var resultsIdx = value[1];
        if (fetchedDocs.has(id)) {
          updateDoc(revLimit, fetchedDocs.get(id), currentDoc, results, resultsIdx, docWritten, writeDoc, newEdits);
        } else {
          var merged = merge([], currentDoc.metadata.rev_tree[0], revLimit);
          currentDoc.metadata.rev_tree = merged.tree;
          currentDoc.stemmedRevs = merged.stemmedRevs || [];
          insertDoc(currentDoc, resultsIdx, docWritten);
        }
      }
      nextDoc();
    });
  }
  function safeJsonParse(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return vuvuzela.parse(str);
    }
  }
  function safeJsonStringify(json) {
    try {
      return JSON.stringify(json);
    } catch (e) {
      return vuvuzela.stringify(json);
    }
  }
  function readAsBlobOrBuffer(storedObject, type) {
    storedObject.type = type;
    return storedObject;
  }
  function prepareAttachmentForStorage(attData, cb) {
    cb(attData);
  }
  function createEmptyBlobOrBuffer(type) {
    return typedBuffer('', 'binary', type);
  }
  function getCacheFor(transaction, store) {
    var prefix = store.prefix()[0];
    var cache = transaction._cache;
    var subCache = cache.get(prefix);
    if (!subCache) {
      subCache = new ExportedMap();
      cache.set(prefix, subCache);
    }
    return subCache;
  }
  function LevelTransaction() {
    this._batch = [];
    this._cache = new ExportedMap();
  }
  LevelTransaction.prototype.get = function(store, key, callback) {
    var cache = getCacheFor(this, store);
    var exists = cache.get(key);
    if (exists) {
      return nextTick(function() {
        callback(null, exists);
      });
    } else if (exists === null) {
      return nextTick(function() {
        callback({name: 'NotFoundError'});
      });
    }
    store.get(key, function(err, res$$1) {
      if (err) {
        if (err.name === 'NotFoundError') {
          cache.set(key, null);
        }
        return callback(err);
      }
      cache.set(key, res$$1);
      callback(null, res$$1);
    });
  };
  LevelTransaction.prototype.batch = function(batch) {
    for (var i = 0,
        len = batch.length; i < len; i++) {
      var operation = batch[i];
      var cache = getCacheFor(this, operation.prefix);
      if (operation.type === 'put') {
        cache.set(operation.key, operation.value);
      } else {
        cache.set(operation.key, null);
      }
    }
    this._batch = this._batch.concat(batch);
  };
  LevelTransaction.prototype.execute = function(db, callback) {
    var keys = new ExportedSet();
    var uniqBatches = [];
    for (var i = this._batch.length - 1; i >= 0; i--) {
      var operation = this._batch[i];
      var lookupKey = operation.prefix.prefix()[0] + '\xff' + operation.key;
      if (keys.has(lookupKey)) {
        continue;
      }
      keys.add(lookupKey);
      uniqBatches.push(operation);
    }
    db.batch(uniqBatches, callback);
  };
  var DOC_STORE = 'document-store';
  var BY_SEQ_STORE = 'by-sequence';
  var ATTACHMENT_STORE = 'attach-store';
  var BINARY_STORE = 'attach-binary-store';
  var LOCAL_STORE = 'local-store';
  var META_STORE = 'meta-store';
  var dbStores = new ExportedMap();
  var UPDATE_SEQ_KEY = '_local_last_update_seq';
  var DOC_COUNT_KEY = '_local_doc_count';
  var UUID_KEY = '_local_uuid';
  var MD5_PREFIX = 'md5-';
  var safeJsonEncoding = {
    encode: safeJsonStringify,
    decode: safeJsonParse,
    buffer: false,
    type: 'cheap-json'
  };
  var levelChanges = new Changes();
  function getWinningRev(metadata) {
    return 'winningRev' in metadata ? metadata.winningRev : winningRev(metadata);
  }
  function getIsDeleted(metadata, winningRev$$1) {
    return 'deleted' in metadata ? metadata.deleted : isDeleted(metadata, winningRev$$1);
  }
  function fetchAttachment(att, stores, opts) {
    var type = att.content_type;
    return new PouchPromise$1(function(resolve, reject) {
      stores.binaryStore.get(att.digest, function(err, buffer) {
        var data;
        if (err) {
          if (err.name !== 'NotFoundError') {
            return reject(err);
          } else {
            if (!opts.binary) {
              data = '';
            } else {
              data = binStringToBluffer('', type);
            }
          }
        } else {
          if (opts.binary) {
            data = readAsBlobOrBuffer(buffer, type);
          } else {
            data = buffer.toString('base64');
          }
        }
        delete att.stub;
        delete att.length;
        att.data = data;
        resolve();
      });
    });
  }
  function fetchAttachments(results, stores, opts) {
    var atts = [];
    results.forEach(function(row) {
      if (!(row.doc && row.doc._attachments)) {
        return;
      }
      var attNames = Object.keys(row.doc._attachments);
      attNames.forEach(function(attName) {
        var att = row.doc._attachments[attName];
        if (!('data' in att)) {
          atts.push(att);
        }
      });
    });
    return PouchPromise$1.all(atts.map(function(att) {
      return fetchAttachment(att, stores, opts);
    }));
  }
  function LevelPouch$1(opts, callback) {
    opts = clone(opts);
    var api = this;
    var instanceId;
    var stores = {};
    var revLimit = opts.revs_limit;
    var db;
    var name = opts.name;
    if (typeof opts.createIfMissing === 'undefined') {
      opts.createIfMissing = true;
    }
    var leveldown = opts.db;
    var dbStore;
    var leveldownName = functionName(leveldown);
    if (dbStores.has(leveldownName)) {
      dbStore = dbStores.get(leveldownName);
    } else {
      dbStore = new ExportedMap();
      dbStores.set(leveldownName, dbStore);
    }
    if (dbStore.has(name)) {
      db = dbStore.get(name);
      afterDBCreated();
    } else {
      dbStore.set(name, sublevelPouch(levelup(name, opts, function(err) {
        if (err) {
          dbStore.delete(name);
          return callback(err);
        }
        db = dbStore.get(name);
        db._docCount = -1;
        db._queue = new Deque();
        if (typeof opts.migrate === 'object') {
          opts.migrate.doMigrationOne(name, db, afterDBCreated);
        } else {
          afterDBCreated();
        }
      })));
    }
    function afterDBCreated() {
      stores.docStore = db.sublevel(DOC_STORE, {valueEncoding: safeJsonEncoding});
      stores.bySeqStore = db.sublevel(BY_SEQ_STORE, {valueEncoding: 'json'});
      stores.attachmentStore = db.sublevel(ATTACHMENT_STORE, {valueEncoding: 'json'});
      stores.binaryStore = db.sublevel(BINARY_STORE, {valueEncoding: 'binary'});
      stores.localStore = db.sublevel(LOCAL_STORE, {valueEncoding: 'json'});
      stores.metaStore = db.sublevel(META_STORE, {valueEncoding: 'json'});
      if (typeof opts.migrate === 'object') {
        opts.migrate.doMigrationTwo(db, stores, afterLastMigration);
      } else {
        afterLastMigration();
      }
    }
    function afterLastMigration() {
      stores.metaStore.get(UPDATE_SEQ_KEY, function(err, value) {
        if (typeof db._updateSeq === 'undefined') {
          db._updateSeq = value || 0;
        }
        stores.metaStore.get(DOC_COUNT_KEY, function(err, value) {
          db._docCount = !err ? value : 0;
          stores.metaStore.get(UUID_KEY, function(err, value) {
            instanceId = !err ? value : uuid();
            stores.metaStore.put(UUID_KEY, instanceId, function() {
              nextTick(function() {
                callback(null, api);
              });
            });
          });
        });
      });
    }
    function countDocs(callback) {
      if (db.isClosed()) {
        return callback(new Error('database is closed'));
      }
      return callback(null, db._docCount);
    }
    api._remote = false;
    api.type = function() {
      return 'leveldb';
    };
    api._id = function(callback) {
      callback(null, instanceId);
    };
    api._info = function(callback) {
      var res$$1 = {
        doc_count: db._docCount,
        update_seq: db._updateSeq,
        backend_adapter: functionName(leveldown)
      };
      return nextTick(function() {
        callback(null, res$$1);
      });
    };
    function tryCode(fun, args) {
      try {
        fun.apply(null, args);
      } catch (err) {
        args[args.length - 1](err);
      }
    }
    function executeNext() {
      var firstTask = db._queue.peekFront();
      if (firstTask.type === 'read') {
        runReadOperation(firstTask);
      } else {
        runWriteOperation(firstTask);
      }
    }
    function runReadOperation(firstTask) {
      var readTasks = [firstTask];
      var i = 1;
      var nextTask = db._queue.get(i);
      while (typeof nextTask !== 'undefined' && nextTask.type === 'read') {
        readTasks.push(nextTask);
        i++;
        nextTask = db._queue.get(i);
      }
      var numDone = 0;
      readTasks.forEach(function(readTask) {
        var args = readTask.args;
        var callback = args[args.length - 1];
        args[args.length - 1] = getArguments(function(cbArgs) {
          callback.apply(null, cbArgs);
          if (++numDone === readTasks.length) {
            nextTick(function() {
              readTasks.forEach(function() {
                db._queue.shift();
              });
              if (db._queue.length) {
                executeNext();
              }
            });
          }
        });
        tryCode(readTask.fun, args);
      });
    }
    function runWriteOperation(firstTask) {
      var args = firstTask.args;
      var callback = args[args.length - 1];
      args[args.length - 1] = getArguments(function(cbArgs) {
        callback.apply(null, cbArgs);
        nextTick(function() {
          db._queue.shift();
          if (db._queue.length) {
            executeNext();
          }
        });
      });
      tryCode(firstTask.fun, args);
    }
    function writeLock(fun) {
      return getArguments(function(args) {
        db._queue.push({
          fun: fun,
          args: args,
          type: 'write'
        });
        if (db._queue.length === 1) {
          nextTick(executeNext);
        }
      });
    }
    function readLock(fun) {
      return getArguments(function(args) {
        db._queue.push({
          fun: fun,
          args: args,
          type: 'read'
        });
        if (db._queue.length === 1) {
          nextTick(executeNext);
        }
      });
    }
    function formatSeq(n) {
      return ('0000000000000000' + n).slice(-16);
    }
    function parseSeq(s) {
      return parseInt(s, 10);
    }
    api._get = readLock(function(id, opts, callback) {
      opts = clone(opts);
      stores.docStore.get(id, function(err, metadata) {
        if (err || !metadata) {
          return callback(createError(MISSING_DOC, 'missing'));
        }
        var rev$$1;
        if (!opts.rev) {
          rev$$1 = getWinningRev(metadata);
          var deleted = getIsDeleted(metadata, rev$$1);
          if (deleted) {
            return callback(createError(MISSING_DOC, "deleted"));
          }
        } else {
          rev$$1 = opts.latest ? latest(opts.rev, metadata) : opts.rev;
        }
        var seq = metadata.rev_map[rev$$1];
        stores.bySeqStore.get(formatSeq(seq), function(err, doc) {
          if (!doc) {
            return callback(createError(MISSING_DOC));
          }
          if ('_id' in doc && doc._id !== metadata.id) {
            return callback(new Error('wrong doc returned'));
          }
          doc._id = metadata.id;
          if ('_rev' in doc) {
            if (doc._rev !== rev$$1) {
              return callback(new Error('wrong doc returned'));
            }
          } else {
            doc._rev = rev$$1;
          }
          return callback(null, {
            doc: doc,
            metadata: metadata
          });
        });
      });
    });
    api._getAttachment = function(docId, attachId, attachment, opts, callback) {
      var digest = attachment.digest;
      var type = attachment.content_type;
      stores.binaryStore.get(digest, function(err, attach) {
        if (err) {
          if (err.name !== 'NotFoundError') {
            return callback(err);
          }
          return callback(null, opts.binary ? createEmptyBlobOrBuffer(type) : '');
        }
        if (opts.binary) {
          callback(null, readAsBlobOrBuffer(attach, type));
        } else {
          callback(null, attach.toString('base64'));
        }
      });
    };
    api._bulkDocs = writeLock(function(req, opts, callback) {
      var newEdits = opts.new_edits;
      var results = new Array(req.docs.length);
      var fetchedDocs = new ExportedMap();
      var stemmedRevs = new ExportedMap();
      var txn = new LevelTransaction();
      var docCountDelta = 0;
      var newUpdateSeq = db._updateSeq;
      var userDocs = req.docs;
      var docInfos = userDocs.map(function(doc) {
        if (doc._id && isLocalId(doc._id)) {
          return doc;
        }
        var newDoc = parseDoc(doc, newEdits);
        if (newDoc.metadata && !newDoc.metadata.rev_map) {
          newDoc.metadata.rev_map = {};
        }
        return newDoc;
      });
      var infoErrors = docInfos.filter(function(doc) {
        return doc.error;
      });
      if (infoErrors.length) {
        return callback(infoErrors[0]);
      }
      function verifyAttachment(digest, callback) {
        txn.get(stores.attachmentStore, digest, function(levelErr) {
          if (levelErr) {
            var err = createError(MISSING_STUB, 'unknown stub attachment with digest ' + digest);
            callback(err);
          } else {
            callback();
          }
        });
      }
      function verifyAttachments(finish) {
        var digests = [];
        userDocs.forEach(function(doc) {
          if (doc && doc._attachments) {
            Object.keys(doc._attachments).forEach(function(filename) {
              var att = doc._attachments[filename];
              if (att.stub) {
                digests.push(att.digest);
              }
            });
          }
        });
        if (!digests.length) {
          return finish();
        }
        var numDone = 0;
        var err;
        digests.forEach(function(digest) {
          verifyAttachment(digest, function(attErr) {
            if (attErr && !err) {
              err = attErr;
            }
            if (++numDone === digests.length) {
              finish(err);
            }
          });
        });
      }
      function fetchExistingDocs(finish) {
        var numDone = 0;
        var overallErr;
        function checkDone() {
          if (++numDone === userDocs.length) {
            return finish(overallErr);
          }
        }
        userDocs.forEach(function(doc) {
          if (doc._id && isLocalId(doc._id)) {
            return checkDone();
          }
          txn.get(stores.docStore, doc._id, function(err, info) {
            if (err) {
              if (err.name !== 'NotFoundError') {
                overallErr = err;
              }
            } else {
              fetchedDocs.set(doc._id, info);
            }
            checkDone();
          });
        });
      }
      function compact(revsMap, callback) {
        var promise = PouchPromise$1.resolve();
        revsMap.forEach(function(revs, docId) {
          promise = promise.then(function() {
            return new PouchPromise$1(function(resolve, reject) {
              api._doCompactionNoLock(docId, revs, {ctx: txn}, function(err) {
                if (err) {
                  return reject(err);
                }
                resolve();
              });
            });
          });
        });
        promise.then(function() {
          callback();
        }, callback);
      }
      function autoCompact(callback) {
        var revsMap = new ExportedMap();
        fetchedDocs.forEach(function(metadata, docId) {
          revsMap.set(docId, compactTree(metadata));
        });
        compact(revsMap, callback);
      }
      function finish() {
        compact(stemmedRevs, function(error) {
          if (error) {
            complete(error);
          }
          if (api.auto_compaction) {
            return autoCompact(complete);
          }
          complete();
        });
      }
      function writeDoc(docInfo, winningRev$$1, winningRevIsDeleted, newRevIsDeleted, isUpdate, delta, resultsIdx, callback2) {
        docCountDelta += delta;
        var err = null;
        var recv = 0;
        docInfo.metadata.winningRev = winningRev$$1;
        docInfo.metadata.deleted = winningRevIsDeleted;
        docInfo.data._id = docInfo.metadata.id;
        docInfo.data._rev = docInfo.metadata.rev;
        if (newRevIsDeleted) {
          docInfo.data._deleted = true;
        }
        if (docInfo.stemmedRevs.length) {
          stemmedRevs.set(docInfo.metadata.id, docInfo.stemmedRevs);
        }
        var attachments = docInfo.data._attachments ? Object.keys(docInfo.data._attachments) : [];
        function attachmentSaved(attachmentErr) {
          recv++;
          if (!err) {
            if (attachmentErr) {
              err = attachmentErr;
              callback2(err);
            } else if (recv === attachments.length) {
              finish();
            }
          }
        }
        function onMD5Load(doc, key, data, attachmentSaved) {
          return function(result) {
            saveAttachment(doc, MD5_PREFIX + result, key, data, attachmentSaved);
          };
        }
        function doMD5(doc, key, attachmentSaved) {
          return function(data) {
            binaryMd5(data, onMD5Load(doc, key, data, attachmentSaved));
          };
        }
        for (var i = 0; i < attachments.length; i++) {
          var key = attachments[i];
          var att = docInfo.data._attachments[key];
          if (att.stub) {
            var id = docInfo.data._id;
            var rev$$1 = docInfo.data._rev;
            saveAttachmentRefs(id, rev$$1, att.digest, attachmentSaved);
            continue;
          }
          var data;
          if (typeof att.data === 'string') {
            try {
              data = thisAtob(att.data);
            } catch (e) {
              callback(createError(BAD_ARG, 'Attachment is not a valid base64 string'));
              return;
            }
            doMD5(docInfo, key, attachmentSaved)(data);
          } else {
            prepareAttachmentForStorage(att.data, doMD5(docInfo, key, attachmentSaved));
          }
        }
        function finish() {
          var seq = docInfo.metadata.rev_map[docInfo.metadata.rev];
          if (seq) {
            return callback2();
          }
          seq = ++newUpdateSeq;
          docInfo.metadata.rev_map[docInfo.metadata.rev] = docInfo.metadata.seq = seq;
          var seqKey = formatSeq(seq);
          var batch = [{
            key: seqKey,
            value: docInfo.data,
            prefix: stores.bySeqStore,
            type: 'put'
          }, {
            key: docInfo.metadata.id,
            value: docInfo.metadata,
            prefix: stores.docStore,
            type: 'put'
          }];
          txn.batch(batch);
          results[resultsIdx] = {
            ok: true,
            id: docInfo.metadata.id,
            rev: docInfo.metadata.rev
          };
          fetchedDocs.set(docInfo.metadata.id, docInfo.metadata);
          callback2();
        }
        if (!attachments.length) {
          finish();
        }
      }
      var attachmentQueues = {};
      function saveAttachmentRefs(id, rev$$1, digest, callback) {
        function fetchAtt() {
          return new PouchPromise$1(function(resolve, reject) {
            txn.get(stores.attachmentStore, digest, function(err, oldAtt) {
              if (err && err.name !== 'NotFoundError') {
                return reject(err);
              }
              resolve(oldAtt);
            });
          });
        }
        function saveAtt(oldAtt) {
          var ref = [id, rev$$1].join('@');
          var newAtt = {};
          if (oldAtt) {
            if (oldAtt.refs) {
              newAtt.refs = oldAtt.refs;
              newAtt.refs[ref] = true;
            }
          } else {
            newAtt.refs = {};
            newAtt.refs[ref] = true;
          }
          return new PouchPromise$1(function(resolve) {
            txn.batch([{
              type: 'put',
              prefix: stores.attachmentStore,
              key: digest,
              value: newAtt
            }]);
            resolve(!oldAtt);
          });
        }
        var queue = attachmentQueues[digest] || PouchPromise$1.resolve();
        attachmentQueues[digest] = queue.then(function() {
          return fetchAtt().then(saveAtt).then(function(isNewAttachment) {
            callback(null, isNewAttachment);
          }, callback);
        });
      }
      function saveAttachment(docInfo, digest, key, data, callback) {
        var att = docInfo.data._attachments[key];
        delete att.data;
        att.digest = digest;
        att.length = data.length;
        var id = docInfo.metadata.id;
        var rev$$1 = docInfo.metadata.rev;
        att.revpos = parseInt(rev$$1, 10);
        saveAttachmentRefs(id, rev$$1, digest, function(err, isNewAttachment) {
          if (err) {
            return callback(err);
          }
          if (data.length === 0) {
            return callback(err);
          }
          if (!isNewAttachment) {
            return callback(err);
          }
          txn.batch([{
            type: 'put',
            prefix: stores.binaryStore,
            key: digest,
            value: bufferFrom(data, 'binary')
          }]);
          callback();
        });
      }
      function complete(err) {
        if (err) {
          return nextTick(function() {
            callback(err);
          });
        }
        txn.batch([{
          prefix: stores.metaStore,
          type: 'put',
          key: UPDATE_SEQ_KEY,
          value: newUpdateSeq
        }, {
          prefix: stores.metaStore,
          type: 'put',
          key: DOC_COUNT_KEY,
          value: db._docCount + docCountDelta
        }]);
        txn.execute(db, function(err) {
          if (err) {
            return callback(err);
          }
          db._docCount += docCountDelta;
          db._updateSeq = newUpdateSeq;
          levelChanges.notify(name);
          nextTick(function() {
            callback(null, results);
          });
        });
      }
      if (!docInfos.length) {
        return callback(null, []);
      }
      verifyAttachments(function(err) {
        if (err) {
          return callback(err);
        }
        fetchExistingDocs(function(err) {
          if (err) {
            return callback(err);
          }
          processDocs(revLimit, docInfos, api, fetchedDocs, txn, results, writeDoc, opts, finish);
        });
      });
    });
    api._allDocs = readLock(function(opts, callback) {
      opts = clone(opts);
      countDocs(function(err, docCount) {
        if (err) {
          return callback(err);
        }
        var readstreamOpts = {};
        var skip = opts.skip || 0;
        if (opts.startkey) {
          readstreamOpts.gte = opts.startkey;
        }
        if (opts.endkey) {
          readstreamOpts.lte = opts.endkey;
        }
        if (opts.key) {
          readstreamOpts.gte = readstreamOpts.lte = opts.key;
        }
        if (opts.descending) {
          readstreamOpts.reverse = true;
          var tmp = readstreamOpts.lte;
          readstreamOpts.lte = readstreamOpts.gte;
          readstreamOpts.gte = tmp;
        }
        var limit;
        if (typeof opts.limit === 'number') {
          limit = opts.limit;
        }
        if (limit === 0 || ('start' in readstreamOpts && 'end' in readstreamOpts && readstreamOpts.start > readstreamOpts.end)) {
          return callback(null, {
            total_rows: docCount,
            offset: opts.skip,
            rows: []
          });
        }
        var results = [];
        var docstream = stores.docStore.readStream(readstreamOpts);
        var throughStream = through2.obj(function(entry, _, next) {
          var metadata = entry.value;
          var winningRev$$1 = getWinningRev(metadata);
          var deleted = getIsDeleted(metadata, winningRev$$1);
          if (!deleted) {
            if (skip-- > 0) {
              next();
              return;
            } else if (typeof limit === 'number' && limit-- <= 0) {
              docstream.unpipe();
              docstream.destroy();
              next();
              return;
            }
          } else if (opts.deleted !== 'ok') {
            next();
            return;
          }
          function allDocsInner(data) {
            var doc = {
              id: metadata.id,
              key: metadata.id,
              value: {rev: winningRev$$1}
            };
            if (opts.include_docs) {
              doc.doc = data;
              doc.doc._rev = doc.value.rev;
              if (opts.conflicts) {
                var conflicts = collectConflicts(metadata);
                if (conflicts.length) {
                  doc.doc._conflicts = conflicts;
                }
              }
              for (var att in doc.doc._attachments) {
                if (doc.doc._attachments.hasOwnProperty(att)) {
                  doc.doc._attachments[att].stub = true;
                }
              }
            }
            if (opts.inclusive_end === false && metadata.id === opts.endkey) {
              return next();
            } else if (deleted) {
              if (opts.deleted === 'ok') {
                doc.value.deleted = true;
                doc.doc = null;
              } else {
                return next();
              }
            }
            results.push(doc);
            next();
          }
          if (opts.include_docs) {
            var seq = metadata.rev_map[winningRev$$1];
            stores.bySeqStore.get(formatSeq(seq), function(err, data) {
              allDocsInner(data);
            });
          } else {
            allDocsInner();
          }
        }, function(next) {
          PouchPromise$1.resolve().then(function() {
            if (opts.include_docs && opts.attachments) {
              return fetchAttachments(results, stores, opts);
            }
          }).then(function() {
            callback(null, {
              total_rows: docCount,
              offset: opts.skip,
              rows: results
            });
          }, callback);
          next();
        }).on('unpipe', function() {
          throughStream.end();
        });
        docstream.on('error', callback);
        docstream.pipe(throughStream);
      });
    });
    api._changes = function(opts) {
      opts = clone(opts);
      if (opts.continuous) {
        var id = name + ':' + uuid();
        levelChanges.addListener(name, id, api, opts);
        levelChanges.notify(name);
        return {cancel: function() {
            levelChanges.removeListener(name, id);
          }};
      }
      var descending = opts.descending;
      var results = [];
      var lastSeq = opts.since || 0;
      var called = 0;
      var streamOpts = {reverse: descending};
      var limit;
      if ('limit' in opts && opts.limit > 0) {
        limit = opts.limit;
      }
      if (!streamOpts.reverse) {
        streamOpts.start = formatSeq(opts.since || 0);
      }
      var docIds = opts.doc_ids && new ExportedSet(opts.doc_ids);
      var filter = filterChange(opts);
      var docIdsToMetadata = new ExportedMap();
      var returnDocs;
      if ('return_docs' in opts) {
        returnDocs = opts.return_docs;
      } else if ('returnDocs' in opts) {
        returnDocs = opts.returnDocs;
      } else {
        returnDocs = true;
      }
      function complete() {
        opts.done = true;
        if (returnDocs && opts.limit) {
          if (opts.limit < results.length) {
            results.length = opts.limit;
          }
        }
        changeStream.unpipe(throughStream);
        changeStream.destroy();
        if (!opts.continuous && !opts.cancelled) {
          if (opts.include_docs && opts.attachments) {
            fetchAttachments(results, stores, opts).then(function() {
              opts.complete(null, {
                results: results,
                last_seq: lastSeq
              });
            });
          } else {
            opts.complete(null, {
              results: results,
              last_seq: lastSeq
            });
          }
        }
      }
      var changeStream = stores.bySeqStore.readStream(streamOpts);
      var throughStream = through2.obj(function(data, _, next) {
        if (limit && called >= limit) {
          complete();
          return next();
        }
        if (opts.cancelled || opts.done) {
          return next();
        }
        var seq = parseSeq(data.key);
        var doc = data.value;
        if (seq === opts.since && !descending) {
          return next();
        }
        if (docIds && !docIds.has(doc._id)) {
          return next();
        }
        var metadata;
        function onGetMetadata(metadata) {
          var winningRev$$1 = getWinningRev(metadata);
          function onGetWinningDoc(winningDoc) {
            var change = opts.processChange(winningDoc, metadata, opts);
            change.seq = metadata.seq;
            var filtered = filter(change);
            if (typeof filtered === 'object') {
              return opts.complete(filtered);
            }
            if (filtered) {
              called++;
              if (opts.attachments && opts.include_docs) {
                fetchAttachments([change], stores, opts).then(function() {
                  opts.onChange(change);
                });
              } else {
                opts.onChange(change);
              }
              if (returnDocs) {
                results.push(change);
              }
            }
            next();
          }
          if (metadata.seq !== seq) {
            return next();
          }
          lastSeq = seq;
          if (winningRev$$1 === doc._rev) {
            return onGetWinningDoc(doc);
          }
          var winningSeq = metadata.rev_map[winningRev$$1];
          stores.bySeqStore.get(formatSeq(winningSeq), function(err, doc) {
            onGetWinningDoc(doc);
          });
        }
        metadata = docIdsToMetadata.get(doc._id);
        if (metadata) {
          return onGetMetadata(metadata);
        }
        stores.docStore.get(doc._id, function(err, metadata) {
          if (opts.cancelled || opts.done || db.isClosed() || isLocalId(metadata.id)) {
            return next();
          }
          docIdsToMetadata.set(doc._id, metadata);
          onGetMetadata(metadata);
        });
      }, function(next) {
        if (opts.cancelled) {
          return next();
        }
        if (returnDocs && opts.limit) {
          if (opts.limit < results.length) {
            results.length = opts.limit;
          }
        }
        next();
      }).on('unpipe', function() {
        throughStream.end();
        complete();
      });
      changeStream.pipe(throughStream);
      return {cancel: function() {
          opts.cancelled = true;
          complete();
        }};
    };
    api._close = function(callback) {
      if (db.isClosed()) {
        return callback(createError(NOT_OPEN));
      }
      db.close(function(err) {
        if (err) {
          callback(err);
        } else {
          dbStore.delete(name);
          callback();
        }
      });
    };
    api._getRevisionTree = function(docId, callback) {
      stores.docStore.get(docId, function(err, metadata) {
        if (err) {
          callback(createError(MISSING_DOC));
        } else {
          callback(null, metadata.rev_tree);
        }
      });
    };
    api._doCompaction = writeLock(function(docId, revs, opts, callback) {
      api._doCompactionNoLock(docId, revs, opts, callback);
    });
    api._doCompactionNoLock = function(docId, revs, opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      if (!revs.length) {
        return callback();
      }
      var txn = opts.ctx || new LevelTransaction();
      txn.get(stores.docStore, docId, function(err, metadata) {
        if (err) {
          return callback(err);
        }
        var seqs = revs.map(function(rev$$1) {
          var seq = metadata.rev_map[rev$$1];
          delete metadata.rev_map[rev$$1];
          return seq;
        });
        traverseRevTree(metadata.rev_tree, function(isLeaf, pos, revHash, ctx, opts) {
          var rev$$1 = pos + '-' + revHash;
          if (revs.indexOf(rev$$1) !== -1) {
            opts.status = 'missing';
          }
        });
        var batch = [];
        batch.push({
          key: metadata.id,
          value: metadata,
          type: 'put',
          prefix: stores.docStore
        });
        var digestMap = {};
        var numDone = 0;
        var overallErr;
        function checkDone(err) {
          if (err) {
            overallErr = err;
          }
          if (++numDone === revs.length) {
            if (overallErr) {
              return callback(overallErr);
            }
            deleteOrphanedAttachments();
          }
        }
        function finish(err) {
          if (err) {
            return callback(err);
          }
          txn.batch(batch);
          if (opts.ctx) {
            return callback();
          }
          txn.execute(db, callback);
        }
        function deleteOrphanedAttachments() {
          var possiblyOrphanedAttachments = Object.keys(digestMap);
          if (!possiblyOrphanedAttachments.length) {
            return finish();
          }
          var numDone = 0;
          var overallErr;
          function checkDone(err) {
            if (err) {
              overallErr = err;
            }
            if (++numDone === possiblyOrphanedAttachments.length) {
              finish(overallErr);
            }
          }
          var refsToDelete = new ExportedMap();
          revs.forEach(function(rev$$1) {
            refsToDelete.set(docId + '@' + rev$$1, true);
          });
          possiblyOrphanedAttachments.forEach(function(digest) {
            txn.get(stores.attachmentStore, digest, function(err, attData) {
              if (err) {
                if (err.name === 'NotFoundError') {
                  return checkDone();
                } else {
                  return checkDone(err);
                }
              }
              var refs = Object.keys(attData.refs || {}).filter(function(ref) {
                return !refsToDelete.has(ref);
              });
              var newRefs = {};
              refs.forEach(function(ref) {
                newRefs[ref] = true;
              });
              if (refs.length) {
                batch.push({
                  key: digest,
                  type: 'put',
                  value: {refs: newRefs},
                  prefix: stores.attachmentStore
                });
              } else {
                batch = batch.concat([{
                  key: digest,
                  type: 'del',
                  prefix: stores.attachmentStore
                }, {
                  key: digest,
                  type: 'del',
                  prefix: stores.binaryStore
                }]);
              }
              checkDone();
            });
          });
        }
        seqs.forEach(function(seq) {
          batch.push({
            key: formatSeq(seq),
            type: 'del',
            prefix: stores.bySeqStore
          });
          txn.get(stores.bySeqStore, formatSeq(seq), function(err, doc) {
            if (err) {
              if (err.name === 'NotFoundError') {
                return checkDone();
              } else {
                return checkDone(err);
              }
            }
            var atts = Object.keys(doc._attachments || {});
            atts.forEach(function(attName) {
              var digest = doc._attachments[attName].digest;
              digestMap[digest] = true;
            });
            checkDone();
          });
        });
      });
    };
    api._getLocal = function(id, callback) {
      stores.localStore.get(id, function(err, doc) {
        if (err) {
          callback(createError(MISSING_DOC));
        } else {
          callback(null, doc);
        }
      });
    };
    api._putLocal = function(doc, opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      if (opts.ctx) {
        api._putLocalNoLock(doc, opts, callback);
      } else {
        api._putLocalWithLock(doc, opts, callback);
      }
    };
    api._putLocalWithLock = writeLock(function(doc, opts, callback) {
      api._putLocalNoLock(doc, opts, callback);
    });
    api._putLocalNoLock = function(doc, opts, callback) {
      delete doc._revisions;
      var oldRev = doc._rev;
      var id = doc._id;
      var txn = opts.ctx || new LevelTransaction();
      txn.get(stores.localStore, id, function(err, resp) {
        if (err && oldRev) {
          return callback(createError(REV_CONFLICT));
        }
        if (resp && resp._rev !== oldRev) {
          return callback(createError(REV_CONFLICT));
        }
        doc._rev = oldRev ? '0-' + (parseInt(oldRev.split('-')[1], 10) + 1) : '0-1';
        var batch = [{
          type: 'put',
          prefix: stores.localStore,
          key: id,
          value: doc
        }];
        txn.batch(batch);
        var ret = {
          ok: true,
          id: doc._id,
          rev: doc._rev
        };
        if (opts.ctx) {
          return callback(null, ret);
        }
        txn.execute(db, function(err) {
          if (err) {
            return callback(err);
          }
          callback(null, ret);
        });
      });
    };
    api._removeLocal = function(doc, opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      if (opts.ctx) {
        api._removeLocalNoLock(doc, opts, callback);
      } else {
        api._removeLocalWithLock(doc, opts, callback);
      }
    };
    api._removeLocalWithLock = writeLock(function(doc, opts, callback) {
      api._removeLocalNoLock(doc, opts, callback);
    });
    api._removeLocalNoLock = function(doc, opts, callback) {
      var txn = opts.ctx || new LevelTransaction();
      txn.get(stores.localStore, doc._id, function(err, resp) {
        if (err) {
          if (err.name !== 'NotFoundError') {
            return callback(err);
          } else {
            return callback(createError(MISSING_DOC));
          }
        }
        if (resp._rev !== doc._rev) {
          return callback(createError(REV_CONFLICT));
        }
        txn.batch([{
          prefix: stores.localStore,
          type: 'del',
          key: doc._id
        }]);
        var ret = {
          ok: true,
          id: doc._id,
          rev: '0-0'
        };
        if (opts.ctx) {
          return callback(null, ret);
        }
        txn.execute(db, function(err) {
          if (err) {
            return callback(err);
          }
          callback(null, ret);
        });
      });
    };
    api._destroy = function(opts, callback) {
      var dbStore;
      var leveldownName = functionName(leveldown);
      if (dbStores.has(leveldownName)) {
        dbStore = dbStores.get(leveldownName);
      } else {
        return callDestroy(name, callback);
      }
      if (dbStore.has(name)) {
        levelChanges.removeAllListeners(name);
        dbStore.get(name).close(function() {
          dbStore.delete(name);
          callDestroy(name, callback);
        });
      } else {
        callDestroy(name, callback);
      }
    };
    function callDestroy(name, cb) {
      leveldown.destroy(name, cb);
    }
  }
  var requireLeveldown = function() {
    try {
      return require('leveldown');
    } catch (err) {
      err = err || 'leveldown import error';
      if (err.code === 'MODULE_NOT_FOUND') {
        return new Error(['the \'leveldown\' package is not available. install it, or,', 'specify another storage backend using the \'db\' option'].join(' '));
      } else if (err.message && err.message.match('Module version mismatch')) {
        return new Error([err.message, 'This generally implies that leveldown was built with a different', 'version of node than that which is running now.  You may try', 'fully removing and reinstalling PouchDB or leveldown to resolve.'].join(' '));
      }
      return new Error(err.toString() + ': unable to import leveldown');
    }
  };
  var stores = ['document-store', 'by-sequence', 'attach-store', 'attach-binary-store'];
  function formatSeq(n) {
    return ('0000000000000000' + n).slice(-16);
  }
  var UPDATE_SEQ_KEY$1 = '_local_last_update_seq';
  var DOC_COUNT_KEY$1 = '_local_doc_count';
  var UUID_KEY$1 = '_local_uuid';
  var doMigrationOne = function(name, db, callback) {
    var leveldown = require('leveldown');
    var base = path.resolve(name);
    function move(store, index, cb) {
      var storePath = path.join(base, store);
      var opts;
      if (index === 3) {
        opts = {valueEncoding: 'binary'};
      } else {
        opts = {valueEncoding: 'json'};
      }
      var sub = db.sublevel(store, opts);
      var orig = levelup(storePath, opts);
      var from = orig.createReadStream();
      var writeStream = new LevelWriteStream(sub);
      var to = writeStream();
      from.on('end', function() {
        orig.close(function(err) {
          cb(err, storePath);
        });
      });
      from.pipe(to);
    }
    fs.unlink(base + '.uuid', function(err) {
      if (err) {
        return callback();
      }
      var todo = 4;
      var done = [];
      stores.forEach(function(store, i) {
        move(store, i, function(err, storePath) {
          if (err) {
            return callback(err);
          }
          done.push(storePath);
          if (!(--todo)) {
            done.forEach(function(item) {
              leveldown.destroy(item, function() {
                if (++todo === done.length) {
                  fs.rmdir(base, callback);
                }
              });
            });
          }
        });
      });
    });
  };
  var doMigrationTwo = function(db, stores, callback) {
    var batches = [];
    stores.bySeqStore.get(UUID_KEY$1, function(err, value) {
      if (err) {
        return callback();
      }
      batches.push({
        key: UUID_KEY$1,
        value: value,
        prefix: stores.metaStore,
        type: 'put',
        valueEncoding: 'json'
      });
      batches.push({
        key: UUID_KEY$1,
        prefix: stores.bySeqStore,
        type: 'del'
      });
      stores.bySeqStore.get(DOC_COUNT_KEY$1, function(err, value) {
        if (value) {
          batches.push({
            key: DOC_COUNT_KEY$1,
            value: value,
            prefix: stores.metaStore,
            type: 'put',
            valueEncoding: 'json'
          });
          batches.push({
            key: DOC_COUNT_KEY$1,
            prefix: stores.bySeqStore,
            type: 'del'
          });
        }
        stores.bySeqStore.get(UPDATE_SEQ_KEY$1, function(err, value) {
          if (value) {
            batches.push({
              key: UPDATE_SEQ_KEY$1,
              value: value,
              prefix: stores.metaStore,
              type: 'put',
              valueEncoding: 'json'
            });
            batches.push({
              key: UPDATE_SEQ_KEY$1,
              prefix: stores.bySeqStore,
              type: 'del'
            });
          }
          var deletedSeqs = {};
          stores.docStore.createReadStream({
            startKey: '_',
            endKey: '_\xFF'
          }).pipe(through2.obj(function(ch, _, next) {
            if (!isLocalId(ch.key)) {
              return next();
            }
            batches.push({
              key: ch.key,
              prefix: stores.docStore,
              type: 'del'
            });
            var winner = winningRev(ch.value);
            Object.keys(ch.value.rev_map).forEach(function(key) {
              if (key !== 'winner') {
                this.push(formatSeq(ch.value.rev_map[key]));
              }
            }, this);
            var winningSeq = ch.value.rev_map[winner];
            stores.bySeqStore.get(formatSeq(winningSeq), function(err, value) {
              if (!err) {
                batches.push({
                  key: ch.key,
                  value: value,
                  prefix: stores.localStore,
                  type: 'put',
                  valueEncoding: 'json'
                });
              }
              next();
            });
          })).pipe(through2.obj(function(seq, _, next) {
            if (deletedSeqs[seq]) {
              return next();
            }
            deletedSeqs[seq] = true;
            stores.bySeqStore.get(seq, function(err, resp) {
              if (err || !isLocalId(resp._id)) {
                return next();
              }
              batches.push({
                key: seq,
                prefix: stores.bySeqStore,
                type: 'del'
              });
              next();
            });
          }, function() {
            db.batch(batches, callback);
          }));
        });
      });
    });
  };
  var migrate = {
    doMigrationOne: doMigrationOne,
    doMigrationTwo: doMigrationTwo
  };
  function LevelDownPouch(opts, callback) {
    var leveldown = opts.db;
    if (!leveldown) {
      leveldown = requireLeveldown();
      if (leveldown instanceof Error) {
        return callback(leveldown);
      }
    }
    var _opts = $inject_Object_assign({
      db: leveldown,
      migrate: migrate
    }, opts);
    LevelPouch$1.call(this, _opts, callback);
  }
  LevelDownPouch.valid = function() {
    return true;
  };
  LevelDownPouch.use_prefix = false;
  var LevelPouch = function(PouchDB) {
    PouchDB.adapter('leveldb', LevelDownPouch, true);
  };
  var request = require('request');
  function applyTypeToBuffer(buffer, resp) {
    buffer.type = resp.headers['content-type'];
  }
  function defaultBody() {
    return bufferFrom('', 'binary');
  }
  function ajaxCore$1(options, callback) {
    options = clone(options);
    var defaultOptions = {
      method: "GET",
      headers: {},
      json: true,
      processData: true,
      timeout: 10000,
      cache: false
    };
    options = $inject_Object_assign(defaultOptions, options);
    function onSuccess(obj$$1, resp, cb) {
      if (!options.binary && options.json && typeof obj$$1 === 'string') {
        try {
          obj$$1 = JSON.parse(obj$$1);
        } catch (e) {
          return cb(e);
        }
      }
      if (Array.isArray(obj$$1)) {
        obj$$1 = obj$$1.map(function(v) {
          if (v.error || v.missing) {
            return generateErrorFromResponse(v);
          } else {
            return v;
          }
        });
      }
      if (options.binary) {
        applyTypeToBuffer(obj$$1, resp);
      }
      cb(null, obj$$1, resp);
    }
    if (options.json) {
      if (!options.binary) {
        options.headers.Accept = 'application/json';
      }
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    }
    if (options.binary) {
      options.encoding = null;
      options.json = false;
    }
    if (!options.processData) {
      options.json = false;
    }
    return request(options, function(err, response, body) {
      if (err) {
        return callback(generateErrorFromResponse(err));
      }
      var error;
      var content_type = response.headers && response.headers['content-type'];
      var data = body || defaultBody();
      if (!options.binary && (options.json || !options.processData) && typeof data !== 'object' && (/json/.test(content_type) || (/^[\s]*\{/.test(data) && /\}[\s]*$/.test(data)))) {
        try {
          data = JSON.parse(data.toString());
        } catch (e) {}
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        onSuccess(data, response, callback);
      } else {
        error = generateErrorFromResponse(data);
        error.status = response.statusCode;
        callback(error);
      }
    });
  }
  function ajax(opts, callback) {
    return ajaxCore$1(opts, callback);
  }
  function pool(promiseFactories, limit) {
    return new PouchPromise$1(function(resolve, reject) {
      var running = 0;
      var current = 0;
      var done = 0;
      var len = promiseFactories.length;
      var err;
      function runNext() {
        running++;
        promiseFactories[current++]().then(onSuccess, onError);
      }
      function doNext() {
        if (++done === len) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        } else {
          runNextBatch();
        }
      }
      function onSuccess() {
        running--;
        doNext();
      }
      function onError(thisErr) {
        running--;
        err = err || thisErr;
        doNext();
      }
      function runNextBatch() {
        while (running < limit && current < len) {
          runNext();
        }
      }
      runNextBatch();
    });
  }
  var CHANGES_BATCH_SIZE = 25;
  var MAX_SIMULTANEOUS_REVS = 50;
  var CHANGES_TIMEOUT_BUFFER = 5000;
  var DEFAULT_HEARTBEAT = 10000;
  var supportsBulkGetMap = {};
  function readAttachmentsAsBlobOrBuffer(row) {
    var atts = row.doc && row.doc._attachments;
    if (!atts) {
      return;
    }
    Object.keys(atts).forEach(function(filename) {
      var att = atts[filename];
      att.data = b64ToBluffer(att.data, att.content_type);
    });
  }
  function encodeDocId(id) {
    if (/^_design/.test(id)) {
      return '_design/' + encodeURIComponent(id.slice(8));
    }
    if (/^_local/.test(id)) {
      return '_local/' + encodeURIComponent(id.slice(7));
    }
    return encodeURIComponent(id);
  }
  function preprocessAttachments$2(doc) {
    if (!doc._attachments || !Object.keys(doc._attachments)) {
      return PouchPromise$1.resolve();
    }
    return PouchPromise$1.all(Object.keys(doc._attachments).map(function(key) {
      var attachment = doc._attachments[key];
      if (attachment.data && typeof attachment.data !== 'string') {
        return new PouchPromise$1(function(resolve) {
          blobToBase64(attachment.data, resolve);
        }).then(function(b64) {
          attachment.data = b64;
        });
      }
    }));
  }
  function hasUrlPrefix(opts) {
    if (!opts.prefix) {
      return false;
    }
    var protocol = parseUri(opts.prefix).protocol;
    return protocol === 'http' || protocol === 'https';
  }
  function getHost(name, opts) {
    if (hasUrlPrefix(opts)) {
      var dbName = opts.name.substr(opts.prefix.length);
      name = opts.prefix + encodeURIComponent(dbName);
    }
    var uri = parseUri(name);
    if (uri.user || uri.password) {
      uri.auth = {
        username: uri.user,
        password: uri.password
      };
    }
    var parts = uri.path.replace(/(^\/|\/$)/g, '').split('/');
    uri.db = parts.pop();
    if (uri.db.indexOf('%') === -1) {
      uri.db = encodeURIComponent(uri.db);
    }
    uri.path = parts.join('/');
    return uri;
  }
  function genDBUrl(opts, path$$1) {
    return genUrl(opts, opts.db + '/' + path$$1);
  }
  function genUrl(opts, path$$1) {
    var pathDel = !opts.path ? '' : '/';
    return opts.protocol + '://' + opts.host + (opts.port ? (':' + opts.port) : '') + '/' + opts.path + pathDel + path$$1;
  }
  function paramsToStr(params) {
    return '?' + Object.keys(params).map(function(k) {
      return k + '=' + encodeURIComponent(params[k]);
    }).join('&');
  }
  function HttpPouch(opts, callback) {
    var api = this;
    var host = getHost(opts.name, opts);
    var dbUrl = genDBUrl(host, '');
    opts = clone(opts);
    var ajaxOpts = opts.ajax || {};
    if (opts.auth || host.auth) {
      var nAuth = opts.auth || host.auth;
      var str = nAuth.username + ':' + nAuth.password;
      var token = thisBtoa(unescape(encodeURIComponent(str)));
      ajaxOpts.headers = ajaxOpts.headers || {};
      ajaxOpts.headers.Authorization = 'Basic ' + token;
    }
    api._ajax = ajax;
    function ajax$$1(userOpts, options, callback) {
      var reqAjax = userOpts.ajax || {};
      var reqOpts = $inject_Object_assign(clone(ajaxOpts), reqAjax, options);
      var defaultHeaders = clone(ajaxOpts.headers || {});
      reqOpts.headers = $inject_Object_assign(defaultHeaders, reqAjax.headers, options.headers || {});
      if (api.constructor.listeners('debug').length) {
        api.constructor.emit('debug', ['http', reqOpts.method, reqOpts.url]);
      }
      return api._ajax(reqOpts, callback);
    }
    function ajaxPromise(userOpts, opts) {
      return new PouchPromise$1(function(resolve, reject) {
        ajax$$1(userOpts, opts, function(err, res$$1) {
          if (err) {
            return reject(err);
          }
          resolve(res$$1);
        });
      });
    }
    function adapterFun$$1(name, fun) {
      return adapterFun(name, getArguments(function(args) {
        setup().then(function() {
          return fun.apply(this, args);
        }).catch(function(e) {
          var callback = args.pop();
          callback(e);
        });
      }));
    }
    var setupPromise;
    function setup() {
      if (opts.skipSetup || opts.skip_setup) {
        return PouchPromise$1.resolve();
      }
      if (setupPromise) {
        return setupPromise;
      }
      var checkExists = {
        method: 'GET',
        url: dbUrl
      };
      setupPromise = ajaxPromise({}, checkExists).catch(function(err) {
        if (err && err.status && err.status === 404) {
          res(404, 'PouchDB is just detecting if the remote exists.');
          return ajaxPromise({}, {
            method: 'PUT',
            url: dbUrl
          });
        } else {
          return PouchPromise$1.reject(err);
        }
      }).catch(function(err) {
        if (err && err.status && err.status === 412) {
          return true;
        }
        return PouchPromise$1.reject(err);
      });
      setupPromise.catch(function() {
        setupPromise = null;
      });
      return setupPromise;
    }
    nextTick(function() {
      callback(null, api);
    });
    api._remote = true;
    api.type = function() {
      return 'http';
    };
    api.id = adapterFun$$1('id', function(callback) {
      ajax$$1({}, {
        method: 'GET',
        url: genUrl(host, '')
      }, function(err, result) {
        var uuid$$1 = (result && result.uuid) ? (result.uuid + host.db) : genDBUrl(host, '');
        callback(null, uuid$$1);
      });
    });
    api.request = adapterFun$$1('request', function(options, callback) {
      options.url = genDBUrl(host, options.url);
      ajax$$1({}, options, callback);
    });
    api.compact = adapterFun$$1('compact', function(opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      opts = clone(opts);
      ajax$$1(opts, {
        url: genDBUrl(host, '_compact'),
        method: 'POST'
      }, function() {
        function ping() {
          api.info(function(err, res$$1) {
            if (res$$1 && !res$$1.compact_running) {
              callback(null, {ok: true});
            } else {
              setTimeout(ping, opts.interval || 200);
            }
          });
        }
        ping();
      });
    });
    api.bulkGet = adapterFun('bulkGet', function(opts, callback) {
      var self = this;
      function doBulkGet(cb) {
        var params = {};
        if (opts.revs) {
          params.revs = true;
        }
        if (opts.attachments) {
          params.attachments = true;
        }
        if (opts.latest) {
          params.latest = true;
        }
        ajax$$1(opts, {
          url: genDBUrl(host, '_bulk_get' + paramsToStr(params)),
          method: 'POST',
          body: {docs: opts.docs}
        }, cb);
      }
      function doBulkGetShim() {
        var batchSize = MAX_SIMULTANEOUS_REVS;
        var numBatches = Math.ceil(opts.docs.length / batchSize);
        var numDone = 0;
        var results = new Array(numBatches);
        function onResult(batchNum) {
          return function(err, res$$1) {
            results[batchNum] = res$$1.results;
            if (++numDone === numBatches) {
              callback(null, {results: flatten(results)});
            }
          };
        }
        for (var i = 0; i < numBatches; i++) {
          var subOpts = pick(opts, ['revs', 'attachments', 'latest']);
          subOpts.ajax = ajaxOpts;
          subOpts.docs = opts.docs.slice(i * batchSize, Math.min(opts.docs.length, (i + 1) * batchSize));
          bulkGet(self, subOpts, onResult(i));
        }
      }
      var dbUrl = genUrl(host, '');
      var supportsBulkGet = supportsBulkGetMap[dbUrl];
      if (typeof supportsBulkGet !== 'boolean') {
        doBulkGet(function(err, res$$1) {
          if (err) {
            supportsBulkGetMap[dbUrl] = false;
            res(err.status, 'PouchDB is just detecting if the remote ' + 'supports the _bulk_get API.');
            doBulkGetShim();
          } else {
            supportsBulkGetMap[dbUrl] = true;
            callback(null, res$$1);
          }
        });
      } else if (supportsBulkGet) {
        doBulkGet(callback);
      } else {
        doBulkGetShim();
      }
    });
    api._info = function(callback) {
      setup().then(function() {
        ajax$$1({}, {
          method: 'GET',
          url: genDBUrl(host, '')
        }, function(err, res$$1) {
          if (err) {
            return callback(err);
          }
          res$$1.host = genDBUrl(host, '');
          callback(null, res$$1);
        });
      }).catch(callback);
    };
    api.get = adapterFun$$1('get', function(id, opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      opts = clone(opts);
      var params = {};
      if (opts.revs) {
        params.revs = true;
      }
      if (opts.revs_info) {
        params.revs_info = true;
      }
      if (opts.latest) {
        params.latest = true;
      }
      if (opts.open_revs) {
        if (opts.open_revs !== "all") {
          opts.open_revs = JSON.stringify(opts.open_revs);
        }
        params.open_revs = opts.open_revs;
      }
      if (opts.rev) {
        params.rev = opts.rev;
      }
      if (opts.conflicts) {
        params.conflicts = opts.conflicts;
      }
      id = encodeDocId(id);
      var options = {
        method: 'GET',
        url: genDBUrl(host, id + paramsToStr(params))
      };
      function fetchAttachments(doc) {
        var atts = doc._attachments;
        var filenames = atts && Object.keys(atts);
        if (!atts || !filenames.length) {
          return;
        }
        function fetch(filename) {
          var att = atts[filename];
          var path$$1 = encodeDocId(doc._id) + '/' + encodeAttachmentId(filename) + '?rev=' + doc._rev;
          return ajaxPromise(opts, {
            method: 'GET',
            url: genDBUrl(host, path$$1),
            binary: true
          }).then(function(blob) {
            if (opts.binary) {
              return blob;
            }
            return new PouchPromise$1(function(resolve) {
              blobToBase64(blob, resolve);
            });
          }).then(function(data) {
            delete att.stub;
            delete att.length;
            att.data = data;
          });
        }
        var promiseFactories = filenames.map(function(filename) {
          return function() {
            return fetch(filename);
          };
        });
        return pool(promiseFactories, 5);
      }
      function fetchAllAttachments(docOrDocs) {
        if (Array.isArray(docOrDocs)) {
          return PouchPromise$1.all(docOrDocs.map(function(doc) {
            if (doc.ok) {
              return fetchAttachments(doc.ok);
            }
          }));
        }
        return fetchAttachments(docOrDocs);
      }
      ajaxPromise(opts, options).then(function(res$$1) {
        return PouchPromise$1.resolve().then(function() {
          if (opts.attachments) {
            return fetchAllAttachments(res$$1);
          }
        }).then(function() {
          callback(null, res$$1);
        });
      }).catch(function(e) {
        e.docId = id;
        callback(e);
      });
    });
    api.remove = adapterFun$$1('remove', function(docOrId, optsOrRev, opts, callback) {
      var doc;
      if (typeof optsOrRev === 'string') {
        doc = {
          _id: docOrId,
          _rev: optsOrRev
        };
        if (typeof opts === 'function') {
          callback = opts;
          opts = {};
        }
      } else {
        doc = docOrId;
        if (typeof optsOrRev === 'function') {
          callback = optsOrRev;
          opts = {};
        } else {
          callback = opts;
          opts = optsOrRev;
        }
      }
      var rev$$1 = (doc._rev || opts.rev);
      ajax$$1(opts, {
        method: 'DELETE',
        url: genDBUrl(host, encodeDocId(doc._id)) + '?rev=' + rev$$1
      }, callback);
    });
    function encodeAttachmentId(attachmentId) {
      return attachmentId.split("/").map(encodeURIComponent).join("/");
    }
    api.getAttachment = adapterFun$$1('getAttachment', function(docId, attachmentId, opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      var params = opts.rev ? ('?rev=' + opts.rev) : '';
      var url = genDBUrl(host, encodeDocId(docId)) + '/' + encodeAttachmentId(attachmentId) + params;
      ajax$$1(opts, {
        method: 'GET',
        url: url,
        binary: true
      }, callback);
    });
    api.removeAttachment = adapterFun$$1('removeAttachment', function(docId, attachmentId, rev$$1, callback) {
      var url = genDBUrl(host, encodeDocId(docId) + '/' + encodeAttachmentId(attachmentId)) + '?rev=' + rev$$1;
      ajax$$1({}, {
        method: 'DELETE',
        url: url
      }, callback);
    });
    api.putAttachment = adapterFun$$1('putAttachment', function(docId, attachmentId, rev$$1, blob, type, callback) {
      if (typeof type === 'function') {
        callback = type;
        type = blob;
        blob = rev$$1;
        rev$$1 = null;
      }
      var id = encodeDocId(docId) + '/' + encodeAttachmentId(attachmentId);
      var url = genDBUrl(host, id);
      if (rev$$1) {
        url += '?rev=' + rev$$1;
      }
      if (typeof blob === 'string') {
        var binary;
        try {
          binary = thisAtob(blob);
        } catch (err) {
          return callback(createError(BAD_ARG, 'Attachment is not a valid base64 string'));
        }
        blob = binary ? binStringToBluffer(binary, type) : '';
      }
      var opts = {
        headers: {'Content-Type': type},
        method: 'PUT',
        url: url,
        processData: false,
        body: blob,
        timeout: ajaxOpts.timeout || 60000
      };
      ajax$$1({}, opts, callback);
    });
    api._bulkDocs = function(req, opts, callback) {
      req.new_edits = opts.new_edits;
      setup().then(function() {
        return PouchPromise$1.all(req.docs.map(preprocessAttachments$2));
      }).then(function() {
        ajax$$1(opts, {
          method: 'POST',
          url: genDBUrl(host, '_bulk_docs'),
          timeout: opts.timeout,
          body: req
        }, function(err, results) {
          if (err) {
            return callback(err);
          }
          results.forEach(function(result) {
            result.ok = true;
          });
          callback(null, results);
        });
      }).catch(callback);
    };
    api._put = function(doc, opts, callback) {
      setup().then(function() {
        return preprocessAttachments$2(doc);
      }).then(function() {
        ajax$$1(opts, {
          method: 'PUT',
          url: genDBUrl(host, encodeDocId(doc._id)),
          body: doc
        }, function(err, result) {
          if (err) {
            err.docId = doc && doc._id;
            return callback(err);
          }
          callback(null, result);
        });
      }).catch(callback);
    };
    api.allDocs = adapterFun$$1('allDocs', function(opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      opts = clone(opts);
      var params = {};
      var body;
      var method = 'GET';
      if (opts.conflicts) {
        params.conflicts = true;
      }
      if (opts.descending) {
        params.descending = true;
      }
      if (opts.include_docs) {
        params.include_docs = true;
      }
      if (opts.attachments) {
        params.attachments = true;
      }
      if (opts.key) {
        params.key = JSON.stringify(opts.key);
      }
      if (opts.start_key) {
        opts.startkey = opts.start_key;
      }
      if (opts.startkey) {
        params.startkey = JSON.stringify(opts.startkey);
      }
      if (opts.end_key) {
        opts.endkey = opts.end_key;
      }
      if (opts.endkey) {
        params.endkey = JSON.stringify(opts.endkey);
      }
      if (typeof opts.inclusive_end !== 'undefined') {
        params.inclusive_end = !!opts.inclusive_end;
      }
      if (typeof opts.limit !== 'undefined') {
        params.limit = opts.limit;
      }
      if (typeof opts.skip !== 'undefined') {
        params.skip = opts.skip;
      }
      var paramStr = paramsToStr(params);
      if (typeof opts.keys !== 'undefined') {
        method = 'POST';
        body = {keys: opts.keys};
      }
      ajaxPromise(opts, {
        method: method,
        url: genDBUrl(host, '_all_docs' + paramStr),
        body: body
      }).then(function(res$$1) {
        if (opts.include_docs && opts.attachments && opts.binary) {
          res$$1.rows.forEach(readAttachmentsAsBlobOrBuffer);
        }
        callback(null, res$$1);
      }).catch(callback);
    });
    api._changes = function(opts) {
      var batchSize = 'batch_size' in opts ? opts.batch_size : CHANGES_BATCH_SIZE;
      opts = clone(opts);
      if (opts.continuous && !('heartbeat' in opts)) {
        opts.heartbeat = DEFAULT_HEARTBEAT;
      }
      var requestTimeout = ('timeout' in opts) ? opts.timeout : ('timeout' in ajaxOpts) ? ajaxOpts.timeout : 30 * 1000;
      if ('timeout' in opts && opts.timeout && (requestTimeout - opts.timeout) < CHANGES_TIMEOUT_BUFFER) {
        requestTimeout = opts.timeout + CHANGES_TIMEOUT_BUFFER;
      }
      if ('heartbeat' in opts && opts.heartbeat && (requestTimeout - opts.heartbeat) < CHANGES_TIMEOUT_BUFFER) {
        requestTimeout = opts.heartbeat + CHANGES_TIMEOUT_BUFFER;
      }
      var params = {};
      if ('timeout' in opts && opts.timeout) {
        params.timeout = opts.timeout;
      }
      var limit = (typeof opts.limit !== 'undefined') ? opts.limit : false;
      var returnDocs;
      if ('return_docs' in opts) {
        returnDocs = opts.return_docs;
      } else if ('returnDocs' in opts) {
        returnDocs = opts.returnDocs;
      } else {
        returnDocs = true;
      }
      var leftToFetch = limit;
      if (opts.style) {
        params.style = opts.style;
      }
      if (opts.include_docs || opts.filter && typeof opts.filter === 'function') {
        params.include_docs = true;
      }
      if (opts.attachments) {
        params.attachments = true;
      }
      if (opts.continuous) {
        params.feed = 'longpoll';
      }
      if (opts.conflicts) {
        params.conflicts = true;
      }
      if (opts.descending) {
        params.descending = true;
      }
      if ('heartbeat' in opts) {
        if (opts.heartbeat) {
          params.heartbeat = opts.heartbeat;
        }
      }
      if (opts.filter && typeof opts.filter === 'string') {
        params.filter = opts.filter;
      }
      if (opts.view && typeof opts.view === 'string') {
        params.filter = '_view';
        params.view = opts.view;
      }
      if (opts.query_params && typeof opts.query_params === 'object') {
        for (var param_name in opts.query_params) {
          if (opts.query_params.hasOwnProperty(param_name)) {
            params[param_name] = opts.query_params[param_name];
          }
        }
      }
      var method = 'GET';
      var body;
      if (opts.doc_ids) {
        params.filter = '_doc_ids';
        method = 'POST';
        body = {doc_ids: opts.doc_ids};
      } else if (opts.selector) {
        params.filter = '_selector';
        method = 'POST';
        body = {selector: opts.selector};
      }
      var xhr;
      var lastFetchedSeq;
      var fetch = function(since, callback) {
        if (opts.aborted) {
          return;
        }
        params.since = since;
        if (typeof params.since === "object") {
          params.since = JSON.stringify(params.since);
        }
        if (opts.descending) {
          if (limit) {
            params.limit = leftToFetch;
          }
        } else {
          params.limit = (!limit || leftToFetch > batchSize) ? batchSize : leftToFetch;
        }
        var xhrOpts = {
          method: method,
          url: genDBUrl(host, '_changes' + paramsToStr(params)),
          timeout: requestTimeout,
          body: body
        };
        lastFetchedSeq = since;
        if (opts.aborted) {
          return;
        }
        setup().then(function() {
          xhr = ajax$$1(opts, xhrOpts, callback);
        }).catch(callback);
      };
      var results = {results: []};
      var fetched = function(err, res$$1) {
        if (opts.aborted) {
          return;
        }
        var raw_results_length = 0;
        if (res$$1 && res$$1.results) {
          raw_results_length = res$$1.results.length;
          results.last_seq = res$$1.last_seq;
          var req = {};
          req.query = opts.query_params;
          res$$1.results = res$$1.results.filter(function(c) {
            leftToFetch--;
            var ret = filterChange(opts)(c);
            if (ret) {
              if (opts.include_docs && opts.attachments && opts.binary) {
                readAttachmentsAsBlobOrBuffer(c);
              }
              if (returnDocs) {
                results.results.push(c);
              }
              opts.onChange(c);
            }
            return ret;
          });
        } else if (err) {
          opts.aborted = true;
          opts.complete(err);
          return;
        }
        if (res$$1 && res$$1.last_seq) {
          lastFetchedSeq = res$$1.last_seq;
        }
        var finished = (limit && leftToFetch <= 0) || (res$$1 && raw_results_length < batchSize) || (opts.descending);
        if ((opts.continuous && !(limit && leftToFetch <= 0)) || !finished) {
          nextTick(function() {
            fetch(lastFetchedSeq, fetched);
          });
        } else {
          opts.complete(null, results);
        }
      };
      fetch(opts.since || 0, fetched);
      return {cancel: function() {
          opts.aborted = true;
          if (xhr) {
            xhr.abort();
          }
        }};
    };
    api.revsDiff = adapterFun$$1('revsDiff', function(req, opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      ajax$$1(opts, {
        method: 'POST',
        url: genDBUrl(host, '_revs_diff'),
        body: req
      }, callback);
    });
    api._close = function(callback) {
      callback();
    };
    api._destroy = function(options, callback) {
      ajax$$1(options, {
        url: genDBUrl(host, ''),
        method: 'DELETE'
      }, function(err, resp) {
        if (err && err.status && err.status !== 404) {
          return callback(err);
        }
        callback(null, resp);
      });
    };
  }
  HttpPouch.valid = function() {
    return true;
  };
  var HttpPouch$1 = function(PouchDB) {
    PouchDB.adapter('http', HttpPouch, false);
    PouchDB.adapter('https', HttpPouch, false);
  };
  function QueryParseError(message) {
    this.status = 400;
    this.name = 'query_parse_error';
    this.message = message;
    this.error = true;
    try {
      Error.captureStackTrace(this, QueryParseError);
    } catch (e) {}
  }
  inherits(QueryParseError, Error);
  function NotFoundError$2(message) {
    this.status = 404;
    this.name = 'not_found';
    this.message = message;
    this.error = true;
    try {
      Error.captureStackTrace(this, NotFoundError$2);
    } catch (e) {}
  }
  inherits(NotFoundError$2, Error);
  function BuiltInError(message) {
    this.status = 500;
    this.name = 'invalid_value';
    this.message = message;
    this.error = true;
    try {
      Error.captureStackTrace(this, BuiltInError);
    } catch (e) {}
  }
  inherits(BuiltInError, Error);
  function promisedCallback(promise, callback) {
    if (callback) {
      promise.then(function(res$$1) {
        nextTick(function() {
          callback(null, res$$1);
        });
      }, function(reason) {
        nextTick(function() {
          callback(reason);
        });
      });
    }
    return promise;
  }
  function callbackify(fun) {
    return getArguments(function(args) {
      var cb = args.pop();
      var promise = fun.apply(this, args);
      if (typeof cb === 'function') {
        promisedCallback(promise, cb);
      }
      return promise;
    });
  }
  function fin(promise, finalPromiseFactory) {
    return promise.then(function(res$$1) {
      return finalPromiseFactory().then(function() {
        return res$$1;
      });
    }, function(reason) {
      return finalPromiseFactory().then(function() {
        throw reason;
      });
    });
  }
  function sequentialize(queue, promiseFactory) {
    return function() {
      var args = arguments;
      var that = this;
      return queue.add(function() {
        return promiseFactory.apply(that, args);
      });
    };
  }
  function uniq(arr) {
    var theSet = new ExportedSet(arr);
    var result = new Array(theSet.size);
    var index = -1;
    theSet.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }
  function mapToKeysArray(map) {
    var result = new Array(map.size);
    var index = -1;
    map.forEach(function(value, key) {
      result[++index] = key;
    });
    return result;
  }
  function createBuiltInError(name) {
    var message = 'builtin ' + name + ' function requires map values to be numbers' + ' or number arrays';
    return new BuiltInError(message);
  }
  function sum(values) {
    var result = 0;
    for (var i = 0,
        len = values.length; i < len; i++) {
      var num = values[i];
      if (typeof num !== 'number') {
        if (Array.isArray(num)) {
          result = typeof result === 'number' ? [result] : result;
          for (var j = 0,
              jLen = num.length; j < jLen; j++) {
            var jNum = num[j];
            if (typeof jNum !== 'number') {
              throw createBuiltInError('_sum');
            } else if (typeof result[j] === 'undefined') {
              result.push(jNum);
            } else {
              result[j] += jNum;
            }
          }
        } else {
          throw createBuiltInError('_sum');
        }
      } else if (typeof result === 'number') {
        result += num;
      } else {
        result[0] += num;
      }
    }
    return result;
  }
  function createBuiltInErrorInVm(name) {
    return {
      builtInError: true,
      name: name
    };
  }
  function convertToTrueError(err) {
    return createBuiltInError(err.name);
  }
  function isBuiltInError(obj$$1) {
    return obj$$1 && obj$$1.builtInError;
  }
  function evalFunctionInVm(func, emit) {
    return function(arg1, arg2, arg3) {
      var code = '(function() {"use strict";' + 'var createBuiltInError = ' + createBuiltInErrorInVm.toString() + ';' + 'var sum = ' + sum.toString() + ';' + 'var log = function () {};' + 'var isArray = Array.isArray;' + 'var toJSON = JSON.parse;' + 'var __emitteds__ = [];' + 'var emit = function (key, value) {__emitteds__.push([key, value]);};' + 'var __result__ = (' + func.replace(/;\s*$/, '') + ')' + '(' + JSON.stringify(arg1) + ',' + JSON.stringify(arg2) + ',' + JSON.stringify(arg3) + ');' + 'return {result: __result__, emitteds: __emitteds__};' + '})()';
      var output = vm.runInNewContext(code);
      output.emitteds.forEach(function(emitted) {
        emit(emitted[0], emitted[1]);
      });
      if (isBuiltInError(output.result)) {
        output.result = convertToTrueError(output.result);
      }
      return output.result;
    };
  }
  var log = guardedConsole.bind(null, 'log');
  var evalFunc;
  {
    evalFunc = evalFunctionInVm;
  }
  var evalFunction = evalFunc;
  function TaskQueue$2() {
    this.promise = new PouchPromise$1(function(fulfill) {
      fulfill();
    });
  }
  TaskQueue$2.prototype.add = function(promiseFactory) {
    this.promise = this.promise.catch(function() {}).then(function() {
      return promiseFactory();
    });
    return this.promise;
  };
  TaskQueue$2.prototype.finish = function() {
    return this.promise;
  };
  function stringify(input) {
    if (!input) {
      return 'undefined';
    }
    switch (typeof input) {
      case 'function':
        return input.toString();
      case 'string':
        return input.toString();
      default:
        return JSON.stringify(input);
    }
  }
  function createViewSignature(mapFun, reduceFun) {
    return stringify(mapFun) + stringify(reduceFun) + 'undefined';
  }
  function createView(sourceDB, viewName, mapFun, reduceFun, temporary, localDocName) {
    var viewSignature = createViewSignature(mapFun, reduceFun);
    var cachedViews;
    if (!temporary) {
      cachedViews = sourceDB._cachedViews = sourceDB._cachedViews || {};
      if (cachedViews[viewSignature]) {
        return cachedViews[viewSignature];
      }
    }
    var promiseForView = sourceDB.info().then(function(info) {
      var depDbName = info.db_name + '-mrview-' + (temporary ? 'temp' : stringMd5(viewSignature));
      function diffFunction(doc) {
        doc.views = doc.views || {};
        var fullViewName = viewName;
        if (fullViewName.indexOf('/') === -1) {
          fullViewName = viewName + '/' + viewName;
        }
        var depDbs = doc.views[fullViewName] = doc.views[fullViewName] || {};
        if (depDbs[depDbName]) {
          return;
        }
        depDbs[depDbName] = true;
        return doc;
      }
      return upsert(sourceDB, '_local/' + localDocName, diffFunction).then(function() {
        return sourceDB.registerDependentDatabase(depDbName).then(function(res$$1) {
          var db = res$$1.db;
          db.auto_compaction = true;
          var view = {
            name: depDbName,
            db: db,
            sourceDB: sourceDB,
            adapter: sourceDB.adapter,
            mapFun: mapFun,
            reduceFun: reduceFun
          };
          return view.db.get('_local/lastSeq').catch(function(err) {
            if (err.status !== 404) {
              throw err;
            }
          }).then(function(lastSeqDoc) {
            view.seq = lastSeqDoc ? lastSeqDoc.seq : 0;
            if (cachedViews) {
              view.db.once('destroyed', function() {
                delete cachedViews[viewSignature];
              });
            }
            return view;
          });
        });
      });
    });
    if (cachedViews) {
      cachedViews[viewSignature] = promiseForView;
    }
    return promiseForView;
  }
  var persistentQueues = {};
  var tempViewQueue = new TaskQueue$2();
  var CHANGES_BATCH_SIZE$1 = 50;
  function parseViewName(name) {
    return name.indexOf('/') === -1 ? [name, name] : name.split('/');
  }
  function isGenOne(changes) {
    return changes.length === 1 && /^1-/.test(changes[0].rev);
  }
  function emitError(db, e) {
    try {
      db.emit('error', e);
    } catch (err) {
      guardedConsole('error', 'The user\'s map/reduce function threw an uncaught error.\n' + 'You can debug this error by doing:\n' + 'myDatabase.on(\'error\', function (err) { debugger; });\n' + 'Please double-check your map/reduce function.');
      guardedConsole('error', e);
    }
  }
  function createAbstractMapReduce(localDocName, mapper, reducer, ddocValidator) {
    function tryMap(db, fun, doc) {
      try {
        fun(doc);
      } catch (e) {
        emitError(db, e);
      }
    }
    function tryReduce(db, fun, keys, values, rereduce) {
      try {
        return {output: fun(keys, values, rereduce)};
      } catch (e) {
        emitError(db, e);
        return {error: e};
      }
    }
    function sortByKeyThenValue(x, y) {
      var keyCompare = collate(x.key, y.key);
      return keyCompare !== 0 ? keyCompare : collate(x.value, y.value);
    }
    function sliceResults(results, limit, skip) {
      skip = skip || 0;
      if (typeof limit === 'number') {
        return results.slice(skip, limit + skip);
      } else if (skip > 0) {
        return results.slice(skip);
      }
      return results;
    }
    function rowToDocId(row) {
      var val = row.value;
      var docId = (val && typeof val === 'object' && val._id) || row.id;
      return docId;
    }
    function readAttachmentsAsBlobOrBuffer(res$$1) {
      res$$1.rows.forEach(function(row) {
        var atts = row.doc && row.doc._attachments;
        if (!atts) {
          return;
        }
        Object.keys(atts).forEach(function(filename) {
          var att = atts[filename];
          atts[filename].data = b64ToBluffer(att.data, att.content_type);
        });
      });
    }
    function postprocessAttachments(opts) {
      return function(res$$1) {
        if (opts.include_docs && opts.attachments && opts.binary) {
          readAttachmentsAsBlobOrBuffer(res$$1);
        }
        return res$$1;
      };
    }
    function addHttpParam(paramName, opts, params, asJson) {
      var val = opts[paramName];
      if (typeof val !== 'undefined') {
        if (asJson) {
          val = encodeURIComponent(JSON.stringify(val));
        }
        params.push(paramName + '=' + val);
      }
    }
    function coerceInteger(integerCandidate) {
      if (typeof integerCandidate !== 'undefined') {
        var asNumber = Number(integerCandidate);
        if (!isNaN(asNumber) && asNumber === parseInt(integerCandidate, 10)) {
          return asNumber;
        } else {
          return integerCandidate;
        }
      }
    }
    function coerceOptions(opts) {
      opts.group_level = coerceInteger(opts.group_level);
      opts.limit = coerceInteger(opts.limit);
      opts.skip = coerceInteger(opts.skip);
      return opts;
    }
    function checkPositiveInteger(number) {
      if (number) {
        if (typeof number !== 'number') {
          return new QueryParseError('Invalid value for integer: "' + number + '"');
        }
        if (number < 0) {
          return new QueryParseError('Invalid value for positive integer: ' + '"' + number + '"');
        }
      }
    }
    function checkQueryParseError(options, fun) {
      var startkeyName = options.descending ? 'endkey' : 'startkey';
      var endkeyName = options.descending ? 'startkey' : 'endkey';
      if (typeof options[startkeyName] !== 'undefined' && typeof options[endkeyName] !== 'undefined' && collate(options[startkeyName], options[endkeyName]) > 0) {
        throw new QueryParseError('No rows can match your key range, ' + 'reverse your start_key and end_key or set {descending : true}');
      } else if (fun.reduce && options.reduce !== false) {
        if (options.include_docs) {
          throw new QueryParseError('{include_docs:true} is invalid for reduce');
        } else if (options.keys && options.keys.length > 1 && !options.group && !options.group_level) {
          throw new QueryParseError('Multi-key fetches for reduce views must use ' + '{group: true}');
        }
      }
      ['group_level', 'limit', 'skip'].forEach(function(optionName) {
        var error = checkPositiveInteger(options[optionName]);
        if (error) {
          throw error;
        }
      });
    }
    function httpQuery(db, fun, opts) {
      var params = [];
      var body;
      var method = 'GET';
      addHttpParam('reduce', opts, params);
      addHttpParam('include_docs', opts, params);
      addHttpParam('attachments', opts, params);
      addHttpParam('limit', opts, params);
      addHttpParam('descending', opts, params);
      addHttpParam('group', opts, params);
      addHttpParam('group_level', opts, params);
      addHttpParam('skip', opts, params);
      addHttpParam('stale', opts, params);
      addHttpParam('conflicts', opts, params);
      addHttpParam('startkey', opts, params, true);
      addHttpParam('start_key', opts, params, true);
      addHttpParam('endkey', opts, params, true);
      addHttpParam('end_key', opts, params, true);
      addHttpParam('inclusive_end', opts, params);
      addHttpParam('key', opts, params, true);
      params = params.join('&');
      params = params === '' ? '' : '?' + params;
      if (typeof opts.keys !== 'undefined') {
        var MAX_URL_LENGTH = 2000;
        var keysAsString = 'keys=' + encodeURIComponent(JSON.stringify(opts.keys));
        if (keysAsString.length + params.length + 1 <= MAX_URL_LENGTH) {
          params += (params[0] === '?' ? '&' : '?') + keysAsString;
        } else {
          method = 'POST';
          if (typeof fun === 'string') {
            body = {keys: opts.keys};
          } else {
            fun.keys = opts.keys;
          }
        }
      }
      if (typeof fun === 'string') {
        var parts = parseViewName(fun);
        return db.request({
          method: method,
          url: '_design/' + parts[0] + '/_view/' + parts[1] + params,
          body: body
        }).then(function(result) {
          result.rows.forEach(function(row) {
            if (row.value && row.value.error && row.value.error === "builtin_reduce_error") {
              throw new Error(row.reason);
            }
          });
          return result;
        }).then(postprocessAttachments(opts));
      }
      body = body || {};
      Object.keys(fun).forEach(function(key) {
        if (Array.isArray(fun[key])) {
          body[key] = fun[key];
        } else {
          body[key] = fun[key].toString();
        }
      });
      return db.request({
        method: 'POST',
        url: '_temp_view' + params,
        body: body
      }).then(postprocessAttachments(opts));
    }
    function customQuery(db, fun, opts) {
      return new PouchPromise$1(function(resolve, reject) {
        db._query(fun, opts, function(err, res$$1) {
          if (err) {
            return reject(err);
          }
          resolve(res$$1);
        });
      });
    }
    function customViewCleanup(db) {
      return new PouchPromise$1(function(resolve, reject) {
        db._viewCleanup(function(err, res$$1) {
          if (err) {
            return reject(err);
          }
          resolve(res$$1);
        });
      });
    }
    function defaultsTo(value) {
      return function(reason) {
        if (reason.status === 404) {
          return value;
        } else {
          throw reason;
        }
      };
    }
    function getDocsToPersist(docId, view, docIdsToChangesAndEmits) {
      var metaDocId = '_local/doc_' + docId;
      var defaultMetaDoc = {
        _id: metaDocId,
        keys: []
      };
      var docData = docIdsToChangesAndEmits.get(docId);
      var indexableKeysToKeyValues = docData[0];
      var changes = docData[1];
      function getMetaDoc() {
        if (isGenOne(changes)) {
          return PouchPromise$1.resolve(defaultMetaDoc);
        }
        return view.db.get(metaDocId).catch(defaultsTo(defaultMetaDoc));
      }
      function getKeyValueDocs(metaDoc) {
        if (!metaDoc.keys.length) {
          return PouchPromise$1.resolve({rows: []});
        }
        return view.db.allDocs({
          keys: metaDoc.keys,
          include_docs: true
        });
      }
      function processKeyValueDocs(metaDoc, kvDocsRes) {
        var kvDocs = [];
        var oldKeys = new ExportedSet();
        for (var i = 0,
            len = kvDocsRes.rows.length; i < len; i++) {
          var row = kvDocsRes.rows[i];
          var doc = row.doc;
          if (!doc) {
            continue;
          }
          kvDocs.push(doc);
          oldKeys.add(doc._id);
          doc._deleted = !indexableKeysToKeyValues.has(doc._id);
          if (!doc._deleted) {
            var keyValue = indexableKeysToKeyValues.get(doc._id);
            if ('value' in keyValue) {
              doc.value = keyValue.value;
            }
          }
        }
        var newKeys = mapToKeysArray(indexableKeysToKeyValues);
        newKeys.forEach(function(key) {
          if (!oldKeys.has(key)) {
            var kvDoc = {_id: key};
            var keyValue = indexableKeysToKeyValues.get(key);
            if ('value' in keyValue) {
              kvDoc.value = keyValue.value;
            }
            kvDocs.push(kvDoc);
          }
        });
        metaDoc.keys = uniq(newKeys.concat(metaDoc.keys));
        kvDocs.push(metaDoc);
        return kvDocs;
      }
      return getMetaDoc().then(function(metaDoc) {
        return getKeyValueDocs(metaDoc).then(function(kvDocsRes) {
          return processKeyValueDocs(metaDoc, kvDocsRes);
        });
      });
    }
    function saveKeyValues(view, docIdsToChangesAndEmits, seq) {
      var seqDocId = '_local/lastSeq';
      return view.db.get(seqDocId).catch(defaultsTo({
        _id: seqDocId,
        seq: 0
      })).then(function(lastSeqDoc) {
        var docIds = mapToKeysArray(docIdsToChangesAndEmits);
        return PouchPromise$1.all(docIds.map(function(docId) {
          return getDocsToPersist(docId, view, docIdsToChangesAndEmits);
        })).then(function(listOfDocsToPersist) {
          var docsToPersist = flatten(listOfDocsToPersist);
          lastSeqDoc.seq = seq;
          docsToPersist.push(lastSeqDoc);
          return view.db.bulkDocs({docs: docsToPersist});
        });
      });
    }
    function getQueue(view) {
      var viewName = typeof view === 'string' ? view : view.name;
      var queue = persistentQueues[viewName];
      if (!queue) {
        queue = persistentQueues[viewName] = new TaskQueue$2();
      }
      return queue;
    }
    function updateView(view) {
      return sequentialize(getQueue(view), function() {
        return updateViewInQueue(view);
      })();
    }
    function updateViewInQueue(view) {
      var mapResults;
      var doc;
      function emit(key, value) {
        var output = {
          id: doc._id,
          key: normalizeKey(key)
        };
        if (typeof value !== 'undefined' && value !== null) {
          output.value = normalizeKey(value);
        }
        mapResults.push(output);
      }
      var mapFun = mapper(view.mapFun, emit);
      var currentSeq = view.seq || 0;
      function processChange(docIdsToChangesAndEmits, seq) {
        return function() {
          return saveKeyValues(view, docIdsToChangesAndEmits, seq);
        };
      }
      var queue = new TaskQueue$2();
      function processNextBatch() {
        return view.sourceDB.changes({
          conflicts: true,
          include_docs: true,
          style: 'all_docs',
          since: currentSeq,
          limit: CHANGES_BATCH_SIZE$1
        }).then(processBatch);
      }
      function processBatch(response) {
        var results = response.results;
        if (!results.length) {
          return;
        }
        var docIdsToChangesAndEmits = createDocIdsToChangesAndEmits(results);
        queue.add(processChange(docIdsToChangesAndEmits, currentSeq));
        if (results.length < CHANGES_BATCH_SIZE$1) {
          return;
        }
        return processNextBatch();
      }
      function createDocIdsToChangesAndEmits(results) {
        var docIdsToChangesAndEmits = new ExportedMap();
        for (var i = 0,
            len = results.length; i < len; i++) {
          var change = results[i];
          if (change.doc._id[0] !== '_') {
            mapResults = [];
            doc = change.doc;
            if (!doc._deleted) {
              tryMap(view.sourceDB, mapFun, doc);
            }
            mapResults.sort(sortByKeyThenValue);
            var indexableKeysToKeyValues = createIndexableKeysToKeyValues(mapResults);
            docIdsToChangesAndEmits.set(change.doc._id, [indexableKeysToKeyValues, change.changes]);
          }
          currentSeq = change.seq;
        }
        return docIdsToChangesAndEmits;
      }
      function createIndexableKeysToKeyValues(mapResults) {
        var indexableKeysToKeyValues = new ExportedMap();
        var lastKey;
        for (var i = 0,
            len = mapResults.length; i < len; i++) {
          var emittedKeyValue = mapResults[i];
          var complexKey = [emittedKeyValue.key, emittedKeyValue.id];
          if (i > 0 && collate(emittedKeyValue.key, lastKey) === 0) {
            complexKey.push(i);
          }
          indexableKeysToKeyValues.set(toIndexableString(complexKey), emittedKeyValue);
          lastKey = emittedKeyValue.key;
        }
        return indexableKeysToKeyValues;
      }
      return processNextBatch().then(function() {
        return queue.finish();
      }).then(function() {
        view.seq = currentSeq;
      });
    }
    function reduceView(view, results, options) {
      if (options.group_level === 0) {
        delete options.group_level;
      }
      var shouldGroup = options.group || options.group_level;
      var reduceFun = reducer(view.reduceFun);
      var groups = [];
      var lvl = isNaN(options.group_level) ? Number.POSITIVE_INFINITY : options.group_level;
      results.forEach(function(e) {
        var last = groups[groups.length - 1];
        var groupKey = shouldGroup ? e.key : null;
        if (shouldGroup && Array.isArray(groupKey)) {
          groupKey = groupKey.slice(0, lvl);
        }
        if (last && collate(last.groupKey, groupKey) === 0) {
          last.keys.push([e.key, e.id]);
          last.values.push(e.value);
          return;
        }
        groups.push({
          keys: [[e.key, e.id]],
          values: [e.value],
          groupKey: groupKey
        });
      });
      results = [];
      for (var i = 0,
          len = groups.length; i < len; i++) {
        var e = groups[i];
        var reduceTry = tryReduce(view.sourceDB, reduceFun, e.keys, e.values, false);
        if (reduceTry.error && reduceTry.error instanceof BuiltInError) {
          throw reduceTry.error;
        }
        results.push({
          value: reduceTry.error ? null : reduceTry.output,
          key: e.groupKey
        });
      }
      return {rows: sliceResults(results, options.limit, options.skip)};
    }
    function queryView(view, opts) {
      return sequentialize(getQueue(view), function() {
        return queryViewInQueue(view, opts);
      })();
    }
    function queryViewInQueue(view, opts) {
      var totalRows;
      var shouldReduce = view.reduceFun && opts.reduce !== false;
      var skip = opts.skip || 0;
      if (typeof opts.keys !== 'undefined' && !opts.keys.length) {
        opts.limit = 0;
        delete opts.keys;
      }
      function fetchFromView(viewOpts) {
        viewOpts.include_docs = true;
        return view.db.allDocs(viewOpts).then(function(res$$1) {
          totalRows = res$$1.total_rows;
          return res$$1.rows.map(function(result) {
            if ('value' in result.doc && typeof result.doc.value === 'object' && result.doc.value !== null) {
              var keys = Object.keys(result.doc.value).sort();
              var expectedKeys = ['id', 'key', 'value'];
              if (!(keys < expectedKeys || keys > expectedKeys)) {
                return result.doc.value;
              }
            }
            var parsedKeyAndDocId = parseIndexableString(result.doc._id);
            return {
              key: parsedKeyAndDocId[0],
              id: parsedKeyAndDocId[1],
              value: ('value' in result.doc ? result.doc.value : null)
            };
          });
        });
      }
      function onMapResultsReady(rows) {
        var finalResults;
        if (shouldReduce) {
          finalResults = reduceView(view, rows, opts);
        } else {
          finalResults = {
            total_rows: totalRows,
            offset: skip,
            rows: rows
          };
        }
        if (opts.include_docs) {
          var docIds = uniq(rows.map(rowToDocId));
          return view.sourceDB.allDocs({
            keys: docIds,
            include_docs: true,
            conflicts: opts.conflicts,
            attachments: opts.attachments,
            binary: opts.binary
          }).then(function(allDocsRes) {
            var docIdsToDocs = new ExportedMap();
            allDocsRes.rows.forEach(function(row) {
              docIdsToDocs.set(row.id, row.doc);
            });
            rows.forEach(function(row) {
              var docId = rowToDocId(row);
              var doc = docIdsToDocs.get(docId);
              if (doc) {
                row.doc = doc;
              }
            });
            return finalResults;
          });
        } else {
          return finalResults;
        }
      }
      if (typeof opts.keys !== 'undefined') {
        var keys = opts.keys;
        var fetchPromises = keys.map(function(key) {
          var viewOpts = {
            startkey: toIndexableString([key]),
            endkey: toIndexableString([key, {}])
          };
          return fetchFromView(viewOpts);
        });
        return PouchPromise$1.all(fetchPromises).then(flatten).then(onMapResultsReady);
      } else {
        var viewOpts = {descending: opts.descending};
        var startkey;
        var endkey;
        if ('start_key' in opts) {
          startkey = opts.start_key;
        }
        if ('startkey' in opts) {
          startkey = opts.startkey;
        }
        if ('end_key' in opts) {
          endkey = opts.end_key;
        }
        if ('endkey' in opts) {
          endkey = opts.endkey;
        }
        if (typeof startkey !== 'undefined') {
          viewOpts.startkey = opts.descending ? toIndexableString([startkey, {}]) : toIndexableString([startkey]);
        }
        if (typeof endkey !== 'undefined') {
          var inclusiveEnd = opts.inclusive_end !== false;
          if (opts.descending) {
            inclusiveEnd = !inclusiveEnd;
          }
          viewOpts.endkey = toIndexableString(inclusiveEnd ? [endkey, {}] : [endkey]);
        }
        if (typeof opts.key !== 'undefined') {
          var keyStart = toIndexableString([opts.key]);
          var keyEnd = toIndexableString([opts.key, {}]);
          if (viewOpts.descending) {
            viewOpts.endkey = keyStart;
            viewOpts.startkey = keyEnd;
          } else {
            viewOpts.startkey = keyStart;
            viewOpts.endkey = keyEnd;
          }
        }
        if (!shouldReduce) {
          if (typeof opts.limit === 'number') {
            viewOpts.limit = opts.limit;
          }
          viewOpts.skip = skip;
        }
        return fetchFromView(viewOpts).then(onMapResultsReady);
      }
    }
    function httpViewCleanup(db) {
      return db.request({
        method: 'POST',
        url: '_view_cleanup'
      });
    }
    function localViewCleanup(db) {
      return db.get('_local/' + localDocName).then(function(metaDoc) {
        var docsToViews = new ExportedMap();
        Object.keys(metaDoc.views).forEach(function(fullViewName) {
          var parts = parseViewName(fullViewName);
          var designDocName = '_design/' + parts[0];
          var viewName = parts[1];
          var views = docsToViews.get(designDocName);
          if (!views) {
            views = new ExportedSet();
            docsToViews.set(designDocName, views);
          }
          views.add(viewName);
        });
        var opts = {
          keys: mapToKeysArray(docsToViews),
          include_docs: true
        };
        return db.allDocs(opts).then(function(res$$1) {
          var viewsToStatus = {};
          res$$1.rows.forEach(function(row) {
            var ddocName = row.key.substring(8);
            docsToViews.get(row.key).forEach(function(viewName) {
              var fullViewName = ddocName + '/' + viewName;
              if (!metaDoc.views[fullViewName]) {
                fullViewName = viewName;
              }
              var viewDBNames = Object.keys(metaDoc.views[fullViewName]);
              var statusIsGood = row.doc && row.doc.views && row.doc.views[viewName];
              viewDBNames.forEach(function(viewDBName) {
                viewsToStatus[viewDBName] = viewsToStatus[viewDBName] || statusIsGood;
              });
            });
          });
          var dbsToDelete = Object.keys(viewsToStatus).filter(function(viewDBName) {
            return !viewsToStatus[viewDBName];
          });
          var destroyPromises = dbsToDelete.map(function(viewDBName) {
            return sequentialize(getQueue(viewDBName), function() {
              return new db.constructor(viewDBName, db.__opts).destroy();
            })();
          });
          return PouchPromise$1.all(destroyPromises).then(function() {
            return {ok: true};
          });
        });
      }, defaultsTo({ok: true}));
    }
    function queryPromised(db, fun, opts) {
      if (typeof db._query === 'function') {
        return customQuery(db, fun, opts);
      }
      if (isRemote(db)) {
        return httpQuery(db, fun, opts);
      }
      if (typeof fun !== 'string') {
        checkQueryParseError(opts, fun);
        tempViewQueue.add(function() {
          var createViewPromise = createView(db, 'temp_view/temp_view', fun.map, fun.reduce, true, localDocName);
          return createViewPromise.then(function(view) {
            return fin(updateView(view).then(function() {
              return queryView(view, opts);
            }), function() {
              return view.db.destroy();
            });
          });
        });
        return tempViewQueue.finish();
      } else {
        var fullViewName = fun;
        var parts = parseViewName(fullViewName);
        var designDocName = parts[0];
        var viewName = parts[1];
        return db.get('_design/' + designDocName).then(function(doc) {
          var fun = doc.views && doc.views[viewName];
          if (!fun) {
            throw new NotFoundError$2('ddoc ' + doc._id + ' has no view named ' + viewName);
          }
          ddocValidator(doc, viewName);
          checkQueryParseError(opts, fun);
          var createViewPromise = createView(db, fullViewName, fun.map, fun.reduce, false, localDocName);
          return createViewPromise.then(function(view) {
            if (opts.stale === 'ok' || opts.stale === 'update_after') {
              if (opts.stale === 'update_after') {
                nextTick(function() {
                  updateView(view);
                });
              }
              return queryView(view, opts);
            } else {
              return updateView(view).then(function() {
                return queryView(view, opts);
              });
            }
          });
        });
      }
    }
    function abstractQuery(fun, opts, callback) {
      var db = this;
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      opts = opts ? coerceOptions(opts) : {};
      if (typeof fun === 'function') {
        fun = {map: fun};
      }
      var promise = PouchPromise$1.resolve().then(function() {
        return queryPromised(db, fun, opts);
      });
      promisedCallback(promise, callback);
      return promise;
    }
    var abstractViewCleanup = callbackify(function() {
      var db = this;
      if (typeof db._viewCleanup === 'function') {
        return customViewCleanup(db);
      }
      if (isRemote(db)) {
        return httpViewCleanup(db);
      }
      return localViewCleanup(db);
    });
    return {
      query: abstractQuery,
      viewCleanup: abstractViewCleanup
    };
  }
  var builtInReduce = {
    _sum: function(keys, values) {
      return sum(values);
    },
    _count: function(keys, values) {
      return values.length;
    },
    _stats: function(keys, values) {
      function sumsqr(values) {
        var _sumsqr = 0;
        for (var i = 0,
            len = values.length; i < len; i++) {
          var num = values[i];
          _sumsqr += (num * num);
        }
        return _sumsqr;
      }
      return {
        sum: sum(values),
        min: Math.min.apply(null, values),
        max: Math.max.apply(null, values),
        count: values.length,
        sumsqr: sumsqr(values)
      };
    }
  };
  function getBuiltIn(reduceFunString) {
    if (/^_sum/.test(reduceFunString)) {
      return builtInReduce._sum;
    } else if (/^_count/.test(reduceFunString)) {
      return builtInReduce._count;
    } else if (/^_stats/.test(reduceFunString)) {
      return builtInReduce._stats;
    } else if (/^_/.test(reduceFunString)) {
      throw new Error(reduceFunString + ' is not a supported reduce function.');
    }
  }
  function mapper(mapFun, emit) {
    if (typeof mapFun === "function" && mapFun.length === 2) {
      var origMap = mapFun;
      return function(doc) {
        return origMap(doc, emit);
      };
    } else {
      return evalFunction(mapFun.toString(), emit);
    }
  }
  function reducer(reduceFun) {
    var reduceFunString = reduceFun.toString();
    var builtIn = getBuiltIn(reduceFunString);
    if (builtIn) {
      return builtIn;
    } else {
      return evalFunction(reduceFunString);
    }
  }
  function ddocValidator(ddoc, viewName) {
    var fun = ddoc.views && ddoc.views[viewName];
    if (typeof fun.map !== 'string') {
      throw new NotFoundError$2('ddoc ' + ddoc._id + ' has no string view named ' + viewName + ', instead found object of type: ' + typeof fun.map);
    }
  }
  var localDocName = 'mrviews';
  var abstract = createAbstractMapReduce(localDocName, mapper, reducer, ddocValidator);
  function query(fun, opts, callback) {
    return abstract.query.call(this, fun, opts, callback);
  }
  function viewCleanup(callback) {
    return abstract.viewCleanup.call(this, callback);
  }
  var mapreduce = {
    query: query,
    viewCleanup: viewCleanup
  };
  function isGenOne$1(rev$$1) {
    return /^1-/.test(rev$$1);
  }
  function fileHasChanged(localDoc, remoteDoc, filename) {
    return !localDoc._attachments || !localDoc._attachments[filename] || localDoc._attachments[filename].digest !== remoteDoc._attachments[filename].digest;
  }
  function getDocAttachments(db, doc) {
    var filenames = Object.keys(doc._attachments);
    return PouchPromise$1.all(filenames.map(function(filename) {
      return db.getAttachment(doc._id, filename, {rev: doc._rev});
    }));
  }
  function getDocAttachmentsFromTargetOrSource(target, src, doc) {
    var doCheckForLocalAttachments = isRemote(src) && !isRemote(target);
    var filenames = Object.keys(doc._attachments);
    if (!doCheckForLocalAttachments) {
      return getDocAttachments(src, doc);
    }
    return target.get(doc._id).then(function(localDoc) {
      return PouchPromise$1.all(filenames.map(function(filename) {
        if (fileHasChanged(localDoc, doc, filename)) {
          return src.getAttachment(doc._id, filename);
        }
        return target.getAttachment(localDoc._id, filename);
      }));
    }).catch(function(error) {
      if (error.status !== 404) {
        throw error;
      }
      return getDocAttachments(src, doc);
    });
  }
  function createBulkGetOpts(diffs) {
    var requests = [];
    Object.keys(diffs).forEach(function(id) {
      var missingRevs = diffs[id].missing;
      missingRevs.forEach(function(missingRev) {
        requests.push({
          id: id,
          rev: missingRev
        });
      });
    });
    return {
      docs: requests,
      revs: true,
      latest: true
    };
  }
  function getDocs(src, target, diffs, state) {
    diffs = clone(diffs);
    var resultDocs = [],
        ok = true;
    function getAllDocs() {
      var bulkGetOpts = createBulkGetOpts(diffs);
      if (!bulkGetOpts.docs.length) {
        return;
      }
      return src.bulkGet(bulkGetOpts).then(function(bulkGetResponse) {
        if (state.cancelled) {
          throw new Error('cancelled');
        }
        return PouchPromise$1.all(bulkGetResponse.results.map(function(bulkGetInfo) {
          return PouchPromise$1.all(bulkGetInfo.docs.map(function(doc) {
            var remoteDoc = doc.ok;
            if (doc.error) {
              ok = false;
            }
            if (!remoteDoc || !remoteDoc._attachments) {
              return remoteDoc;
            }
            return getDocAttachmentsFromTargetOrSource(target, src, remoteDoc).then(function(attachments) {
              var filenames = Object.keys(remoteDoc._attachments);
              attachments.forEach(function(attachment, i) {
                var att = remoteDoc._attachments[filenames[i]];
                delete att.stub;
                delete att.length;
                att.data = attachment;
              });
              return remoteDoc;
            });
          }));
        })).then(function(results) {
          resultDocs = resultDocs.concat(flatten(results).filter(Boolean));
        });
      });
    }
    function hasAttachments(doc) {
      return doc._attachments && Object.keys(doc._attachments).length > 0;
    }
    function hasConflicts(doc) {
      return doc._conflicts && doc._conflicts.length > 0;
    }
    function fetchRevisionOneDocs(ids) {
      return src.allDocs({
        keys: ids,
        include_docs: true,
        conflicts: true
      }).then(function(res$$1) {
        if (state.cancelled) {
          throw new Error('cancelled');
        }
        res$$1.rows.forEach(function(row) {
          if (row.deleted || !row.doc || !isGenOne$1(row.value.rev) || hasAttachments(row.doc) || hasConflicts(row.doc)) {
            return;
          }
          if (row.doc._conflicts) {
            delete row.doc._conflicts;
          }
          resultDocs.push(row.doc);
          delete diffs[row.id];
        });
      });
    }
    function getRevisionOneDocs() {
      var ids = Object.keys(diffs).filter(function(id) {
        var missing = diffs[id].missing;
        return missing.length === 1 && isGenOne$1(missing[0]);
      });
      if (ids.length > 0) {
        return fetchRevisionOneDocs(ids);
      }
    }
    function returnResult() {
      return {
        ok: ok,
        docs: resultDocs
      };
    }
    return PouchPromise$1.resolve().then(getRevisionOneDocs).then(getAllDocs).then(returnResult);
  }
  var CHECKPOINT_VERSION = 1;
  var REPLICATOR = "pouchdb";
  var CHECKPOINT_HISTORY_SIZE = 5;
  var LOWEST_SEQ = 0;
  function updateCheckpoint(db, id, checkpoint, session, returnValue) {
    return db.get(id).catch(function(err) {
      if (err.status === 404) {
        if (db.adapter === 'http' || db.adapter === 'https') {
          res(404, 'PouchDB is just checking if a remote checkpoint exists.');
        }
        return {
          session_id: session,
          _id: id,
          history: [],
          replicator: REPLICATOR,
          version: CHECKPOINT_VERSION
        };
      }
      throw err;
    }).then(function(doc) {
      if (returnValue.cancelled) {
        return;
      }
      if (doc.last_seq === checkpoint) {
        return;
      }
      doc.history = (doc.history || []).filter(function(item) {
        return item.session_id !== session;
      });
      doc.history.unshift({
        last_seq: checkpoint,
        session_id: session
      });
      doc.history = doc.history.slice(0, CHECKPOINT_HISTORY_SIZE);
      doc.version = CHECKPOINT_VERSION;
      doc.replicator = REPLICATOR;
      doc.session_id = session;
      doc.last_seq = checkpoint;
      return db.put(doc).catch(function(err) {
        if (err.status === 409) {
          return updateCheckpoint(db, id, checkpoint, session, returnValue);
        }
        throw err;
      });
    });
  }
  function Checkpointer(src, target, id, returnValue, opts) {
    this.src = src;
    this.target = target;
    this.id = id;
    this.returnValue = returnValue;
    this.opts = opts;
  }
  Checkpointer.prototype.writeCheckpoint = function(checkpoint, session) {
    var self = this;
    return this.updateTarget(checkpoint, session).then(function() {
      return self.updateSource(checkpoint, session);
    });
  };
  Checkpointer.prototype.updateTarget = function(checkpoint, session) {
    if (this.opts.writeTargetCheckpoint) {
      return updateCheckpoint(this.target, this.id, checkpoint, session, this.returnValue);
    } else {
      return PouchPromise$1.resolve(true);
    }
  };
  Checkpointer.prototype.updateSource = function(checkpoint, session) {
    if (this.opts.writeSourceCheckpoint) {
      var self = this;
      if (this.readOnlySource) {
        return PouchPromise$1.resolve(true);
      }
      return updateCheckpoint(this.src, this.id, checkpoint, session, this.returnValue).catch(function(err) {
        if (isForbiddenError(err)) {
          self.readOnlySource = true;
          return true;
        }
        throw err;
      });
    } else {
      return PouchPromise$1.resolve(true);
    }
  };
  var comparisons = {
    "undefined": function(targetDoc, sourceDoc) {
      if (collate(targetDoc.last_seq, sourceDoc.last_seq) === 0) {
        return sourceDoc.last_seq;
      }
      return 0;
    },
    "1": function(targetDoc, sourceDoc) {
      return compareReplicationLogs(sourceDoc, targetDoc).last_seq;
    }
  };
  Checkpointer.prototype.getCheckpoint = function() {
    var self = this;
    return self.target.get(self.id).then(function(targetDoc) {
      if (self.readOnlySource) {
        return PouchPromise$1.resolve(targetDoc.last_seq);
      }
      return self.src.get(self.id).then(function(sourceDoc) {
        if (targetDoc.version !== sourceDoc.version) {
          return LOWEST_SEQ;
        }
        var version;
        if (targetDoc.version) {
          version = targetDoc.version.toString();
        } else {
          version = "undefined";
        }
        if (version in comparisons) {
          return comparisons[version](targetDoc, sourceDoc);
        }
        return LOWEST_SEQ;
      }, function(err) {
        if (err.status === 404 && targetDoc.last_seq) {
          return self.src.put({
            _id: self.id,
            last_seq: LOWEST_SEQ
          }).then(function() {
            return LOWEST_SEQ;
          }, function(err) {
            if (isForbiddenError(err)) {
              self.readOnlySource = true;
              return targetDoc.last_seq;
            }
            return LOWEST_SEQ;
          });
        }
        throw err;
      });
    }).catch(function(err) {
      if (err.status !== 404) {
        throw err;
      }
      return LOWEST_SEQ;
    });
  };
  function compareReplicationLogs(srcDoc, tgtDoc) {
    if (srcDoc.session_id === tgtDoc.session_id) {
      return {
        last_seq: srcDoc.last_seq,
        history: srcDoc.history
      };
    }
    return compareReplicationHistory(srcDoc.history, tgtDoc.history);
  }
  function compareReplicationHistory(sourceHistory, targetHistory) {
    var S = sourceHistory[0];
    var sourceRest = sourceHistory.slice(1);
    var T = targetHistory[0];
    var targetRest = targetHistory.slice(1);
    if (!S || targetHistory.length === 0) {
      return {
        last_seq: LOWEST_SEQ,
        history: []
      };
    }
    var sourceId = S.session_id;
    if (hasSessionId(sourceId, targetHistory)) {
      return {
        last_seq: S.last_seq,
        history: sourceHistory
      };
    }
    var targetId = T.session_id;
    if (hasSessionId(targetId, sourceRest)) {
      return {
        last_seq: T.last_seq,
        history: targetRest
      };
    }
    return compareReplicationHistory(sourceRest, targetRest);
  }
  function hasSessionId(sessionId, history) {
    var props = history[0];
    var rest = history.slice(1);
    if (!sessionId || history.length === 0) {
      return false;
    }
    if (sessionId === props.session_id) {
      return true;
    }
    return hasSessionId(sessionId, rest);
  }
  function isForbiddenError(err) {
    return typeof err.status === 'number' && Math.floor(err.status / 100) === 4;
  }
  var STARTING_BACK_OFF = 0;
  function backOff(opts, returnValue, error, callback) {
    if (opts.retry === false) {
      returnValue.emit('error', error);
      returnValue.removeAllListeners();
      return;
    }
    if (typeof opts.back_off_function !== 'function') {
      opts.back_off_function = defaultBackOff;
    }
    returnValue.emit('requestError', error);
    if (returnValue.state === 'active' || returnValue.state === 'pending') {
      returnValue.emit('paused', error);
      returnValue.state = 'stopped';
      var backOffSet = function backoffTimeSet() {
        opts.current_back_off = STARTING_BACK_OFF;
      };
      var removeBackOffSetter = function removeBackOffTimeSet() {
        returnValue.removeListener('active', backOffSet);
      };
      returnValue.once('paused', removeBackOffSetter);
      returnValue.once('active', backOffSet);
    }
    opts.current_back_off = opts.current_back_off || STARTING_BACK_OFF;
    opts.current_back_off = opts.back_off_function(opts.current_back_off);
    setTimeout(callback, opts.current_back_off);
  }
  function sortObjectPropertiesByKey(queryParams) {
    return Object.keys(queryParams).sort(collate).reduce(function(result, key) {
      result[key] = queryParams[key];
      return result;
    }, {});
  }
  function generateReplicationId(src, target, opts) {
    var docIds = opts.doc_ids ? opts.doc_ids.sort(collate) : '';
    var filterFun = opts.filter ? opts.filter.toString() : '';
    var queryParams = '';
    var filterViewName = '';
    var selector = '';
    if (opts.selector) {
      selector = JSON.stringify(opts.selector);
    }
    if (opts.filter && opts.query_params) {
      queryParams = JSON.stringify(sortObjectPropertiesByKey(opts.query_params));
    }
    if (opts.filter && opts.filter === '_view') {
      filterViewName = opts.view.toString();
    }
    return PouchPromise$1.all([src.id(), target.id()]).then(function(res) {
      var queryData = res[0] + res[1] + filterFun + filterViewName + queryParams + docIds + selector;
      return new PouchPromise$1(function(resolve) {
        binaryMd5(queryData, resolve);
      });
    }).then(function(md5sum) {
      md5sum = md5sum.replace(/\//g, '.').replace(/\+/g, '_');
      return '_local/' + md5sum;
    });
  }
  function replicate(src, target, opts, returnValue, result) {
    var batches = [];
    var currentBatch;
    var pendingBatch = {
      seq: 0,
      changes: [],
      docs: []
    };
    var writingCheckpoint = false;
    var changesCompleted = false;
    var replicationCompleted = false;
    var last_seq = 0;
    var continuous = opts.continuous || opts.live || false;
    var batch_size = opts.batch_size || 100;
    var batches_limit = opts.batches_limit || 10;
    var changesPending = false;
    var doc_ids = opts.doc_ids;
    var selector = opts.selector;
    var repId;
    var checkpointer;
    var changedDocs = [];
    var session = uuid();
    result = result || {
      ok: true,
      start_time: new Date(),
      docs_read: 0,
      docs_written: 0,
      doc_write_failures: 0,
      errors: []
    };
    var changesOpts = {};
    returnValue.ready(src, target);
    function initCheckpointer() {
      if (checkpointer) {
        return PouchPromise$1.resolve();
      }
      return generateReplicationId(src, target, opts).then(function(res$$1) {
        repId = res$$1;
        var checkpointOpts = {};
        if (opts.checkpoint === false) {
          checkpointOpts = {
            writeSourceCheckpoint: false,
            writeTargetCheckpoint: false
          };
        } else if (opts.checkpoint === 'source') {
          checkpointOpts = {
            writeSourceCheckpoint: true,
            writeTargetCheckpoint: false
          };
        } else if (opts.checkpoint === 'target') {
          checkpointOpts = {
            writeSourceCheckpoint: false,
            writeTargetCheckpoint: true
          };
        } else {
          checkpointOpts = {
            writeSourceCheckpoint: true,
            writeTargetCheckpoint: true
          };
        }
        checkpointer = new Checkpointer(src, target, repId, returnValue, checkpointOpts);
      });
    }
    function writeDocs() {
      changedDocs = [];
      if (currentBatch.docs.length === 0) {
        return;
      }
      var docs = currentBatch.docs;
      var bulkOpts = {timeout: opts.timeout};
      return target.bulkDocs({
        docs: docs,
        new_edits: false
      }, bulkOpts).then(function(res$$1) {
        if (returnValue.cancelled) {
          completeReplication();
          throw new Error('cancelled');
        }
        var errorsById = Object.create(null);
        res$$1.forEach(function(res$$1) {
          if (res$$1.error) {
            errorsById[res$$1.id] = res$$1;
          }
        });
        var errorsNo = Object.keys(errorsById).length;
        result.doc_write_failures += errorsNo;
        result.docs_written += docs.length - errorsNo;
        docs.forEach(function(doc) {
          var error = errorsById[doc._id];
          if (error) {
            result.errors.push(error);
            if (error.name === 'unauthorized' || error.name === 'forbidden') {
              returnValue.emit('denied', clone(error));
            } else {
              throw error;
            }
          } else {
            changedDocs.push(doc);
          }
        });
      }, function(err) {
        result.doc_write_failures += docs.length;
        throw err;
      });
    }
    function finishBatch() {
      if (currentBatch.error) {
        throw new Error('There was a problem getting docs.');
      }
      result.last_seq = last_seq = currentBatch.seq;
      var outResult = clone(result);
      if (changedDocs.length) {
        outResult.docs = changedDocs;
        returnValue.emit('change', outResult);
      }
      writingCheckpoint = true;
      return checkpointer.writeCheckpoint(currentBatch.seq, session).then(function() {
        writingCheckpoint = false;
        if (returnValue.cancelled) {
          completeReplication();
          throw new Error('cancelled');
        }
        currentBatch = undefined;
        getChanges();
      }).catch(function(err) {
        onCheckpointError(err);
        throw err;
      });
    }
    function getDiffs() {
      var diff = {};
      currentBatch.changes.forEach(function(change) {
        if (change.id === "_user/") {
          return;
        }
        diff[change.id] = change.changes.map(function(x) {
          return x.rev;
        });
      });
      return target.revsDiff(diff).then(function(diffs) {
        if (returnValue.cancelled) {
          completeReplication();
          throw new Error('cancelled');
        }
        currentBatch.diffs = diffs;
      });
    }
    function getBatchDocs() {
      return getDocs(src, target, currentBatch.diffs, returnValue).then(function(got) {
        currentBatch.error = !got.ok;
        got.docs.forEach(function(doc) {
          delete currentBatch.diffs[doc._id];
          result.docs_read++;
          currentBatch.docs.push(doc);
        });
      });
    }
    function startNextBatch() {
      if (returnValue.cancelled || currentBatch) {
        return;
      }
      if (batches.length === 0) {
        processPendingBatch(true);
        return;
      }
      currentBatch = batches.shift();
      getDiffs().then(getBatchDocs).then(writeDocs).then(finishBatch).then(startNextBatch).catch(function(err) {
        abortReplication('batch processing terminated with error', err);
      });
    }
    function processPendingBatch(immediate) {
      if (pendingBatch.changes.length === 0) {
        if (batches.length === 0 && !currentBatch) {
          if ((continuous && changesOpts.live) || changesCompleted) {
            returnValue.state = 'pending';
            returnValue.emit('paused');
          }
          if (changesCompleted) {
            completeReplication();
          }
        }
        return;
      }
      if (immediate || changesCompleted || pendingBatch.changes.length >= batch_size) {
        batches.push(pendingBatch);
        pendingBatch = {
          seq: 0,
          changes: [],
          docs: []
        };
        if (returnValue.state === 'pending' || returnValue.state === 'stopped') {
          returnValue.state = 'active';
          returnValue.emit('active');
        }
        startNextBatch();
      }
    }
    function abortReplication(reason, err) {
      if (replicationCompleted) {
        return;
      }
      if (!err.message) {
        err.message = reason;
      }
      result.ok = false;
      result.status = 'aborting';
      batches = [];
      pendingBatch = {
        seq: 0,
        changes: [],
        docs: []
      };
      completeReplication(err);
    }
    function completeReplication(fatalError) {
      if (replicationCompleted) {
        return;
      }
      if (returnValue.cancelled) {
        result.status = 'cancelled';
        if (writingCheckpoint) {
          return;
        }
      }
      result.status = result.status || 'complete';
      result.end_time = new Date();
      result.last_seq = last_seq;
      replicationCompleted = true;
      if (fatalError) {
        fatalError = createError(fatalError);
        fatalError.result = result;
        if (fatalError.name === 'unauthorized' || fatalError.name === 'forbidden') {
          returnValue.emit('error', fatalError);
          returnValue.removeAllListeners();
        } else {
          backOff(opts, returnValue, fatalError, function() {
            replicate(src, target, opts, returnValue);
          });
        }
      } else {
        returnValue.emit('complete', result);
        returnValue.removeAllListeners();
      }
    }
    function onChange(change) {
      if (returnValue.cancelled) {
        return completeReplication();
      }
      var filter = filterChange(opts)(change);
      if (!filter) {
        return;
      }
      pendingBatch.seq = change.seq;
      pendingBatch.changes.push(change);
      processPendingBatch(batches.length === 0 && changesOpts.live);
    }
    function onChangesComplete(changes) {
      changesPending = false;
      if (returnValue.cancelled) {
        return completeReplication();
      }
      if (changes.results.length > 0) {
        changesOpts.since = changes.last_seq;
        getChanges();
        processPendingBatch(true);
      } else {
        var complete = function() {
          if (continuous) {
            changesOpts.live = true;
            getChanges();
          } else {
            changesCompleted = true;
          }
          processPendingBatch(true);
        };
        if (!currentBatch && changes.results.length === 0) {
          writingCheckpoint = true;
          checkpointer.writeCheckpoint(changes.last_seq, session).then(function() {
            writingCheckpoint = false;
            result.last_seq = last_seq = changes.last_seq;
            complete();
          }).catch(onCheckpointError);
        } else {
          complete();
        }
      }
    }
    function onChangesError(err) {
      changesPending = false;
      if (returnValue.cancelled) {
        return completeReplication();
      }
      abortReplication('changes rejected', err);
    }
    function getChanges() {
      if (!(!changesPending && !changesCompleted && batches.length < batches_limit)) {
        return;
      }
      changesPending = true;
      function abortChanges() {
        changes.cancel();
      }
      function removeListener() {
        returnValue.removeListener('cancel', abortChanges);
      }
      if (returnValue._changes) {
        returnValue.removeListener('cancel', returnValue._abortChanges);
        returnValue._changes.cancel();
      }
      returnValue.once('cancel', abortChanges);
      var changes = src.changes(changesOpts).on('change', onChange);
      changes.then(removeListener, removeListener);
      changes.then(onChangesComplete).catch(onChangesError);
      if (opts.retry) {
        returnValue._changes = changes;
        returnValue._abortChanges = abortChanges;
      }
    }
    function startChanges() {
      initCheckpointer().then(function() {
        if (returnValue.cancelled) {
          completeReplication();
          return;
        }
        return checkpointer.getCheckpoint().then(function(checkpoint) {
          last_seq = checkpoint;
          changesOpts = {
            since: last_seq,
            limit: batch_size,
            batch_size: batch_size,
            style: 'all_docs',
            doc_ids: doc_ids,
            selector: selector,
            return_docs: true
          };
          if (opts.filter) {
            if (typeof opts.filter !== 'string') {
              changesOpts.include_docs = true;
            } else {
              changesOpts.filter = opts.filter;
            }
          }
          if ('heartbeat' in opts) {
            changesOpts.heartbeat = opts.heartbeat;
          }
          if ('timeout' in opts) {
            changesOpts.timeout = opts.timeout;
          }
          if (opts.query_params) {
            changesOpts.query_params = opts.query_params;
          }
          if (opts.view) {
            changesOpts.view = opts.view;
          }
          getChanges();
        });
      }).catch(function(err) {
        abortReplication('getCheckpoint rejected with ', err);
      });
    }
    function onCheckpointError(err) {
      writingCheckpoint = false;
      abortReplication('writeCheckpoint completed with error', err);
    }
    if (returnValue.cancelled) {
      completeReplication();
      return;
    }
    if (!returnValue._addedListeners) {
      returnValue.once('cancel', completeReplication);
      if (typeof opts.complete === 'function') {
        returnValue.once('error', opts.complete);
        returnValue.once('complete', function(result) {
          opts.complete(null, result);
        });
      }
      returnValue._addedListeners = true;
    }
    if (typeof opts.since === 'undefined') {
      startChanges();
    } else {
      initCheckpointer().then(function() {
        writingCheckpoint = true;
        return checkpointer.writeCheckpoint(opts.since, session);
      }).then(function() {
        writingCheckpoint = false;
        if (returnValue.cancelled) {
          completeReplication();
          return;
        }
        last_seq = opts.since;
        startChanges();
      }).catch(onCheckpointError);
    }
  }
  inherits(Replication, events.EventEmitter);
  function Replication() {
    events.EventEmitter.call(this);
    this.cancelled = false;
    this.state = 'pending';
    var self = this;
    var promise = new PouchPromise$1(function(fulfill, reject) {
      self.once('complete', fulfill);
      self.once('error', reject);
    });
    self.then = function(resolve, reject) {
      return promise.then(resolve, reject);
    };
    self.catch = function(reject) {
      return promise.catch(reject);
    };
    self.catch(function() {});
  }
  Replication.prototype.cancel = function() {
    this.cancelled = true;
    this.state = 'cancelled';
    this.emit('cancel');
  };
  Replication.prototype.ready = function(src, target) {
    var self = this;
    if (self._readyCalled) {
      return;
    }
    self._readyCalled = true;
    function onDestroy() {
      self.cancel();
    }
    src.once('destroyed', onDestroy);
    target.once('destroyed', onDestroy);
    function cleanup() {
      src.removeListener('destroyed', onDestroy);
      target.removeListener('destroyed', onDestroy);
    }
    self.once('complete', cleanup);
  };
  function toPouch(db, opts) {
    var PouchConstructor = opts.PouchConstructor;
    if (typeof db === 'string') {
      return new PouchConstructor(db, opts);
    } else {
      return db;
    }
  }
  function replicateWrapper(src, target, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (typeof opts === 'undefined') {
      opts = {};
    }
    if (opts.doc_ids && !Array.isArray(opts.doc_ids)) {
      throw createError(BAD_REQUEST, "`doc_ids` filter parameter is not a list.");
    }
    opts.complete = callback;
    opts = clone(opts);
    opts.continuous = opts.continuous || opts.live;
    opts.retry = ('retry' in opts) ? opts.retry : false;
    opts.PouchConstructor = opts.PouchConstructor || this;
    var replicateRet = new Replication(opts);
    var srcPouch = toPouch(src, opts);
    var targetPouch = toPouch(target, opts);
    replicate(srcPouch, targetPouch, opts, replicateRet);
    return replicateRet;
  }
  inherits(Sync, events.EventEmitter);
  function sync$1(src, target, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (typeof opts === 'undefined') {
      opts = {};
    }
    opts = clone(opts);
    opts.PouchConstructor = opts.PouchConstructor || this;
    src = toPouch(src, opts);
    target = toPouch(target, opts);
    return new Sync(src, target, opts, callback);
  }
  function Sync(src, target, opts, callback) {
    var self = this;
    this.canceled = false;
    var optsPush = opts.push ? $inject_Object_assign({}, opts, opts.push) : opts;
    var optsPull = opts.pull ? $inject_Object_assign({}, opts, opts.pull) : opts;
    this.push = replicateWrapper(src, target, optsPush);
    this.pull = replicateWrapper(target, src, optsPull);
    this.pushPaused = true;
    this.pullPaused = true;
    function pullChange(change) {
      self.emit('change', {
        direction: 'pull',
        change: change
      });
    }
    function pushChange(change) {
      self.emit('change', {
        direction: 'push',
        change: change
      });
    }
    function pushDenied(doc) {
      self.emit('denied', {
        direction: 'push',
        doc: doc
      });
    }
    function pullDenied(doc) {
      self.emit('denied', {
        direction: 'pull',
        doc: doc
      });
    }
    function pushPaused() {
      self.pushPaused = true;
      if (self.pullPaused) {
        self.emit('paused');
      }
    }
    function pullPaused() {
      self.pullPaused = true;
      if (self.pushPaused) {
        self.emit('paused');
      }
    }
    function pushActive() {
      self.pushPaused = false;
      if (self.pullPaused) {
        self.emit('active', {direction: 'push'});
      }
    }
    function pullActive() {
      self.pullPaused = false;
      if (self.pushPaused) {
        self.emit('active', {direction: 'pull'});
      }
    }
    var removed = {};
    function removeAll(type) {
      return function(event, func) {
        var isChange = event === 'change' && (func === pullChange || func === pushChange);
        var isDenied = event === 'denied' && (func === pullDenied || func === pushDenied);
        var isPaused = event === 'paused' && (func === pullPaused || func === pushPaused);
        var isActive = event === 'active' && (func === pullActive || func === pushActive);
        if (isChange || isDenied || isPaused || isActive) {
          if (!(event in removed)) {
            removed[event] = {};
          }
          removed[event][type] = true;
          if (Object.keys(removed[event]).length === 2) {
            self.removeAllListeners(event);
          }
        }
      };
    }
    if (opts.live) {
      this.push.on('complete', self.pull.cancel.bind(self.pull));
      this.pull.on('complete', self.push.cancel.bind(self.push));
    }
    function addOneListener(ee, event, listener) {
      if (ee.listeners(event).indexOf(listener) == -1) {
        ee.on(event, listener);
      }
    }
    this.on('newListener', function(event) {
      if (event === 'change') {
        addOneListener(self.pull, 'change', pullChange);
        addOneListener(self.push, 'change', pushChange);
      } else if (event === 'denied') {
        addOneListener(self.pull, 'denied', pullDenied);
        addOneListener(self.push, 'denied', pushDenied);
      } else if (event === 'active') {
        addOneListener(self.pull, 'active', pullActive);
        addOneListener(self.push, 'active', pushActive);
      } else if (event === 'paused') {
        addOneListener(self.pull, 'paused', pullPaused);
        addOneListener(self.push, 'paused', pushPaused);
      }
    });
    this.on('removeListener', function(event) {
      if (event === 'change') {
        self.pull.removeListener('change', pullChange);
        self.push.removeListener('change', pushChange);
      } else if (event === 'denied') {
        self.pull.removeListener('denied', pullDenied);
        self.push.removeListener('denied', pushDenied);
      } else if (event === 'active') {
        self.pull.removeListener('active', pullActive);
        self.push.removeListener('active', pushActive);
      } else if (event === 'paused') {
        self.pull.removeListener('paused', pullPaused);
        self.push.removeListener('paused', pushPaused);
      }
    });
    this.pull.on('removeListener', removeAll('pull'));
    this.push.on('removeListener', removeAll('push'));
    var promise = PouchPromise$1.all([this.push, this.pull]).then(function(resp) {
      var out = {
        push: resp[0],
        pull: resp[1]
      };
      self.emit('complete', out);
      if (callback) {
        callback(null, out);
      }
      self.removeAllListeners();
      return out;
    }, function(err) {
      self.cancel();
      if (callback) {
        callback(err);
      } else {
        self.emit('error', err);
      }
      self.removeAllListeners();
      if (callback) {
        throw err;
      }
    });
    this.then = function(success, err) {
      return promise.then(success, err);
    };
    this.catch = function(err) {
      return promise.catch(err);
    };
  }
  Sync.prototype.cancel = function() {
    if (!this.canceled) {
      this.canceled = true;
      this.push.cancel();
      this.pull.cancel();
    }
  };
  function replication(PouchDB) {
    PouchDB.replicate = replicateWrapper;
    PouchDB.sync = sync$1;
    Object.defineProperty(PouchDB.prototype, 'replicate', {get: function() {
        var self = this;
        return {
          from: function(other, opts, callback) {
            return self.constructor.replicate(other, self, opts, callback);
          },
          to: function(other, opts, callback) {
            return self.constructor.replicate(self, other, opts, callback);
          }
        };
      }});
    PouchDB.prototype.sync = function(dbName, opts, callback) {
      return this.constructor.sync(this, dbName, opts, callback);
    };
  }
  PouchDB$5.plugin(LevelPouch).plugin(HttpPouch$1).plugin(mapreduce).plugin(replication);
  module.exports = PouchDB$5;
})(require('buffer').Buffer, require('process'));
