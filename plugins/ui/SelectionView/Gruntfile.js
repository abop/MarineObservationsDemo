module.exports = function(grunt) {

    grunt.initConfig({
        
        pkg: {},

        copy: {

            dist: {
                files: [
                    { src: 'joint.ui.SelectionView.js', dest: 'dist/joint.ui.SelectionView.js' }
                ]
            }
        },
        
        imageEmbed: {
            // Convert images to data-uris for the SelectionView ui plugin.
            dist: {
                src: [ 'selection.css' ],
                dest: 'dist/selection.css',
                options: {
                    deleteAfterEncoding : false
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-image-embed");
    grunt.loadNpmTasks("grunt-contrib-copy");

    // Default task(s).
    grunt.registerTask('default', ['imageEmbed', 'copy']);
};
