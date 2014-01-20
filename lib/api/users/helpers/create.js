var es = require('event-stream')
  , fs = require('fs')
  , path = require('path')
  ;

function create (profile, opts) {
  console.log('CREATE USER HOOK', profile, opts);
  var directories = { };
  directories.user = path.dirname(opts.repo_path);
  directories.repo = opts.repo_path;
  return iter;
  function start (profile, fn) {
    return finish;
    function finish (err, results) {
      var make = results.pop( );
      return fn(null, profile);
    }
  }
  function User (make, fn) {
    fs.mkdir(make.user, dir);
    function dir (err) {
      fn(null, make);
    }
  }
  function Repo (make, fn) {
    fs.mkdir(make.repo, dir);
    function dir (err) {
      fn(null, make);
    }
  }
  function iter (profile, next) {
    console.log('creating repo?', profile, opts, arguments);
    start.callback = next;
    es.pipeline(es.readArray([directories])
      , es.map(User), es.map(Repo)
      , es.writeArray(start(profile, next)));
  }
}
module.exports = create;
