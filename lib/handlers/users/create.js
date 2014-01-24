var middleware = require('../../middleware')
  ;
function handler (req, res, next) {
  var profile = { };
  res.send(200, res.profile);
  next( );
  return;
}
var endpoint = {
    path: '/users/:user/create'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, updateUser, endpoint.handler);
  }
  var userInfo = middleware.minUser(opts, server);
  var mandatory = middleware.mandatory(opts, server);
  endpoint.middleware = mandatory.concat(userInfo);
  function updateUser (req, res, next) {
    var profile = { };
    console.log("UPDATING PARAMS", req.params.user, req.params, req.body, req.files);
    var name = req.params.user;
    var update = req.params;

    server.updateUser(name, update, {save:false, create:true}, function (result) {
      // console.log('UPDATED user', arguments);
      res.profile = result;
      next( );

    });
  }
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

