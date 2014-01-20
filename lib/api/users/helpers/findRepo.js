
var Repo = {
    name: require('../../../middleware/users/git-profile-name')
  , path: require('../../../middleware/repo-path')
  , repo: require('../../../middleware/get-repo')
};

function fetchUser (profile, fn) {
  if (!fn) { return fetchUser.bind(this, profile); }
  profile.repo = getRepo(profile);
  findMaster(profile, fn);
}
function getRepo (profile) {
  console.log('FIND REPO FOR', profile);
  var name = profile.name;
  var path = Repo.path.get(name, Repo.name.get(name));
  var repo = Repo.repo.get(path);
  return repo;
}

function findRepo (profile, next) {
  console.log('findRepo', 'for', arguments);
  profile.repo = getRepo(profile);
  next(null, profile);
}
var api = {
    getRepo    : getRepo
  , fetchUser  : fetchUser
  , findRepo   : findRepo
};
module.exports = findRepo;
module.exports.api = api;
