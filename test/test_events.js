
describe("events module", function ( ) {

  it("should be required", function (done) {
    var events = require('../lib/events');
    events.should.be.ok;
    events.call.should.be.ok;
    done( );
  });

});
describe("events module interface", function ( ) {
  it("should an init", function (done) {
    var events = require('../lib/events');
    var ev = events( );
    ev.should.be.ok
    ev.process.should.be.ok
    ev.stream.should.be.ok
    ev.stream.write.should.be.ok
    ev.on.should.be.ok
    done( );
  });
});

describe("events module interface", function ( ) {
  var events = require('../lib/events');
  var ev = events( );
  it("should respond to events with listeners", function (done) {
    ev.on('user', function (hook, next) {
      console.log('every user request 2', hook.value( ));
      hook.should.be.ok;
      hook.map.call.should.be.ok;
      hook.map(function (data, N) {
        data.should.be.ok;
        data.name.should.be.ok;
        data.args.should.be.empty;
        console.log(data);
        data.profile = 'http://logins/' + data.name.toLowerCase( );
        N(null, data);
      });
      return next( );
    });
    /*
    */
    ev.user('another', function fetch (value) {
      value.op.should.be.equal('user');
      value.args.should.be.empty;
      value.name.should.be.equal('another');
      value.profile.should.be.equal('http://logins/another');
      done( );
    });
  });
  it("process hooks should finish without listeners", function (done) {
    var hook = ev.process('fake', 'beep', finish);
    function finish (results) {
      results.should.be.ok;
      results.op.should.equal('fake');
      results.args[0].should.equal('beep');
      done( );
      
    }
  });
  describe("hooks are streams", function ( ) {
    var es = require('event-stream');
    var should = require('should');
    it("process hooks should finish without listeners", function (done) {
      var hook = ev.process('fake', 'beep', inspect);
      es.pipeline(hook.stream, es.writeArray(function finish (err, results) {
        should.not.exist(err);
        results.should.be.ok;
        var result = results.pop( );
        result.op.should.equal('fake');
        result.args[0].should.equal('beep');
        done( );
      }));
      function inspect (result) {
        result.should.be.ok;
        result.op.should.equal('fake');
        result.args[0].should.equal('beep');
      }
    });
  });
});
