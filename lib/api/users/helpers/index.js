
var callbacks = require('./callbacks');
var save = require('./save');
var saveDelta = save.saveDelta;
var create = require('./create');
var init = require('./init');
var applyDelta = require('./delta');
var findRepo = require('./findRepo');
var findMaster = require('./findMaster');
var api = {
    applyDelta: applyDelta
  , saveDelta: saveDelta
  , callbacks: callbacks
  , init: init
  , save: save
  , create: create
  , findRepo: findRepo
  , findMaster: findMaster
};
module.exports = api;
