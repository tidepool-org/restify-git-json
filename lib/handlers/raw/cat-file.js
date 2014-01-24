

var middleware = require('../../middleware')
  ;
var path = require('path');

/*
function findKeyPath (repo, hint, cb) {
  repo.load(hint, function (err, body) {
    console.log('FINDKEY', err, body);
    if (err) {
      return findKeyPath(repo, path.dirname(hint), cb);
    }
    body.ref = hint;
    return cb(err, body);

  });
}
*/

// TODO: better error handling
function handler (req, res, next) {
  var ref = 'raw';
  var pattern = /raw\/(.*)/;
  var hashish = req.path( ).match(pattern);
  if (hashish && hashish.length > 1) ref = hashish[0].replace('raw/', '');
  var result = {params: req.params, input: ref };
  // findKeyPath(req.repo, ref, function (err, body) {
  req.findKeyPath(ref, function (err, body) {
    result.body = body;
    if (body.type == 'commit' && body.body.tree) {
      req.repo.loadAs('tree', body.body.tree, function (err, tree) {
        tree.err = err;
        result.tree = tree;
        var name = ref.split(body.ref + '/').pop( );
        console.log('name', name, tree, tree[name]);
        if (tree[name] && tree[name].hash) {
          req.repo.loadAs('blob', tree[name].hash, function (err, blob) {
            // blob.err = err;
            result.blob = blob.toString( );
            res.setHeader('content-type', 'text/plain');
            res.send(200, blob.toString( ));
          });
        }

      });
    }
    result.err = err;
  });
  next( );
}

var endpoint = {
    path: '/repos/:owner/:repo/raw/(.*)'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = middleware.all(opts, server);
  endpoint.middleware.push(middleware.extras.gitFindKeyPath(opts, server));
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

