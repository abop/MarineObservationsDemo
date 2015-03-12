module.exports = function(grunt) {

    grunt.initConfig({
        
        pkg: {},

        handlebars: {
            compile: {
                options: {
                    namespace: 'joint.templates.inspector',
                    processName: function(filePath) { // input:  templates/range.html
                        var pieces = filePath.split('/');
                        return pieces[pieces.length - 1]; // output: range.html
                    }
                },
                files: {
                    'dist/template.js': ['templates/*']
                }
            }
        },
        
        watch: {
            files: ['templates/*.html'],
            tasks: ['handlebars']
        },

        copy: {

            dist: {
                files: [
                    { src: 'joint.ui.Inspector.js', dest: 'dist/joint.ui.Inspector.js' },
                    { src: 'helpers.js', dest: 'dist/helpers.js' },
                    { src: 'lib/handlebars.js', dest: 'dist/handlebars.js' },
                    { src: 'inspector.css', dest: 'dist/inspector.css' }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks("grunt-contrib-copy");

    // Default task(s).
    grunt.registerTask('default', ['handlebars', 'copy']);
};
