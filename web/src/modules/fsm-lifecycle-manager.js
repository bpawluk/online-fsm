'use strict'

import { State } from '../shapes/state-shape.js';
import { Transition } from '../shapes/transition-shape.js';

export class FSMLifecycleManager {
    constructor(sandbox) {
        // Provides:

        // Depends on:
        this.LOAD_CACHE = 'fsm-load-cache';
        this.CLEAR_CACHE = 'fsm-clear-cache';
        this.GET_ITEMS = 'workspace-get-items';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.ADD_BUTTON_LISTENER = 'add-button-listener';
        this.REMOVE_BUTTON_LISTENER = 'remove-button-listener';
        this.APP_INIT_EVENT = 'app-init';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._onNew = () => { if (this.isRunning) this._onNewClicked() };
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'new', listener: this._onNew });
        this._sandbox.sendMessage(this.LOAD_CACHE);
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterListener(this.STATE_CREATED_EVENT, this._saveChanges);
            this._sandbox.unregisterListener(this.STATE_EDITED_EVENT, this._saveChanges);
            this._sandbox.unregisterListener(this.STATE_DELETED_EVENT, this._saveChanges);
            this._sandbox.unregisterListener(this.TRANSITION_CREATED_EVENT, this._saveChanges);
            this._sandbox.unregisterListener(this.TRANSITION_EDITED_EVENT, this._saveChanges);
            this._sandbox.unregisterListener(this.TRANSITION_DELETED_EVENT, this._saveChanges);
            this._sandbox.unregisterMessageReceiver(this.CLEAR_CACHE);
        }
    }

    cleanUp() {
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'new', listener: this._onNew });
    }

    _onNewClicked() {
        let items = this._sandbox.sendMessage(this.GET_ITEMS, (item) => {
            return item instanceof Transition || item instanceof State;
        });

        items.forEach(item => {
            this._sandbox.sendMessage(this.REMOVE_ITEM, item);
        });

        this._sandbox.sendMessage(this.CLEAR_CACHE);
        this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
    }
}