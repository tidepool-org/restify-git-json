
var config = {base: './out/'};
var middleware = require('../lib/middleware/')
middleware(config);
describe('users api', function ( ) {
  var events = require('../lib/events');
  var server = {events: events(config)};
  var userFetch = require('../lib/api/users/fetch');
  var userUpdate = require('../lib/api/users/update');
  it('initialize api ok', function (done) {
    userUpdate.register(config, server);
    userFetch.register(config, server);
    server.fetchUser.should.be.ok;
    server.updateUser.should.be.ok;
    done( );
  });
  
  var suggest = {
    'name': 'Foo Bar'
  , 'email': 'foo@tidepool.io'
  };
  it('should create users', function (done) {
    var name = 'foobar';
    var commit = {
          create: true, save: true
        , repo_path: './out/' + name
        , message: 'my commit message'};
    server.updateUser(name, suggest, commit, proof);
    function proof (profile) {
      profile.user.should.be.ok;
      profile.user.name.should.equal(suggest.name);
      profile.user.email.should.equal(suggest.email);
      profile.name.should.equal(name);
      profile.handle.should.equal(name);
      done( );
    }
  });
  it('should fetch user', function (done) {
    var name = 'foobar';
    server.fetchUser(name, proof);
    function proof (profile) {
      profile.user.should.be.ok;
      profile.user.name.should.equal(suggest.name);
      done( );
    }
  });
  it('should update user', function (done) {
    var name = 'foobar';
    var change = JSON.parse(JSON.stringify(suggest));
    change.name = 'Any Valid Name';
    var updates = {name: change.name};
    updates.user = JSON.parse(JSON.stringify(change));
    var user = JSON.parse(JSON.stringify(change));
    updates.user = user;
    var commit = {
          save: true
        , repo_path: './out/' + name
        , message: 'my update'};
    server.updateUser(name, updates, commit, proof);
    function proof (profile) {
      console.log('updated profile', profile);
      profile.user.should.be.ok;
      profile.user.name.should.equal(change.name);
      done( );
    }
  });
});

