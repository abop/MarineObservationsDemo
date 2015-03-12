module.exports = function(grunt) {

    grunt.initConfig({
        
        pkg: {},

        handlebars: {
            compile: {
                options: {
                    namespace: 'joint.templates.stencil',
                    processName: function(filePath) { // input:  templates/group.html
                        var pieces = filePath.split('/');
                        return pieces[pieces.length - 1]; // output: group.html
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
                    { src: 'joint.ui.Stencil.js', dest: 'dist/joint.ui.Stencil.js' },
                    { src: 'lib/handlebars.js', dest: 'dist/handlebars.js' },
                    { src: 'stencil.css', dest: 'dist/stencil.css' }
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
