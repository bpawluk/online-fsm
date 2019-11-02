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
        this.GET_ITEM_AT = 'workspace-get-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.APP_INIT_EVENT = 'app-init';
        this.ITEM_MOVED_EVENT = 'workspace-item-moved';
        this.ITEM_PRESSED_EVENT = 'workspace-item-pressed';
        this.ITEM_DRAG_ENDED_EVENT = 'workspace-drag-ended';
        this.ITEM_DELETED_EVENT = 'workspace-item-deleted';
        this.DOUBLE_CLICK_EVENT = 'double-click';

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
            this._sandbox.registerListener(this.ITEM_MOVED_EVENT, this.onItemMoved.bind(this));
            this._sandbox.registerListener(this.ITEM_PRESSED_EVENT, this.onItemPressed.bind(this));
            this._sandbox.registerListener(this.ITEM_DRAG_ENDED_EVENT, this.onDragEnded.bind(this));
            this._sandbox.registerListener(this.ITEM_DELETED_EVENT, this.onItemDeleted.bind(this));
            this._sandbox.registerListener(this.DOUBLE_CLICK_EVENT, this.onPointerDoubleClicked.bind(this));
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
    }

    onItemPressed(e) {
        if (e.special && e.item instanceof State) {
            let transition = new Transition({
                position: e.point,
                first: e.item
            });
            this._sandbox.sendMessage(this.ADD_ITEM, transition);
            this._sandbox.sendMessage(this.BEGIN_DRAG, { item: transition, point: e.point });
        }
    }

    onItemMoved(e) {
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

    onDragEnded(e) {
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

    onItemDeleted(e) {
        if (e.item instanceof State) {
            let itemsToDelete = this._sandbox.sendMessage(this.GET_ITEMS, (item) => {
                return item instanceof Transition && (item._firstItem === e.item || item._secondItem === e.item)
            });
            itemsToDelete.forEach(item => {
                this._sandbox.sendMessage(this.REMOVE_ITEM, item);
            });
        }
    }

    onPointerDoubleClicked(e) {
        let point = { x: e.x, y: e.y };
        let doubleClickedItem = this._sandbox.sendMessage(this.GET_ITEM_AT, {
            point: point,
            predicate: function (item) {
                return item instanceof State;
            }
        });
        if (doubleClickedItem) {
            // TODO: Make accepting state
        }
        else {
            let state = new State({
                position: point
            });
            this._sandbox.sendMessage(this.ADD_ITEM, state);
            this._sandbox.sendMessage(this.SELECT_ITEM, { item: state, point: e.point });
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
        }
    }

    cleanUp() { }
}