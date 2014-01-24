var middleware = require('../../middleware')
  , es = require('event-stream')
  , fs = require('fs')
  , path = require('path')
  , gitStream = require('../../stream-git')
  ;

function handler (req, res, next) {
  if (res.profile) {
    res.send(201, res.profile);
    return next( );
  }
  res.send(405, {err: '???', old: req.profile, proposed: res.profile, url: req.profile.url});
  next( );
  return;
}

var endpoint = {
    path: '/users/:user/create'
  , method: 'post'
  , handler: handler
};
function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}
module.exports = function configure (opts, server) {
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, createUser, endpoint.handler);
  }
  var userInfo = middleware.minUser(opts, server);
  var mandatory = middleware.mandatory(opts, server);
  var uploads = middleware.builtin.uploads(opts, server);
  endpoint.middleware = mandatory.concat(userInfo).concat(uploads);
  function paramHelper (params) {
    // (params.user && req.params.user.name && req.params.user.handle)
    var profile;
    if (params.email && params.name) {
      var user = { user: clone(params) };
      profile = clone(params);
      profile.name = params.user;
      return profile;
    }
    return false;
  }
  function createUser (req, res, next) {
    if (req.profile && req.profile.repo && req.profile.user.name) {
      // don't allow duplicate creation
      // res.send(405, {err: err, taken: ref, url: req.profile.url});
      return next( );

    }
    console.log("UPDATING PARAMS", req.params.user, req.params, req.body, req.files);
    var name = req.params.user;
    var update = req.params;
    var updates = paramHelper(req.params) || ((req.body && req.body.user)
                ? req.body.user : req.body)
                ;
    console.log('repo path', req.repo_path);
    var message = req.params.message || req.body.message
               || "creating user " + name;
    var config = { save:true, create:true
                 , repo_path: req.repo_path, message: message
                 , name: name
                 };
    server.updateUser(name, updates, config, function (result) {
      console.log('UPDATED user', arguments);
      res.profile = result;
      next( );

    });
  }
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

