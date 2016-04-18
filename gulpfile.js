var fs = require('fs');
var gulp = require('gulp');
var karma = require('karma');
var concat = require('gulp-concat');
var header = require('gulp-header');
var rename = require('gulp-rename');
var del = require('del');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber');
var order = require("gulp-order");
var flatten = require("gulp-flatten");
var eslint = require('gulp-eslint');

var config = {
    pkg : JSON.parse(fs.readFileSync('./package.json')),
    banner:
    '/*!\n' +
    ' * <%= pkg.name %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' * License: <%= pkg.license %>\n' +
    ' */\n\n\n'
};

gulp.task('watch', function () {
    gulp.watch(['./src/**/*.js'], ['build']);
});

gulp.task('clean', function(cb) {
    del(['dist'], cb);
});

gulp.task('lint', function () {
  return gulp.src('src/*.js')
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('scripts', function() {
    return gulp.src('src/*.js')
        .pipe(plumber({
            errorHandler: handleError
        }))
        .pipe(order([
            'solution-center-login.js',
            'template.js'
        ]))
        .pipe(concat('solution-center-login.js'))
        .pipe(header(config.banner, {
            pkg: config.pkg
        }))
        .pipe(gulp.dest('dist'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify({preserveComments: 'some'}))
        .pipe(gulp.dest('./dist'))
});

gulp.task('lint-test', function(){
    return gulp.src('./test/**/*.js')
        .pipe(eslint());
});

gulp.task('karma', ['build'], function (done) {
  new karma.Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

function handleError(err) {
    console.log(err.toString());
    this.emit('end');
}

gulp.task('build', ['lint', 'scripts']);
gulp.task('test', ['build', 'lint-test', 'karma']);
gulp.task('default', ['build', 'test']);
