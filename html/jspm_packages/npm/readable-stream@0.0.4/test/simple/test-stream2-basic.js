/* */ 
(function(Buffer, process) {
  var common = require('../common');
  var R = require('../../readable');
  var assert = require('assert');
  var util = require('util');
  var EE = require('events').EventEmitter;
  function TestReader(n) {
    R.apply(this);
    this._buffer = new Buffer(n || 100);
    this._buffer.fill('x');
    this._pos = 0;
    this._bufs = 10;
  }
  util.inherits(TestReader, R);
  TestReader.prototype.read = function(n) {
    var max = this._buffer.length - this._pos;
    n = n || max;
    n = Math.max(n, 0);
    var toRead = Math.min(n, max);
    if (toRead === 0) {
      setTimeout(function() {
        this._pos = 0;
        this._bufs -= 1;
        if (this._bufs <= 0) {
          if (!this.ended) {
            this.emit('end');
            this.ended = true;
          }
        } else {
          this.emit('readable');
        }
      }.bind(this), 10);
      return null;
    }
    var ret = this._buffer.slice(this._pos, this._pos + toRead);
    this._pos += toRead;
    return ret;
  };
  function TestWriter() {
    EE.apply(this);
    this.received = [];
    this.flush = false;
  }
  util.inherits(TestWriter, EE);
  TestWriter.prototype.write = function(c) {
    this.received.push(c.toString());
    this.emit('write', c);
    return true;
    this.flush = !this.flush;
    if (!this.flush)
      setTimeout(this.emit.bind(this, 'drain'), 10);
    return this.flush;
  };
  TestWriter.prototype.end = function(c) {
    if (c)
      this.write(c);
    this.emit('end', this.received);
  };
  var tests = [];
  function test(name, fn) {
    tests.push([name, fn]);
  }
  function run() {
    var next = tests.shift();
    if (!next)
      return console.error('ok');
    var name = next[0];
    var fn = next[1];
    console.log('# %s', name);
    fn({
      same: assert.deepEqual,
      equal: assert.equal,
      end: run
    });
  }
  process.nextTick(run);
  test('a most basic test', function(t) {
    var r = new TestReader(20);
    var reads = [];
    var expect = ['x', 'xx', 'xxx', 'xxxx', 'xxxxx', 'xxxxx', 'xxxxxxxx', 'xxxxxxxxx', 'xxx', 'xxxxxxxxxxxx', 'xxxxxxxx', 'xxxxxxxxxxxxxxx', 'xxxxx', 'xxxxxxxxxxxxxxxxxx', 'xx', 'xxxxxxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxxxxxx'];
    r.on('end', function() {
      t.same(reads, expect);
      t.end();
    });
    var readSize = 1;
    function flow() {
      var res;
      while (null !== (res = r.read(readSize++))) {
        reads.push(res.toString());
      }
      r.once('readable', flow);
    }
    flow();
  });
  test('pipe', function(t) {
    var r = new TestReader(5);
    var expect = ['xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx'];
    var w = new TestWriter;
    var flush = true;
    w.on('end', function(received) {
      t.same(received, expect);
      t.end();
    });
    r.pipe(w);
  });
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function(SPLIT) {
    test('unpipe', function(t) {
      var r = new TestReader(5);
      var expect = ['xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx'];
      expect = [expect.slice(0, SPLIT), expect.slice(SPLIT)];
      var w = [new TestWriter(), new TestWriter()];
      var writes = SPLIT;
      w[0].on('write', function() {
        if (--writes === 0) {
          r.unpipe();
          t.equal(r._readableState.pipes, null);
          w[0].end();
          r.pipe(w[1]);
          t.equal(r._readableState.pipes, w[1]);
        }
      });
      var ended = 0;
      var ended0 = false;
      var ended1 = false;
      w[0].on('end', function(results) {
        t.equal(ended0, false);
        ended0 = true;
        ended++;
        t.same(results, expect[0]);
      });
      w[1].on('end', function(results) {
        t.equal(ended1, false);
        ended1 = true;
        ended++;
        t.equal(ended, 2);
        t.same(results, expect[1]);
        t.end();
      });
      r.pipe(w[0]);
    });
  });
  test('multipipe', function(t) {
    var r = new TestReader(5);
    var w = [new TestWriter, new TestWriter];
    var expect = ['xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx'];
    var c = 2;
    w[0].on('end', function(received) {
      t.same(received, expect, 'first');
      if (--c === 0)
        t.end();
    });
    w[1].on('end', function(received) {
      t.same(received, expect, 'second');
      if (--c === 0)
        t.end();
    });
    r.pipe(w[0]);
    r.pipe(w[1]);
  });
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function(SPLIT) {
    test('multi-unpipe', function(t) {
      var r = new TestReader(5);
      var expect = ['xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx'];
      expect = [expect.slice(0, SPLIT), expect.slice(SPLIT)];
      var w = [new TestWriter(), new TestWriter(), new TestWriter()];
      var writes = SPLIT;
      w[0].on('write', function() {
        if (--writes === 0) {
          r.unpipe();
          w[0].end();
          r.pipe(w[1]);
        }
      });
      var ended = 0;
      w[0].on('end', function(results) {
        ended++;
        t.same(results, expect[0]);
      });
      w[1].on('end', function(results) {
        ended++;
        t.equal(ended, 2);
        t.same(results, expect[1]);
        t.end();
      });
      r.pipe(w[0]);
      r.pipe(w[2]);
    });
  });
})(require('buffer').Buffer, require('process'));
