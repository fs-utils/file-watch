
var EventEmitter = require('events').EventEmitter
var debug = require('debug')('file-watch')
var inherits = require('util').inherits
var equal = require('array-equal')
var exclude = require('exclude')
var watch = require('fs').watch
var exists = require('fs').existsSync

module.exports = Watcher

inherits(Watcher, EventEmitter)

function Watcher() {
  if (!(this instanceof Watcher)) return new Watcher()

  this.onerror = this.onerror.bind(this)

  // name -> files lookup
  this.map = {}
  // filename -> watcher lookup
  this.watchers = {}
  // variable for fixin problem with Windows with double fire
  this.lastFire=[null,'',0];
}

Watcher.prototype.watch = function (name, files) {
  debug('watching %s: %s', name, files.join(', '))
  var self = this
  var map = this.map
  var onerror = this.onerror
  var watchers = this.watchers

  // create a watcher for this file if not already
  files.forEach(function (filename) {
    // already watching
    if (watchers[filename]) return
    // watch the file
    addWatcher()

    function addWatcher() {
      if (!exists(filename)) return debug('%s does not exist', filename)

      watchers[filename] = watch(filename, {
        persistent: true
      }, function (event) {
        // Catch event clone
        if (self.lastFire[0]===event[0]&&self.lastFire[1]===event[1]&&(new Date())-self.lastFire[2]<20) return; 
        self.lastFire=[event[0],event[1],new Date()];
        // filename is not guaranteed to be emitted with fs.watch,
        // so we make sure to emit `filename` ourselves.
        debug('%s: %s', event, filename)
        self.emit(name, filename)
        self.emit('change', filename)
        if (event === 'rename') readdWatcher()
      }).on('error', function (err) {
        onerror(err)
        readdWatcher()
      })
    }

    function readdWatcher() {
      watchers[filename].close()
      delete watchers[filename]
      addWatcher()
    }
  })

  var older = map[name]
  if (older && !equal(files, older)) {
    delete map[name]
    var names = Object.keys(map)
    debug('diffing %s against %s', files.join(', '), older.join(', '))
    // remove files that we no longer care for
    exclude(older, files).forEach(function (filename) {
      // still has listeners, ignore
      for (var i = 0; i < names.length; i++)
        if (~map[names[i]].indexOf(filename))
          return

      debug('unwatching %s', filename)
      // no more listeners, so just close it
      watchers[filename].close()
      delete watchers[filename]
    })
  }

  map[name] = files

  return this
}

Watcher.prototype.close =
Watcher.prototype.destroy = function () {
  debug('destroyed')
  Object.keys(this.watchers).forEach(function (filename) {
    this.watchers[filename].close()
  }, this)
  this.map = {}
  this.watchers = {}
  return this
}

Watcher.prototype.onerror = function (err) {
  if (err) this.emit('error', err)
}
