module.exports = function(grunt) {

    grunt.initConfig({
        
        pkg: {},

        handlebars: {
            compile: {
                options: {
                    namespace: 'joint.templates'
                },
                files: {
                    'dist/template.js': 'freetransform.html'
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
                    { src: 'joint.ui.FreeTransform.js', dest: 'dist/joint.ui.FreeTransform.js' },
                    { src: 'lib/handlebars.js', dest: 'dist/handlebars.js' }
                ]
            }
        },
        
        imageEmbed: {
            // Convert images to data-uris for the Halo ui plugin.
            // Don't forget to use /tmp/halo.css in all the places where halo.css should be included in this Gruntfile.
            // Note that the url to images in the plugins/ui/Halo/halo.css must be absolute paths so that
            // we can set the `baseDir` option below.
            dist: {
                src: [ 'freetransform.css' ],
                dest: 'dist/freetransform.css',
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
