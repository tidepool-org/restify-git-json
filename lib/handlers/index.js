
module.exports = function configure (opts, server) {
  var endpoint = { };
  // handlers/<...>/foo
  // foo(opts) - > { path, middleware, method, version, handler(req, res, next), mount(server) }

  endpoint.modules = [
    './server/status', './server/repo-info', './server/owner-info'
  , './upload/dummy'
  // TODO: GET|POST /repos/:owner/create - preview, create new user
  // TODO: GET|POST /repos/:owner/:repo/create - preview, create new namespace per user
  , './upload/branch'
  // TODO: GET|POST /repos/:owner/:repo/raw/:ref/:path - raw version of file
  , './git/refs-get'
  // TODO: POST versions of these
  , './git/get-one-ref'
  , './git/get-commit'
  // TODO: POST
  , './git/get-tree'
  // TODO: POST
  , './git/get-blob'
  // TODO: POST
  , './raw/cat-file'
  , './help'
  , './users/get'
  , './users/create'
  , './users/create-post'
  , './users/update'
  ];
  endpoint.all = [ ];

  function Handler (path) { return require(path)(opts, server); }
  function make (mod) { endpoint.all.push(Handler(mod)); }
  endpoint.modules.forEach(make);

  function mount (server) {
    function install (handler) {
      handler.mount(server);
    }
    endpoint.all.forEach(install);
    server.endpoints = endpoint.all;
  }

  endpoint.mount = mount;

  return endpoint;
};

