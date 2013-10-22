define(['sarah', 'lib/jquery' , 'lib/bootstrap.min'], function(app){
    var Session = app.Session;
    var Utils = app.Utils;
    var appWindow = app.Plugins.nodewebkit.window;
    var fileDialog = app.Plugins.nodewebkit.fileDialog;
    var menu = app.Plugins.nodewebkit.menu;
    var menus = app.Plugins.nodewebkit.menus;
    var shell = app.Plugins.nodewebkit.shell;

    function setSize(width, height) {

        if(width && height) {
            Session.set('size', [width, height]);
        } else {
            var dim = Session.get('size');
            var width = dim[0];
            var height = dim[1];
        }

        var orientation = Session.get('orientation');
        if(orientation === 'landscape') {
            var a = height;
            height = width;
            width = a;
        }

        width = width + 24; // scrollbar

        var frame = document.getElementById('daframe');
        if(frame) {
            frame.width = width;
            frame.height = height;
        }

        var width = width + 4 + 40 + 213 + 30;
        var height = height + 4 + 40;

        return appWindow.resizeTo(width, height);
    }

    return {
        collections : {
            Projects : {
                plugins : {
                    localstorage : {}
                }
            }
        },
        templates : {
            'projectList' : {
                template : 'projectList.html',
                events : {}
            },
            'projectForm' : {
                template : 'projectForm.html',
                events : {
                    'click form .getProjectPath' : function(e) {
                        fileDialog.pickFolder(null, function(folder){
                            document.getElementById('projectPath').value = folder;
                        });
                        return false;
                        e.preventDefault();
                    },
                    'submit form.projectForm' : function(event) {
                        app.Collections.Projects.save(this);
                        app.Router('/home');
                        event.preventDefault();
                        return false;
                    },
                    'click .delete' : function(event, elem) {
                        if(!confirm('Are you sure you want to delete this?')) {
                            event.preventDefault();
                            return false;
                        }
                    }
                }
            },
            'projectGo' : {
                template : 'projectGo.html',
                events : {
                    'click #iPhone5' : function() {
                        var width = 320;
                        var height = 568;
                        setSize(width, height);
                    },
                    'click #iPhone4' : function() {
                        var width = 320;
                        var height = 480;
                        setSize(width, height);
                    },
                    'click #iPad' : function() {
                        var width = 768;
                        var height = 1024;
                        setSize(width, height);
                    },
                    'click #portrait' : function() {
                        Session.set('orientation', 'portrait');
                        setSize();
                    },
                    'click #landscape' : function() {
                        Session.set('orientation', 'landscape');
                        setSize();
                    },
                    'click #folder' : function(e, elem) {
                        var path = $(elem).data('path');
                        shell.openFile(path);
                    },
                    'click #inspector' : function(e, elem) {
                        if(app.Runtime.Servers.length > 0) {
                            shell.openUri(app.Runtime.Servers[0].services[1].url + '/client/#anonymous');
                        }
                    },
                    'click #browser' : function(e, elem) {
                        if(app.Runtime.Servers.length > 0) {
                            shell.openUri(app.Runtime.Servers[0].services[2].url);
                        }
                    },
                    'click #exit' : function() {
                        app.Runtime.Servers.forEach(function(server){
                            server.services.forEach(function(service){
                                service.instance.close();
                            });
                        });
                        app.Runtime.Servers = [];
                        app.Router('#/home');
                    },
                    'click #reload' : function() {
                        document.getElementById('daframe').contentDocument.location.reload(true);
                    }
                },
                beforeRender : function() {
                    if(!Utils.isArray(app.Runtime.Servers))
                        app.Runtime.Servers = [];
                },
                afterRender : function(){
                    // menu.create('test', [
                    //     {
                    //         label : 'Get Element',
                    //         click : function(e) {
                    //             var el = Session.get('selectedContextElement');
                    //             iwin.console.log(el);
                    //             appWindow.instance.showDevTools('daframe');
                    //         }
                    //     },
                    //     {
                    //         label : 'Reload',
                    //         click : function(e) {
                    //             idoc.location.reload(true);
                    //         }
                    //     }
                    // ]);

                    var idoc, iwin;

                    var iframe = document.getElementById('daframe');
                    if(iframe) {
                        iframe.style['overflow-y'] = 'scroll';

                        var project = app.Collections.Projects.get(iframe.getAttribute('data-project'));

                        if(project) {

                            app.Server.start({
                                name : project.projectName,
                                webroot : project.projectPath
                            }, function(services){
                                app.Runtime.Servers.push({
                                    name : project.projectName,
                                    services : services
                                });
                                setTimeout(function(){
                                    iframe.src = services[2].url;
                                    document.getElementById('inspector').removeAttribute('disabled');
                                    document.getElementById('reload').removeAttribute('disabled');
                                    document.getElementById('browser').removeAttribute('disabled');
                                    document.getElementById('loading').style.display = 'none';
                                    document.querySelector('.toolbar').appendChild(services[2].qr);
                                },2000)

                            });
                        }

                        // iframe.onload = function(){
                        //     idoc = window.idoc = this.contentDocument;
                        //     iwin = window.iwin = this.contentWindow;
                        //     idoc.body.addEventListener('contextmenu', function(ev){
                        //         Session.set('selectedContextElement', ev.toElement);
                        //         menu.show('test', ev.x, ev.y);
                        //     });
                        // };
                    }
                }
            },
        },
        routes : {
            '/home' : function() {
                appWindow.resizeTo(800, 600);
                app.Templates.projectList.attributes({
                    projects : function(){
                        return app.Collections.Projects.getAll() || [];
                    }
                }).setOutlet('#outlet');
            },
            '/project/new' : function() {
                app.Templates.projectForm.attributes({
                    project : {},
                    state : 'new'
                }).setOutlet('#outlet');
            },
            '/project/:pid' : function(pid) {
                app.Templates.projectForm.attributes({
                    state : 'view',
                    project : function(){
                        return app.Collections.Projects.get(pid) || {};
                    }
                }).setOutlet('#outlet');
            },
            '/project/edit/:pid' : function(pid) {
                app.Templates.projectForm.attributes({
                    state : 'edit',
                    project : function(){
                        return app.Collections.Projects.get(pid) || {};
                    }
                }).setOutlet('#outlet');
            },
            '/project/delete/:pid' : function(pid) {
                app.Collections.Projects.remove({_id : pid});
                app.Router('/home');
            },
            '/project/go/:pid' : function(pid) {
                Session.set('orientation', 'portrait');
                setSize(320, 568);
                app.Templates.projectGo.attributes({
                    project : function(){
                        return app.Collections.Projects.get(pid) || {};
                    }
                }).setOutlet('#outlet');
            }
        },

        /* Module Hooks */

        preInit : function() {

        },
        postInit : function() {
            app.Router('*', this.routes['/home']);
            // app.Runtime.onClose.push(function(event) {
            //     process.exit();
            // });
        },
        onEnter : function(){

        },
        onLeave : function(){

        }

    }
});