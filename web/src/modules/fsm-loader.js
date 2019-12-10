'use strict'

import { State } from '../shapes/state-shape.js';
import { Transition } from '../shapes/transition-shape.js';

export class FSMLoader {
    constructor(sandbox) {
        // Provides:

        // Depends on:
        this.GET_BOUNDS = 'workspace-scaler-get-bound';
        this.FORCE_RESCALE = 'workspace-force-rescale';
        this.SAVE_CACHE = 'fsm-save-cache';
        this.LOAD_CACHE = 'fsm-load-cache';
        this.CLEAR_CACHE = 'fsm-clear-cache';
        this.SELECT_ITEM = 'workspace-select-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.SERIALIZE_FSM = 'fsm-serialize';
        this.DESERIALIZE_FSM = 'fsm-deserialize';
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
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'design', listener: this._onEdit });
        this._loadSimulator();
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
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'design', listener: this._onEdit });
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
        let cancel = () => this._sandbox.sendMessage(this.HIDE_POPUP);
        this._sandbox.sendMessage(this.SHOW_POPUP, {
            message: 'This will delete all unsaved progress.\nAre you sure?',
            buttons: [{ text: 'Confirm', onClick: confirm }, { text: 'Cancel', onClick: cancel }],
            onEscape: cancel
        });
    }

    _onSaveClicked() {
        this._unfocusWorkspace();
        let image = () => this._saveImage();
        let offline = () => this._saveOffline();
        let online = () => this._saveOnline();
        let cancel = () => this._sandbox.sendMessage(this.HIDE_POPUP);
        this._sandbox.sendMessage(this.SHOW_POPUP, {
            message: 'Please choose saving method',
            buttons: [{ text: 'Image', onClick: image }, { text: 'Local File', onClick: offline },
            { text: 'Generate URL', onClick: online }, { text: 'Cancel', onClick: cancel }],
            onEscape: cancel
        });
    }

    _onLoadClicked() {
        let confirm = () => {
            const result = this._sandbox.sendMessage(this.HIDE_POPUP).find((e) => e.name === 'data').value;
            if (result && result.length > 0) {
                this._loadFile(result[0]);
            }
        };
        let cancel = () => this._sandbox.sendMessage(this.HIDE_POPUP);
        this._sandbox.sendMessage(this.SHOW_POPUP, {
            message: 'Choose file to load',
            input: [{ name: 'data', type: 'file', accept: '.json,application/json' }],
            buttons: [{ text: 'Confirm', onClick: confirm }, { text: 'Cancel', onClick: cancel }],
            onEscape: cancel
        });
    }

    _onRunClicked() {
        this._sandbox.sendMessage(this.SAVE_CACHE);
        window.location.href = '/App/Simulator';
    }

    _onEditClicked() {
        window.location.href = '/App/Designer';
    }

    _loadSimulator() {
        if (/Simulator\/\S{24}$/.test(window.location.pathname)) {
            this._sandbox.sendMessage(this.SHOW_POPUP, { message: 'Loading... Please wait' });
            const xhr = new XMLHttpRequest();
            const loc = window.location.pathname.split('/');
            const url = window.location.origin + "/api/fsm/" + loc[loc.length - 1];
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        this._sandbox.sendMessage(this.DESERIALIZE_FSM, xhr.responseText);
                        this._sandbox.sendMessage(this.FORCE_RESCALE);
                        this._sandbox.sendMessage(this.SAVE_CACHE);
                    }
                    this._sandbox.sendMessage(this.HIDE_POPUP);
                }
            };
            xhr.send();
        } else {
            this._sandbox.sendMessage(this.LOAD_CACHE);
        }

    }

    _loadFile(file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if(result && result.length > 0) {
                this._clearDesigner();
                this._sandbox.sendMessage(this.DESERIALIZE_FSM, result)
                this._sandbox.sendMessage(this.FORCE_RESCALE);
                this._sandbox.sendMessage(this.SAVE_CACHE);
            }
        };
        reader.readAsText(file);
    }

    _saveOnline() {
        let cancel = () => this._sandbox.sendMessage(this.HIDE_POPUP);
        this._sandbox.sendMessage(this.SHOW_POPUP, {
            message: 'Saving... Please wait',
            buttons: [{ text: 'No, thanks', onClick: cancel }],
            onEscape: cancel
        });
        const xhr = new XMLHttpRequest();
        const url = window.location.origin + "/api/fsm";
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                let cancel = () => this._sandbox.sendMessage(this.HIDE_POPUP);
                let message = 'Something went wrong...';
                let buttons = [{ text: 'OK', onClick: cancel }]
                let input = [];
                if (xhr.status === 201) {
                    message = 'Saving succesful!'
                    buttons.push({ text: 'Go to', onClick: () => window.open(xhr.getResponseHeader("Location"), '_blank') });
                    input.push({ name: 'fsm-url', label: 'URL', value: xhr.getResponseHeader("Location") });
                }
                this._sandbox.sendMessage(this.SHOW_POPUP, { message: message, buttons: buttons, input: input, onEscape: cancel });
            }
        };
        var data = this._sandbox.sendMessage(this.SERIALIZE_FSM);
        xhr.send(data);
    }

    _saveOffline() {
        this._sandbox.sendMessage(this.HIDE_POPUP);
        const data = this._sandbox.sendMessage(this.SERIALIZE_FSM);
        const blob = new Blob([data], { type: 'application/json' });
        this._crossBrowserSave('fsm-data.json', blob);
    }

    _saveImage() {
        const margin = 0.5;
        const bounds = this._sandbox.sendMessage(this.GET_BOUNDS, 0);
        if (bounds) {
            const width = bounds.right - bounds.left;
            const height = bounds.bottom - bounds.top;

            const canvas = document.createElement('canvas');
            canvas.style['display'] = 'none';
            canvas.width = width + margin * width;
            canvas.height = height + margin * height;
            document.body.appendChild(canvas);

            const context = canvas.getContext('2d');
            context.fillStyle = '#FFFFFF'
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.translate(0.5 * margin * width - bounds.left, 0.5 * margin * height - bounds.top);

            const items = this._sandbox.sendMessage(this.GET_ITEMS, (item) => item instanceof State || item instanceof Transition);
            items.forEach(item => {
                item.draw(context);
            });

            this._crossBrowserSave('fsm-schema.png', null, canvas);
            document.body.removeChild(canvas);
        } else {
            let cancel = () => this._sandbox.sendMessage(this.HIDE_POPUP);
            let message = 'Your workspace seems to be empty';
            let buttons = [{ text: 'OK', onClick: cancel }]
            this._sandbox.sendMessage(this.SHOW_POPUP, { message: message, buttons: buttons, onEscape: cancel });
        }
    }

    _unfocusWorkspace() {
        if (this._sandbox.handshake(this.SELECT_ITEM)) {
            this._sandbox.sendMessage(this.SELECT_ITEM, { item: null });
        }
    }

    _crossBrowserSave(filename, blob, canvas) {
        if (canvas && canvas.msToBlob) {
            blob = canvas.msToBlob();
        }

        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            let urlObj = null;
            if (canvas) {
                urlObj = canvas.toDataURL();
            } else {
                urlObj = window.URL.createObjectURL(blob);
            }

            const elem = window.document.createElement('a');
            elem.href = urlObj
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
            window.URL.revokeObjectURL(urlObj);
        }
    }
}