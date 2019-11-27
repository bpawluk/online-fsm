'use strict'

import { MathUtils } from '../common-utils.js';
import { State } from '../shapes/state-shape.js';

export class FSMStateManager {
    constructor(sandbox) {
        // Provides:
        this.STATE_CREATED_EVENT = 'fsm-state-created';
        this.STATE_EDITED_EVENT = 'fsm-state-edited';
        this.STATE_DELETED_EVENT = 'fsm-state-edited';

        // Depends on:
        this.ADD_ITEM = 'workspace-add-item';
        this.SELECT_ITEM = 'workspace-select-item';
        this.GET_SELECTED_ITEM = 'workspace-get-selection';
        this.GET_ITEM_AT = 'workspace-get-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.SHOW_POPUP = 'popup-show';
        this.HIDE_POPUP = 'popup-hide';
        this.SET_CONTROL_DISABLED = 'disable-control';
        this.ADD_KEY_LISTENER = 'add-key-listener';
        this.REMOVE_KEY_LISTENER = 'remove-key-listener';
        this.ADD_BUTTON_LISTENER = 'add-button-listener';
        this.REMOVE_BUTTON_LISTENER = 'remove-button-listener';
        this.APP_INIT_EVENT = 'app-init';
        this.ITEM_PRESSED_EVENT = 'workspace-item-pressed';
        this.ITEM_DELETED_EVENT = 'workspace-item-deleted';
        this.ITEM_DRAG_ENDED_EVENT = 'workspace-drag-ended';
        this.ITEM_SELECTION_CHANGED_EVENT = 'workspace-item-selection-changed';
        this.DOUBLE_CLICK_EVENT = 'double-click';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._lastNum;
        this._onAdd = () => { if (this.isRunning) this.addState() };
        this._onAccept = () => { if (this.isRunning) this._operateOnSelectedState((selected) => this.makeAccepting(selected)) };
        this._onInitial = () => { if (this.isRunning) this._operateOnSelectedState((selected) => this.changeEntryPoint({ item: selected })) };
        this._onEdit = () => { if (this.isRunning) this._operateOnSelectedState((selected) => this.beginEditState(selected)) };
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this._sandbox.createEvent(this.STATE_CREATED_EVENT);
            this._sandbox.createEvent(this.STATE_EDITED_EVENT);
            this._sandbox.createEvent(this.STATE_DELETED_EVENT);
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerListener(this.ITEM_PRESSED_EVENT, { callback: this._onItemPressed, thisArg: this });
            this._sandbox.registerListener(this.ITEM_DELETED_EVENT, { callback: this._onItemDeleted, thisArg: this });
            this._sandbox.registerListener(this.DOUBLE_CLICK_EVENT, { callback: this._onPointerDoubleClicked, thisArg: this });
            this._sandbox.registerListener(this.ITEM_DRAG_ENDED_EVENT, { callback: this._onItemDragged, thisArg: this });
            this._sandbox.registerListener(this.ITEM_SELECTION_CHANGED_EVENT, { callback: this._onItemSelectionChanged, thisArg: this });
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
        this._sandbox.sendMessage(this.ADD_KEY_LISTENER, { key: 'Enter', listener: this._onEdit });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'accept', listener: this._onAccept });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'add', listener: this._onAdd });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'connect', listener: this._onConnect });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'initial', listener: this._onInitial });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'edit', listener: this._onEdit });
    }

    addState(point) {
        point = point || { x: 50, y: 50 }
        let state = new State({
            text: 'S' + this._getNumber(),
            position: point
        });
        this._sandbox.sendMessage(this.ADD_ITEM, state);
        this.changeEntryPoint({ item: state, abortIfExists: true })
        this._sandbox.sendMessage(this.SELECT_ITEM, { item: state, point: point });
        this._sandbox.raiseEvent(this.STATE_CREATED_EVENT, state);
    }

    beginEditState(state) {
        this._sandbox.sendMessage(this.REMOVE_KEY_LISTENER, { key: 'Enter', listener: this._onEdit });
        let save = () => {
            let result = this._sandbox.sendMessage(this.HIDE_POPUP);
            let text = result.find((e) => e.name === 'state-name').value;
            this.endEditState(state, text);
        };
        let cancel = () => {
            this._sandbox.sendMessage(this.HIDE_POPUP)
            this.endEditState(state);
        };
        this._sandbox.sendMessage(this.SHOW_POPUP, {
            message: 'Please enter new name for the state',
            input: [{ name: 'state-name', label: 'State name' }],
            buttons: [{ text: 'Save', onClick: save }, { text: 'Cancel', onClick: cancel }],
            onEscape: cancel,
            onEnter: save
        });
    }

    endEditState(state, text) {
        if (text !== undefined) {
            const oldText = state.getText();
            state.setText(text);
            this._sandbox.raiseEvent(this.STATE_EDITED_EVENT, { state: state, changes: [{ name: 'text', oldValue: oldText }] });
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        }
        this._sandbox.sendMessage(this.ADD_KEY_LISTENER, { key: 'Enter', listener: this._onEdit });
    }

    makeAccepting(state) {
        state.accept(!state.isAccepting);
        this._sandbox.raiseEvent(this.STATE_EDITED_EVENT, { state: state, changes: [{ name: 'isAccepting', oldValue: !state.isAccepting }] });
        this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
    }

    changeEntryPoint(data) {
        let current = this._sandbox.sendMessage(this.GET_ITEMS).find((item) => item instanceof State && item.isEntry === true);
        if (!data.abortIfExists && current) {
            current.setAsEntry(false);
            this._sandbox.raiseEvent(this.STATE_EDITED_EVENT, { state: current, changes: [{ name: 'isEntry', oldValue: true }] });
            data.item.setAsEntry(true);
            this._sandbox.raiseEvent(this.STATE_EDITED_EVENT, { state: data.item, changes: [{ name: 'isEntry', oldValue: false }] });
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        } else if (!current) {
            data.item.setAsEntry(true);
            this._sandbox.raiseEvent(this.STATE_EDITED_EVENT, { state: data.item, changes: [{ name: 'isEntry', oldValue: false }] });
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterListener(this.ITEM_PRESSED_EVENT, this._onItemPressed);
            this._sandbox.unregisterListener(this.ITEM_DELETED_EVENT, this._onItemDeleted);
            this._sandbox.unregisterListener(this.DOUBLE_CLICK_EVENT, this._onPointerDoubleClicked);
            this._sandbox.unregisterListener(this.ITEM_DRAG_ENDED_EVENT, this._onItemDragged);
            this._sandbox.unregisterListener(this.ITEM_SELECTION_CHANGED_EVENT, this._onItemSelectionChanged);
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.STATE_CREATED_EVENT);
        this._sandbox.deleteEvent(this.STATE_EDITED_EVENT);
        this._sandbox.deleteEvent(this.STATE_DELETED_EVENT);
        this._sandbox.sendMessage(this.REMOVE_KEY_LISTENER, { key: 'Enter', listener: this._onEdit });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'accept', listener: this._onAccept });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'add', listener: this._onAdd });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'connect', listener: this._onConnect });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'initial', listener: this._onInitial });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'edit', listener: this._onEdit });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'new', listener: this._onNew });
    }

    _getNumber() {
        return 10;
    }

    _operateOnSelectedState(operation) {
        let selected = this._sandbox.sendMessage(this.GET_SELECTED_ITEM);
        if (selected && selected instanceof State) {
            return operation(selected);
        }
    }

    _onItemPressed(e) {
        if (e.item instanceof State && e.shiftKey) {
            this.changeEntryPoint({ item: e.item });
        }
    }

    _onItemDeleted(e) {
        if (e.item instanceof State) {
            this._sandbox.raiseEvent(this.STATE_DELETED_EVENT, e.item);
            if (e.item.isEntry) {
                let states = this._sandbox.sendMessage(this.GET_ITEMS, (item) => item instanceof State);
                if (states && states.length > 0) {
                    this.changeEntryPoint({ item: states[0] });
                }
            }
        }
    }

    _onItemDragged(e) {
        if (e.item instanceof State && !MathUtils.arePointsEqual(e.from, e.to)) {
            this._sandbox.raiseEvent(this.STATE_EDITED_EVENT, { state: e.item, changes: [{ name: 'position', oldValue: e.from }] });
        }
    }

    _onPointerDoubleClicked(e) {
        let point = { x: e.x, y: e.y };
        let doubleClickedItem = this._sandbox.sendMessage(this.GET_ITEM_AT, {
            point: point,
            predicate: function (item) {
                return item instanceof State;
            }
        });
        if (doubleClickedItem) {
            this.makeAccepting(doubleClickedItem);
        }
        else {
            this.addState(point);
        }
    }

    _onItemSelectionChanged(e) {
        if (e.newItem instanceof State) {
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'connect', disabled: false });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'accept', disabled: false });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'initial', disabled: false });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'edit', disabled: false });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'delete', disabled: false });
        } else if (!e.newItem) {
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'connect', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'accept', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'initial', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'edit', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'delete', disabled: true });
        }
    }
}