# File Watch

Super simple file watcher.
Unlike other watchers that listen on directories and globs,
this file only listens to specific files.
This is specifically made for [normalize-builder](https://github.com/normalize/builder.js) where all files are known and constantly updated.

## API

```js
var Watcher = require('file-watch')

var watcher = new Watcher()

watcher.watch('custom event', [
  'file1.txt',
  'file2.txt',
])

watcher.on('custom event', function () {
  console.log('custom event!')
})
```

Now when `file1.txt` or `file2.txt` and changed,
`custom event` will be emitted.
