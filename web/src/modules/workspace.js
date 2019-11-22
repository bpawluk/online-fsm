'use strict'

export class Workspace {
    constructor(sandbox) {
        // Provides:
        this.ADD_ITEM = 'workspace-add-item';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.SELECT_ITEM = 'workspace-select-item';
        this.GET_SELECTED_ITEM = 'workspace-get-selection';
        this.GET_ITEM_AT = 'workspace-get-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.ITEM_PRESSED_EVENT = 'workspace-item-pressed';
        this.ITEM_DELETED_EVENT = 'workspace-item-deleted';
        this.ITEM_POINTER_OVER_CHANGED_EVENT = 'workspace-item-pointer-over-changed';
        this.ITEM_SELECTION_CHANGED_EVENT = 'workspace-item-selection-changed';


        // Depends on:
        this.CLEAR_CANVAS = 'canvas-clear';
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.REDRAW_CANVAS = 'canvas-redraw';
        this.IS_DRAGGING = 'workspace-is-dragging'
        this.APP_INIT_EVENT = 'app-init';
        this.CANVAS_RESIZED_EVENT = 'canvas-resized';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';
        this.KEY_DOWN_EVENT = 'key-down'
        this.BUTTON_CLICKED_EVENT = 'button-clicked';

        // Requires interfaces:
        this.DRAWABLE_INTERFACE = 'drawable-interface';
        this.HOVERABLE_INTERFACE = 'hoverable-interface';
        this.MOVABLE_INTERFACE = 'movable-interface';
        this.SELECTABLE_INTERFACE = 'selectable-interface';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._hoveredItem = null;
        this._selectedItem = null;
        this._items = [];

        this._sandbox.createEvent(this.ITEM_PRESSED_EVENT);
        this._sandbox.createEvent(this.ITEM_DELETED_EVENT);
        this._sandbox.createEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT);
        this._sandbox.createEvent(this.ITEM_SELECTION_CHANGED_EVENT);
        this._sandbox.declareInterface(this.DRAWABLE_INTERFACE, ['draw'], []);
        this._sandbox.declareInterface(this.HOVERABLE_INTERFACE, ['contains', 'pointerOver', 'pointerOut'], ['isHoverable']);
        this._sandbox.declareInterface(this.MOVABLE_INTERFACE, ['move', 'getPosition'], ['isMovable']);
        this._sandbox.declareInterface(this.SELECTABLE_INTERFACE, ['contains', 'select', 'unselect'], ['isSelectable']);
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
            this._sandbox.registerListener(this.POINTER_DOWN_EVENT, { callback: this._handlePointerDown, thisArg: this });
            this._sandbox.registerListener(this.POINTER_MOVE_EVENT, { callback: this._handlePointerMove, thisArg: this });
            this._sandbox.registerListener(this.POINTER_UP_EVENT, { callback: this._handlePointerUp, thisArg: this });
            this._sandbox.registerListener(this.CANVAS_RESIZED_EVENT, { callback: this._onCanvasResized, thisArg: this });
            this._sandbox.registerListener(this.KEY_DOWN_EVENT, { callback: this._handleKeyDown, thisArg: this });
            this._sandbox.registerListener(this.BUTTON_CLICKED_EVENT, { callback: this._handleButtonClicked, thisArg: this });
            this._sandbox.registerMessageReceiver(this.ADD_ITEM, this.addItem.bind(this));
            this._sandbox.registerMessageReceiver(this.REMOVE_ITEM, this.removeItem.bind(this));
            this._sandbox.registerMessageReceiver(this.SELECT_ITEM, this.selectItem.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_ITEM_AT, this.getItemAt.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_SELECTED_ITEM, () => this._selectedItem);
            this._sandbox.registerMessageReceiver(this.GET_ITEMS, this.getItems.bind(this));
            this._sandbox.registerMessageReceiver(this.REFRESH_WORKSPACE, this.refresh.bind(this));
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
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
    }

    removeItem(item) {
        for (let i = 0, len = this._items.length; i < len; i++) {
            if (this._items[i] === item) {
                this._items.splice(i, 1);
            }
        }
        this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
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

    hoverItem(item, point) {
        let oldItem = this._hoveredItem;
        let newItem = this._items.includes(item) && item.isHoverable ? item : null;
        this._hoveredItem = newItem;

        let redrawNeeded = false;
        if (oldItem) {
            oldItem.pointerOut();
            redrawNeeded = true;
        }
        if (newItem) {
            newItem.pointerOver();
            redrawNeeded = true;
        }
        if (redrawNeeded) {
            this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
        }

        this._sandbox.raiseEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT, { point: point, oldItem: oldItem, newItem: newItem });
    }

    selectItem(data) {
        let item = data.item;
        let point = data.point;
        let oldItem = this._selectedItem
        let newItem = this._items.includes(item) && item.isSelectable ? item : null;
        this._selectedItem = newItem;

        let redrawNeeded = false;
        if (oldItem) {
            oldItem.unselect();
            redrawNeeded = true;
        }
        if (newItem) {
            newItem.select(point);
            redrawNeeded = true;
        }
        if (redrawNeeded) {
            this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
        }

        this._sandbox.raiseEvent(this.ITEM_SELECTION_CHANGED_EVENT, { point: point, oldItem: oldItem, newItem: newItem });
    }

    refresh() {
        this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
    }

    stop() {
        if (this.isRunning) {
            this._sandbox.unregisterMessageReceiver(this.ADD_ITEM);
            this._sandbox.unregisterMessageReceiver(this.REMOVE_ITEM);
            this._sandbox.unregisterMessageReceiver(this.SELECT_ITEM);
            this._sandbox.unregisterMessageReceiver(this.GET_ITEM_AT);
            this._sandbox.unregisterMessageReceiver(this.GET_SELECTED_ITEM);
            this._sandbox.unregisterMessageReceiver(this.GET_ITEMS);
            this._sandbox.unregisterMessageReceiver(this.REFRESH_WORKSPACE);
            this._sandbox.unregisterListener(this.POINTER_DOWN_EVENT, this._handlePointerDown);
            this._sandbox.unregisterListener(this.POINTER_MOVE_EVENT, this._handlePointerMove);
            this._sandbox.unregisterListener(this.POINTER_UP_EVENT, this._handlePointerUp);
            this._sandbox.unregisterListener(this.CANVAS_RESIZED_EVENT, this._onCanvasResized);
            this._sandbox.unregisterListener(this.KEY_DOWN_EVENT, this._handleKeyDown);
            this._sandbox.unregisterListener(this.BUTTON_CLICKED_EVENT, this._handleButtonClicked);
            this.isRunning = false;
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.ITEM_PRESSED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_SELECTION_CHANGED_EVENT);
    }

    _handlePointerDown(e) {
        let point = { x: e.x, y: e.y };
        let elementClicked = this.getItemAt({ point: point });
        this.selectItem({ item: elementClicked, point: point });
    }

    _handlePointerMove(e) {
        let point = { x: e.x, y: e.y };
        if (!this._sandbox.sendMessage(this.IS_DRAGGING)) {
            let newHovered = this.getItemAt({ point: point });
            if (this._hoveredItem || newHovered) {
                this.hoverItem(newHovered, point);
            }
        }
    }

    _handlePointerUp(e) {
        let point = { x: e.x, y: e.y };
        let elementAtPoint = this.getItemAt({ point: point });
        if (this._selectedItem && elementAtPoint === this._selectedItem) {
            this._sandbox.raiseEvent(this.ITEM_PRESSED_EVENT, { point: point, item: elementAtPoint, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
        }
    }

    _deleteSelected() {
        let toDelete = this._selectedItem;
        this.selectItem({ item: null });
        this.removeItem(toDelete);
        this._sandbox.raiseEvent(this.ITEM_DELETED_EVENT, { item: toDelete });
    }

    _handleKeyDown(e) {
        if (e.key === 'Delete' && this._selectedItem) {
            this._deleteSelected();
        }
    }

    _handleButtonClicked(button) {
        if (button.id === 'delete') {
            this._deleteSelected();
        }
    }

    _onCanvasResized(e) {
        this.refresh();
    }
}