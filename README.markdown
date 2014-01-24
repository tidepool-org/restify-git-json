# restify-git-json

An API to git repos exposed as a RESTful interface.

Uses libraries to package up
[js-git](https://github.com/creationix/js-git) as a set of streaming
interfaces.  Uses git streams to provide a
[RESTful API ala github](http://developer.github.com/v3/git/blobs/) 
to inspect, create, and manipulate git repos.

Includes an endpoint to upload files, streaming them into a uniquely
identified git reference per user per namespace per upload.

## Install
```bash
$ git clone git@github.com:tidepool-org/restify-git-json.git
# or
$ git clone git://github.com/tidepool-org/restify-git-json.git
$ cd restify-git-json
$ npm install
```

[![Build Status](https://travis-ci.org/tidepool-org/restify-git-json.png?branch=bewest/tests/init)](https://travis-ci.org/tidepool-org/restify-git-json)
[![Coverage Status](https://coveralls.io/repos/bewest/restify-git-json/badge.png)](https://coveralls.io/r/bewest/restify-git-json)

## Run
```bash
$ node server.js
```

#### Environment variables

* **PORT** Expects to be assigned a tcp port to serve http requests 
  on via **`PORT`** environment variable.  Default is `6776`.

* **BASE** the directory housing bare git repos if using `fs-db` backend.
  Default value is `./out`.
* **GIT_BACKEND** `fs-db` (default) or `memdb`.


##### Choosing a git backend

###### Bare file database **`fs-db`**

Each git database is stored on disk using the "bare" repo layout (no working
directory, no files are left "checked out").
See [git repository layout](http://git-scm.com/docs/gitrepository-layout) for
more information.

The current advice is to use this one if you aren't sure.

###### Memory based database **`memdb`**

The git database is stored in memory, which is cool, but you can only get the
contents via the http endpoints supported by the server.  (Cloning is
post-mvp.)  See `lib/handlers/experiments` for WIP.
## API

### HTTP REST Endpoints
Basic idea is to wrap a configurable git repo (backed by s3, memory,
or bare fs) using js-git, providing a RESTful API identical to the
[github json API](http://developer.github.com/v3/git/).

Basic pattern is:
```tsv
METHOD	ENDPOINT	Description
GET	/repos/:owner/:repo/git/:type
GET	/repos/:owner/:repo/git/refs
GET	/repos/:owner/:repo/git/refs/:ref
GET	/repos/:owner/:repo/git/refs/:ref
GET	/repos/:owner/:repo/git/commits/:sha
GET	/repos/:owner/:repo/git/trees/:sha
GET	/repos/:owner/:repo/git/blobs/:sha
```


#### `Uploads`
As a bonus, we expose an additional endpoint
```tsv
METHOD	ENDPOINT	Description
POST	/repos/:owner/:repo/upload
```

This pins uploads to a uniquely identified branch.  The result can
then be cloned for replication.

The semantics for working with this endpoint are the exact same as
normal browser file uploads.  As a bonus feature, if a header with
`content-md5` is sent, the
[checksum of the file is validated](https://github.com/mcavage/node-restify/blob/cc86da05e28dffd9304460c3851f4ac0f0153439/lib/plugins/body_reader.js#L89-L118)
before being saved.  For all cases, sha1 sums are provided for each
upload.

**Caveats** cloning is currently only possible when using fs bare
option (default).

##### Example
EG

```bash
+ curl -ivs -F web=@./History.md -F kkktwo=@env.js localhost:6776/repos/me/test/upload
+ json
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> POST /repos/me/test/upload HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> Content-Length: 2911
> Expect: 100-continue
> Content-Type: multipart/form-data; boundary=----------------------------124e1b80ed69
> 
< HTTP/1.1 100 Continue
} [data not shown]
< HTTP/1.1 201 Created
< Connection: close
< Content-Type: application/json
< Content-Length: 866
< Date: Wed, 15 Jan 2014 05:58:03 GMT
< 
{ [data not shown]
* Closing connection #0
{
  "err": null,
  "body": [
    {
      "ref": "upload/incoming/2014-01-15-79083446/489841",
      "sha": "4898416679ef377c29690b3e4fe0ed2c7aa7ef23",
      "head": {
        "commit": "4898416679ef377c29690b3e4fe0ed2c7aa7ef23",
        "tree": {
          "tree": "f9526358da6b35eb90d365309dfea451f91e096c",
          "author": {
            "name": "MY AUTHOR",
            "email": "git@js"
          },
          "committer": {
            "name": "MY COMMITTER",
            "email": "git@js"
          },
          "message": "MY JUSTIFICATION",
          "url": "http://localhost:6776/repos/me/test/git/trees/f9526358da6b35eb90d365309dfea451f91e096c"
        },
        "url": "http://localhost:6776/repos/me/test/git/commits/4898416679ef377c29690b3e4fe0ed2c7aa7ef23"
      },
      "content": [
        "http://localhost:6776/repos/me/test/raw/upload/incoming/2014-01-15-79083446/489841/History.md",
        "http://localhost:6776/repos/me/test/raw/upload/incoming/2014-01-15-79083446/489841/env.js"
      ],
      "url": "http://localhost:6776/repos/me/test/git/refs/heads/upload/incoming/2014-01-15-79083446/489841"
    }
  ]
}
```

So each request like this creates a new set of blobs on a new uniquely
identified branch, per upload per namespace (repo) per user (per server).

### Installed routes

```bash
+ curl -ivs localhost:6776/help
+ json
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /help HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 998
< Date: Wed, 15 Jan 2014 06:01:29 GMT
< 
{ [data not shown]
* Closing connection #0
[
  {
    "path": "/status",
    "version": "0.0.3",
    "middleware": 0,
    "method": "GET"
  },
  {
    "path": "/repos/:owner/:repo",
    "version": "0.0.3",
    "middleware": 4,
    "method": "GET"
  },
  {
    "path": "/repos/:owner/",
    "version": "0.0.3",
    "middleware": 0,
    "method": "GET"
  },
  {
    "path": "/repo/test",
    "version": "0.0.3",
    "middleware": 2,
    "method": "POST"
  },
  {
    "path": "/repos/:owner/:repo/upload",
    "version": "0.0.3",
    "middleware": 5,
    "method": "POST"
  },
  {
    "path": "/repos/:owner/:repo/git/refs",
    "version": "0.0.3",
    "middleware": 4,
    "method": "GET"
  },
  {
    "path": "/repos/:owner/:repo/git/refs/(.*)",
    "version": "0.0.3",
    "middleware": 4,
    "method": "GET"
  },
  {
    "path": "/repos/:owner/:repo/git/commits/:sha",
    "version": "0.0.3",
    "middleware": 4,
    "method": "GET"
  },
  {
    "path": "/repos/:owner/:repo/git/trees/:sha",
    "version": "0.0.3",
    "middleware": 4,
    "method": "GET"
  },
  {
    "path": "/repos/:owner/:repo/git/blobs/:sha",
    "version": "0.0.3",
    "middleware": 4,
    "method": "GET"
  },
  {
    "path": "/repos/:owner/:repo/raw/(.*)",
    "version": "0.0.3",
    "middleware": 4,
    "method": "GET"
  },
  {
    "path": "/help/",
    "version": "0.0.3",
    "middleware": 1,
    "method": "GET"
  }
]
```
### Use API to fetch data
```bash
+ curl -ivs http://localhost:6776/repos/me/proof/git/refs
+ json -H
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/refs HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 2452
< Date: Thu, 26 Dec 2013 00:05:36 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 2452
Date: Thu, 26 Dec 2013 00:05:36 GMT

{
  "err": null,
  "body": [
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51951039/722e28",
      "sha": "722e28bf2d3aa24cb3eae6b34c63a1bef0f2311a",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51951039/722e28"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51956598/cb3955",
      "sha": "cb3955e12f4b81c25ed307a6d196c0b5decc7883",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51956598/cb3955"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51959099/167675",
      "sha": "167675a1605d03d9eaa5448b432e250a86fccb39",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51959099/167675"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51961695/bf9c8e",
      "sha": "bf9c8ec01ef9f8926109f12e64c3b0a965c7e845",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51961695/bf9c8e"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-51962813/4f9f5c",
      "sha": "4f9f5c47326c677fb91718c953b7d1dec21e7921",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-51962813/4f9f5c"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-54381462/494606",
      "sha": "494606f961d5b519df094662365f52c539a3a142",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-54381462/494606"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57444767/09ae06",
      "sha": "09ae0668f6792d11a55fc050af494d04e6616e14",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57444767/09ae06"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57479601/9d8cd2",
      "sha": "9d8cd26166485fcbf63bd0667456a1ef94255a35",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57479601/9d8cd2"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57500649/127d5a",
      "sha": "127d5a329803597987a912788c260812ead21af7",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57500649/127d5a"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57521748/49a3c6",
      "sha": "49a3c6019a37aa4d6762236c58bf5a8cb78fda0a",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57521748/49a3c6"
    },
    {
      "ref": "refs/heads/upload/incoming/2013-12-25-57540359/36ca88",
      "sha": "36ca88c51023c38b135b243fe054da98d3eb6ac5",
      "url": "http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57540359/36ca88"
    }
  ],
  "url": "http://localhost:6776/repos/me/proof/git/refs/"
}
```
#### Get ref
```bash
+ curl -ivs http://localhost:6776/repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57540359/36ca88
+ json -H
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/refs/heads/upload/incoming/2013-12-25-57540359/36ca88 HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 184
< Date: Thu, 26 Dec 2013 00:00:56 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 184
Date: Thu, 26 Dec 2013 00:00:56 GMT

{
  "err": null,
  "body": {
    "type": "commit",
    "sha": "1daf69f11ee1f5ff253e1a3300839cf6c7be710f",
    "url": "http://localhost:6776/repos/me/proof/git/commits/36ca88c51023c38b135b243fe054da98d3eb6ac5"
  }
}
```
#### Get commit
```bash
+ curl -ivs http://localhost:6776/repos/me/proof/git/commits/36ca88c51023c38b135b243fe054da98d3eb6ac5
+ json -H
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/commits/36ca88c51023c38b135b243fe054da98d3eb6ac5 HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 402
< Date: Thu, 26 Dec 2013 00:01:44 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 402
Date: Thu, 26 Dec 2013 00:01:44 GMT

{
  "err": null,
  "body": {
    "type": "commit",
    "body": {
      "tree": "1daf69f11ee1f5ff253e1a3300839cf6c7be710f",
      "parents": [],
      "author": {
        "name": "MY AUTHOR",
        "email": "git@js",
        "date": "2013-12-25T23:59:00.000Z"
      },
      "committer": {
        "name": "MY COMMITTER",
        "email": "git@js",
        "date": "2013-12-25T23:59:00.000Z"
      },
      "message": "MY JUSTIFICATION"
    },
    "url": "http://localhost:6776/repos/me/proof/git/trees/1daf69f11ee1f5ff253e1a3300839cf6c7be710f"
  }
}
```
#### Get tree
```bash
+ json -H
+ curl -ivs http://localhost:6776/repos/me/proof/git/trees/1daf69f11ee1f5ff253e1a3300839cf6c7be710f
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/trees/1daf69f11ee1f5ff253e1a3300839cf6c7be710f HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 291
< Date: Thu, 26 Dec 2013 00:02:02 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 291
Date: Thu, 26 Dec 2013 00:02:02 GMT

{
  "err": null,
  "body": {
    "input.txt": {
      "mode": 33188,
      "hash": "ca32e189ce9fc464583de225ae5170bc7b8bf776",
      "url": "http://localhost:6776/repos/me/proof/git/blobs/ca32e189ce9fc464583de225ae5170bc7b8bf776"
    }
  },
  "url": "http://localhost:6776/repos/me/proof/git/trees/1daf69f11ee1f5ff253e1a3300839cf6c7be710f/"
}
```
#### Get blob
```bash
+ curl -ivs http://localhost:6776/repos/me/proof/git/blobs/ca32e189ce9fc464583de225ae5170bc7b8bf776
+ json -H -C content
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/proof/git/blobs/ca32e189ce9fc464583de225ae5170bc7b8bf776 HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: application/json
< Content-Length: 691
< Date: Thu, 26 Dec 2013 00:02:34 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 691
Date: Thu, 26 Dec 2013 00:02:34 GMT

2011-03-09T08:38:01	242
2013-05-08T14:43:02	89
2013-06-08T12:22:34	100
2013-06-08T11:28:39	143
2013-07-14T13:14:37	98
2011-03-08T21:34:27	126
2011-04-08T19:30:37	94
2011-04-08T18:29:12	91
2011-11-08T16:55:07	100
2011-11-08T16:21:07	84
2012-01-14T11:58:00	66
2012-01-14T09:44:39	94
2012-03-14T02:42:41	144
2012-05-14T01:54:29	204
2013-03-08T16:20:21	57
2013-03-08T14:43:02	89
2013-03-08T12:22:34	100
2013-03-08T11:28:39	143
2013-04-14T13:14:37	98
2013-05-14T11:58:00	66
2013-05-14T09:44:39	94
2013-05-14T02:42:41	144
2013-05-14T01:54:29	204
2013-07-14T11:58:00	66
2013-08-14T09:44:39	94

```



## Inspired by

* https://github.com/creationix/js-git/blob/master/examples/create.js
* https://gist.github.com/bewest/8008603
* https://github.com/substack/stream-handbook#transform
* https://github.com/dominictarr/event-stream#eventstream

## TODO

### the rest
* update repo metadata
* update user metadata

#### ROADMAP

* get POST json api endpoints working
  * doublecheck API compatibility with github

* test with memdb
  * develop module for memcache/redis
  * develop module for s3 (knox, request, use proxy to s3)
* test git http support XXX: so far I have only tested using file
  based git bare repo... would prefer http support for mem and s3
  modules
* develop export module
  * bundle with encrypt?
* develop import module
* develop remotes/push module

#### fetch content

```bash
+ curl -ivs http://localhost:6776/repos/me/test/raw/upload/incoming/2014-01-15-79083446/489841/History.md
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> GET /repos/me/test/raw/upload/incoming/2014-01-15-79083446/489841/History.md HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 200 OK
< Connection: close
< Content-Type: text/plain
< Content-Length: 2192
< Date: Wed, 15 Jan 2014 06:06:16 GMT
< 
{ [data not shown]
* Closing connection #0
HTTP/1.1 200 OK
Connection: close
Content-Type: text/plain
Content-Length: 2192
Date: Wed, 15 Jan 2014 06:06:16 GMT



v0.0.3 / 2013-12-25
==================

 * 0.0.2

... commits since last month

  * Ben West - 0.0.2
  * Ben West - 0.0.1
  * Ben West - final move cleanup
  * Ben West - move rest over to single install method
  * Ben West - record WIP, final move
  * Ben West - tweak comment
  * Ben West - delete code moved to handlers
  * Ben West - move get-blob to own handler
  * Ben West - move get tree to own handler
  * Ben West - migrate get-commit handler
  * Ben West - move upload branch handler
  * Ben West - get ready to move rest of handlers
  * Ben West - remove experiment from main area
  * Ben West - update post-upload-pack
  * Ben West - move rest of experiments out of way
  * Ben West - remove previous moved code
  * Ben West - moving one experiment out of the way
  * Ben West - start stubbing out experiment
  * Ben West - remove old version of handler
  * Ben West - tweak whitespace
  * Ben West - get moved handler working
  * Ben West - stub out moving another handler
  * Ben West - move another handler to urlize
  * Ben West - update TODO
  * Ben West - moved to handlers
  * Ben West - move one handler over
  * Ben West - get urlize middleware working
  * Ben West - successfully re-organized this code into ./lib/middleware/
  * Ben West - depend on new upload middleware
  * Ben West - initialize upload middleware
  * Ben West - stub out uploads middleware
  * Ben West - move more middleware
  * Ben West - stub out separating more middleware
  * Ben West - Example re-organize single middleware
  * Ben West - markup TODOs
  * Ben West - make ls-remote work and get start on clone
  * Ben West - ls-remote works now
  * Ben West - ...
  * Ben West - add working and non working examples
  * Ben West - A bit closer?
  * Ben West - basic fixes
  * Ben West - update docs
  * Ben West - make link to blobs work
  * Ben West - working links
  * Ben West - remove spurious README
  * Ben West - Merge branch 'master' of github.com:bewest/restify-git-json
  * Ben West - Initial commit
  * Ben West - stub out bunch more stuff
  * Ben West - Add stubbed out experiments
  * Ben West - add packages
  * Ben West - init
n.n.n / 2013-12-25
==================

 * 0.0.2

```

#### Customize profile creation
```bash
+ json
+ curl -isv -XPOST 'http://localhost:6776/users/crash/create?email=tesser@tidepool.org&name=Tessy+Tidepool&handle=secret&user\[email\]=example@tidepool.org&user\[name\]=Tessy+Tidepool&author\[name\]=Foo+Bar&author\[email\]=secrete@tidepool.io&committer\[name\]=blip+on+behalf+of+secret&committer\[email\]=blip%4Atideool.io&message=my+create+message'
* About to connect() to localhost port 6776 (#0)
*   Trying 127.0.0.1... connected
> POST /users/crash/create?email=tesser@tidepool.org&name=Tessy+Tidepool&handle=secret&user[email]=example@tidepool.org&user[name]=Tessy+Tidepool&author[name]=Foo+Bar&author[email]=secrete@tidepool.io&committer[name]=blip+on+behalf+of+secret&committer[email]=blip%4Atideool.io&message=my+create+message HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0 OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 librtmp/2.3
> Host: localhost:6776
> Accept: */*
> 
< HTTP/1.1 201 Created
< Connection: close
< Content-Type: application/json
< Content-Length: 656
< Date: Sat, 18 Jan 2014 18:43:31 GMT
< 
{ [data not shown]
* Closing connection #0
```
```javascript
{
  "name": "Tessy Tidepool",
  "handle": "secret",
  "email": "tesser@tidepool.org",
  "committer": {
    "name": "blip on behalf of secret",
    "email": "blipJtideool.io"
  },
  "author": {
    "name": "Foo Bar",
    "email": "secrete@tidepool.io"
  },
  "user": "crash",
  "url": "http://localhost:6776/users/crash",
  "updated": {
    "ref": "upload/incoming/2014-01-18-38611838/538497",
    "sha": "538497ec4b9db2eca4c7eb63e9acd0ec234a2c9c",
    "head": {
      "commit": "538497ec4b9db2eca4c7eb63e9acd0ec234a2c9c",
      "tree": {
        "tree": "728aee4bbb551213b1cc829357da3ce118d2b55a",
        "author": {
          "name": "Foo Bar",
          "email": "secrete@tidepool.io"
        },
        "committer": {
          "name": "blip on behalf of secret",
          "email": "blipJtideool.io"
        },
        "message": "my create message"
      }
    }
  }
}
```
