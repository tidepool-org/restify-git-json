
var middleware = require('../../middleware')
  ;

function handler (req, res, next) {
  var hash = req.params.sha;
  req.repo.loadAs('text', hash, function (err, blob) {
    console.log('blob', blob);
    var b = blob;
    var o = {err: err, content: b, size: blob.length, type: 'blob', encoding: 'utf-8' };
    res.send(o);
  });
}

var endpoint = {
    path: '/repos/:owner/:repo/git/blobs/:sha'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = middleware.all(opts, server)
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

