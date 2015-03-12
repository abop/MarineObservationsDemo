module.exports = function(grunt) {

    grunt.initConfig({
        
        pkg: {},

        handlebars: {
            compile: {
                options: {
                    namespace: 'joint.templates.halo',
                    processName: function(filePath) { // input:  templates/handle.html
                        var pieces = filePath.split('/');
                        return pieces[pieces.length - 1]; // output: handle.html
                    }
                },
                files: {
                    'dist/template.js': ['templates/*']
                }
            }
        },
        
        watch: {
            files: ['*.html'],
            tasks: ['handlebars']
        },

        copy: {

            dist: {
                files: [
                    { src: 'joint.ui.Halo.js', dest: 'dist/joint.ui.Halo.js' },
                    { src: 'lib/handlebars.js', dest: 'dist/handlebars.js' }
                ]
            }
        },
        
        imageEmbed: {
            // Convert images to data-uris for the Halo ui plugin.
            dist: {
                src: [ 'halo.css' ],
                dest: 'dist/halo.css',
                options: {
                    deleteAfterEncoding : false
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks("grunt-image-embed");
    grunt.loadNpmTasks("grunt-contrib-copy");

    // Default task(s).
    grunt.registerTask('default', ['handlebars', 'imageEmbed', 'copy']);
};
