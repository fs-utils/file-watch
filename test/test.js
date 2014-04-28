
var fs = require('fs')
var path = require('path')
var assert = require('assert')

var Watcher = require('..')
var watcher = new Watcher()

it('should watch', function (done) {
  watcher.watch('files', [1, 2, 3, 4].map(fixture))
  watcher.watchers[fixture(1)].should.be.ok
  watcher.map.files.length.should.equal(4)

  watcher.once('files', function (filename) {
    filename.should.equal(path.basename(fixture(1)))
    done()
  })

  // why i must do this, i do not know.
  setImmediate(function () {
    update(1)
  })
})

it('should unwatch when replaced', function (done) {
  watcher.watch('files', [1, 2, 3].map(fixture))
  assert(!watcher.watchers[fixture[4]])

  watcher.once('4.js', function () {
    done(new Error())
  })

  setImmediate(function () {
    update(4)
    done()
  })
})

function update(number) {
  fs.utimesSync(fixture(number), new Date(), new Date())
}

function fixture(number) {
  return path.resolve(__dirname, 'fixtures', String(number) + '.js')
}
