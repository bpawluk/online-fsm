'use strict'

import { MathUtils } from '../common-utils.js';
import { State } from '../shapes/state-shape.js';
import { Transition } from '../shapes/transition-shape.js';

export class FSMTransitionManager {
    constructor(sandbox) {
        // Provides:
        this.TRANSITION_CREATED_EVENT = 'fsm-transition-created';
        this.TRANSITION_EDITED_EVENT = 'fsm-transition-edited';
        this.TRANSITION_DELETED_EVENT = 'fsm-transition-edited';

        // Depends on:
        this.ADD_ITEM = 'workspace-add-item';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.BEGIN_DRAG = 'workspace-begin-drag';
        this.GET_SELECTED_ITEM = 'workspace-get-selection';
        this.GET_ITEM_AT = 'workspace-get-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.SHOW_POPUP = 'popup-show';
        this.HIDE_POPUP = 'popup-hide';
        this.SET_CONTROL_DISABLED = 'disable-control';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.ADD_KEY_LISTENER = 'add-key-listener';
        this.REMOVE_KEY_LISTENER = 'remove-key-listener';
        this.ADD_BUTTON_LISTENER = 'add-button-listener';
        this.REMOVE_BUTTON_LISTENER = 'remove-button-listener';
        this.APP_INIT_EVENT = 'app-init';
        this.ITEM_MOVED_EVENT = 'workspace-item-moved';
        this.ITEM_PRESSED_EVENT = 'workspace-item-pressed';
        this.ITEM_DRAG_ENDED_EVENT = 'workspace-drag-ended';
        this.ITEM_DELETED_EVENT = 'workspace-item-deleted';
        this.ITEM_SELECTION_CHANGED_EVENT = 'workspace-item-selection-changed';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._onConnect = () => { if (this.isRunning) this._operateOnSelected((selected) => this.beginConnecting(selected), State) };
        this._onEdit = () => { if (this.isRunning) this._operateOnSelected((selected) => this.beginEditTransition(selected), Transition) };
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this._sandbox.createEvent(this.TRANSITION_CREATED_EVENT);
            this._sandbox.createEvent(this.TRANSITION_EDITED_EVENT);
            this._sandbox.createEvent(this.TRANSITION_DELETED_EVENT);
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerListener(this.ITEM_MOVED_EVENT, { callback: this._onItemMoved, thisArg: this });
            this._sandbox.registerListener(this.ITEM_PRESSED_EVENT, { callback: this._onItemPressed, thisArg: this });
            this._sandbox.registerListener(this.ITEM_DRAG_ENDED_EVENT, { callback: this._onDragEnded, thisArg: this });
            this._sandbox.registerListener(this.ITEM_DELETED_EVENT, { callback: this._onItemDeleted, thisArg: this });
            this._sandbox.registerListener(this.ITEM_SELECTION_CHANGED_EVENT, { callback: this._onItemSelectionChanged, thisArg: this });
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
        this._sandbox.sendMessage(this.ADD_KEY_LISTENER, { key: 'Enter', listener: this._onEdit });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'connect', listener: this._onConnect });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'edit', listener: this._onEdit });
    }

    beginConnecting(state, point) {
        point = point || state.getPosition();
        let transition = new Transition({
            text: '$',
            position: point,
            first: state
        });
        this._sandbox.sendMessage(this.ADD_ITEM, transition);
        this._sandbox.sendMessage(this.BEGIN_DRAG, { item: transition, point: point });
    }

    endConnecting(transition, point) {
        let itemAt = this._sandbox.sendMessage(this.GET_ITEM_AT, {
            point: point,
            predicate: function (item) {
                return item instanceof State;
            }
        });
        if (itemAt) {
            transition.setEnd(itemAt);
            this._sandbox.raiseEvent(this.TRANSITION_CREATED_EVENT, transition);
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        }
        else {
            this._sandbox.sendMessage(this.REMOVE_ITEM, transition);
        }
    }

    beginEditTransition(transition) {
        this._sandbox.sendMessage(this.REMOVE_KEY_LISTENER, { key: 'Enter', listener: this._onEdit });
        let save = () => {
            let result = this._sandbox.sendMessage(this.HIDE_POPUP);
            let text = result.find((e) => e.name === 'state-name').value;
            this.endEditTransition(transition, text);
        };
        let cancel = () => {
            this._sandbox.sendMessage(this.HIDE_POPUP)
            this.endEditTransition(transition);
        };
        this._sandbox.sendMessage(this.SHOW_POPUP, {
            message: 'Please enter conditions for the transition separated by a comma',
            input: [{ name: 'state-name', label: 'State name' }],
            buttons: [{ text: 'Save', onClick: save }, { text: 'Cancel', onClick: cancel }],
            onEscape: cancel,
            onEnter: save
        });
    }

    endEditTransition(transition, text) {
        if (text !== undefined) {
            const oldText = transition.getText();
            transition.setText(text);
            this._sandbox.raiseEvent(this.TRANSITION_EDITED_EVENT, { transition: transition, changes: [{ name: 'text', oldValue: oldText }] });
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        }
        this._sandbox.sendMessage(this.ADD_KEY_LISTENER, { key: 'Enter', listener: this._onEdit });
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterListener(this.ITEM_MOVED_EVENT, this._onItemMoved);
            this._sandbox.unregisterListener(this.ITEM_PRESSED_EVENT, this._onItemPressed);
            this._sandbox.unregisterListener(this.ITEM_DRAG_ENDED_EVENT, this._onDragEnded);
            this._sandbox.unregisterListener(this.ITEM_DELETED_EVENT, this._onItemDeleted);
            this._sandbox.unregisterListener(this.ITEM_SELECTION_CHANGED_EVENT, this._onItemSelectionChanged);
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.TRANSITION_CREATED_EVENT);
        this._sandbox.deleteEvent(this.TRANSITION_EDITED_EVENT);
        this._sandbox.deleteEvent(this.TRANSITION_DELETED_EVENT);
        this._sandbox.sendMessage(this.REMOVE_KEY_LISTENER, { key: 'Enter', listener: this._onEdit });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'connect', listener: this._onConnect });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'edit', listener: this._onEdit });
    }

    _operateOnSelected(operation, constructor) {
        let selected = this._sandbox.sendMessage(this.GET_SELECTED_ITEM);
        if (selected && (!constructor || selected instanceof constructor)) {
            return operation(selected);
        }
    }

    _onItemPressed(e) {
        if (e.item instanceof State && e.ctrlKey) {
            this.beginConnecting(e.item, e.point);
        }
    }

    _onItemMoved(e) {
        if (e.item instanceof Transition && !e.item.isSet) {
            let itemAt = this._sandbox.sendMessage(this.GET_ITEM_AT, {
                point: e.point,
                predicate: function (item) {
                    return item instanceof State;
                }
            });
            if (itemAt) {
                e.item.setEndTemporarily(itemAt);
            }
            else {
                e.item.setEndTemporarily(null);
            }
        }
    }

    _onDragEnded(e) {
        if (e.item instanceof Transition) {
            if (e.item.isSet) {
                if (!MathUtils.arePointsEqual(e.from, e.to)) {
                    this._sandbox.raiseEvent(this.TRANSITION_EDITED_EVENT, { transition: e.item, changes: [{ name: 'position', oldValue: e.from }] });
                }
            } else {
                this.endConnecting(e.item, e.point)
            }
        }
    }

    _onItemDeleted(e) {
        if (e.item instanceof State) {
            let itemsToDelete = this._sandbox.sendMessage(this.GET_ITEMS, (item) => {
                return item instanceof Transition && (item.firstItem === e.item || item.secondItem === e.item)
            });
            itemsToDelete.forEach(item => {
                this._sandbox.sendMessage(this.REMOVE_ITEM, item);
            });
        } else if (e.item instanceof Transition && e.item.isSet) {
            this._sandbox.raiseEvent(this.TRANSITION_DELETED_EVENT, e.item);
        }
    }

    _onItemSelectionChanged(e) {
        if (e.newItem instanceof Transition) {
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'connect', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'accept', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'initial', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'edit', disabled: false });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'delete', disabled: false });
        }
    }
}