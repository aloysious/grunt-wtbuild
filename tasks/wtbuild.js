/*
 * grunt-wtbuild
 * https://github.com/aloysious/grunt-wtbuild
 *
 * Copyright (c) 2013 aloysious
 * Licensed under the MIT license.
 */

'use strict';

var kmc = require('kmc'),
	kmcUtils = require('kmc/lib/utils'),
	path = require('path'),
	fs = require('fs'),
	os = require('os'),
	_ = require('lodash');


/**
 * @brief 获取模块依赖关系，写到指定文件 
 *
 * @param mods {Object} 模块列表
 * @param depFile {String} 生成的依赖关系配置文件路径
 * @param depFileCharset {String} 输出文件编码格式
 *
 * @return content
 */
function getModsDependencise(mods, depFile, depFileCharset) {
	var content = [];

	if (_.isObject(mods)) {
		_.forEach(mods, function(mod, modName) {
			if (!_.isEmpty(mod.dependencies)) {
				var requires = [];

				_.forEach(mod.dependencies, function(subMod) {
					requires.push("'" + subMod.name + "'");
				});
				content.push("'" + modName + "': {requires: [" + requires.join(', ') + "]}");
			}
		});
	}
	content = content.length ? "KISSY.config('modules', {" + os.EOL + " " + content.join("," + os.EOL + " ") + " " + os.EOL + "});" : "";

	if (content && depFile) {
		kmcUtils.writeFileSync(depFile, content, depFileCharset);
	}

	return content;

}

/**
 * @brief compileSrcDemo 
 *
 * @param srcFile
 * @param destFile
 * @param options
 *
 * @return 
 */
function compileSrcDemo(srcFile, destFile, options) {
	var srcPath = path.dirname(srcFile),
		rawContent = fs.readFileSync(srcFile).toString(),
		rawArr = [],
		styleSheets = [],
		url = options.domain + '/' + options.group + '/' + options.project + '/' + options.version + '/';

	rawContent = rawContent.replace(/<!--#include\s+virtual="(.*)"\s*-->/g, function(match, content) {
		console.log(match);
		return fs.readFileSync(srcPath + '/' + content).toString();
	});

	rawArr = rawContent.split('</head>');

	rawArr[1] = rawArr[1].replace(/\s*<link.+href="(.*)".*\/>/g, function(match, content) {
		content = path.relative(srcPath, content);
		console.log('+++++++++++' + content);
		styleSheets.push(content);
		return '';
	});

	var tmpLinkSrc = '\n\r<link rel="stylesheet" src="' + url + '??';
	tmpLinkSrc += styleSheets.join(',');
	tmpLinkSrc += '" />\n\r';
	rawArr[0] += tmpLinkSrc;

	return rawArr.join('</head>');
}

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('wtbuild', 'Your task description goes here.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options(),
	  	compileOnly = options.compileOnly,
	  	depOnly = options.depOnly;

  	kmc.config(options);

	// Iterate over all specified file groups.
	this.files.forEach(function (f) {
		var depFile = '',
	  		mods = {},
			depExt = options.depExt,
			depFilePath = options.depFilePath,
	  		depFileCharset = options.depFileCharset || options.charset;

		if (depOnly === true) {
			f.src.forEach(function(src){
				var inputSrc = path.resolve(src),
					outputSrc = path.resolve(String(f.dest)),
					mod = kmc.analyze(inputSrc);

				mods[mod.name] = mod;
				if(depExt || depFilePath){
					depExt = depExt || '.dep';
					var outputIsDir = grunt.file.isDir(outputSrc) || !/\.j$/.test(outputSrc);
					if(depFilePath){
						depFile = grunt.file.isDir(depFilePath) ? path.resolve(depFilePath, path.basename(outputIsDir ? path.basename(inputSrc, '.js') :outputSrc) + depExt + '.js') : depFilePath;
					}else{
						var dir = outputIsDir ? outputSrc : path.dirname(outputSrc);
						depFile = path.resolve(dir, path.basename(inputSrc, '.js') + depExt + '.js');
					}
				}
			});

			getModsDependencise(mods, depFile, depFileCharset);
			grunt.log.writeln('Dep File "' + depFile + '" created.');
		
		}

		if (compileOnly === true) {
			var domain = options.domain,
				group = options.group,
				project = options.project,
				version = options.version;

			f.src.forEach(function(src){
				var inputSrc = path.resolve(src),
					outputSrc = path.resolve(String(f.dest)),
					outputFile = path.resolve(outputSrc, path.basename(inputSrc)),
					content = '';

			/*
				if(comboOnly === true){
					kmc.combo(inputSrc, depFile, depFileCharset);
					grunt.log.writeln('inputSrc: ' + inputSrc);
					grunt.log.writeln('Dep File "' + depFile + '" created.');
				}else{
					result = kmc.build(inputSrc, outputSrc, '', depFile);
					grunt.log.writeln('File "' + result.files[0].outputFile + '" created.');
				}
				*/

				// compileOnly为true时不进行依赖抽取，只进行demo页面的编译构建
				content = compileSrcDemo(inputSrc, outputFile, options);
				grunt.log.writeln(content);
				grunt.log.writeln('File "' + outputFile + '" created.');
			});
		
		}

	});

  });

};
