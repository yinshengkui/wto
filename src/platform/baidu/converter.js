const fs = require('fs');
const gulp = require('gulp');
const fse = require('fs-extra');
const rename = require('gulp-rename');
const replace = require('gulp-replace');

function convert(opt = {}) {
  const src = opt.source || './src';
  const dest = opt.target || './baidu';
  const assets = opt.assets || [
    src + "/**/*.json",
    src + "/**/*.png",
    src + "/**/*.jpg",
    src + "/**/*.gif"
  ];

  fse.remove(dest).then(() => {
    gulp.src(assets)
      .pipe(gulp.dest(dest));

    gulp.src(src + "/**/*.wxss")
      .pipe(replace('.wxss"', '"'))
      .pipe(replace(/url\(['"](\/\/[^'"]+)['"]\)/ig, function(match, p1) {
        // 背景url属性值必须带协议
        return match.replace(/\/\//g, m => 'https:' + m);
      }))
      .pipe(replace(/url\((\/\/[^'"]+)\)/ig, function(match, p1) {
        // 背景url属性值必须带协议
        return match.replace(/\/\//g, m => 'https:' + m);
      }))
      .pipe(replace(/[^,}\n]*image[,{]/ig, function(match, p1) {
        // 修复不支持image子元素选择器的问题
        return match.replace(/image/g, '.fix-image-cls');
      }))
      .pipe(rename(function(path) {
        path.extname = ".css";
      }))
      .pipe(gulp.dest(dest));

    gulp.src(src + "/**/*.wxml")
      .pipe(replace('wx:', 's-'))
      .pipe(replace('s-for-items', 's-for'))
      .pipe(replace('.wxml', '.swan'))
      .pipe(replace('></input>', '/>'))
      .pipe(replace(/<[\w]+/ig, function(match, p1) {
        // 自定义组件命名不能用驼峰
        return match.replace(/[A-Z]/g, (m) => {return ['-', m.toLowerCase()].join('')})
      }))
      .pipe(replace(/<\/[\w]+>/ig, function(match, p1) {
        // 自定义组件命名不能用驼峰
        return match.replace(/[A-Z]/g, (m) => {return ['-', m.toLowerCase()].join('')})
      }))
      .pipe(replace(/{{[^}]+(<)[^=\s][^}]+}}/ig, function(match, p1) {
        // 三目运算 "<" 后面不能直接跟非空白字符
        return match.replace(p1, [p1, ' '].join(''));
      }))
      .pipe(replace(/{{[^}\d]*(\.)[\d][^}]+}}/g, function(match, p1) {
        // 浮点数不能忽略小数点前面的0
        return match.replace(p1, ['0', p1].join(''));
      }))
      .pipe(replace(/scroll-into-view=["']{{([^}]+)}}["']/g, function(match, p1) {
        // scroll-into-view 属性值格式 {{=value=}}
        return match.replace('{{', '').replace('}}', '').replace(p1, '{=' + p1 + '=}');
      }))
      .pipe(replace(/scroll-top=["']{{([^}]+)}}["']/g, function(match, p1) {
        // scroll-top 属性值格式 {{=value=}}
        return match.replace('{{', '').replace('}}', '').replace(p1, '{=' + p1 + '=}');
      }))
      .pipe(replace(/scroll-left=["']{{([^}]+)}}["']/g, function(match, p1) {
        // scroll-left 属性值格式 {{=value=}}
        return match.replace('{{', '').replace('}}', '').replace(p1, '{=' + p1 + '=}');
      }))
      .pipe(replace(/<template.*\s+data=["']({{[^}]+}})/g, function(match, p1) {
        // 模板数据格式 {{{value}}}
        return match.replace(p1, '{' + p1 + '}');
      }))
      .pipe(replace(/<image([^>]+)>/g, function(match, p1) {
        // 修复不支持image子元素选择器的问题
        if (match.match(/class=/)) {
          return match;
        }
        return match.replace(p1, [' class="fix-image-cls" ', p1].join(''));
      }))
      .pipe(replace(/url=["']{{([^{}\s\?=]+)}}/ig, function(match, p1) {
        // url属性值必须带协议
        return match.replace(p1, '(' + p1 +'[0]==\'/\' && ' + p1 + '[1]==\'/\') ? \'https:\' + ' + p1 + ':' + p1);
      }))
      .pipe(replace(/url\({{([^{}\s\?=]+)}}/ig, function(match, p1) {
        // 背景url属性值必须带协议
        return match.replace(p1, '(' + p1 +'[0]==\'/\' && ' + p1 + '[1]==\'/\') ? \'https:\' + ' + p1 + ':' + p1);
      }))
      .pipe(rename(function(path) {
        path.extname = ".swan";
      }))
      .pipe(gulp.dest(dest));

    gulp.src(src + "/**/*.json")
      .pipe(replace(/usingComponents([^}]+)/g, function(match, p1) {
        return match.replace(/"([\w]+)":/ig, (m, p1) => {
          // 自定义组件命名不能用驼峰
          return m.replace(p1, p1.replace(/[A-Z]/g, (m) => {
            return ['-', m.toLowerCase()].join('')
          }));
        });
      }))
      .pipe(gulp.dest(dest));

    const patch = fs.readFileSync(__dirname + '/patch.js', 'utf8');
    return gulp.src(src + "/**/*.js")
      .pipe(replace(/([\s\S]*)/, patch + '$1'))
      .pipe(replace(/\.option\.transition\.delay/g, '.delay'))
      .pipe(replace(/\.option\.transition\.duration/g, '.duration'))
      .pipe(replace(/\.option\.transition\.timingFunction/g, '.duration'))
      .pipe(gulp.dest(dest));
  });
}

module.exports = convert;