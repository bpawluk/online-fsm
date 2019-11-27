'use strict'

import { State } from '../shapes/state-shape.js';
import { Transition } from '../shapes/transition-shape.js';

export class FSMCacheManager {
    constructor(sandbox) {
        // Depends on:
        this.GET_ITEMS = 'workspace-get-items';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.SERIALIZE_FSM = 'fsm-serialize';
        this.DESERIALIZE_FSM = 'fsm-deserialize';
        this.ADD_BUTTON_LISTENER = 'add-button-listener';
        this.REMOVE_BUTTON_LISTENER = 'remove-button-listener';
        this.APP_INIT_EVENT = 'app-init';
        this.STATE_CREATED_EVENT = 'fsm-state-created';
        this.STATE_EDITED_EVENT = 'fsm-state-edited';
        this.STATE_DELETED_EVENT = 'fsm-state-edited';
        this.TRANSITION_CREATED_EVENT = 'fsm-transition-created';
        this.TRANSITION_EDITED_EVENT = 'fsm-transition-edited';
        this.TRANSITION_DELETED_EVENT = 'fsm-transition-edited';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._onNew = () => {
            localStorage.removeItem('fsm-data');
            this._clearWorkspace();
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        }
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerListener(this.STATE_CREATED_EVENT, { callback: this._saveChanges, thisArg: this });
            this._sandbox.registerListener(this.STATE_EDITED_EVENT, { callback: this._saveChanges, thisArg: this });
            this._sandbox.registerListener(this.STATE_DELETED_EVENT, { callback: this._saveChanges, thisArg: this });
            this._sandbox.registerListener(this.TRANSITION_CREATED_EVENT, { callback: this._saveChanges, thisArg: this });
            this._sandbox.registerListener(this.TRANSITION_EDITED_EVENT, { callback: this._saveChanges, thisArg: this });
            this._sandbox.registerListener(this.TRANSITION_DELETED_EVENT, { callback: this._saveChanges, thisArg: this });
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'new', listener: this._onNew });
        let dataString = localStorage.getItem('fsm-data');
        if (dataString) this._sandbox.sendMessage(this.DESERIALIZE_FSM, dataString);
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
        }
    }

    cleanUp() {
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'new', listener: this._onNew });
    }

    _saveChanges(){
        localStorage.setItem('fsm-data', this._sandbox.sendMessage(this.SERIALIZE_FSM));
        console.log('changes saved');
    }

    _clearWorkspace() {
        let items = this._sandbox.sendMessage(this.GET_ITEMS, (item) => {
            return item instanceof Transition || item instanceof State;
        });
        items.forEach(item => {
            this._sandbox.sendMessage(this.REMOVE_ITEM, item);
        });
    }
}