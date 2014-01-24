var middleware = require('../../middleware')
  ;

function handler (req, res, next) {
  res.send(201, res.profile);
  next( );
  return;
}

var endpoint = {
    path: '/users/:user'
  , method: 'post'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, updateUser, endpoint.handler);
  }
  var userInfo = middleware.userInfo(opts, server);
  var mandatory = middleware.mandatory(opts, server);
  var uploads = middleware.builtin.uploads(opts, server);
  function updateUser (req, res, next) {
    var updates = (req.params.user && req.params.user.name && req.params.user.handle)
                ? req.params
                : ((req.body && req.body.user) ? req.body
                : req.body)
                ;
    if (false && updates.user) {
      updates.user = updates.user;
    }
    var message = req.params.message || (req.body.body && req.body.message)
                ? req.body.message : "updated profile";
    var config = { save: true, message: message };
    server.updateUser(req.params.user, updates, config, function (result) {
      res.profile = result;
      next( );

    });
  }
  endpoint.middleware = mandatory.concat(userInfo).concat(uploads);
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

