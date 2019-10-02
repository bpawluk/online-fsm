'use strict'
import * as coreUtils from './core-utils';

export class Core {
    constructor() {
        this._isInit = false;
        this._modulesManager = new coreUtils.ModulesManager();
        this._eventsManager = new coreUtils.EventsManager();
        this._interfacesManager = new coreUtils.InterfacesManager();

        this.declareInterface('module', ['init', 'stop'], ['isInit']);
    }

    init() {
        if (!this._isInit) {
            this._modulesManager.initAll();
            this._isInit = true;
        }
    }

    addModule(module, name) {
        this.assertInterface(module, 'module');
        this._modulesManager.add(module, name);
    }

    addModuleAndInit(module, name) {
        this.assertInterface(module, 'module');
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