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
        this.APP_INIT_EVENT = 'app-init';
        this.ITEM_MOVED_EVENT = 'workspace-item-moved';
        this.ITEM_PRESSED_EVENT = 'workspace-item-pressed';
        this.ITEM_DRAG_ENDED_EVENT = 'workspace-drag-ended';
        this.ITEM_DELETED_EVENT = 'workspace-item-deleted';
        this.DOUBLE_CLICK_EVENT = 'double-click';
        this.BUTTON_CLICKED_EVENT = 'button-clicked';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, this.onAppInit.bind(this));
            this.isInit = true;
            this.start();
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerListener(this.ITEM_MOVED_EVENT, this._onItemMoved.bind(this));
            this._sandbox.registerListener(this.ITEM_PRESSED_EVENT, this._onItemPressed.bind(this));
            this._sandbox.registerListener(this.ITEM_DRAG_ENDED_EVENT, this._onDragEnded.bind(this));
            this._sandbox.registerListener(this.ITEM_DELETED_EVENT, this._onItemDeleted.bind(this));
            this._sandbox.registerListener(this.DOUBLE_CLICK_EVENT, this._onPointerDoubleClicked.bind(this));
            this._sandbox.registerListener(this.BUTTON_CLICKED_EVENT, this._onButtonClicked.bind(this));
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
    }

    addState(point) {
        point = point || { x: 50, y: 50 }
        let state = new State({
            position: point
        });
        this._sandbox.sendMessage(this.ADD_ITEM, state);
        this.changeEntryPoint({ item: state, abortIfExists: true })
        this._sandbox.sendMessage(this.SELECT_ITEM, { item: state, point: point });
    }

    beginConnecting(item, point) {
        point = point || item.getPosition();
        let transition = new Transition({
            position: point,
            first: item
        });
        this._sandbox.sendMessage(this.ADD_ITEM, transition);
        this._sandbox.sendMessage(this.BEGIN_DRAG, { item: transition, point: point });
    }

    makeAccepting(state) {
        state.accept(!state.isAccepting);
        this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
    }

    changeEntryPoint(data) {
        let current = this._sandbox.sendMessage(this.GET_ITEMS).find((item) => item instanceof State && item.isEntry === true);
        if (!data.abortIfExists && current) {
            current.setAsEntry(false);
            data.item.setAsEntry(true);
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        } else if (!current) {
            data.item.setAsEntry(true);
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
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
    }

    _onItemDeleted(e) {
        if (e.item instanceof State) {
            let itemsToDelete = this._sandbox.sendMessage(this.GET_ITEMS, (item) => {
                return item instanceof Transition && (item._firstItem === e.item || item._secondItem === e.item)
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

    _onButtonClicked(button) {
        let selected = this._sandbox.sendMessage(this.GET_SELECTED_ITEM);
        switch (button.id) {
            case 'add':
                this.addState();
                break;
            case 'connect':
                if (selected) {
                    this.beginConnecting(selected);
                }
                break;
            case 'accept':
                if (selected) {
                    this.makeAccepting(selected);
                }
                break;
            case 'initial':
                if (selected) {
                    this.changeEntryPoint({ item: selected });
                }
                break;
            case 'edit':
                if (selected) {
                    let oldText = selected.getText();
                    this._sandbox.sendMessage(this.SHOW_POPUP, {
                        message: 'Please enter new name for the state',
                        input: [{ name: 'state-name', label: 'State name' }],
                        buttons: [{
                            text: 'Save',
                            onClick: (e) => {
                                let result = this._sandbox.sendMessage(this.HIDE_POPUP);
                                selected.setText(result.find((e) => e.name === 'state-name').value);
                                this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
                            }
                        },
                        {
                            text: 'Cancel',
                            onClick: (e) => {
                                this._sandbox.sendMessage(this.HIDE_POPUP)
                                selected.setText(oldText);
                                this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
                            }
                        }]
                    });
                }
                break;
        }
    }
}