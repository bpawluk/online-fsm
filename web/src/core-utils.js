'use strict'
import { ArrayUtils } from './common-utils.js';

export class Interface {
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
            if (obj[currentMember] === undefined || typeof obj[currentMember] !== 'function') {
                throw new Error('Object does not implement the interface ' + this._name + '. Missing method: ' + currentMember);
            }
        }

        for (let i = 0, len = this._properties.length; i < len; i++) {
            let currentMember = this._properties[i];
            if (obj[currentMember] === undefined || typeof obj[currentMember] === 'function') {
                throw new Error('Object does not implement the interface ' + this._name + '. Missing properties: ' + currentMember);
            }
        }
    }
}

export class Event {
    constructor() {
        this._listeners = [];
    }

    registerListener(listener) {
        if (!listener || !listener.callback || typeof listener.callback !== 'function') {
            throw new Error('Event listener has to be of type function');
        }

        if (!this._listeners.find(item => item.callback === listener.callback)) {
            this._listeners.push(listener);
        }
    }

    unregisterListener(callback) {
        return ArrayUtils.remove(this._listeners.find(item => item.callback === callback), this._listeners)
    }

    clear() {
        this._listeners = [];
    }

    invoke(args) {
        const listeners = this._listeners.slice();
        for (let i = 0, len = listeners.length; i < len; i++) {
            const current = listeners[i];
            if (current.thisArg) {
                current.callback.call(current.thisArg, args);
            } else {
                current.callback(args);
            }
        }
    }
}

export class EventsManager {
    constructor() {
        // Provides:
        this.EVENT_REGISTERED_EVENT = 'event-registered';
        this.EVENT_UNREGISTERED_EVENT = 'event-unregistered';

        this._events = new Map();
        this._events.set(this.EVENT_REGISTERED_EVENT, new Event());
        this._events.set(this.EVENT_UNREGISTERED_EVENT, new Event());
        this._queue = [];
        this._executing = false;
    }

    create(eventName) {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, new Event());
            this.raise(this.EVENT_REGISTERED_EVENT, eventName)
        }
    }

    delete(eventName) {
        let success = false;
        let events = this._events;

        if (events.has(eventName)) {
            events.delete(eventName);
            this.raise(this.EVENT_UNREGISTERED_EVENT, eventName)
            success = true;
        }
        return success;
    }

    raise(eventName, args) {
        let success = false;
        let event = this._events.get(eventName);

        if (event) {
            if (this._executing) {
                this._queue.push({eventName: eventName, args: args});
            }
            else {
                this._executing = true;
                event.invoke(args);
                this._executing = false;

                if (this._queue.length > 0) {
                    let nextEvent = this._queue.shift();
                    this.raise(nextEvent.eventName, nextEvent.args);
                }
            }

            success = true;
        }
        return success;
    }

    registerListener(eventName, listener) {
        let success = false;
        let event = this._events.get(eventName);
        if (event) {
            event.registerListener(listener);
            success = true;
        }
        return success;
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

export class Mediator {
    constructor() {
        this._receivers = new Map();
    }

    register(key, receiver) {
        let receivers = this._receivers;

        if (receivers.has(key)) {
            throw new Error('Receiver ' + key + ' already registered');
        }

        if (!receiver || typeof receiver !== 'function') {
            throw new Error('Receiver must be a function');
        }

        receivers.set(key, receiver);
    }

    unregister(key) {
        let success = false;
        let receivers = this._receivers;

        if (receivers.has(key)) {
            receivers.delete(key);
            success = true;
        }

        return success;
    }

    send(key, message) {
        let receivers = this._receivers;

        if (!receivers.has(key)) {
            throw new Error('Receiver ' + key + ' not registered');
        }

        return receivers.get(key)(message);
    }

    handshake(key) {
        return this._receivers.has(key);
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

    startAll() {
        for (let module of this._modules.values()) {
            if (!module.isRunning) {
                module.start();
            }
        }
    }

    start(moduleName) {
        let success = false;
        let module = this._modules.get(moduleName)

        if (module) {
            if (!module.isRunning) {
                module.start();
            }
            success = true;
        }
        return success;
    }

    stopAll() {
        for (let module of this._modules.values()) {
            if (module.isRunning) {
                module.stop();
            }
        }
    }

    stop(moduleName) {
        let success = false;
        let module = this._modules.get(moduleName)

        if (module) {
            if (module.isRunning) {
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
            modules.get(moduleName).cleanUp();
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
        const iface = this._interfaces.get(name);
        if (!iface) {
            throw new Error('Interface ' + name + ' is not declared');
        }
        iface.isImplemtedBy(obj);
    }
}