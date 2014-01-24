
var middleware = require('../../middleware')
  ;

function handler (req, res, next) {
  var hash = req.params.sha;
  console.log('hash', hash, req.params, req);
  req.repo.loadAs('tree', hash, function (err, tree) {
    console.log('FOUND COMMIT', tree);
    Object.keys(tree).forEach(function (blob) {
      var leaf = tree[blob];
      var inspect = req.urlize(['/repos', req.params.owner, req.params.repo, 'git', 'blobs', leaf.hash ].join('/'));
      leaf.url = inspect;
    });
    tree.type = 'tree';
    res.send(200, {err: err, body: tree, url: req.urlize( )});

  });
}

var endpoint = {
    path: '/repos/:owner/:repo/git/trees/:sha'
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

