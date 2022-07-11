'use strict';
const gulp = require('gulp');
const crossEnv = process.env.NODE_ENV;
const gulpIf = require('gulp-if');
const clean = require('gulp-clean');
const browserSync = require('browser-sync').create();
const gulpConcat = require('gulp-concat');
const gulpMaps = require('gulp-sourcemaps');
const sass = require('gulp-sass')(require('sass'));
const sassGlob = require('gulp-sass-glob');
const cleanCSS = require('gulp-clean-css');
const cssAutoPrefix = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const imageMin = require('gulp-imagemin');
const imgToWebp = require('gulp-webp');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const ttfToWoff = require('gulp-ttf2woff');
const ttfToWoff2 = require('gulp-ttf2woff2');
const fontfacegen = require('gulp-fontfacegen');

const files = ['./src/*.html', './src/img/**/*', './src/icons/**/*', './src/sass/**/*'];

gulp.task('clean', () => gulp.src('./docs', { read: false })
  .pipe(clean()));

gulp.task('copy:html', () => gulp.src('./src/*.html')
  .pipe(gulp.dest('./docs'))
  .pipe(browserSync.reload({ stream: true })));

gulp.task('copy:img', () => gulp.src('./src/img/**/*')
  .pipe(imageMin({
    plugins: [
      imageMin.gifsicle(), imageMin.mozjpeg(), imageMin.optipng(),
    ]
  }))
  .pipe(imgToWebp({ quality: 50 }))
  .pipe(gulp.dest('./docs/images'))
  .pipe(browserSync.reload({ stream: true }))
);

gulp.task('ttfToWoff2', () => gulp.src('./src/fonts/**/*')
  .pipe(ttfToWoff2())
  .pipe(gulp.dest('./docs/fonts/'))
);

gulp.task('ttfToWoff', () => gulp.src('./src/fonts/**/*')
  .pipe(ttfToWoff())
  .pipe(gulp.dest('./docs/fonts'))
);

gulp.task('convertFont', () => gulp.src('./docs/fonts/**/*.{woff,woff2}')
  .pipe(fontfacegen({
    filepath: './docs',
    filename: 'font.css'
  }))
  .pipe(gulp.dest('./docs/fonts'))
);

gulp.task('copy:fonts', gulp.series(gulp.parallel('ttfToWoff', 'ttfToWoff2'), 'convertFont'));

gulp.task('copy:icons', () => gulp.src('./src/icons/**/*')
  .pipe(svgo({
    plugins: [{
      removeAttrs: {
        attrs: '(fill|stroke|style|width|height|data.*)'
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
  .pipe(gulp.dest('./docs/icons'))
);

gulp.task('sass', () => gulp.src('./src/scss/main.scss')
  .pipe(gulpIf(crossEnv === 'dev', gulpMaps.init()))
  .pipe(sassGlob())
  .pipe(sass())
  .pipe(gulpConcat('main.min.css'))
  .pipe(gulpIf(crossEnv === 'build', gcmq()))
  .pipe(gulpIf(crossEnv === 'build', cssAutoPrefix({ browsers: ['last 2 versions'], cascade: false })))
  .pipe(gulpIf(crossEnv === 'build', cleanCSS()))
  .pipe(gulpIf(crossEnv === 'dev', gulpMaps.write()))
  .pipe(gulp.dest('./docs/'))
  .pipe(browserSync.reload({ stream: true }))
);

gulp.task('browser', () => {
  browserSync.init({
    server: {
      baseDir: './docs'
    },
    open: false,
  });
});

gulp.watch(files, gulp.series('clean', 'copy:html', 'copy:img', 'copy:icons', 'sass'));

gulp.task('default', gulp.series('clean', 'copy:html', 'copy:img', 'copy:icons', 'copy:fonts', 'sass', 'browser'));