'use strict';


// ---
// Setup: load plugins and define config variables
// ---


// Plugins
import gulp from 'gulp';
import cp from 'child_process';
import shell from 'gulp-shell';
import sequence from 'run-sequence';
import rename from 'gulp-rename';
import svgSymbols from 'gulp-svg-symbols';
import cheerio from 'gulp-cheerio';
import svgmin from 'gulp-svgmin';
import browserSync from 'browser-sync';
import sass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import critical from 'critical';
import gnf from 'gulp-npm-files';
import del from 'del';





// Config
const config = {
  browsersync: {
    server: {
      baseDir: '_site',
      reloadDelay: 2000,
      debounce: 200,
      notify: true,
      ghostMode: {
        clicks: true,
        location: true,
        forms: true,
        scroll: false
      }
    }
  },
  buildmessage: '<span style="color: rgba(#fff,.3)">Building</span> jekyll',
  symbols: {
    title: '%f symbol',
    svgClassname: 'c-symbol-set',
    templates: ['default-svg']
  },
  cheerio: {
    run: function ($) {
      $('[fill]').removeAttr('fill');
    },
    parserOptions: { xmlMode: true }
  },
  sass: {
    outputStyle: 'compressed'
  },
  autoprefixer: {
    browsers: [
      'last 2 version',
      '> 2%',
      'ie >= 9',
      'ios >= 8',
      'android >= 4'
    ]
  },
  cleancss: {
    mediaMerging: false,
    keepSpecialComments: 0
  },
  criticalcss: {
    base: './',
    src: '_site/index.html',
    css: 'css/screen.css',
    dest: '_includes/atom.critical.css',
    dimensions: [{
      height: 736,
      width: 414
    }, {
      height: 900,
      width: 1600
    }],
    minify: true
  },
  jsConcat: 'scripts.js',
  minifyjsConcat: 'scripts.min.js',
  criticaljsConcat: 'atom.enhance.js'
};


const paths = {
  vendor: 'vendor/',
  scssSrc: '_scss/**/*.scss',
  cssSrc: 'css/',
  cssDist: '_site/css/',
  jsSrc: [
    'vendor/jquery/dist/jquery.js',
    'vendor/bootstrap-sass/assets/javascripts/bootstrap.js',
    'js/_scripts/**/*.js'
  ],
  jsDist: 'js/',
  jsJekyllDist: '_site/js/',
  criticaljsSrc: [
    'vendor/fg-loadjs/loadJS.js',
    'vendor/fg-loadcss/src/cssrelpreload.js',
    'vendor/fg-loadcss/src/loadCSS.js',
    'vendor/fg-loadcss/src/onloadCSS.js'
  ],
  criticaljsDist: '_includes/',
  symbolsSrc: '_artwork/symbols/*.svg',
  symbolsDist: 'img/svg/',
  cssWatch: '_scss/**/*.scss',
  criticalcssWatch: 'css/screen.min*',
  jsWatch: 'js/_scripts/**/*.js',
  symbolsWatch: '_artwork/symbols/*.svg',
  siteWatch: [
    'img/**/*.png',
    'img/**/*.jpg',
    'img/**/*.svg',
    '**/*.markdown',
    '**/*.html',
    '_posts/*.md',
    '_data/*.yaml',
    '_config.yml',
    '!_site/**/*.*'
  ]
}





// ---
// Install
// ---


// Copy dependencies from `node_modules` to $paths.vendor
gulp.task('copy-npm-dependencies', () => {
  return gulp.src(gnf(), {base:'./'})
    .pipe(gulp.dest(paths.vendor));
});


// Move `$paths.vendor/node_modules/**/*` to `$paths.vendor/**/*`
gulp.task('copy-vendor-dependencies', ['copy-npm-dependencies'], () =>  {
  return gulp.src(paths.vendor + 'node_modules/**/*')
    .pipe(gulp.dest(paths.vendor));
});


// Delete `$paths.vendor/node_modules`
gulp.task('dependencies', ['copy-vendor-dependencies'], () =>  {
  return del([paths.vendor + 'node_modules/']);
});





// ---
// Symbols
// ---


// Convert multiple svg's to one symbol file
// https://css-tricks.com/svg-symbol-good-choice-icons/
gulp.task('symbols', () => {
  return gulp.src(paths.symbolsSrc)
    .pipe(cheerio(config.cheerio))
    .pipe(svgmin())
    .pipe(svgSymbols(config.symbols))
    .pipe(gulp.dest(paths.symbolsDist));
});





// ---
// CSS
// ---


// Generate css > 'gulp css'
gulp.task('css', () => {
  return gulp.src(paths.scssSrc)
    .pipe(sourcemaps.init())
    .pipe(sass.sync(config.sass).on('error', sass.logError))
    .pipe(postcss([ autoprefixer(config.autoprefixer) ]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.cssDist))
    .pipe(browserSync.stream())
    .pipe(gulp.dest(paths.cssSrc));
});

// Production css > 'gulp productioncss'
gulp.task('productioncss', () => {
  return gulp.src(paths.scssSrc)
    .pipe(sass.sync(config.sass).on('error', sass.logError))
    .pipe(postcss([ autoprefixer(config.autoprefixer) ]))
    .pipe(cleanCSS(config.cleancss))
    .pipe(rename((path) => {
      path.basename += ".min";
    }))
    .pipe(gulp.dest(paths.cssSrc));
});


// Generate critical css > 'gulp criticalcss'
gulp.task('criticalcss', () => {
  critical.generate(config.criticalcss);
});





// ---
// Javascript
// ---


// Concat JS > 'gulp js'
gulp.task('js', () => {
  return gulp.src(paths.jsSrc)
    .pipe(babel({
      presets: ['es2017-node7']
    }))
    .pipe(concat(config.jsConcat))
    .pipe(gulp.dest(paths.jsJekyllDist))
    .pipe(browserSync.stream())
    .pipe(gulp.dest(paths.jsDist));
});


// Compress and concat JS > 'gulp productionjs'
gulp.task('productionjs', () => {
  return gulp.src(paths.jsSrc)
    .pipe(babel({
      presets: ['es2017-node7']
    }))
    .pipe(concat(config.minifyjsConcat))
    .pipe(uglify())
    .pipe(gulp.dest(paths.jsDist));
});


// Concatenate and minify critical js > 'gulp criticaljs'
gulp.task('criticaljs', () => {
  return gulp.src(paths.criticaljsSrc)
    .pipe(concat(config.criticaljsConcat))
    .pipe(uglify())
    .pipe(gulp.dest(paths.criticaljsDist));
});





// ---
// Jekyll
// ---


// Jekyll staging build > 'gulp jekyll'
gulp.task('jekyll', shell.task([
  'bundle exec jekyll build --incremental',
]))


// // Jekyll production build > 'gulp jekyllBuild'
gulp.task('jekyllBuild', shell.task([
  'JEKYLL_ENV=production bundle exec jekyll build',
]))





// ---
// Browsersync
// ---


// Browsersync > 'gulp browsersync'
gulp.task('browsersync', () =>  {
  browserSync.init(config.browsersync);
});


// Browsersync reload after Jekyll build > 'gulp browsersyncReload'
gulp.task('browsersyncReload', ['jekyll'], () => {
  browserSync.reload();
});





// ---
// Main tasks
// ---


// Default task > 'gulp'
gulp.task('default', function(callback) {
  sequence(
    'assets',
    'jekyll',
  callback);
});


// Build task > 'gulp build'
gulp.task('build', function(callback) {
  sequence(
    'production',
    'jekyllBuild',
  callback);
});


// Assets task > 'gulp assets'
gulp.task('assets', function(callback) {
  sequence(
    'dependencies',
    ['css', 'js', 'symbols'],
  callback);
});


// Production task > 'gulp production'
gulp.task('production', function(callback) {
  sequence(
    'dependencies',
    [
      'productioncss',
      'criticalcss',
      'productionjs',
      'criticaljs',
      'symbols'
    ],
  callback);
});


// Watch task > 'gulp watch'
gulp.task('watch', ['default','browsersync'],() => {
  gulp.watch(paths.jsWatch, ['js']);
  gulp.watch(paths.cssWatch, ['css']);
  gulp.watch(paths.symbolsWatch, ['symbols']);
  gulp.watch(paths.siteWatch, ['browsersyncReload']);
});
