var middleware = require('../../middleware')
  , es = require('event-stream')
  , path = require('path')
  , gitStream = require('../../stream-git')
  , uploads = require('../../middleware/uploads')
  ;

function callbacks (profile, committer, msg) {
  var config = { };
  function getMessage (fn) {
    fn(msg);
  }
  function getAuthor (fn) {
    if (profile.author) {
      return fn({name: profile.author.handle || profile.author.name, email: profile.author.email});
    }
    if (profile.user) {
      return fn({name: profile.user.handle || profile.user.name, email: profile.user.email});
    }
    fn({name: profile.handle || profile.name, email: profile.email || null});
  }
  function getCommitter (fn) {
    if (committer) {
      return fn({name: committer.name, email: committer.email});
    }
    if (profile.committer) {
      return fn({name: profile.committer.name, email: profile.committer.email});
    }
    return fn(null);
  }
  config.getMessage = getMessage;
  config.getAuthor = getAuthor;
  config.getCommitter = getCommitter;
  return config;
}

function handler (req, res, next) {
  var input = uploads.fileStream(req);
  var message = req.params.message;
  var committer = req.params.committer || null;
  if (!committer || (!committer.name && !committer.email)) {
    committer = null;
  }
  var profile = req.profile;
  if (req.params.author && req.params.author.email && req.params.author.name) {
    profile.author = req.params.author;
  }
  var opts = callbacks(profile, committer, message);
  var git = gitStream(req.repo, opts);
  es.pipeline(input, uploads.fileContentBlob( ), git, es.writeArray(done));
  function done (err, results) {
    var result = results[0];
    var url = req.urlize('../git/refs/heads/' + result.ref)
    var commit = req.urlize('../git/commits/' + result.head.commit);
    var tree = req.urlize('../git/trees/' + result.head.tree.tree);
    var content = [ ];
    for (var k in req.files) {
      content.push(req.urlize(['../raw', result.ref, req.files[k].name].join('/')));
    };
    result.content = content;
    result.url = url;
    result.head.url = commit;
    result.head.tree.url = tree;
    result.inputs = req.files;
    console.log("INPUTS", req.files);

    res.send(201, {err: err, body: result})
  };
  next( );
}

var endpoint = {
    path: '/repos/:owner/:repo/upload'
  , method: 'post'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function ownerProfile (req, res, next) {
    server.fetchUser(req.params.owner, done);
    function done (profile) {
      profile.handle = req.params.owner;
      req.profile = profile;
      next( );
    }
  }
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, ownerProfile, endpoint.handler);
  }
  endpoint.middleware = middleware.uploads(opts, server)
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

