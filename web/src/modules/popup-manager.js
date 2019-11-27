'use strict'

export class PopupManager {
    constructor(sandbox, config) {
        // Provides:
        this.SHOW_POPUP = 'popup-show';
        this.HIDE_POPUP = 'popup-hide';

        // Depends on:
        this.ADD_KEY_LISTENER = 'add-key-listener';
        this.REMOVE_KEY_LISTENER = 'remove-key-listener';
        this.APP_INIT_EVENT = 'app-init';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;
        this._popup = this._createPopupContainer();
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerMessageReceiver(this.SHOW_POPUP, this.showPopup.bind(this));
            this._sandbox.registerMessageReceiver(this.HIDE_POPUP, this.hidePopup.bind(this));
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit)
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

        if (typeof data.onEnter === 'function') {
            this._popup.onEnter = data.onEnter;
            this._sandbox.sendMessage(this.ADD_KEY_LISTENER, { key: 'Enter', listener: this._popup.onEnter });
        }

        if (typeof data.onEscape === 'function') {
            this._popup.onEscape = data.onEscape;
            this._sandbox.sendMessage(this.ADD_KEY_LISTENER, { key: 'Escape', listener: this._popup.onEscape });
        }
    }

    hidePopup() {
        if (typeof this._popup.onEnter === 'function') {
            this._sandbox.sendMessage(this.REMOVE_KEY_LISTENER, { key: 'Enter', listener: this._popup.onEnter });
            this._popup.onEnter = null;
        }

        if (typeof this._popup.onEscape === 'function') {
            this._sandbox.sendMessage(this.REMOVE_KEY_LISTENER, { key: 'Enter', listener: this._popup.onEscape });
            this._popup.onEscape = null;        }

        this._popup.text.innerText = '';

        let data = [];
        let input = Array.prototype.slice.call(this._popup.input.getElementsByTagName('input'));
        if (input) {
            input.forEach((ipt) => data.push({ name: ipt.name, value: ipt.value }));
        }

        this._removeChildren(this._popup.input);
        this._removeChildren(this._popup.buttons);
        this._popup.container.style['display'] = 'none';
        return data;
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterMessageReceiver(this.SHOW_POPUP);
            this._sandbox.unregisterMessageReceiver(this.HIDE_POPUP);
        }
    }

    cleanUp() { }

    _removeChildren(element) {
        let children = Array.prototype.slice.call(element.childNodes);
        children.forEach(child => child.parentNode.removeChild(child));
    }

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
}