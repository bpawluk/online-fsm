'use strict'

import { State, Transition } from './fsm-shapes.js'

export class FSMDesigner {
    constructor(sandbox) {
        // Provides:

        // Depends on:
        this.ADD_ITEM = 'workspace-add-item';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.BEGIN_DRAG = 'workspace-begin-drag';
        this.SELECT_ITEM = 'workspace-select-item';
        this.GET_SELECTED_ITEM = 'workspace-get-selection';
        this.GET_ITEM_AT = 'workspace-get-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.SHOW_POPUP = 'popup-show';
        this.HIDE_POPUP = 'popup-hide';
        this.DISABLE_CONTROL = 'disable-control';
        this.ENABLE_CONTROL = 'enable-control';
        this.SERIALIZE_FSM = 'fsm-serialize';
        this.DESERIALIZE_FSM = 'fsm-deserialize';
        this.APP_INIT_EVENT = 'app-init';
        this.ITEM_MOVED_EVENT = 'workspace-item-moved';
        this.ITEM_PRESSED_EVENT = 'workspace-item-pressed';
        this.ITEM_DRAG_ENDED_EVENT = 'workspace-drag-ended';
        this.ITEM_DELETED_EVENT = 'workspace-item-deleted';
        this.ITEM_SELECTION_CHANGED_EVENT = 'workspace-item-selection-changed';
        this.DOUBLE_CLICK_EVENT = 'double-click';
        this.KEY_DOWN_EVENT = 'key-down'
        this.BUTTON_CLICKED_EVENT = 'button-clicked';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._lastNum = 0;
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
            this._sandbox.registerListener(this.ITEM_MOVED_EVENT, { callback: this._onItemMoved, thisArg: this });
            this._sandbox.registerListener(this.ITEM_PRESSED_EVENT, { callback: this._onItemPressed, thisArg: this });
            this._sandbox.registerListener(this.ITEM_DRAG_ENDED_EVENT, { callback: this._onDragEnded, thisArg: this });
            this._sandbox.registerListener(this.ITEM_DELETED_EVENT, { callback: this._onItemDeleted, thisArg: this });
            this._sandbox.registerListener(this.ITEM_SELECTION_CHANGED_EVENT, { callback: this._onItemSelectionChanged, thisArg: this });
            this._sandbox.registerListener(this.DOUBLE_CLICK_EVENT, { callback: this._onPointerDoubleClicked, thisArg: this });
            this._sandbox.registerListener(this.KEY_DOWN_EVENT, { callback: this._onKeyDown, thisArg: this });
            this._sandbox.registerListener(this.BUTTON_CLICKED_EVENT, { callback: this._onButtonClicked, thisArg: this });
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
        this._sandbox.sendMessage(this.SELECT_ITEM, { item: null });
        let dataString = localStorage.getItem('fsm-data');
        if (dataString) {
            let data = this._sandbox.sendMessage(this.DESERIALIZE_FSM, dataString)
            data.states.forEach(state => {
                let text = state.getText().trim();
                if (text && /^S[0-9]+$/.test(text)) {
                    let number = parseInt(text.slice(1, text.length));
                    console.log(number);
                    this._lastNum = number > this._lastNum ? number + 1 : this._lastNum;
                }
                this._sandbox.sendMessage(this.ADD_ITEM, state)
            });
            data.transitions.forEach(transition => {
                this._sandbox.sendMessage(this.ADD_ITEM, transition)
            });
        }
    }

    addState(point) {
        point = point || { x: 50, y: 50 }
        let state = new State({
            text: 'S' + this._lastNum++,
            position: point
        });
        this._sandbox.sendMessage(this.ADD_ITEM, state);
        this.changeEntryPoint({ item: state, abortIfExists: true })
        this._sandbox.sendMessage(this.SELECT_ITEM, { item: state, point: point });
        console.log('state added');
        this._saveChanges();
    }

    beginEditState(state) {
        this._sandbox.unregisterListener(this.KEY_DOWN_EVENT, this._onKeyDown);
        let oldText = state.getText();
        let save = () => {
            let result = this._sandbox.sendMessage(this.HIDE_POPUP);
            state.setText(result.find((e) => e.name === 'state-name').value);
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
            this._sandbox.registerListener(this.KEY_DOWN_EVENT, { callback: this._onKeyDown, thisArg: this });
            console.log('state edited');
            this._saveChanges();
        };
        let cancel = () => {
            this._sandbox.sendMessage(this.HIDE_POPUP)
            state.setText(oldText);
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
            this._sandbox.registerListener(this.KEY_DOWN_EVENT, { callback: this._onKeyDown, thisArg: this });
        };
        this._sandbox.sendMessage(this.SHOW_POPUP, {
            message: 'Please enter new name for the state',
            input: [{ name: 'state-name', label: 'State name' }],
            buttons: [{ text: 'Save', onClick: save }, { text: 'Cancel', onClick: cancel }],
            onEscape: cancel,
            onEnter: save
        });
    }

    beginConnecting(item, point) {
        point = point || item.getPosition();
        let transition = new Transition({
            text: '$',
            position: point,
            first: item
        });
        this._sandbox.sendMessage(this.ADD_ITEM, transition);
        this._sandbox.sendMessage(this.BEGIN_DRAG, { item: transition, point: point });
    }

    makeAccepting(state) {
        state.accept(!state.isAccepting);
        this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        console.log('state accepted');
        this._saveChanges();
    }

    changeEntryPoint(data) {
        let current = this._sandbox.sendMessage(this.GET_ITEMS).find((item) => item instanceof State && item.isEntry === true);
        if (!data.abortIfExists && current) {
            current.setAsEntry(false);
            data.item.setAsEntry(true);
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
            console.log('state entry set');
            this._saveChanges();
        } else if (!current) {
            data.item.setAsEntry(true);
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
            console.log('state entry set');
            this._saveChanges();
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterListener(this.ITEM_MOVED_EVENT, this._onItemMoved);
            this._sandbox.unregisterListener(this.ITEM_PRESSED_EVENT, this._onItemPressed);
            this._sandbox.unregisterListener(this.ITEM_DRAG_ENDED_EVENT, this._onDragEnded);
            this._sandbox.unregisterListener(this.ITEM_DELETED_EVENT, this._onItemDeleted);
            this._sandbox.unregisterListener(this.ITEM_SELECTION_CHANGED_EVENT, this._onItemSelectionChanged);
            this._sandbox.unregisterListener(this.DOUBLE_CLICK_EVENT, this._onPointerDoubleClicked);
            this._sandbox.unregisterListener(this.KEY_DOWN_EVENT, this._onKeyDown);
            this._sandbox.unregisterListener(this.BUTTON_CLICKED_EVENT, this._onButtonClicked);
        }
    }

    cleanUp() { }

    _onItemPressed(e) {
        if (e.item instanceof State) {
            if (e.ctrlKey) {
                this.beginConnecting(e.item, e.point);
            }
            else if (e.shiftKey) {
                this.changeEntryPoint({ item: e.item });
            }
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
        if (e.item instanceof Transition && !e.item.isSet) {
            let itemAt = this._sandbox.sendMessage(this.GET_ITEM_AT, {
                point: e.point,
                predicate: function (item) {
                    return item instanceof State;
                }
            });
            if (itemAt) {
                e.item.setEnd(itemAt);
            }
            else {
                this._sandbox.sendMessage(this.REMOVE_ITEM, e.item);
            }
        }
        //TO DO
        // console.log('drag ended');
        // this._saveChanges();
    }

    _onItemDeleted(e) {
        if (e.item instanceof State) {
            let itemsToDelete = this._sandbox.sendMessage(this.GET_ITEMS, (item) => {
                return item instanceof Transition && (item.firstItem === e.item || item.secondItem === e.item)
            });
            itemsToDelete.forEach(item => {
                this._sandbox.sendMessage(this.REMOVE_ITEM, item);
            });
            if (e.item.isEntry) {
                let states = this._sandbox.sendMessage(this.GET_ITEMS, (item) => item instanceof State);
                if (states && states.length > 0) {
                    this.changeEntryPoint({ item: states[0] });
                }
            }
        }
        console.log('item deleted');
        this._saveChanges();
    }

    _onItemSelectionChanged(e) {
        if (e.newItem && (e.newItem instanceof State || e.newItem instanceof Transition)) {
            if (e.newItem instanceof State) {
                this._sandbox.sendMessage(this.ENABLE_CONTROL, 'connect');
                this._sandbox.sendMessage(this.ENABLE_CONTROL, 'accept');
                this._sandbox.sendMessage(this.ENABLE_CONTROL, 'initial');
            } else {
                this._sandbox.sendMessage(this.DISABLE_CONTROL, 'connect');
                this._sandbox.sendMessage(this.DISABLE_CONTROL, 'accept');
                this._sandbox.sendMessage(this.DISABLE_CONTROL, 'initial');
            }
            this._sandbox.sendMessage(this.ENABLE_CONTROL, 'edit');
            this._sandbox.sendMessage(this.ENABLE_CONTROL, 'delete');
        } else {
            this._sandbox.sendMessage(this.DISABLE_CONTROL, 'connect');
            this._sandbox.sendMessage(this.DISABLE_CONTROL, 'accept');
            this._sandbox.sendMessage(this.DISABLE_CONTROL, 'initial');
            this._sandbox.sendMessage(this.DISABLE_CONTROL, 'edit');
            this._sandbox.sendMessage(this.DISABLE_CONTROL, 'delete');
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

    _onKeyDown(e) {
        if (e.key === 'Enter') {
            let selected = this._sandbox.sendMessage(this.GET_SELECTED_ITEM);
            if (selected) {
                this.beginEditState(selected);
            }
        }
    }

    _onButtonClicked(button) {
        let selected = this._sandbox.sendMessage(this.GET_SELECTED_ITEM);
        switch (button.id) {
            case 'add':
                this.addState();
                break;
            case 'connect':
                if (selected && selected instanceof State) {
                    this.beginConnecting(selected);
                }
                break;
            case 'accept':
                if (selected && selected instanceof State) {
                    this.makeAccepting(selected);
                }
                break;
            case 'initial':
                if (selected && selected instanceof State) {
                    this.changeEntryPoint({ item: selected });
                }
                break;
            case 'edit':
                if (selected) {
                    this.beginEditState(selected);
                }
                break;
        }
    }

    _saveChanges() {
        let states = this._sandbox.sendMessage(this.GET_ITEMS, (item) => item instanceof State);
        let transitions = this._sandbox.sendMessage(this.GET_ITEMS, (item) => item instanceof Transition);
        let json = this._sandbox.sendMessage(this.SERIALIZE_FSM, { states: states, transitions: transitions });
        console.log('SAVE');
        localStorage.setItem('fsm-data', json);
    }
}