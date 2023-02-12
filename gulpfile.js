'use strict';
const { SRC, DIST, STYLES, JS } = require('./config-gulp.js'); // Paths
const { src, dest, parallel, series, watch, task } = require('gulp');

const isProd = process.env.NODE_ENV;

const browserSync = require('browser-sync').create();
const clean = require('gulp-clean');
const gulpIf = require('gulp-if');
const concat = require('gulp-concat');
// Code
const pug = require('gulp-pug');
// SCSS -> CSS
const sass = require('gulp-sass')(require('sass'));
const glob = require('gulp-sass-glob');
const cleanCss = require('gulp-clean-css');
const prefix = require('gulp-autoprefixer');
// JS -> legacy JS
const babel = require('gulp-babel');
const minJS = require('gulp-uglify');
// convertation && minimize
const minImg = require('gulp-imagemin');
const webpImg = require('gulp-webp');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
// Fonts
const ttfToWoff = require('gulp-ttf2woff');
const ttfToWoff2 = require('gulp-ttf2woff2');
const fontfacegen = require('./fonts');

task('clean', () => src(`${DIST}/*`, { read: false, ignore: [`${DIST}/img`, `${DIST}/fonts`] })
  .pipe(clean()))
task('cleanAll', () => src(`${DIST}/*`, { read: false, ignore: [`${DIST}/fonts`] })
  .pipe(clean()))

task('browser', function () {
  browserSync.init({
    server: `./${DIST}`,
    open: true,
  })
});
// Convert & Copy
task('pug:html', () => src(`./${SRC}/*.pug`)
  .pipe(gulpIf(isProd == "build", pug({ pretty: false }), pug({ pretty: true })))
  .pipe(dest(DIST)));
task('copy:img', () => src(`./${SRC}/img/**/*`)
  .pipe(minImg([minImg.mozjpeg({ quality: 100, progressive: true }), minImg.optipng({ optimizationLevel: 3 }),]))
  .pipe(webpImg())
  .pipe(dest(`${DIST}/img`)));
task('copy:svg', () => src(`./${SRC}/icons/**/*.svg`)
  .pipe(svgo({
    plugins: [{
      removeAttrs: {
        attrs: '(fill|stroke)'
      }
    }]
  }))
  .pipe(svgSprite({
    mode: {
      symbol: {
        sprite: '../sprite.svg'
      }
    }
  }))
  .pipe(dest(`./${DIST}`)));
task('sass', () => src(STYLES, { sourcemaps: gulpIf(isProd != 'build', true, false) })
  .pipe(glob())
  .pipe(sass())
  .pipe(concat('main.min.css'))
  .pipe(prefix())
  .pipe(gulpIf(isProd == 'build', cleanCss({ level: 2 })))
  .pipe(dest(`${DIST}`, { sourcemaps: gulpIf(isProd != 'build', true, false) })));
task('js', () => src(JS, { sourcemaps: gulpIf(isProd != 'build', true, false) })
  .pipe(concat('main.min.js'))
  .pipe(babel({
    presets: ['@babel/env'],
  }))
  .pipe(gulpIf(isProd == 'build', minJS()))
  .pipe(dest(DIST, { sourcemaps: gulpIf(isProd != 'build', true, false) })));
// Fonts
task('ttfToWoff2', () => src(`${SRC}/fonts/*.ttf`)
  .pipe(ttfToWoff2())
  .pipe(dest(`${SRC}/fonts/converted`))
);
task('ttfToWoff', () => src(`${SRC}/fonts/*.ttf`)
  .pipe(ttfToWoff())
  .pipe(dest(`${SRC}/fonts/converted`))
);
task('fontsGenCss', () => src(`${SRC}/fonts/converted/**/*.{woff,woff2}`)
  .pipe(fontfacegen({
    filepath: `${SRC}/sass/layout`,
    filename: 'font.scss'
  }))
);
task('copy:fonts', () => src(`${SRC}/fonts/converted/**/*`)
  .pipe(dest(`${DIST}/fonts`)));
task('fonts', series(parallel('ttfToWoff', 'ttfToWoff2'), 'fontsGenCss', 'copy:fonts'));


task('reloading', () => src(DIST)
  .pipe(browserSync.reload({ stream: true })));

watch([SRC, `!${SRC}/fonts/**/*`], series('clean', parallel('pug:html', 'copy:svg', 'sass', 'js'), 'reloading'));
task('default', series('cleanAll', parallel('pug:html', 'copy:img', 'copy:svg', 'sass', 'js'), 'browser'));