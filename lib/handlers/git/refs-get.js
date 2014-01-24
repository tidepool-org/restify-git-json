
var middleware = require('../../middleware')
  ;

function handler (req, res, next) {
  console.log('REPO', req.repo);
  // console.log("URL HINT", req.urlize('./../commits'), req.headers.host, server.url, req.url, req.path( ), req.href( ));
  req.repo.db.keys('refs/', console.log);
  req.repo.listRefs('refs/',  function (err, refs) {
    console.log("REFS", err, 'REFS', refs);
    if (err) {
      console.log("ERROR", err, refs);
      res.send(502, err);
      return;
    }
    var keys = Object.keys(refs);
    console.log('keys', keys);
    // TODO: redo all URL handling.
    // TODO: create middleware, takes config creates function urlize
    // refs.url = server.url + path.join(req.path( ));
    refs.url = req.urlize( );
    var results = [ ];
    keys.forEach(function (key) {
      var item = refs[key];
      console.log('each', key, item);
      var r = {
        ref: key,
        sha: item,
        // url: server.url + path.join('/repos', req.params.owner, req.params.repo, 'git', key)
        url: req.urlize('../' + key)
      };
      results.push(r);
      // item.url  = path.join(server.url, item.type + 's', item.body.tree);
    });
    res.send(200, {err: err, body: results, url: req.urlize( )});

  });
}

var endpoint = {
    path: '/repos/:owner/:repo/git/refs'
  , method: 'get'
  , handler: handler
};
// foo(opts) - > { path, middleware, method, version, handler(req, res, next), mount(server) }
// server.get('/repos/:owner/:repo/git/refs', MIDDLE.all(opts, server), function (req, res, next) {
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = middleware.all(opts, server);
  endpoint.mount = mount;
   
  return endpoint;
};
module.exports.endpoint = endpoint;

