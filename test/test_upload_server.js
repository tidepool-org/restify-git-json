
var restify = require('restify');
var clients = require('restify/lib/clients');
var es = require('event-stream');
var fs = require('fs');
var mimeStream = require('mime-multipart-stream');
var http = require('http');
function defaultContent ( ) {
  var fileOne = es.readArray(["dummy content hello world text"]);
  var fileTwo = fs.createReadStream('./Makefile');
  var content = {fileOne: fileOne, fileTwo: fileTwo};
  return content;
}
function testContent (T) {
  var content = defaultContent( );
  var pre = "====";
  var boundary =  pre + pre + pre + "TIDEPOOL" + "TESTBOUNDARY" + "EOF";
  var stream = mimeStream({boundary: boundary, type: 'form-data'});
  function make (name, part) {
    var o = {
      disposition: 'form-data; name="' + name + '"; filename="'+ name + '"'
    , type: 'text/plain; charset=UTF-8'
    , transferEncoding: 'quoted-printable'
    , body: part
    };
    return o;
  }
  stream.add(make('testfileOne', content.fileOne));
  stream.add(make('testfileTwo', content.fileTwo));
  function message(m) {
    var o = {
      disposition: 'form-data; name="message";'
    , type: 'x-www-form-urlencoded'
    , transferEncoding: 'quoted-printable'
    , body: es.readArray([m])
    };
    stream.add(o);
  }
  stream.message = message;
  return stream;
}
function createClient (opts) {
  var client = restify.createJsonClient(opts);
  function help (fn) {
    return client.get('/help', fn);
  }
  function status (fn) {
    return client.get('/status', fn);
  }
  function userInfo (name, fn) {
    return client.get('/users/' + name, fn);
  }
  function updateUser (name, update, fn) {
    var url = '/users/' + name;
    return client.post(url, update, fn);
  }
  function createUser (name, update, fn) {
    var params = '?name=' + update.handle;
               + '&email=' + update.email;
    var url = '/users/' + name + '/create' + params;
    return client.post(url, update, fn);
  }
  function download (url, fn) {
    console.log("DOWNLOADING", url);
    url = url.replace('http://localhost', '');
    url = url.replace('http:/localhost', '');
    console.log("URL", url);
    client.get(url, function (err, res, req, body) {
      console.log("DOWNLOADING", url, body);
      fn(err, body);
    });
  }
  function uploadContent (profile, content, fn) {
    var name = profile.handle;
    var url = '/repos/' + name + '/test/upload';
    var config = {
      'content-type': 'multipart/form-data'
    , path: url
    // , url: url
    , method: 'POST' 
    };
    // options.
    // var mimes = testContent(content);
    var mimes = defaultContent(content);
    var fopts = {
      url: 'http://localhost:6776/'
    }
    var ropts = {
        method: 'POST'
      , uri: 'http://localhost/' + url
      //, uri: url
      , path: url
      // , socketPath: opts.socketPath
      // , host: 'localhost'
      // , port: 6776
      , socketPath: opts.socketPath
      // , headers: { //'content-type': 'multipart/form-data' }

    };
    /*
    var req = http.request(ropts, function up (res) {
    es.pipeline(mimes, req, es.writeArray(function (err, buffers) {
      console.log('INTER B', req);
      req.end( );
    }));
      es.pipeline(res, es.writeArray(done));
    });
    mimes.message('this is a personalized commit message');
    // mimes.pipe(req);
    // req.end( );
    req.on('error', done);
    return;
    */
    var request = require('request');
    var req = request.post(ropts, start);
    var form = req.form( );
    form.append("message", "this is my commit message");
    form.append('fileOne', mimes.fileOne, {filename: 'fileOne', knownLength: 30, contentType: 'text/plain'});
    form.append('fileTwo', mimes.fileTwo);
    function start (err, res, body) {
      // console.log("UPLOADED BODY", err, body);
      fn(err, JSON.parse(body));
    }
    return;
    function done (err, result) {
      fn(err, JSON.parse(result[0]));
      
    }

  }
  function xxdownload (url) {

  }
  function xxdownloadContent (content) { }
  client.help = help;
  client.status = status;
  client.userInfo = userInfo;
  client.createUser = createUser;
  client.updateUser = updateUser;
  client.uploadContent = uploadContent;
  client.download = download;
  return client;
}
module.exports.before = function ( ) {
}
describe("restify-git-json server", function ( ) {
  var Server = require('../server');
  var server, client;
  var opts = {
    base: './out'
  , socketPath: '/tmp/test-restify-git-json.sock'
  };
  this.profile = { };
  after(function (done) {
    server.close( );
    done( );
  });
  it('should initialize ok', function (done) {
    server = Server(opts);
    server.listen(opts.socketPath, function ( ) {
      client = createClient(opts);
      client.status(function (err, req, res, body) {
        // console.log("STATUS", body);
        body.should.startWith("OK");
        done( );
      });
    });
  });
  it('should respond to help', function (done) {
    client.help(function (err, req, res, body) {
      // console.log("HELP", arguments);
      body.length.should.be.above(1);
      done( );
    });
  });
  var profile;
  describe("users api", function ( ) {
    var my = { };
    this.profile = my;
    var foobarUser = { handle: 'fooTestUser'
      , user: { name: 'Foo Test User', email: 'test@tidepool.io' }
    };
    var client = createClient(opts);
    
    it('should create a new user', function (done) {
      testCreateUser(client, foobarUser, function (err, result) {
        my.profile = result;
        this.profile = result;
        done( );
      });
    });

    it('should not allow repeated user creation', function (done) {
      var name = my.profile.handle;
      client.createUser(name, my.profile, function (err, req, res, result) {
        // console.log('REFUSAL', result);
        err.statusCode.should.equal(405);
        result.old.should.be.ok;
        done( );
      });
    });

    function validFetchUser (client, name, fn) {
      client.userInfo(client, name, function (err, req, res, body) {
        // console.log("userInfo", body);
        body.should.be.ok;
        body.user.name.should.be.ok;
        my.profile = body;
        this.profile = body;
        console.log('validFetchUser', this.profile);
        fn(err, body);
      });
    }

    it('should then update', function (done) {
      console.log('should then update');
      testUpdateUser(finish);
      function finish (err, result) { done( ); }
    });
    // it('should then sync update', function ( ) { });

    // testUploadContent(my.profile, onUploaded);
    // function onUploaded (err, result) { }
    it('should then upload', function (done) {
      this.timeout(12000);
      my.profile.handle.should.be.ok;
      console.log("UPLOADING to", my.profile);
      testUploadContent(my.profile, finish);
      function finish (err, result) {
        console.log("DONE DONE", result);
        console.log("DONE ERR", err);
        result.body.should.exist;
        result.body.ref.should.exist;
        result.body.content.should.exist;
        console.log("DONE OK", result.body.head.tree);
        my.upload = result;
        done( );
      }
    });
    // it('should then sync upload', function ( ) { });

    it('should then download content', function (done) {
        this.timeout(4000);
        console.log("DOWNLOAD", my.upload);
        my.upload.should.be.ok;
        downloadContent(my.upload, function (err, results) {
          done( );
        });
    });
    it('should then sync upload', function ( ) { });


    it('should dereference urls', function (done) {
      this.timeout(10000);
      var downloads;
      console.log("DEREFERENCE", my.upload);
      my.upload.should.be.ok;
      var urls = [ my.upload.body.url, my.upload.body.head.url ];
      downloads = walkDownload(more, finish);
      // downloads.resume( );
      // urls.forEach(downloads.write);
      // urls.push(['/repos', my.profile.handle, 'test/git/refs'].join('/'));
      // urls.push(['/repos', my.profile.handle, 'test/git/refs/'].join('/'));
      urls.push(['/repos', my.profile.handle, 'test'].join('/'));
      urls.push(['/repos', my.profile.handle].join('/'));
      urls.push(['/users', my.profile.handle + 'xxx', 'create'].join('/'));
      es.readArray(urls).pipe(downloads.resume( ));
      var Visited = [ ];
      var V = { };
      // downloads.resume( );
      // downloads.end( );
      function finish (err, results) {
        done( );
      }
      function Q (u) {
        if (V[u]) {
          return false;
        }
        V[u] = u;
        Visited.push(u);
        return u;
      }
      function more (err, results) {
        console.log("MORE", err, results);
        var add = [ ];
        function validQ (u) {
          if (Q(u)) {
            add.push(u);
            return u;
          }
          return false;
        }
        validQ(results.url);
        var latest = results.url;
        if (results.result && !results.err) {
          if (results.result.type == 'blob') {
            // console.log('CRAWL QUIT');
            // return [ ];
          }
          var body;
          if (results.result.type == 'tree') {
            console.log('FOUND TREE', results);
            body = result.result;
          }
          if (results.result.body) {
            body = results.result.body;
            console.log('MORE BODY TYPE, url', body.type, body.url);
            if (body.type == 'commit') {
              validQ(body.url);
              return add;
            }
            if (results.result.url == latest) {
            }
            if (results.result.body && results.result.body.url) {
              // downloads.write(body.url);

              if (body.url !== results.url)// && results.result.type !== 'tree')
                validQ(body.url);
              // add.push(body.url);
            }
          }
          if (body) {
            console.log("MORE FOUND", body);
            if (typeof body == "Array") {
              body.forEach(validate);
            } else {
              validate(body);
            }
            function validate (body) {
              var keys = Object.keys(body);
              keys.forEach(function (i, k) {
                if (body[i].url) {
                  console.log("MORE URLS", body[i].url);
                  // downloads.write(body[i].url);
                  validQ(body[i].url);
                  // add.push(body[i].url);
                }
              });
            }
          }
        }
        return add;
      }
    });
    // it('should then sync upload', function ( ) { });
    function walkDownload (visit, fn) {
      // var urls = [ upload.body.head.url , upload.body.url ];
      var tr = es.through(write);
      var found = { };
      function write(url) {
        var self = this;
        if (found[url]) {
          // self.emit( );
          return ;
        }
        // return self.emit('data', url);
        self.push(url);
        return;
        client.download(url, function (err, result) {
          var m = {err:err, url: url, result: result};
          if (!found[url]) {
            found[url] = m;
            // self.emit('data', m);
            self.push('data', m);
          }
          // crawl(err, m);
        });
      }
      function down (url, next) {
        if (found[url]) {
          // return next(null, found[url]);
          next( );
        }
        client.download(url, function (err, result) {
          var m = {err:err, url: url, result: result};
          crawl(err, m, next);
          // next(null, m);
        });
      }
      var finished = false;
      function crawl (err, result, next) {
        console.log("CRAWL CRAWL", result);
        if (visit) {
          var add = visit(err, result);
          var U = result.url;
          console.log("CRAWL ADD", add);
          if (add && add.length > 0) {
            stream.pause( );
            function valid (url, pass) {
              if (found[url] || url == U || url == result.url) { pass( ); }
              found[url] == result;
              pass(null, url);
            }
            var load = walkDownload(visit, function (e, rs) {
              console.log("CRAWL DEEP", add, e, rs);
              found[U] = found[U] || {};
              result.deep = rs;
              found[U].deep = (e || rs);
              next(err, result);
              stream.resume( );

            });
            var inputs = es.readArray(add || [ ]);
            inputs.on('end', load.end);
            es.pipeline(inputs, es.map(valid), load.resume( ));
            stream.resume( );
            return 
          }
        }
          // es.readArray(add).pipe(tr, {end:false});
          // if (add) { add.forEach(tr.write); }
          
        next(err, result);
      }
                    // es.readArray(urls),
      var stream = es.pipeline(tr, es.map(down), es.writeArray(done))
      function done(err, results) {
        console.log("DOWNLOADING CRAWL DONE", err, results);
        fn(err, results);
      }
      return tr;
    }

    function downloadContent (download, fn) {

      console.log("DOWNLAODCONTENT", download);
      download.body.should.be.ok;
      es.pipeline(es.readArray(download.body.content)
        , es.map(fetch)
        , es.writeArray(done)
        );

      function fetch (url, next) {
        console.log("FETCH URL", url); 
        url = url.replace("http:/localhost", "");
        url = url.replace("http://localhost", "");
        console.log("FETCH URL", url); 
        client.get(url, function (err, req, res, body) {
          // console.log("FETCH FETCH", arguments);
          res.body.should.be.ok;
          next(null, res.body);
        });
      }

      function done (err, results) {
        download.downloaded = results;
        fn(err, results);
      }
    }

    function testUpdateUser (finish) {
      console.log("XXXXX");
      // it('should update user', function (done) {
        console.log("PROFILE FOR UPDATE", my.profile, this.profile);
        var update = JSON.parse(JSON.stringify(my.profile));
        var author = { name: "Bar Update", email: "updated@tidepool.io" };
        update.user.user = author;
        update.user.author = author;
        update.user.data = { custom: 'property' };
        update.user.user = JSON.parse(JSON.stringify(update.user))
        name = update.name;
        client.updateUser(name, update.user, function (err, req, res, result) {
          // console.log("UPDATED", result);
          result.name.should.equal(name);
          result.user.name.should.equal(update.user.name)
          result.user.data.should.be.ok;
          result.user.data.custom.should.equal(update.user.data.custom);
          if (finish) { finish(err, result); }
          // done( );
        });
      // });
    }

    function testUploadContent (profile, fn) {
    // describe("uploaded content", function ( ) {
        console.log("YYYY");
        // it('user should be able to upload content into git', function ( ) {
        client.uploadContent(profile, 'test', function (err, results) {
          console.log("UPLOADED", results);
          fn(err, results);
        });
        //});
    // });
    }

    it('should 404 non-existent users', function (done) {
      client.userInfo('xx-no-exist', function (err, req, res, body) {
        // console.log("404 ERR", 'error', err, 'body', body);
        // console.log("404 REQ", req);
        // console.log("404 RES", res);
        // body.should.be.ok;
        err.statusCode.should.equal(404);
        done( );
      });
    });
    describe("user creation REST api", function ( ) {
      var update = { };
      var client = createClient(opts);
      testCreateUser(client, null, function (err, result) {
        result.should.be.ok;
        // done( );
      });
    });
  });

});
function testCreateUser (client, update, fn) {
  update = update || ({ handle: 'testUser'
    , user: { name: 'Test User', email: 'test@tidepool.io' }
  });
  var left = 2;
  var R = { };
  function finish (err, result) {
    if (--left == 0) {
      console.log('LEFT', left, R);
      fn(R.err, R.result);
    }
  }
  // describe("user creation REST api", function ( ) {
    // it('should create a user', function (done) {
      var name = update.handle;
      client.createUser(name, update, function (err, req, res, result) {
        console.log('CREATED', result);
        result.handle.should.equal(name);
        result.user.name.should.equal(update.user.name);
        result.user.email.should.equal(update.user.email);
        result.should.be.ok;
        R.err = err;
        R.result = result;
        fn(err, result);
        // after( );
        // finish(err, result);
        // done( );
      });
    // });
    function after ( ) {
    describe("repeated creation", function ( ) {
    it('should not allow repeated user creation', function (done) {
      var name = my.profile.handle;
      client.createUser(name, update, function (err, req, res, result) {
        console.log('REFUSAL', result);
        err.statusCode.should.equal(405);
        result.old.should.be.ok;
        // fn(err, result);
        // finish(err, result);
      });
      done( );
    });
    });
    }
  // });
}
