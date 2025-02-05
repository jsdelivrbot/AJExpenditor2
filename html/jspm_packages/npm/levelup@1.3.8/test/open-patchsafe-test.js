/* */ 
var levelup = require('../lib/levelup'),
    common = require('./common'),
    assert = require('referee').assert,
    refute = require('referee').refute,
    buster = require('bustermove');
function test(fun) {
  return function(done) {
    var location = common.nextLocation(),
        db = levelup(location, {
          createIfMissing: true,
          errorIfExists: true,
          valueEncoding: 'utf8'
        });
    this.closeableDatabases.push(db);
    this.cleanupDirs.push(location);
    assert.isObject(db);
    assert.equals(db.location, location);
    fun(db, done);
    refute(db.isOpen());
    refute(db.isClosed());
  };
}
buster.testCase('Deferred open() is patch-safe', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,
  'put() on pre-opened database': test(function(db, done) {
    var put = db.put,
        called = 0;
    db.put = function() {
      called++;
      return put.apply(this, arguments);
    };
    db.put('key', 'VALUE', function() {
      assert.equals(called, 1);
      done();
    });
  }),
  'del() on pre-opened database': test(function(db, done) {
    var del = db.del,
        called = 0;
    db.del = function() {
      called++;
      return del.apply(this, arguments);
    };
    db.del('key', function() {
      assert.equals(called, 1);
      done();
    });
  }),
  'batch() on pre-opened database': test(function(db, done) {
    var batch = db.batch,
        called = 0;
    db.batch = function() {
      called++;
      return batch.apply(this, arguments);
    };
    db.batch([{
      key: 'key',
      value: 'v',
      type: 'put'
    }, {
      key: 'key2',
      value: 'v2',
      type: 'put'
    }], function() {
      assert.equals(called, 1);
      done();
    });
  })
});
