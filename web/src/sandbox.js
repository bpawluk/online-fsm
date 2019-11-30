'use strict'

export class Sandbox {
    constructor(core){
        this._core = core;
    }

    registerMessageReceiver(key, receiver) {
        this._core.registerMessageReceiver(key, receiver);
    }

    unregisterMessageReceiver(key) {
        return this._core.unregisterMessageReceiver(key);
    }

    sendMessage(key, message) {
        return this._core.sendMessage(key, message);
    }

    handshake(key) {
        return this._core.handshake(key);
    }

    createEvent(name) {
        this._core.createEvent(name);
    }

    deleteEvent(name) {
        return this._core.deleteEvent(name);
    }

    raiseEvent(name, args) {
        return this._core.raiseEvent(name, args);
    }

    registerListener(name, listener) {
        this._core.registerListener(name, listener);
    }

    unregisterListener(name, listener) {
        return this._core.unregisterListener(name, listener);
    }

    declareInterface(name, methods, properties) {
        this._core.declareInterface(name, methods, properties);
    }

    assertInterface(obj, name) {
        this._core.assertInterface(obj, name);
    }
}