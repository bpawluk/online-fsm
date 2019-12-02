'use strict'

import { State } from '../shapes/state-shape.js';
import { Transition } from '../shapes/transition-shape.js';

export class FSMLoader {
    constructor(sandbox) {
        // Provides:

        // Depends on:
        this.SAVE_CACHE = 'fsm-save-cache';
        this.LOAD_CACHE = 'fsm-load-cache';
        this.CLEAR_CACHE = 'fsm-clear-cache';
        this.SELECT_ITEM = 'workspace-select-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.SHOW_POPUP = 'popup-show';
        this.HIDE_POPUP = 'popup-hide';
        this.ADD_BUTTON_LISTENER = 'add-button-listener';
        this.REMOVE_BUTTON_LISTENER = 'remove-button-listener';
        this.APP_INIT_EVENT = 'app-init';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._onNew = () => { if (this.isRunning) this._onNewClicked() };
        this._onSave = () => { if (this.isRunning) this._onSaveClicked() };
        this._onLoad = () => { if (this.isRunning) this._onLoadClicked() };
        this._onRun = () => { if (this.isRunning) this._onRunClicked() };
        this._onEdit = () => { if (this.isRunning) this._onEditClicked() };
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
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'save', listener: this._onSave });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'load', listener: this._onLoad });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'run', listener: this._onRun });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'edit', listener: this._onEdit });
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
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'save', listener: this._onSave });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'load', listener: this._onLoad });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'run', listener: this._onRun });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'edit', listener: this._onEdit });
    }

    _clearDesigner() {
        let items = this._sandbox.sendMessage(this.GET_ITEMS, (item) => {
            return item instanceof Transition || item instanceof State;
        });

        items.forEach(item => {
            this._sandbox.sendMessage(this.REMOVE_ITEM, item);
        });

        this._sandbox.sendMessage(this.CLEAR_CACHE);
        this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
    }

    _onNewClicked() {
        this._unfocusWorkspace();
        let confirm = () => {
            this._sandbox.sendMessage(this.HIDE_POPUP);
            this._clearDesigner();
            if (!window.location.href.toLowerCase().includes('/app/designer')) {
                window.location.href = '/App/Designer';
            }
        };
        let cancel = () => {
            this._sandbox.sendMessage(this.HIDE_POPUP)
        };
        this._sandbox.sendMessage(this.SHOW_POPUP, {
            message: 'This will delete all unsaved progress.\nAre you sure?',
            buttons: [{ text: 'Confirm', onClick: confirm }, { text: 'Cancel', onClick: cancel }],
            onEscape: cancel
        });
    }

    _onSaveClicked() {

    }

    _onLoadClicked() {

    }

    _onRunClicked() {
        this._sandbox.sendMessage(this.SAVE_CACHE);
        window.location.href = '/App/Simulator';
    }

    _onEditClicked() {
        window.location.href = '/App/Designer';
    }

    _unfocusWorkspace() {
        if (this._sandbox.handshake(this.SELECT_ITEM)) {
            this._sandbox.sendMessage(this.SELECT_ITEM, { item: null });
        }
    }
}