var gulp = require('gulp');
var execSync = require('child_process').execSync;


var paths = {
  libs: ['lib/processor.js', 'lib/message.js', 'lib/statemachine.js', 'lib/database.js', 'lib/language.js', 'lib/classify.js'],
  statemachines: ['dialog/snowmanstates.js', 'dialog/dialogstates.js']
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
  gulp.watch(paths.statemachines, ['statemachines']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'docs', 'statemachines']);



gulp.task('docs', function () {
  const fs = require('fs-then-native')
  const jsdoc2md = require('jsdoc-to-markdown')

  return jsdoc2md.render({ files: paths.libs, configure: 'jsdoc.json' })
    .then(output => fs.writeFile('docs.md', output))
})

/**
 * Document any statemachines, loads StateMachine class, reads in
 * and calls describe() on each of them to construct a GraphViz .dot
 * digraph description and then runs GraphViz dot to produce an SVG
 * visualisation.
 *
 * @method statemachines
 *
 */
gulp.task('statemachines', function () {
    const fs = require('fs-then-native');
    const { StateMachine } = require('./lib/statemachine.js');
    console.log(execSync('pwd').toString());
    for (let source of paths.statemachines){
        // Need to invalidate node cache or we don't get latest version...
        delete require.cache[require.resolve('./'+source)]
        const sm = new StateMachine(require('./'+source));
        const dot = sm.describe();
        const dotFile = source.replace(/\.js$/,'.dot');
        const svgFile = source.replace(/\.js$/,'.svg');
        fs.writeFile(source.replace(/\.js$/,'.dot'), dot)
        .then(() => {
            var svg = execSync(`dot -Tsvg ${dotFile}`).toString();
            fs.writeFile(svgFile, svg);
        })
    }
})
