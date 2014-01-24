var applyDelta = require('./delta')
  , callbacks = require('./callbacks')
  , es = require('event-stream')
  ;

function init (update, opts, fn) {
  if (!fn) { fn = opts; opts = { } };
  console.log("CREATE NEW PROFILE FROM", update, "OPTS", opts);
  var user = (update.user && update.user.name) ? update.user : update;
  if (opts.name) {
    update.handle = opts.name;
    user.handle = opts.name;
  }
  var profile = { };
  if (update.user && !update.user.name) {
    update.handle = update.user;
    profile.name = update.user;
    delete update.user;
  }
  profile.user = user;
  profile.handle = user.handle;
  profile.name = update.handle;
  profile.secret = user.secret;
  profile = applyDelta(profile, update);
  var info = callbacks(profile);
  var inputs = es.readArray(['author', 'committer']);
  function attrs (prop, next) {
    var getter;
    switch (prop) {
      case 'committer':
        getter = info.getCommitter;
        break;
      case 'author':
        getter = info.getAuthor;
        break;
      default: return next(null); break;
    }
    getter(set);
    function set (value) {
      profile[prop] = value;
      next(null);
    }
  }
  function done (err, results) {
    fn(err, profile);
  }
  es.pipeline(inputs, es.map(attrs), es.writeArray(done));
  return profile;
}
module.exports = init;
