
function callbacks (profile, committer, msg) {
  var config = { };
  function getMessage (fn) {
    fn(msg);
  }
  function getAuthor (fn) {
    console.log('getAuthor', profile.author);
    if (profile.author) {
      return fn({name: profile.author.handle || profile.author.name, email: profile.author.email});
    }
    if (profile.user) {
      return fn({name: profile.user.handle || profile.user.name, email: profile.user.email});
    }
    fn({name: profile.handle, email: profile.email});
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
module.exports = callbacks;
