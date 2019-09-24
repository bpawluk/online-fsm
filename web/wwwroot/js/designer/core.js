"use strict"
var onlineFSM = onlineFSM || {};

onlineFSM.core = function () {
    var _lastID = 0;
    var _appRegistry = []
    var _modules = Object.create(null);
    var _interfaces = Object.create(null);

    function registerApp(app, initialise) {
        initialise(app);
        app.setID(_lastID++);
        _appRegistry.push(app);
    }

    function removeApp(id) {

    }

    function registerModule(name, module) {
        _modules[name] = module;
    }

    function retrieveModule(name) {
        return _modules[name];
    }

    function declareInterface(name, methods, properties) {
        _interfaces[name] = new Interface(name, methods, properties);
    }

    function implements(obj, name) {
        var interface = _interfaces[name];
        if (!interface) {
            throw new Error("Interface " + name + " is not declared");
        }
        interface.isImplemtedBy(obj);
    }

    function Interface(name, methods, properties) {
        var methods = methods || [];
        var properties = properties || [];

        this._name = name;
        this._methods = methods;
        this._properties = properties;

        for (var i = 0, len = methods.length; i < len; i++) {
            if (typeof methods[i] !== 'string') {
                throw new Error("To define an interface you need to provide list of method names of type string");
            }
            this._methods.push(methods[i]);
        }

        for (var i = 0, len = properties.length; i < len; i++) {
            if (typeof properties[i] !== 'string') {
                throw new Error("To define an interface you need to provide list of property names of type string");
            }
            this._properties.push(properties[i]);
        }
    }

    Interface.prototype.isImplemtedBy = function (obj) {
        if (typeof obj !== 'object') {
            throw new Error("The " + this._name + " interface is not implemented by " + typeof obj);
        }

        for (var i = 0, len = this._methods.length; i < len; i++) {
            var currentMember = this._methods[i];
            if (!obj[currentMember] || typeof obj[currentMember] !== 'function') {
                throw new Error("Object does not implement the interface " + this._name);
            }
        }

        for (var i = 0, len = properties.length; i < len; i++) {
            var currentMember = this._methods[i];
            if (!obj[currentMember] || typeof obj[currentMember] === 'function') {
                throw new Error("Object does not implement the interface " + this._name);
            }
        }
    }

    return {
        registerApp: registerApp,
        removeApp: removeApp,
        registerModule: registerModule,
        retrieveModule: retrieveModule,
        declareInterface: declareInterface,
        implements: implements
    };
}();