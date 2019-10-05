'use strict'

export class DomManager {
    constructor(sandbox) {
        // Provides:
        this.APPEND_DOM_ELEMENT = 'append-dom-element';

        // Depends on:
        this.APP_INIT_EVENT = 'app-init';

        this._isInit = false;
        this._sandbox = sandbox;

        this._sandbox.registerMessageReceiver(this.APPEND_DOM_ELEMENT, this.appendDomElement.bind(this));
    }

    init() {
        if (!this._isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, this.onAppInit.bind(this));
            this._isInit = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???)
    }

    appendDomElement() {

    }

    stop() {
        
    }

    cleanUp() {

    }
}