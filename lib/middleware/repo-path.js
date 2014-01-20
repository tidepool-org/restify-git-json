var path = require('path');
var BASE = '';
function get (user, repo) {
  var args = Array.prototype.slice.apply(arguments);
  args.unshift(BASE);
  console.log('construct path!', args);
  return path.join.apply(path, args);
}

module.exports = function getPath (opts) {
  BASE = opts.base;
  function middle (req, res, next) {
    req.repo_path = get(req.params.owner, req.repo_name);
    next( );
  };
  middle.base = BASE;
  middle.get = get;
  return middle;
}
module.exports.get = get;
