'use strict'

export class FSMCacheManager {
    constructor(sandbox) {
        // Provides:
        this.SAVE_CACHE = 'fsm-save-cache';
        this.LOAD_CACHE = 'fsm-load-cache';
        this.CLEAR_CACHE = 'fsm-clear-cache';

        // Depends on:
        this.SERIALIZE_FSM = 'fsm-serialize';
        this.DESERIALIZE_FSM = 'fsm-deserialize';
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

        this._saveSpan = 5000;
        this._lastSave = null;
        this._isWaiting = false;
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerMessageReceiver(this.SAVE_CACHE, this.saveCache.bind(this));
            this._sandbox.registerMessageReceiver(this.LOAD_CACHE, this.loadCache.bind(this));
            this._sandbox.registerMessageReceiver(this.CLEAR_CACHE, this.clearCache.bind(this));
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

    }

    saveCache() {
        localStorage.setItem('fsm-data', this._sandbox.sendMessage(this.SERIALIZE_FSM));
        console.log('SAVED | PREV ' + (Date.now() - this._lastSave) / 1000 + ' seconds ago');
        this._lastSave = Date.now();

    }

    loadCache() {
        let dataString = localStorage.getItem('fsm-data');
        if (dataString) this._sandbox.sendMessage(this.DESERIALIZE_FSM, dataString);
    }

    clearCache() {
        localStorage.removeItem('fsm-data');
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
            this._sandbox.unregisterMessageReceiver(this.SAVE_CACHE);
            this._sandbox.unregisterMessageReceiver(this.LOAD_CACHE);
            this._sandbox.unregisterMessageReceiver(this.CLEAR_CACHE);
        }
    }

    cleanUp() { }

    _saveChanges() {
        if (!this._isWaiting) {
            const timeDiff = Date.now() - this._lastSave;
            if (timeDiff > this._saveSpan) {
                this.saveCache();
            } else {
                this._isWaiting = true;
                setTimeout(() => {
                    this.saveCache()
                    this._isWaiting = false;
                }, this._saveSpan - timeDiff);
            }
        }
    }
}