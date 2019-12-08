'use strict'

export class InputPresenter {
    constructor(sandbox) {
        // Provides:
        this.SET_INPUT_PRESENTER = 'input-presenter-set';
        this.HIGHLIGHT_INPUT_PRESENTER = 'input-presenter-highlight';

        // Depends on:
        this.GET_ELEMENT_BY_ID = 'get-element-by-id';
        this.APPEND_DOM_ELEMENT = 'append-dom-element';
        this.REMOVE_CHILDREN = 'dom-remove-children';
        this.APP_INIT_EVENT = 'app-init';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._inputWrapper = null;
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerMessageReceiver(this.SET_INPUT_PRESENTER, this.setInput.bind(this));
            this._sandbox.registerMessageReceiver(this.HIGHLIGHT_INPUT_PRESENTER, this.highlightInput.bind(this));
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
        this._inputWrapper = this._sandbox.sendMessage(this.GET_ELEMENT_BY_ID, { id: 'input-wrapper' });
    }

    setInput(string) {
        this._sandbox.sendMessage(this.REMOVE_CHILDREN, this._inputWrapper);
        if (string && string.length > 0) {
            for (let i = 0, len = string.length; i < len; i++) {
                this._sandbox.sendMessage(this.APPEND_DOM_ELEMENT, { type: 'span', class: 'input-symbol', container: this._inputWrapper, rawContent: string.charAt(i) })
            }
            this.highlightInput(0);
        }
    }

    highlightInput(position) {
        const children = this._inputWrapper.childNodes;
        for (let i = 0, len = children.length; i < len; i++) {
            const child = children.item(i);
            if (i < position) {
                child.className = 'input-symbol read';
            }
            else if (i == position) {
                child.className = 'input-symbol selected';
            }
            else if (i > position) {
                child.className = 'input-symbol';
            }
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterMessageReceiver(this.SET_INPUT_PRESENTER);
            this._sandbox.unregisterMessageReceiver(this.HIGHLIGHT_INPUT_PRESENTER);
        }
    }

    cleanUp() { }
}