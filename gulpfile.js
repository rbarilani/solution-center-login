var fs = require('fs');
var connect = require('gulp-connect');
var gulp = require('gulp');
var karma = require('karma').server;
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var header = require('gulp-header');
var rename = require('gulp-rename');
var es = require('event-stream');
var del = require('del');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber');
var open = require('gulp-open');
var order = require("gulp-order");
var flatten = require("gulp-flatten");

var config = {
    pkg : JSON.parse(fs.readFileSync('./package.json')),
    banner:
    '/*!\n' +
    ' * <%= pkg.name %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' * License: <%= pkg.license %>\n' +
    ' */\n\n\n'
};

gulp.task('connect', function() {
    connect.server({
        root: '.',
        livereload: true
    });
});

gulp.task('watch', function () {
    gulp.watch(['./src/**/*.js'], ['build']);
});

gulp.task('clean', function(cb) {
    del(['dist'], cb);
});

gulp.task('scripts', function() {

    function buildDistJS(){
        return gulp.src('src/*.js')
            .pipe(plumber({
                errorHandler: handleError
            }))
            .pipe(jshint())
            .pipe(jshint.reporter('jshint-stylish'))
            .pipe(jshint.reporter('fail'));
    };

    es.merge(buildDistJS(), buildTemplates())
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
        .pipe(connect.reload());
});

gulp.task('jshint-test', function(){
    return gulp.src('./test/**/*.js').pipe(jshint());
});

gulp.task('karma', ['build'], function (done) {
    karma.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done);
});

gulp.task('karma-serve', ['build'], function(done){
    karma.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: false
    }, done);
});

function handleError(err) {
    console.log(err.toString());
    this.emit('end');
};

gulp.task('build', ['scripts']);
gulp.task('serve', ['build', 'connect', 'watch', 'open']);
gulp.task('default', ['build', 'test']);
gulp.task('test', ['build', 'jshint-test', 'karma']);
gulp.task('serve-test', ['build', 'watch', 'jshint-test', 'karma-serve']);
