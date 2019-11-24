'use strict'

export class Workspace {
    constructor(sandbox) {
        // Provides:
        this.ADD_ITEM = 'workspace-add-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.GET_ITEM_AT = 'workspace-get-item';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.ADD_BUTTON_LISTENER = 'add-button-listener';
        this.ADD_KEY_LISTENER = 'add-key-listener';
        this.REMOVE_BUTTON_LISTENER = 'remove-button-listener';
        this.REMOVE_KEY_LISTENER = 'remove-key-listener';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.ITEM_ADDED_EVENT = 'workspace-item-added';
        this.ITEM_DELETED_EVENT = 'workspace-item-deleted';

        // Depends on:
        this.SELECT_ITEM = 'workspace-select-item';
        this.GET_SELECTED_ITEM = 'workspace-get-selection';
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.REDRAW_CANVAS = 'canvas-redraw';
        this.APP_INIT_EVENT = 'app-init';
        this.CANVAS_RESIZED_EVENT = 'canvas-resized';

        // Requires interfaces:
        this.DRAWABLE_INTERFACE = 'drawable-interface';
        this.HOVERABLE_INTERFACE = 'hoverable-interface';
        this.MOVABLE_INTERFACE = 'movable-interface';
        this.SELECTABLE_INTERFACE = 'selectable-interface';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._items = [];
        this._deleteSelectedBind = this._deleteSelected.bind(this);
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this._sandbox.createEvent(this.ITEM_ADDED_EVENT);
            this._sandbox.createEvent(this.ITEM_DELETED_EVENT);
            this._sandbox.declareInterface(this.DRAWABLE_INTERFACE, ['draw'], []);
            this._sandbox.declareInterface(this.HOVERABLE_INTERFACE, ['contains', 'pointerOver', 'pointerOut'], ['isHoverable']);
            this._sandbox.declareInterface(this.MOVABLE_INTERFACE, ['move', 'getPosition'], ['isMovable']);
            this._sandbox.declareInterface(this.SELECTABLE_INTERFACE, ['contains', 'select', 'unselect'], ['isSelectable']);
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerListener(this.CANVAS_RESIZED_EVENT, { callback: this._onCanvasResized, thisArg: this });
            this._sandbox.registerMessageReceiver(this.ADD_ITEM, this.addItem.bind(this));
            this._sandbox.registerMessageReceiver(this.REMOVE_ITEM, this.removeItem.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_ITEM_AT, this.getItemAt.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_ITEMS, this.getItems.bind(this));
            this._sandbox.registerMessageReceiver(this.REFRESH_WORKSPACE, this.refresh.bind(this));
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
        this._sandbox.sendMessage(this.ADD_KEY_LISTENER, { key: 'Delete', listener: this._deleteSelectedBind });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'delete', listener: this._deleteSelectedBind });
    }

    addItem(item) {
        this._sandbox.assertInterface(item, this.DRAWABLE_INTERFACE);
        if (item.isHoverable) {
            this._sandbox.assertInterface(item, this.HOVERABLE_INTERFACE);
        }
        if (item.isMovable) {
            this._sandbox.assertInterface(item, this.MOVABLE_INTERFACE);
        }
        if (item.isSelectable) {
            this._sandbox.assertInterface(item, this.SELECTABLE_INTERFACE);
        }
        this._items.push(item);
        this._sandbox.sendMessage(this.DRAW_ON_CANVAS, item);
        this._sandbox.raiseEvent(this.ITEM_ADDED_EVENT, item);
    }

    removeItem(item) {
        for (let i = 0, len = this._items.length; i < len; i++) {
            if (this._items[i] === item) {
                this._items.splice(i, 1);
                this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
                this._sandbox.raiseEvent(this.ITEM_DELETED_EVENT, { item: item });
                return;
            }
        }
    }

    getItemAt(data) {
        let point = data.point;
        let items = this._items;
        for (let i = items.length - 1; i >= 0; i--) {
            let current = items[i];
            if (current.contains && current.contains(point) && (!data.predicate || data.predicate(current))) {
                return current;
            }
        }
        return null;
    }

    getItems(predicate) {
        if (!predicate) {
            return this._items.slice();
        } else {
            return this._items.filter(predicate);
        }
    }

    refresh() {
        this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
    }

    stop() {
        if (this.isRunning) {
            this._sandbox.unregisterMessageReceiver(this.ADD_ITEM);
            this._sandbox.unregisterMessageReceiver(this.REMOVE_ITEM);
            this._sandbox.unregisterMessageReceiver(this.GET_ITEM_AT);
            this._sandbox.unregisterMessageReceiver(this.GET_ITEMS);
            this._sandbox.unregisterMessageReceiver(this.REFRESH_WORKSPACE);
            this._sandbox.unregisterListener(this.CANVAS_RESIZED_EVENT, this._onCanvasResized);
            this.isRunning = false;
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.ITEM_ADDED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_DELETED_EVENT);
        this._sandbox.sendMessage(this.REMOVE_KEY_LISTENER, { key: 'Delete', listener: this._deleteSelectedBind });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'delete', listener: this._deleteSelectedBind });
    }

    _deleteSelected() {
        if (this.isRunning) {
            let toDelete = this._sandbox.sendMessage(this.GET_SELECTED_ITEM);
            if (toDelete) {
                this._sandbox.sendMessage(this.SELECT_ITEM, { item: null });
                this.removeItem(toDelete);
            }
        }
    }

    _onCanvasResized(e) {
        this.refresh();
    }
}