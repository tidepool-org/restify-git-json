
function findMaster (profile, next) {
  function onBlob (err, blob) {
    if (err) return next(null, profile);
    profile.user = JSON.parse(blob.toString( ));
    next(null, profile);
  }
  function onTree (err, tree) {
    if (err) { return next(null, {err:err, profile:profile, tree:tree}); }
    profile.repo.loadAs('blob', tree['profile.json'].hash, onBlob);
  }
  function onMaster (err, master, hash) {
    console.log('master found', hash, err, 'next', next);
    if (err) {
      // user does not exist
      delete profile.repo;
      return next(null, {err: 'does not exist', profile: profile});
    }
    if (master) {
      var author = JSON.parse(JSON.stringify(master.body.author));
      var committer = JSON.parse(JSON.stringify(master.body.committer));
      profile.lastUpdated = master.body.committer.date || master.body.author.date;
      delete author.date;
      delete committer.date;
      profile.author = author;
      profile.committer = committer;
      
    }
    return profile.repo.loadAs('tree', master.body.tree, onTree);
  }
  profile.repo.load('refs/heads/master', onMaster);
}
module.exports = findMaster;
