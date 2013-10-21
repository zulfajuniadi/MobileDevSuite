requirejs.config({
    paths: {
        /* SarahJS Required libraries */
        "lodash" : "lib/lodash",
        "text" : "lib/text.min",

        /* SarahJS Modules */
        "sarah" : "lib/SarahJS/sarah",
        "sarah.modules" : "lib/SarahJS/sarah.modules",
    }
});

requirejs(['sarah', 'lodash'], function(app){
    app.Configure({
        app : 'app/app.js',
        rootUrl : '',
        base : 'lib/SarahJS/',
        plugins : ['session.localstorage', 'db.localstorage', 'nodewebkit'],
        depsInterval : 200
    });
});
