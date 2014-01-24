
var builtin = {
    urlize: require('./urlize')
  , getRepo: require ('./get-repo')
  , repo_name: require('./repo-name')
  , getPath: require('./repo-path')
  , fixGitRequest: require('./fix-double-dot-git')
  , uploads: require('./uploads')

//, 
};

var extras = { };
var users = require('./users/');
var userProfileName = require('./users/git-profile-name');
var gitRepoExists = require('./git-repo-exists');
var gitFindKeyPath = require('./git-find-key-path');
extras.gitFindKeyPath = gitFindKeyPath;

function all (opts, server) {
  var all = [ ];
  var mandated = mandatory(opts, server);
  all = all.concat(mandated);
  all = all.concat(suggested(opts, server));
  var keys = [ ];
  keys.forEach(function (key) {
    all.push(builtin[key](opts, server));
    
  });
  return all;
}

function suggested (opts, sever) {
  var middleware = [ builtin.repo_name(opts)
                   , builtin.getPath(opts), builtin.getRepo(opts) ];
  return middleware;
}

function minUser (opts, server) {
  var middleware = [ userProfileName(opts, server), users(opts, server)
                   , builtin.getPath(opts), builtin.getRepo(opts)
                   ];
  return middleware;
}

function user (opts, server) {
  var middleware = minUser(opts, server).concat(
      [ gitRepoExists(opts, server), gitFindKeyPath(opts, server)
      ]);
  return middleware;
}

function gitMiddle (opts, sever) {
  var gitMiddleWare = [ builtin.repo_name(opts), builtin.fixGitRequest(opts)
                      , builtin.getPath(opts),  builtin.getRepo(opts) ];
  return gitMiddleWare;
}

function mandatory (opts, server) {
  var keys = ['urlize'];
  var wares = [ ];
  keys.forEach(function (key) {
    wares.push(builtin[key](opts, server));
  });
  return wares;
}

function uploads (opts, server) {
  var wares = all(opts, server);
  wares.push(builtin.uploads(opts, server));
  return wares;
}

module.exports = function configure (opts, server) {
  return all(opts, server);
};
module.exports.builtin = builtin;
module.exports.extras = extras;
module.exports.all = all;
module.exports.mandatory = mandatory;
module.exports.suggested = suggested;
module.exports.gitMiddle = gitMiddle;
module.exports.uploads = uploads;
module.exports.userInfo = user;
module.exports.minUser = minUser;


