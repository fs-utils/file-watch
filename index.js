
var EventEmitter = require('events').EventEmitter
var debug = require('debug')('file-watch')
var inherits = require('util').inherits
var watch = require('fs').watch

module.exports = Watcher

inherits(Watcher, EventEmitter)

function Watcher() {
  if (!(this instanceof Watcher)) return new Watcher()

  this.onerror = this.onerror.bind(this)

  // name -> files lookup
  this.map = {}
  // filename -> watcher lookup
  this.watchers = {}
}

Watcher.prototype.watch = function (name, files) {
  debug('watching %s: %s', name, files.join(', '))
  var self = this
  var map = this.map
  var onerror = this.onerror
  var watchers = this.watchers

  files.forEach(function (filename) {
    // already watching
    if (watchers[filename]) return
    // watch the file
    watchers[filename] = watch(filename, {
      persistent: true
    }, onChange).on('error', onerror)
  })

  if (map[name]) {
    var older = map[name]
    delete map[name]
    var names = Object.keys(map)
    difference(files, older).forEach(function (filename) {
      // still has listeners, ignore
      for (var i = 0; i < names.length; i++)
        if (~map[name].indexOf(filename))
          return

      // no more listeners, so just close it
      watchers[filename].close()
      delete watchers[filename]
    })
  }

  map[name] = files

  return this

  function onChange(event, filename) {
    debug('%s: %s', event, filename)
    // how to handle rename?
    self.emit(name, filename)
  }
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

// external module for this?
function difference(newer, older) {
  var buf = older.slice()
  newer.forEach(function (thing) {
    var index = older.indexOf(thing)
    if (~index) older.splice(index, 1)
  })
  return buf
}
