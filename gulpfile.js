var gulp = require('gulp');


var paths = {
  libs: ['lib/message.js', 'lib/database.js', 'lib/language.js', 'lib/classify.js'],
  };

// Not all tasks need to use streams
// A gulpfile is just another node program and you can use any package available on npm
gulp.task('clean', function() {
  // You can use multiple globbing patterns as you would with `gulp.src`
  return del(['build']);
});





// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.libs, ['docs']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'docs']);



gulp.task('docs', function () {
  const fs = require('fs-then-native')
  const jsdoc2md = require('jsdoc-to-markdown')

  return jsdoc2md.render({ files: paths.libs })
    .then(output => fs.writeFile('docs.md', output))
})