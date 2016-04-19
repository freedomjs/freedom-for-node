/*jslint node:true*/
/**
 * Gruntfile for freedom-for-node
 */
module.exports = function (grunt) {
  'use strict';
  require('time-grunt')(grunt);
  require('jit-grunt')(grunt, {
    'npm-publish': 'grunt-npm'
  });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      root: [ 'Gruntfile.js', 'index.js', 'package.json' ],
      src: [ 'lib/**/*' ],
      demo: [ 'demo/**/*' ],
      providers: [ 'providers/**/*' ],
      options: {
        jshintrc: true
      }
    },
    jasmine_nodejs: {
      integration: {
        specs: ['spec/*.spec.js'],
        helpers: ['spec/helper/**']
      }
    },
    bump: {
      options: {
        files: ['package.json'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin'
      }
    },
    'npm-publish': {
      options: {
        // list of tasks that are required before publishing
        requires: [],
        // if the workspace is dirty, abort publishing (to avoid publishing local changes)
        abortIfDirty: true
      }
    },
    prompt: {
      tagMessage: {
        options: {
          questions: [
            {
              config: 'bump.options.tagMessage',
              type: 'input',
              message: 'Enter a git tag message:',
              default: 'v%VERSION%'
            }
          ]
        }
      }
    }
  });

  grunt.registerTask('test', [
    'jshint',
    'jasmine_nodejs'
  ]);
  
  grunt.registerTask('release', function (arg) {
    if (arguments.length === 0) {
      arg = 'patch';
    }
    grunt.task.run([
      'prompt:tagMessage',
      'bump:' + arg,
      'npm-publish'
    ]);
  });

  grunt.registerTask('default', ['test']);
};
