
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
    path.basename(filename).should.equal(path.basename(fixture(1)))
    done()
  })

  // why i must do this, i do not know.
  setImmediate(function () {
    update(1)
  })
})

it('should emit `change` on any changes', function (done) {
  watcher.watch('files', [1, 2, 3, 4].map(fixture))

  watcher.once('change', function (filename) {
    path.basename(filename).should.equal(path.basename(fixture(1)))
    done()
  })

  // why i must do this, i do not know.
  setImmediate(function () {
    update(1)
  })
})

it('should unwatch when replaced', function (done) {
  watcher.watch('files', [1, 2, 3].map(fixture))
  assert(!watcher.watchers[fixture(4)])

  watcher.once('files', function () {
    done(new Error())
  })

  setImmediate(function () {
    update(4)
    done()
  })
})

describe('renaming', function () {
  var name = fixture(5)
  beforeEach(function () {
    fs.writeFileSync(name, 'foobar')
  })

  afterEach(function () {
    if (fs.existsSync(name))
      fs.unlinkSync(name)
  })

  it('should re-watch when overwritten', function (done) {
    watcher.watch('files2', [name])
    watcher.once('files2', function () {
      watcher.once('files2', function () { done() })
      update(5)
    })
    var name2 = fixture(6)
    fs.writeFileSync(name2, 'foobar2')
    fs.renameSync(name2, name)
  })

  it('should not throw when really removing/renaming file', function (done) {
    watcher.watch('files2', [name])
    watcher.once('files2', function () { done() })
    fs.unlinkSync(name)
  })
})

function update(number) {
  fs.utimesSync(fixture(number), new Date(), new Date())
}

function fixture(number) {
  return path.resolve(__dirname, 'fixtures', String(number) + '.js')
}
