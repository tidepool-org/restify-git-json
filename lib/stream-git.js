
var platform = require('git-node-platform')
  , jsGit = require('js-git')
  , es = require('event-stream')
  , fsDB = require('git-fs-db')(platform)
  ;

var repos = require('./repos')
  ;

function logger (msg) {
  return es.through(function (chunk) {
    console.log(msg, chunk);
    this.emit('data', chunk);
  });
}

// Most code here is modeled after:
// * https://github.com/creationix/js-git/blob/master/examples/create.js
// * https://gist.github.com/bewest/8008603
// * https://github.com/substack/stream-handbook#transform
// * https://github.com/dominictarr/event-stream#eventstream

/**
 * Blobs takes incoming objects with keys content and name and commits them to the given repo.
 * It will append these blobs to a tree if given.
 * TODO: rename write-blob or blobWriter
 * @constructor Blobs(repo, [tree]) -> readable-stream 
 */
function Blobs (repo, tree) {
  tree = tree || { };
  // Use es.map to save each blob, re-emitting it with the saved hash.
  var stream = es.pipeline(es.map(function (chunk, cb) {
    var content = chunk.content;
    var name = chunk.name;
    repo.saveAs("blob", chunk.content, function (err, hash) {
      if (err) { cb(err); throw err; }
      tree[name] = {mode: 0100644, hash: hash, name: name};
      cb(null, tree[name]);
    });
  }));
  return stream;
}

/**
 * Tree consumes all incoming saved blobs (with hash) and re-emits a
 * single tree ready to be saved.
 * TODO: rename blob-tree or blobTree
 */
function Tree (blobs, tree) {

  var tree = tree || { };
  var tr = es.through(
    function write (chunk) {
      // read all data events emitted from stream, appending to
      // committable tree
      tree[chunk.name] = chunk; delete chunk.name;
    }
  , function end (chunk) {
     // re-emit single committable tree at end.
     console.log("PREPARED TREE", tree);
     this.emit('data', tree);
     this.end( );
  });

  return tr;
}

/**
 * trees consumes incoming trees replete with blobs and hashes, saves
 * and re-emits the result.
 * TODO: take commit opts as argument { parent, author, name, email }
 * TODO: rename to write-tree? or previewTree
 * TODO: split into two streams, one emitting committable trees with
 *       commit info added (preview), the second to save and re-emit?
 * * preview-tree
 * * write-tree
 * * preview-commit
 * see git-commit-tree vs git-write-tree
 * `write-tree | preview-commit`
 */
function trees (repo, root) {
  root = root || { };
  // create an iterating stream which saves everything
  var stream = es.pipeline(es.map( function (tree, cb) {
    console.log("TREE", tree);
    // write tree
    repo.saveAs('tree', tree, function (err, hash) {
      if (err) { cb(err); }
      // XXX: bad defaults
      return cb(null, hash);
      /*
      var commit = {
        tree: hash
      , author: repo.getAuthor( )
      , committer: repo.getCommitter( )
      , message: repo.getMessage( )
      // , author: { name: 'MY AUTHOR', email: 'git@js' }
      // , committer: { name: 'MY COMMITTER', email: 'git@js' }
      // , message: 'MY JUSTIFICATION'
      };
      if (root.parent) {
        commit.parent = root.parent;
      }
      cb(null, commit);
      */
    });

  }));
  return stream;
}

function PreviewCommit (repo, opts) {
  var getAuthor = (repo.getAuthor || opts.getAuthor);
  var getCommitter = (repo.getCommitter || opts.getCommitter);
  var getMessage = (repo.getMessage || opts.getMessage);
  var keys = [ ['author',    getAuthor]
             , ['committer', getCommitter]
             , ['message',   getMessage] ];
  function fetch (key, next) {
    var get = key.pop( );
    var field = key.pop( );
    function finish (fetched) {
      console.log('fetched', field, fetched);
      next(null, [field, fetched]);
    }
    get(finish);
  }
  function ammend (thing) {
    function install (key, next) {
      var value = key.pop( );
      var field = key.pop( );
      console.log('key ammend', key, thing);
      console.log('ammending', field, value);
      thing[field] = value;
      next(null);
    }
    return install;
  }
  var stream = es.through(writer);
  function writer (data) {
    var hash = data;
    var commit = { };
    commit.tree = hash;
    if (opts.parents) {
      commit.parents = opts.parents;
    }
    function whenDone (err, result) {
      console.log('preview commit', commit);
      stream.emit('data', commit);
    }
    es.pipeline(es.readArray(keys), es.map(fetch), es.map(ammend(commit)), es.writeArray(whenDone));
  }
  return stream;

}

function Commits (repo, opts) {
  // Use a through stream to transform incoming stream of commit stubs into
  // saved commits.  Incoming stream is full of json objects that are formatted
  // to be commits.
  // 
  function writer (chunk) {
    // TODO: fill with opts.
    // TODO: provide some mechanism for connecting future commits to
    // this one (for other, more generic use)
    var tr = this;
    console.log('commiting', chunk);
    // save commit
    repo.saveAs('commit', chunk, function (err, hash) {
      console.log('COMMIT', arguments);
      tr.emit('data', {commit: hash, tree: chunk});
    });
  }
  function end ( ) {
    this.end('end');
  }
  return es.through(writer, end);
}

/**
 * Record commits on a branch.
 */
function UpdateBranch(repo, name) {
  // Use a through stream to transform an incoming stream of commits into
  // commits that can be dereferenced on a branch.
  var prefix = name;
  function writer (chunk) {
    var tr = this;
    console.log('UpdateBranch input', chunk, chunk.commit);
    // Create new branch.
    // Use part of commit hash from the tree to name the branch.
    // TODO: consider adding some kind of timestamp in the name
    var tail = chunk.commit.slice(0, 6);
    var middle = 'incoming'
    var ts = new Date( );
    var offset = (
        ((
          (ts.getHours( ) * 60 * 60)
        + (ts.getMinutes( ) * 60)
        + (ts.getSeconds( ))
        ) * 1000)
        + ts.getMilliseconds( )
      );
    ts = ts.toISOString( ).split('T');
    ts.pop( );
    ts.push(offset);
    var parts = [ prefix, middle, ts.join('-'), name, tail ];
    var name = parts.join('/').replace('//', '/');
    // create a branch
    repo.setHead(name, function (err) {
      console.log("SET REF", arguments, 'UPDATE TO', chunk.commit);
      // pin branch to point at our commit
      var branch = {
        ref: name
      , sha: chunk.commit
      };
      repo.updateHead(chunk.commit, function (err) {
        branch.head = chunk;
        console.log('updated head', arguments);
        tr.emit('data', branch);
        tr.end( );
      });
    });
  }
  return es.through(writer);
}

/**
 * Poorly named gitStream reads incoming objects with a `name` and `content` field.
 * It saves incoming objects as as blobs, aggregated into a tree, which is
 * committed to a new uniquely identifying branch.
 */
// TODO: seriously re-think through naming
function gitStream(repo, opts) {
  console.log("repo", repo);
  var commits = UpdateBranch(repo, 'upload');
  function each (data, cb) {
    console.log('committed tree ', data);
    cb(null, data);
  }
  var stream = es.pipeline(logger('FOO'), Blobs(repo)
                 , Tree( ), trees(repo)
                 , PreviewCommit(repo, opts)
                 , Commits(repo), commits
                 , es.map(each));
  
  return stream;
}


module.exports = gitStream;
module.exports.gitStream = gitStream;

if (!module.parent) {
  var name = './out/test.git';
  var setup = repos('fs-db');
  var repo = setup.create(name);
  var m = {name: 'incoming.txt', content: 'hello world' }
    , o = {name: 'flurbity.txt', content: 'howdy world' }
    , c = {name: 'incoming-one.txt', content: 'foo\tbar' }
    , k = {name: 'incoming-2013.txt', content: 'qux\tqan' }
    ;

  function getAuthor (fn) {
    if (!fn) return getAuthor.bind(this);
    return fn({ name: 'MY AUTHOR', email: 'git@js' });
  }
  function getCommitter (fn) {
    if (!fn) return getCommitter.bind(this);
    
    return fn({ name: 'MY COMMITTER', email: 'git@js' });
  }
  function getMessage (fn) {
    if (!fn) return getMessage.bind(this);
    return fn('MY JUSTIFICATION');
  }
  repo.getAuthor = getAuthor;
  repo.getCommitter = getCommitter;
  repo.getMessage = getMessage;
  var incoming = es.readArray([m, o/*, c, k*/]);
  function withResults (err, results) {
    console.log("WITH RESULTS", err, results);
  }
  es.pipeline(incoming, gitStream(repo), es.writeArray(withResults));

}
