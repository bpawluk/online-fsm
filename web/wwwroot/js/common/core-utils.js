'use strict'
import * as utils from '../common/common-utils';

class Interface {
    constructor(name, methods, properties) {
        this._name = name;
        this._methods = methods || [];
        this._properties = properties || [];

        for (let i = 0, len = methods.length; i < len; i++) {
            if (typeof methods[i] !== 'string') {
                throw new Error('To define an interface you need to provide list of method names of type string');
            }
            this._methods.push(methods[i]);
        }

        for (let i = 0, len = properties.length; i < len; i++) {
            if (typeof properties[i] !== 'string') {
                throw new Error('To define an interface you need to provide list of property names of type string');
            }
            this._properties.push(properties[i]);
        }
    }

    isImplemtedBy(obj) {
        if (typeof obj !== 'object') {
            throw new Error('The ' + this._name + ' interface is not implemented by ' + typeof obj);
        }

        for (let i = 0, len = this._methods.length; i < len; i++) {
            let currentMember = this._methods[i];
            if (!obj[currentMember] || typeof obj[currentMember] !== 'function') {
                throw new Error('Object does not implement the interface ' + this._name);
            }
        }

        for (let i = 0, len = properties.length; i < len; i++) {
            let currentMember = this._methods[i];
            if (!obj[currentMember] || typeof obj[currentMember] === 'function') {
                throw new Error('Object does not implement the interface ' + this._name);
            }
        }
    }
}

class Event {
    constructor() {
        this._listeners = [];
    }

    registerListener(listener) {
        if (!listener || typeof listener !== 'function') {
            throw new Error('Event listener has to be of type function');
        }
        this._listeners.push(listener);
    }

    unregisterListener(listener) {
        return utils.ArrayUtils.remove(listener, this._listeners)
    }

    clear() {
        this._listeners = [];
    }

    invoke(args) {
        const listeners = this._listeners;
        for (let i = 0, len = listeners.length; i < len; i++) {
            listeners[i](args);
        }
    }
}

export class EventsManager {
    constructor() {
        this._events = new Map();
        this._events.set('event-registered', new Event());
        this._events.set('event-unregistered', new Event());
    }

    create(eventName) {
        this._events.set(eventName, new Event());
        this.raise('event-registered', eventName)
    }

    delete(eventName) {
        let success = false;
        let events = this._events;

        if (events.has(eventName)) {
            events.delete(eventName);
            this.raise('event-unregistered', eventName)
            success = true;
        }
        return success;
    }

    raise(eventName, args) {
        let success = false;
        let event = this._events.get(eventName);

        if (event) {
            event.invoke(args);
            success = true;
        }
        return success;
    }

    registerListener(eventName, listener) {
        let event = this._events.get(eventName);
        if(!event){
            this.create(eventName);
        }
        event.registerListener(listener);
    }

    unregisterListener(eventName, listener) {
        let success = false;
        let event = this._events.get(eventName);

        if (event) {
            success = event.unregisterListener(listener);
        }
        return success;
    }
}

export class ModulesManager {
    constructor() {
        this._modules = new Map();
    }

    add(module, name) {
        this._modules.set(name, module);
    }

    init(moduleName) {
        let success = false;
        let module = this._modules.get(moduleName)

        if (module) {
            if (!module.isInit) {
                module.init();
            }
            success = true;
        }
        return success;
    }

    initAll() {
        for (let module of this._modules.values()) {
            if (!module.isInit) {
                module.init();
            }
        }
    }

    addAndInit(module, name) {
        this.add(module, name);
        if (!module.isInit) {
            module.init();
        }
        return true;
    }

    stop(moduleName) {
        let success = false;
        let module = this._modules.get(moduleName)

        if (module) {
            if (module.isInit) {
                module.stop();
            }
            success = true;
        }
        return success;
    }

    remove(moduleName) {
        let success = false;
        let modules = this._modules;

        if (modules.has(moduleName)) {
            this.stop(moduleName)
            modules.delete(moduleName);
            success = true;
        }
        return success;
    }
}

export class InterfacesManager {
    constructor() {
        this._interfaces = new Map();
    }

    declare(name, methods, properties) {
        this._interfaces.set(name, new Interface(name, methods, properties));
    }

    assert(obj, name) {
        const interface = this._interfaces.get(name);
        if (!interface) {
            throw new Error('Interface ' + name + ' is not declared');
        }
        interface.isImplemtedBy(obj);
    }
}