requirejs([
    'sarah',
    'sarah.modules!projects',
], function(app){
    app.Server = require('injector');
});