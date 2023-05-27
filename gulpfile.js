const {src, dest, parallel, series, watch} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const fileInclude = require('gulp-file-include');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const del = require('del');
const uglify = require('gulp-uglify-es').default
const image = require('gulp-imagemin');
const htmlmin = require('gulp-htmlmin');
const typograff = require('gulp-typograf');
const argv = require('yargs').argv;
const gulpif = require('gulp-if');
const plumber = require('gulp-plumber');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');

const isDev = () => {
  return !argv.prod
}

const isProd = () => {
  return !!argv.prod
}

const fonts = () => {
   src('./src/fonts/**.ttf')
   .pipe(ttf2woff())
   .pipe(dest('./app/fonts'))
   return src('./src/fonts/**.ttf')
   .pipe(ttf2woff2())
   .pipe(dest('./app/fonts'))
}

const svgSprites = () => {
   return src('./src/img/svg/**.svg')
   .pipe(svgmin({
      js2svg: {
         pretty: true,
      }
   }))
   .pipe(cheerio({
      run: function ($) {
         $('[fill]').removeAttr('fill');
         $('[stroke]').removeAttr('stroke');
         $('[style]').removeAttr('style');
       },
       parserOptions: {
         xmlMode: true
       },
   }))
   .pipe(replace('&gt;', '>'))
   .pipe(svgSprite({
      mode: {
         stack: {
            sprite: '../sprite.svg'
         }
      }
   }))
   .pipe(dest('./app/img'))
}

const styles = () => {
   return src('./src/sass/**/*.sass')
   .pipe(gulpif(isDev(), sourcemaps.init()))
   .pipe(sass({
      outputStyle: 'expanded'
   }).on('error', notify.onError()))
   .pipe(rename({
      suffix: '.min'
   }))
   .pipe(gulpif(isProd(), autoprefixer({
    cascade: false
   })))
  .pipe(gulpif(isProd(), cleanCss({
    level: 2
  })))
   .pipe(gulpif(isDev(), sourcemaps.write('.')))
   .pipe(dest('./app/css/'))
   .pipe(browserSync.stream())
}

const htmlInclude = () => {
   return src(['./src/*.html'])
   .pipe(fileInclude({
      prefix: '@',
      basepath: '@file'
   }))
   .pipe(typograff({
    locale: ['ru', 'en-US']
   }))
   .pipe(gulpif(isProd(), htmlmin({
    collapseWhitespace: true
   })))
   .pipe(dest('./app'))
   .pipe(browserSync.stream())
}

const imgToApp =() => {
   return src(['./src/img/**.jpg', './src/img/**.png', './src/img/**.jpeg', './src/img/**.svg'])
   .pipe(gulpif(isProd(), image()))
   .pipe(dest('./app/img'))
}

const resources = () => {
   return src('./src/resources/**')
   .pipe(dest('./app'))
}

const clean = () => {
   return del(['./app/*'])
}

const scripts = () => {
   return src(['./src/js/main.js', './src/js/vendor/**/*.js'])
   .pipe(plumber({
    errorHandler: notify.onError()
   }))
   .pipe(gulpif(isDev(), sourcemaps.init()))
   .pipe(babel({
    presets: ['@babel/env']
   }))
   .pipe(concat('main.js'))
   .pipe(gulpif(isProd(), uglify()))
   .pipe(gulpif(isDev(), sourcemaps.write('.')))
   .pipe(dest('./app/js'))
   .pipe(browserSync.stream())
}

const watchFiles = () => {
   browserSync.init({
      server: {
         baseDir: "./app"
      }
   })
   watch('./src/sass/**/*.sass', styles)
   watch('./src/*.html', htmlInclude)
   watch('./src/img/**.jpg', imgToApp)
   watch('./src/img/**.png', imgToApp)
   watch('./src/img/**.jpeg', imgToApp)
   watch('./src/img/**.svg', imgToApp)
   watch('./src/img/svg/**.svg', svgSprites)
   watch('./src/resources/**', resources)
   watch('./src/fonts/**.ttf', fonts)
   watch('./src/js/**/*.js', scripts)
}

exports.styles = styles
exports.watchFiles = watchFiles
exports.default = series(clean, parallel(htmlInclude, fonts, scripts, resources, imgToApp, svgSprites), styles, watchFiles)

