
function valid (origin, field, value) {
  return value || origin[field];
}
function install (origin, each, root) {
  return function (key) {
    console.log("KEY", key, root[key]);
    return (origin[key] = each(origin, key, root[key]));
  }
}
var    keys = ['name', 'handle', 'email', 'committer', 'author', 'data'];

// TODO: get decent merge from somewhere
// intent is to pluck a few whitelisted keys
function applyDelta (profile, update) {
  var user = { };
  keys.forEach(install(user, valid, profile.user));
  keys.forEach(install(user, valid, update));
  profile.user = user;
  profile.author = user.author || profile.author;
  profile.committer = user.committer || null;
  return profile;
}
module.exports = applyDelta;
module.exports.valid = valid;
module.exports.install = install;
