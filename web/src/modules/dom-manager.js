'use strict'

import { ObjectUtils } from "../common-utils.js";

export class DomManager {
    constructor(sandbox, config) {
        // Provides:
        this.APPEND_DOM_ELEMENT = 'append-dom-element';
        this.GET_ELEMENTS_BY_TAG = 'get-element-by-tag';
        this.GET_APP_SIZE = 'get-app-size';
        this.SHOW_POPUP = 'popup-show';
        this.HIDE_POPUP = 'popup-hide';
        this.DISABLE_CONTROL = 'disable-control';
        this.ENABLE_CONTROL = 'enable-control';
        this.APP_RESIZED_EVENT = 'app-resized';

        // Depends on:
        this.APP_INIT_EVENT = 'app-init';
        this.KEY_DOWN_EVENT = 'key-down'

        // Requires interfaces:

        if (!config || !config.entrypoint) {
            throw new Error('DomManager requires configuration object with an entrypoint defined');
        }

        this._windowResizedBind = this._onWindowResized.bind(this);

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;
        this._outerDiv = document.getElementById(config.entrypoint);
        this._popup = this._createPopupContainer();

        this._sandbox.createEvent(this.APP_RESIZED_EVENT);
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this.isInit = true;
            this.start();
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerListener(this.KEY_DOWN_EVENT, { callback: this._onKeyPressed, thisArg: this });
            this._sandbox.registerMessageReceiver(this.APPEND_DOM_ELEMENT, this.appendDomElement.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_ELEMENTS_BY_TAG, this.getElementsByTag);
            this._sandbox.registerMessageReceiver(this.GET_APP_SIZE, this.getAppSize.bind(this));
            this._sandbox.registerMessageReceiver(this.SHOW_POPUP, this.showPopup.bind(this));
            this._sandbox.registerMessageReceiver(this.HIDE_POPUP, this.hidePopup.bind(this));
            this._sandbox.registerMessageReceiver(this.DISABLE_CONTROL, this.disableControl.bind(this));
            this._sandbox.registerMessageReceiver(this.ENABLE_CONTROL, this.enableControl.bind(this));
            window.addEventListener('resize', this._windowResizedBind)
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

        this._outerDiv.appendChild(elementToAppend);
        return elementToAppend;
    }

    getElementsByTag(tag) {
        return Array.prototype.slice.call(document.getElementsByTagName(tag));
    }

    getAppSize() {
        let data = this._outerDiv.getBoundingClientRect();
        return {
            width: data.width,
            height: data.height
        };
    }

    showPopup(data) {
        if (this._popup.container.style['display'] !== 'none') {
            this.hidePopup();
        }

        this._popup.container.style['display'] = 'flex';

        data = data || {};

        if (data.message) {
            this._popup.text.innerText = data.message;
        }

        if (data.input) {
            data.input.forEach(input => {
                let label = document.createElement('label');
                label.for = input.name;
                label.innerText = input.label;
                label.style['display'] = 'block';
                label.style['font-size'] = '0.8em';
                this._popup.input.appendChild(label);
                let ipt = document.createElement('input');
                ipt.type = 'text';
                ipt.id = input.name;
                ipt.name = input.name;
                ipt.style['display'] = 'block';
                ipt.style['width'] = '100%';
                ipt.style['margin-bottom'] = '5px';
                ipt.addEventListener('input', input.onChange)
                this._popup.input.appendChild(ipt);
            });
            let firstInput = this._popup.input.getElementsByTagName('input')[0];
            if (firstInput) firstInput.focus();
        }

        if (data.buttons) {
            data.buttons.forEach(button => {
                let btn = document.createElement('button');
                btn.innerText = button.text;
                btn.style['padding'] = '3px';
                btn.style['display'] = 'inline-block';
                btn.style['margin'] = '3px';
                btn.addEventListener('click', button.onClick);
                this._popup.buttons.appendChild(btn);
            });
        }

        this._popup.onEnter = data.onEnter;
        this._popup.onEscape = data.onEscape;
    }

    hidePopup() {
        let data = null;
        this._popup.onEnter = null;
        this._popup.onEscape = null;
        this._popup.text.innerText = '';

        let input = Array.prototype.slice.call(this._popup.input.getElementsByTagName('input'));
        if (input) {
            data = [];
            input.forEach((ipt) => data.push({ name: ipt.name, value: ipt.value }));
        }

        this.removeChildren(this._popup.input);
        this.removeChildren(this._popup.buttons);
        this._popup.container.style['display'] = 'none';
        return data;
    }

    disableControl(id) {
        let control = document.getElementById(id);
        if (control && 'disabled' in control) {
            control.disabled = true;
        }
    }

    enableControl(id) {
        let control = document.getElementById(id);
        if (control && 'disabled' in control) {
            control.disabled = false;
        }
    }

    removeChildren(element) {
        let children = Array.prototype.slice.call(element.childNodes);
        children.forEach(child => child.parentNode.removeChild(child));
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            window.removeEventListener('resize', this._windowResizedBind);
            this._sandbox.unregisterListener(this.KEY_DOWN_EVENT, this._onKeyPressed);
            this._sandbox.unregisterMessageReceiver(this.APPEND_DOM_ELEMENT);
            this._sandbox.unregisterMessageReceiver(this.GET_ELEMENTS_BY_TAG);
            this._sandbox.unregisterMessageReceiver(this.GET_APP_SIZE);
            this._sandbox.unregisterMessageReceiver(this.SHOW_POPUP);
            this._sandbox.unregisterMessageReceiver(this.HIDE_POPUP);
            this._sandbox.unregisterMessageReceiver(this.DISABLE_CONTROL);
            this._sandbox.unregisterMessageReceiver(this.ENABLE_CONTROL);
        }
    }

    cleanUp() { }

    _createPopupContainer() {
        let container = document.createElement('div');
        container.style['background-color'] = 'rgba(0,0,0,0.7)';
        container.style['position'] = 'fixed';
        container.style['top'] = 0;
        container.style['right'] = 0;
        container.style['bottom'] = 0;
        container.style['left'] = 0;
        container.style['display'] = 'none';
        container.style['align-items'] = 'center';
        container.style['justify-content'] = 'center';
        container.style['z-index'] = 99;

        let content = document.createElement('div');
        content.style['background'] = '#FFFFFF';
        content.style['max-height'] = '75%';
        content.style['max-width'] = '75%';
        content.style['padding'] = '10px';
        content.style['border-style'] = 'solid';
        content.style['border-width'] = '1px';
        content.style['border-color'] = '#333333';
        container.appendChild(content);

        let text = document.createElement('p');
        text.id = 'message';
        text.style['margin-bottom'] = '8px';
        content.appendChild(text);

        let input = document.createElement('div');
        input.id = 'input';
        input.style['margin-bottom'] = '8px';
        content.appendChild(input);

        let buttons = document.createElement('div');
        buttons.id = 'buttons';
        buttons.style['text-align'] = 'center';
        content.appendChild(buttons);

        document.body.appendChild(container);
        return {
            container: container,
            text: text,
            input: input,
            buttons: buttons
        };
    }

    _onWindowResized(e) {
        this._sandbox.raiseEvent(this.APP_RESIZED_EVENT, this.getAppSize());
    }

    _onKeyPressed(e) {
        if (e.key === 'Escape' && this._popup.onEscape) {
            this._popup.onEscape();
        }
        else if (e.key === 'Enter' && this._popup.onEscape) {
            this._popup.onEnter();
        }
    }
}