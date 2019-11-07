'use strict'

import { ObjectUtils } from "../common-utils.js";

export class DomManager {
    constructor(sandbox, config) {
        // Provides:
        this.APPEND_DOM_ELEMENT = 'append-dom-element';
        this.GET_ELEMENTS_BY_TAG = 'get-element-by-tag';
        this.GET_APP_SIZE = 'get-app-size';
        this.APP_RESIZED_EVENT = 'app-resized';

        // Depends on:
        this.APP_INIT_EVENT = 'app-init';

        // Requires interfaces:

        if (!config || !config.entrypoint) {
            throw new Error('DomManager requires configuration object with an entrypoint defined');
        }

        this._windowResizedBind = this._onWindowResized.bind(this);

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;
        this._outerDiv = document.getElementById(config.entrypoint);

        this._sandbox.createEvent(this.APP_RESIZED_EVENT);
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, this.onAppInit.bind(this));
            this.isInit = true;
            this.start();
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerMessageReceiver(this.APPEND_DOM_ELEMENT, this.appendDomElement.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_ELEMENTS_BY_TAG, this.getElementsByTag);
            this._sandbox.registerMessageReceiver(this.GET_APP_SIZE, this.getAppSize.bind(this));
            window.addEventListener('resize', this._windowResizedBind)
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???)
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

        this._outerDiv.appendChild(elementToAppend);
        return elementToAppend;
    }

    getElementsByTag(tag) {
        return Array.from(document.getElementsByTagName(tag));
    }

    getAppSize() {
        let data = this._outerDiv.getBoundingClientRect();
        return {
            width: data.width,
            height: data.height
        };
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            window.removeEventListener('resize', this._windowResizedBind)
            this._sandbox.unregisterMessageReceiver(this.APPEND_DOM_ELEMENT);
            this._sandbox.unregisterMessageReceiver(this.GET_ELEMENTS_BY_TAG);
            this._sandbox.unregisterMessageReceiver(this.GET_APP_SIZE);
        }
    }

    cleanUp() { }

    _onWindowResized(e) {
        this._sandbox.raiseEvent(this.APP_RESIZED_EVENT, this.getAppSize());
    }
}