var es = require('event-stream')
  , gitStream = require('../../../stream-git')
  , callbacks = require('./callbacks')
  ;

function saveDelta (profile, opts, next) {
  
  console.log('SAVE DELTA', profile);
  var config = opts;
  var message = opts.message;
  profile.repo.load('refs/heads/master', saveUpload);
  function saveUpload (err, ref, hash) {
    // console.log('on LOAD', config, err, ref, hash);
    // console.log('SAVING', profile.user);
    if (config.create && (err && err.code == 'ENOENT')) {
      err = null;
    }
    if (!err && (ref || config.create)) {
      // console.log('SAVING', profile.user);

      var incoming = {name: 'profile.json', content: JSON.stringify(profile.user)};
      var input = es.readArray([incoming]);
      console.log("COMMITTING", profile.user);
      var opts = callbacks(profile.user, profile.committer, message);
      // console.log("COMMITTING", opts);
      // opts.getAuthor(console.log);
      // opts.getCommitter(console.log);
      opts.parents = [hash];

      var git = gitStream(profile.repo, opts);
      es.pipeline(input, git, es.writeArray(finish));
      function finish (err, results) {

        var result = results.pop( );
        // console.log("XXX UPDATED PROFILE", err, profile.user, result);
        // result.url = req.profile.url;
        // profile.url = req.profile.url;
        profile.repo.setHead('master', function onMaster (err, master, hash) {
          // console.log('set to master', err, master);
          profile.repo.updateHead(result.head.commit, function onUpdated (err, update) {
            // console.log('updated master', 'err', err, 'update', update);
            profile.updated = result;
            // res.send(201, profile);
            return next(null, profile);
          });
        });
      };
    }
  };
}

function save (user, opts) {
  console.log('CREATE SAVE HOOK', user, opts);
  return iter;

  function iter (profile, next) {
    saveDelta(profile, opts, next);
  }
}
module.exports = save;
module.exports.saveDelta = saveDelta;

