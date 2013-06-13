/*
 * grunt-wtbuild
 * https://github.com/aloysious/grunt-wtbuild
 *
 * Copyright (c) 2013 aloysious
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },
	
	// Configuration to be run (and then tested).
	wtbuild: {
		compile: {
			options: {
				compileOnly: true,
				domain: '<%= pkg.domain%>',
				group: '<%= pkg.group%>',
				project: '<%= pkg.project%>',
				version: '<%= pkg.version%>'
			},
			files: [{
				src: 'test/assets/page/*.{shtml,html}',
				dest: 'tmp/assets/page'
			}]
		},
		dep: {
			options: {
				packages: [{
					name: 'assets',
					path: 'test/'
				}],
				depExt: '.dep',
				depOnly: true,
				depFilePath: 'mods.js'
			},
			files: [{
				src: 'test/assets/*.js'
			}]
		}
	},

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'wtbuild', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

  grunt.registerTask('buildmods', ['wtbuild:dep']);

};
