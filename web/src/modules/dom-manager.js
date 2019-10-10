'use strict'

import { ObjectUtils } from "../common-utils.js";

export class DomManager {
    constructor(sandbox, config) {
        // Provides:
        this.APPEND_DOM_ELEMENT = 'append-dom-element';

        // Depends on:
        this.APP_INIT_EVENT = 'app-init';

        if (!config || !config.entrypoint) {
            throw new Error('DomManager requires configuration object with an entrypoint defined');
        }

        this._isInit = false;
        this._sandbox = sandbox;
        this._outerDiv = document.getElementById(config.entrypoint);

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

            config.rawContent = null;
        } else if (config.domContent) {

            config.domContent = null;
        }

        ObjectUtils.forEachOwnProperty(config, (key, value) => {
            if(elementToAppend.hasAttribute(key) !== null && value !== null) {
                elementToAppend.setAttribute(key, value);
            }
        });

        this._outerDiv.appendChild(elementToAppend);
        return elementToAppend;
    }

    stop() {
        this._isInit = false;
    }

    cleanUp() {

    }
}