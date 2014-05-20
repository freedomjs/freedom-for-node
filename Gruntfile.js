/**
 * Gruntfile for freedom-for-node
 */

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine_node: {
      integration: ['test']
    }
  });

  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.registerTask('test', [
  'jasmine_node'
  ]);
};