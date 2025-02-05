/* */ 
(function(process) {
  var levelup = require('../lib/levelup'),
      common = require('./common'),
      SlowStream = require('slow-stream'),
      delayed = require('delayed'),
      rimraf = require('rimraf'),
      async = require('async'),
      msgpack = require('msgpack-js'),
      assert = require('referee').assert,
      refute = require('referee').refute,
      buster = require('bustermove'),
      bigBlob = Array.apply(null, Array(1024 * 100)).map(function() {
        return 'aaaaaaaaaa';
      }).join('');
  buster.testCase('ReadStream', {
    'setUp': common.readStreamSetUp,
    'tearDown': common.commonTearDown,
    'test simple ReadStream': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream();
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
        }.bind(this));
      }.bind(this));
    },
    'test pausing': function(done) {
      var calls = 0,
          rs,
          pauseVerify = function() {
            assert.equals(calls, 5, 'stream should still be paused');
            rs.resume();
            pauseVerify.called = true;
          },
          onData = function() {
            if (++calls == 5) {
              rs.pause();
              setTimeout(pauseVerify, 50);
            }
          },
          verify = function() {
            assert.equals(calls, this.sourceData.length, 'onData was used in test');
            assert(pauseVerify.called, 'pauseVerify was used in test');
            this.verify(rs, done);
          }.bind(this);
      this.dataSpy = this.spy(onData);
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          rs = db.createReadStream();
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('end', verify.bind(this));
        }.bind(this));
      }.bind(this));
    },
    'test destroy() immediately': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream();
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', function() {
            assert.equals(this.dataSpy.callCount, 0, '"data" event was not fired');
            assert.equals(this.endSpy.callCount, 0, '"end" event was not fired');
            done();
          }.bind(this));
          rs.destroy();
        }.bind(this));
      }.bind(this));
    },
    'test destroy() after close': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream();
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', function() {
            rs.destroy();
            done();
          }.bind(this));
        }.bind(this));
      }.bind(this));
    },
    'test destroy() after closing db': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          db.close(function(err) {
            var rs = db.createReadStream();
            rs.destroy();
            done();
          }.bind(this));
        }.bind(this));
      }.bind(this));
    },
    'test destroy() twice': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream();
          rs.on('data', function() {
            rs.destroy();
            rs.destroy();
            done();
          });
        }.bind(this));
      }.bind(this));
    },
    'test destroy() half way through': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream(),
              endSpy = this.spy(),
              calls = 0;
          this.dataSpy = this.spy(function() {
            if (++calls == 5)
              rs.destroy();
          });
          rs.on('data', this.dataSpy);
          rs.on('end', endSpy);
          rs.on('close', function() {
            assert.equals(this.dataSpy.callCount, 5, 'ReadStream emitted correct number of "data" events (5)');
            this.sourceData.slice(0, 5).forEach(function(d, i) {
              var call = this.dataSpy.getCall(i);
              assert(call);
              if (call) {
                assert.equals(call.args.length, 1, 'ReadStream "data" event #' + i + ' fired with 1 argument');
                refute.isNull(call.args[0].key, 'ReadStream "data" event #' + i + ' argument has "key" property');
                refute.isNull(call.args[0].value, 'ReadStream "data" event #' + i + ' argument has "value" property');
                assert.equals(call.args[0].key, d.key, 'ReadStream "data" event #' + i + ' argument has correct "key"');
                assert.equals(+call.args[0].value, +d.value, 'ReadStream "data" event #' + i + ' argument has correct "value"');
              }
            }.bind(this));
            done();
          }.bind(this));
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "reverse=true"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({reverse: true});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData.reverse();
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "start"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({start: '50'});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(50);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "start" and "reverse=true"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({
            start: '50',
            reverse: true
          });
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData.reverse();
          this.sourceData = this.sourceData.slice(49);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "start" being mid-way key (float)': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({start: '49.5'});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(50);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "start" being mid-way key (float) and "reverse=true"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({
            start: '49.5',
            reverse: true
          });
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData.reverse();
          this.sourceData = this.sourceData.slice(50);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "start" being mid-way key (string)': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({start: '499999'});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(50);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "end"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({end: '50'});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(0, 51);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "end" being mid-way key (float)': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({end: '50.5'});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(0, 51);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "end" being mid-way key (string)': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({end: '50555555'});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(0, 51);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "end" being mid-way key (float) and "reverse=true"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({
            end: '50.5',
            reverse: true
          });
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData.reverse();
          this.sourceData = this.sourceData.slice(0, 49);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with both "start" and "end"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({
            start: 30,
            end: 70
          });
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(30, 71);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with both "start" and "end" and "reverse=true"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({
            start: 70,
            end: 30,
            reverse: true
          });
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData.reverse();
          this.sourceData = this.sourceData.slice(29, 70);
        }.bind(this));
      }.bind(this));
    },
    'test hex encoding': function(done) {
      var options = {
        createIfMissing: true,
        errorIfExists: true,
        keyEncoding: 'utf8',
        valueEncoding: 'hex'
      },
          data = [{
            type: 'put',
            key: 'ab',
            value: 'abcdef0123456789'
          }];
      this.openTestDatabase({}, function(db) {
        db.batch(data.slice(), options, function(err) {
          refute(err);
          var rs = db.createReadStream(options);
          rs.on('data', function(data) {
            assert.equals(data.value, 'abcdef0123456789');
          });
          rs.on('end', this.endSpy);
          rs.on('close', done);
        }.bind(this));
      }.bind(this));
    },
    'test json encoding': function(done) {
      var options = {
        createIfMissing: true,
        errorIfExists: true,
        keyEncoding: 'utf8',
        valueEncoding: 'json'
      },
          data = [{
            type: 'put',
            key: 'aa',
            value: {
              a: 'complex',
              obj: 100
            }
          }, {
            type: 'put',
            key: 'ab',
            value: {
              b: 'foo',
              bar: [1, 2, 3]
            }
          }, {
            type: 'put',
            key: 'ac',
            value: {
              c: 'w00t',
              d: {
                e: [0, 10, 20, 30],
                f: 1,
                g: 'wow'
              }
            }
          }, {
            type: 'put',
            key: 'ba',
            value: {
              a: 'complex',
              obj: 100
            }
          }, {
            type: 'put',
            key: 'bb',
            value: {
              b: 'foo',
              bar: [1, 2, 3]
            }
          }, {
            type: 'put',
            key: 'bc',
            value: {
              c: 'w00t',
              d: {
                e: [0, 10, 20, 30],
                f: 1,
                g: 'wow'
              }
            }
          }, {
            type: 'put',
            key: 'ca',
            value: {
              a: 'complex',
              obj: 100
            }
          }, {
            type: 'put',
            key: 'cb',
            value: {
              b: 'foo',
              bar: [1, 2, 3]
            }
          }, {
            type: 'put',
            key: 'cc',
            value: {
              c: 'w00t',
              d: {
                e: [0, 10, 20, 30],
                f: 1,
                g: 'wow'
              }
            }
          }];
      this.openTestDatabase(options, function(db) {
        db.batch(data.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream();
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done, data));
        }.bind(this));
      }.bind(this));
    },
    'test injectable encoding': function(done) {
      var options = {
        createIfMissing: true,
        errorIfExists: true,
        keyEncoding: 'utf8',
        valueEncoding: {
          decode: msgpack.decode,
          encode: msgpack.encode,
          buffer: true
        }
      },
          data = [{
            type: 'put',
            key: 'aa',
            value: {
              a: 'complex',
              obj: 100
            }
          }, {
            type: 'put',
            key: 'ab',
            value: {
              b: 'foo',
              bar: [1, 2, 3]
            }
          }, {
            type: 'put',
            key: 'ac',
            value: {
              c: 'w00t',
              d: {
                e: [0, 10, 20, 30],
                f: 1,
                g: 'wow'
              }
            }
          }, {
            type: 'put',
            key: 'ba',
            value: {
              a: 'complex',
              obj: 100
            }
          }, {
            type: 'put',
            key: 'bb',
            value: {
              b: 'foo',
              bar: [1, 2, 3]
            }
          }, {
            type: 'put',
            key: 'bc',
            value: {
              c: 'w00t',
              d: {
                e: [0, 10, 20, 30],
                f: 1,
                g: 'wow'
              }
            }
          }, {
            type: 'put',
            key: 'ca',
            value: {
              a: 'complex',
              obj: 100
            }
          }, {
            type: 'put',
            key: 'cb',
            value: {
              b: 'foo',
              bar: [1, 2, 3]
            }
          }, {
            type: 'put',
            key: 'cc',
            value: {
              c: 'w00t',
              d: {
                e: [0, 10, 20, 30],
                f: 1,
                g: 'wow'
              }
            }
          }];
      this.openTestDatabase(options, function(db) {
        db.batch(data.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream();
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done, data));
        }.bind(this));
      }.bind(this));
    },
    'test readStream() "reverse=true" not sticky (issue #6)': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({reverse: true});
          rs.on('close', function() {
            var rs = db.createReadStream();
            rs.on('data', this.dataSpy);
            rs.on('end', this.endSpy);
            rs.on('close', this.verify.bind(this, rs, done));
          }.bind(this));
          rs.resume();
        }.bind(this));
      }.bind(this));
    },
    'test ReadStream, start=0': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({start: 0});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
        }.bind(this));
      }.bind(this));
    },
    'test ReadStream, end=0': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({end: 0});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = [];
        }.bind(this));
      }.bind(this));
    },
    'test ReadStream without db ref doesn\'t get GCed': function(done) {
      var dataSpy1 = this.spy(),
          dataSpy2 = this.spy(),
          location1 = common.nextLocation(),
          location2 = common.nextLocation(),
          sourceData = this.sourceData,
          verify = function() {
            assert(dataSpy1.callCount, sourceData.length);
            assert(dataSpy2.callCount, sourceData.length);
            async.parallel([rimraf.bind(null, location1), rimraf.bind(null, location2)], done);
          },
          execute = function(d, callback) {
            d.readStream.pipe(new SlowStream({maxWriteInterval: 5})).on('data', d.spy).on('close', delayed.delayed(callback, 0.05));
          },
          open = function(reopen, location, callback) {
            levelup(location, {
              createIfMissing: !reopen,
              errorIfExists: !reopen
            }, callback);
          },
          write = function(db, callback) {
            db.batch(sourceData.slice(), callback);
          },
          close = function(db, callback) {
            db.close(callback);
          },
          setup = function(callback) {
            async.map([location1, location2], open.bind(null, false), function(err, dbs) {
              refute(err);
              if (err)
                return;
              async.map(dbs, write, function(err) {
                refute(err);
                if (err)
                  return;
                async.forEach(dbs, close, callback);
              });
            });
          },
          reopen = function() {
            async.map([location1, location2], open.bind(null, true), function(err, dbs) {
              refute(err);
              if (err)
                return;
              async.forEach([{
                readStream: dbs[0].createReadStream(),
                spy: dataSpy1
              }, {
                readStream: dbs[1].createReadStream(),
                spy: dataSpy2
              }], execute, verify);
            });
          };
      setup(delayed.delayed(reopen, 0.05));
    },
    'test ReadStream on pre-opened db': function(done) {
      var execute = function(db) {
        refute(db.isOpen());
        refute(db.isClosed());
        var rs = db.createReadStream();
        rs.on('data', this.dataSpy);
        rs.on('end', this.endSpy);
        rs.on('close', this.verify.bind(this, rs, done));
      }.bind(this),
          setup = function(db) {
            db.batch(this.sourceData.slice(), function(err) {
              refute(err);
              db.close(function(err) {
                refute(err);
                var db2 = levelup(db.location, {
                  createIfMissing: false,
                  errorIfExists: false,
                  valueEncoding: 'utf8'
                });
                execute(db2);
              });
            }.bind(this));
          }.bind(this);
      this.openTestDatabase(setup);
    },
    'test readStream() with "limit"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({limit: 20});
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(0, 20);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "start" and "limit"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({
            start: '20',
            limit: 20
          });
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(20, 40);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "end" after "limit"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({
            end: '50',
            limit: 20
          });
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(0, 20);
        }.bind(this));
      }.bind(this));
    },
    'test readStream() with "end" before "limit"': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream({
            end: '30',
            limit: 50
          });
          rs.on('data', this.dataSpy);
          rs.on('end', this.endSpy);
          rs.on('close', this.verify.bind(this, rs, done));
          this.sourceData = this.sourceData.slice(0, 31);
        }.bind(this));
      }.bind(this));
    },
    'test iterator next/end race condition': function(done) {
      var data = [],
          i = 5,
          v;
      while (i--) {
        v = bigBlob + i;
        data.push({
          type: 'put',
          key: v,
          value: v
        });
      }
      this.openTestDatabase(function(db) {
        db.batch(data, function(err) {
          refute(!!err);
          var rs = db.createReadStream().on('close', done);
          rs.once('data', rs.destroy.bind(rs));
        }.bind(this));
      }.bind(this));
    },
    'test can only end once': function(done) {
      this.openTestDatabase(function(db) {
        db.batch(this.sourceData.slice(), function(err) {
          refute(err);
          var rs = db.createReadStream().on('close', done);
          process.nextTick(function() {
            rs.destroy();
          });
        }.bind(this));
      }.bind(this));
    }
  });
})(require('process'));
