'use strict'

import { ObjectUtils } from "../common-utils.js";

export class DomManager {
    constructor(sandbox, config) {
        // Provides:
        this.APPEND_DOM_ELEMENT = 'append-dom-element';
        this.GET_ELEMENT_BY_ID = 'get-element-by-id';
        this.GET_ELEMENTS_BY_TAG = 'get-element-by-tag';
        this.SET_CONTROL_DISABLED = 'disable-control';
        this.GET_APP_SIZE = 'get-app-size';
        this.APP_RESIZED_EVENT = 'app-resized';

        // Depends on:
        this.ADD_KEY_LISTENER = 'add-key-listener';
        this.REMOVE_KEY_LISTENER = 'remove-key-listener';
        this.APP_INIT_EVENT = 'app-init';

        this._windowResizedBind = this._onWindowResized.bind(this);

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;
        this._outerElement = config.entrypoint ? document.getElementById(config.entrypoint) : document.body;
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this._sandbox.createEvent(this.APP_RESIZED_EVENT);
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerMessageReceiver(this.APPEND_DOM_ELEMENT, this.appendDomElement.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_ELEMENT_BY_ID, this.getElementById);
            this._sandbox.registerMessageReceiver(this.GET_ELEMENTS_BY_TAG, this.getElementsByTag);
            this._sandbox.registerMessageReceiver(this.GET_APP_SIZE, this.getAppSize.bind(this));
            this._sandbox.registerMessageReceiver(this.SET_CONTROL_DISABLED, this.setControlDisabled.bind(this));
            window.addEventListener('resize', this._windowResizedBind)
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit)
    }

    appendDomElement(config) {
        if (!config || !config.type) {
            throw new Error('You need to provide configuration for the DOM element to append');
        }

        let elementToAppend = document.createElement(config.type);
        config.type = null;

        if (config.style) {
            ObjectUtils.forEachOwnProperty(config.style, (key, value) => {
                elementToAppend.style[key] = value;
            })
            config.style = null;
        }

        if (config.rawContent) {
            // to implement
            config.rawContent = null;
        } else if (config.domContent) {
            // to implement
            config.domContent = null;
        }

        ObjectUtils.forEachOwnProperty(config, (key, value) => {
            if (elementToAppend.hasAttribute(key) !== null && value !== null) {
                elementToAppend.setAttribute(key, value);
            }
        });

        this._outerElement.appendChild(elementToAppend);
        return elementToAppend;
    }

    getElementById(data) {
        const element = document.getElementById(data.id);
        if (!data.predicate || data.predicate(element)) {
            return element;
        } else {
            return null;
        }
    }

    getElementsByTag(tag) {
        return Array.prototype.slice.call(document.getElementsByTagName(tag));
    }

    getAppSize() {
        let data = this._outerElement.getBoundingClientRect();
        return {
            width: data.width,
            height: data.height
        };
    }

    setControlDisabled(data) {
        let control = document.getElementById(data.id);
        if (control && 'disabled' in control) {
            control.disabled = !!data.disabled;
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            window.removeEventListener('resize', this._windowResizedBind);
            this._sandbox.unregisterMessageReceiver(this.APPEND_DOM_ELEMENT);
            this._sandbox.unregisterMessageReceiver(this.GET_ELEMENT_BY_ID);
            this._sandbox.unregisterMessageReceiver(this.GET_ELEMENTS_BY_TAG);
            this._sandbox.unregisterMessageReceiver(this.GET_APP_SIZE);
            this._sandbox.unregisterMessageReceiver(this.SET_CONTROL_DISABLED);
        }
    }

    cleanUp() { }

    _onWindowResized(e) {
        this._sandbox.raiseEvent(this.APP_RESIZED_EVENT, this.getAppSize());
    }
}