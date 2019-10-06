'use strict'
import { EventsManager, InterfacesManager, Mediator, ModulesManager } from '../common/core-utils.js';
import { Sandbox } from '../common/sandbox.js';

export class Core {
    constructor() {
        // Provides:
        this.APP_INIT_EVENT = 'app-init';
        this.MODULE_INTERFACE = 'module';

        this._isInit = false;
        this._sandbox = new Sandbox(this);
        this._mediator = new Mediator();
        this._modulesManager = new ModulesManager();
        this._eventsManager = new EventsManager();
        this._interfacesManager = new InterfacesManager();

        this.createEvent(this.APP_INIT_EVENT);
        this.declareInterface(this.MODULE_INTERFACE, ['init', 'stop', 'cleanUp'], []);
    }

    init() {
        if (!this._isInit) {
            this._modulesManager.initAll();
            this._isInit = true;
            this.raiseEvent(this.APP_INIT_EVENT);
        }
        return null;
    }

    addModule(constructor, name, config) {
        const module = new constructor(this._sandbox, config);
        this.assertInterface(module, this.MODULE_INTERFACE);
        this._modulesManager.add(module, name);
    }

    addModuleAndInit(constructor, name, config) {
        const module = new constructor(this._sandbox, config);
        this.assertInterface(module, this.MODULE_INTERFACE);
        this._modulesManager.addAndInit(module, name);
    }

    removeModule(name) {
        return this._modulesManager.remove(name);
    }

    initModule(name) {
        return this._modulesManager.init(name);
    }

    stopModule(name) {
        return this._modulesManager.stop(name);
    }

    registerMessageReceiver(key, receiver) {
        this._mediator.register(key, receiver);
    }

    unregisterMessageReceiver(key) {
        return this._mediator.unregister(key);
    }

    sendMessage(key, message) {
        return this._mediator.send(key, message);
    }

    createEvent(name) {
        this._eventsManager.create(name);
    }

    deleteEvent(name) {
        return this._eventsManager.delete(name);
    }

    raiseEvent(name, args) {
        return this._eventsManager.raise(name, args);
    }

    registerListener(name, listener) {
        this._eventsManager.registerListener(name, listener);
    }

    unregisterListener(name, listener) {
        return this._eventsManager.unregisterListener(name, listener);
    }

    declareInterface(name, methods, properties) {
        this._interfacesManager.declare(name, methods, properties);
    }

    assertInterface(obj, name) {
        this._interfacesManager.assert(obj, name);
    }
}