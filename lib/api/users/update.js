
var helpers = require('./helpers');

function register (opts, server) {
  function prime (user, next) {
    server.fetchUser(user, next);
  }
  function updateUser (user, update, config, done) {

    config.name = user;
    // console.log("UPDATE PROFILE", user, update);
    var hook = server.events.process('update.profile', user, update, done);
    hook.opts = config;
    hook.inject(server.events);
  }
  server.updateUser = updateUser;
  server.events.on('update.profile', function onProfile (hook, next) {
    var profile = { };
    hook.map(function each (data, fetch) {
      console.log('default update profile subscription data', data, arguments);
      var update = data.args.pop( );
      profile = data.args.pop( );
      if (hook.opts && hook.opts.create) {
        helpers.init(update, hook.opts, begin);
      } else {
        prime(profile, begin);
      }
      function begin (profile) {
        var args = Array.prototype.slice.apply(arguments);
        profile = args.pop( );
        profile = helpers.applyDelta(profile, update);
        fetch(null, profile);
      }
    });
    if (hook.opts && hook.opts.save && hook.opts.message) {
      profile.commitMessage = hook.opts.message;
      if (hook.opts.create) {
        hook.map(helpers.create(profile, hook.opts));
        hook.map(helpers.findRepo);
      }
      hook.map(helpers.save(profile, hook.opts));
    }

    next( );
  });
}
register.registered = false;

function configure (opts, server) {
  if (register.registered) { return; }
  if (opts.updateUser) {
    server.updateUser = opts.updateUser;
  } else {
    register(opts, server);
  }
  register.registered = true;

}
module.exports = configure;
module.exports.register = register;
