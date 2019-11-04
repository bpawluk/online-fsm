'use strict'

export class Workspace {
    constructor(sandbox) {
        // Provides:
        this.ADD_ITEM = 'workspace-add-item';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.MOVE_ITEM = 'workspace-move-item';
        this.BEGIN_DRAG = 'workspace-begin-drag';
        this.END_DRAG = 'workspace-end-drag';
        this.SELECT_ITEM = 'workspace-select-item';
        this.GET_ITEM_AT = 'workspace-get-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.ITEM_DRAG_STARTED_EVENT = 'workspace-drag-started';
        this.ITEM_MOVED_EVENT = 'workspace-item-moved';
        this.ITEM_DRAG_ENDED_EVENT = 'workspace-drag-ended';
        this.ITEM_PRESSED_EVENT = 'workspace-item-pressed';
        this.ITEM_DELETED_EVENT = 'workspace-item-deleted';
        this.ITEM_POINTER_OVER_CHANGED_EVENT = 'workspace-item-pointer-over-changed';
        this.ITEM_SELECTION_CHANGED_EVENT = 'workspace-item-selection-changed';

        // Depends on:
        this.CLEAR_CANVAS = 'canvas-clear';
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.REDRAW_CANVAS = 'canvas-redraw';
        this.PREVENT_SCROLLING = 'prevent-scrolling';
        this.APP_INIT_EVENT = 'app-init';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';
        this.KEY_DOWN = 'key-down'

        // Requires interfaces:
        this.DRAWABLE_INTERFACE = 'drawable-interface';
        this.HOVERABLE_INTERFACE = 'hoverable-interface';
        this.MOVABLE_INTERFACE = 'movable-interface';
        this.SELECTABLE_INTERFACE = 'selectable-interface';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._draggedItem = null;
        this._hoveredItem = null;
        this._selectedItem = null;
        this._items = [];

        this._sandbox.createEvent(this.ITEM_DRAG_STARTED_EVENT);
        this._sandbox.createEvent(this.ITEM_MOVED_EVENT);
        this._sandbox.createEvent(this.ITEM_DRAG_ENDED_EVENT);
        this._sandbox.createEvent(this.ITEM_PRESSED_EVENT);
        this._sandbox.createEvent(this.ITEM_DELETED_EVENT);
        this._sandbox.createEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT);
        this._sandbox.createEvent(this.ITEM_SELECTION_CHANGED_EVENT);
        this._sandbox.declareInterface(this.DRAWABLE_INTERFACE, ['draw'], []);
        this._sandbox.declareInterface(this.HOVERABLE_INTERFACE, ['contains', 'pointerOver', 'pointerOut'], ['isHoverable']);
        this._sandbox.declareInterface(this.MOVABLE_INTERFACE, ['move'], ['isMovable']);
        this._sandbox.declareInterface(this.SELECTABLE_INTERFACE, ['contains', 'select', 'unselect'], ['isSelectable']);
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
            this._sandbox.registerListener(this.POINTER_DOWN_EVENT, this._handlePointerDown.bind(this));
            this._sandbox.registerListener(this.POINTER_MOVE_EVENT, this._handlePointerMove.bind(this));
            this._sandbox.registerListener(this.POINTER_UP_EVENT, this._handlePointerUp.bind(this));
            this._sandbox.registerListener(this.KEY_DOWN, this._handleKeyDown.bind(this));
            this._sandbox.registerMessageReceiver(this.ADD_ITEM, this.addItem.bind(this));
            this._sandbox.registerMessageReceiver(this.REMOVE_ITEM, this.removeItem.bind(this));
            this._sandbox.registerMessageReceiver(this.MOVE_ITEM, this.moveItem.bind(this));
            this._sandbox.registerMessageReceiver(this.SELECT_ITEM, this.selectItem.bind(this));
            this._sandbox.registerMessageReceiver(this.BEGIN_DRAG, this.beginDrag.bind(this));
            this._sandbox.registerMessageReceiver(this.END_DRAG, this.endDrag.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_ITEM_AT, this.getItemAt.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_ITEMS, this.getItems.bind(this));
            this.isRunning = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
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
        if(!predicate){
            return this._items.slice();
        } else {
            return this._items.filter(predicate);
        }
    }

    beginDrag(data) {
        let item = data.item;
        let point = data.point;
        this.endDrag(point);
        if (item && item.isMovable) {
            if (this._items.includes(item) && item.isMovable) {
                this._draggedItem = item;
                this._sandbox.raiseEvent(this.ITEM_DRAG_STARTED_EVENT, { item: item, point: point });
            }
        }
        this._sandbox.sendMessage(this.PREVENT_SCROLLING, false);
    }

    endDrag(point) {
        if (this._draggedItem) {
            let draggedItem = this._draggedItem;
            this._draggedItem = null;
            this._sandbox.raiseEvent(this.ITEM_DRAG_ENDED_EVENT, { item: draggedItem, point: point });
        }
        this._sandbox.sendMessage(this.PREVENT_SCROLLING, true);
    }

    moveItem(data) {
        let item = data.item;
        let point = data.point;
        if (item && this._items.includes(item) && item.isMovable) {
            item.move(point);
            this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
            this._sandbox.raiseEvent(this.ITEM_MOVED_EVENT, { item: item, point: point, source: data.sender });
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

    stop() {
        if (this.isRunning) {
            this._sandbox.unregisterMessageReceiver(this.ADD_ITEM);
            this._sandbox.unregisterMessageReceiver(this.REMOVE_ITEM);
            this._sandbox.unregisterMessageReceiver(this.SELECT_ITEM);
            this._sandbox.unregisterMessageReceiver(this.MOVE_ITEM);
            this._sandbox.unregisterMessageReceiver(this.BEGIN_DRAG);
            this._sandbox.unregisterMessageReceiver(this.END_DRAG);
            this._sandbox.unregisterMessageReceiver(this.GET_ITEM_AT);
            // this._sandbox.unregisterListener(this.POINTER_DOWN_EVENT, this._handlePointerDown.bind(this));
            // this._sandbox.unregisterListener(this.POINTER_MOVE_EVENT, this._handlePointerMove.bind(this));
            // this._sandbox.unregisterListener(this.POINTER_UP_EVENT, this._handlePointerUp.bind(this));
            this.isRunning = false;
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.ITEM_DRAG_STARTED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_MOVED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_DRAG_ENDED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_PRESSED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_SELECTION_CHANGED_EVENT);
    }

    _handlePointerDown(e) {
        let point = { x: e.x, y: e.y };
        let elementClicked = this.getItemAt({ point: point });
        this.beginDrag({ item: elementClicked, point: point });
        this.selectItem({ item: elementClicked, point: point });
    }

    _handlePointerMove(e) {
        let point = { x: e.x, y: e.y };
        if (this._draggedItem) {
            this.moveItem({ item: this._draggedItem, point: point });
        }
        else {
            let newHovered = this.getItemAt({ point: point });
            if (this._hoveredItem || newHovered) {
                this.hoverItem(newHovered, point);
            }
        }
    }

    _handlePointerUp(e) {
        let point = { x: e.x, y: e.y };
        this.endDrag(point);
        let elementAtPoint = this.getItemAt({ point: point });
        if (this._selectedItem && elementAtPoint === this._selectedItem) {
            this._sandbox.raiseEvent(this.ITEM_PRESSED_EVENT, { point: point, item: elementAtPoint, special: e.ctrlKey });
        }
    }

    _handleKeyDown(e) {
        if (e.key === 'Delete' && this._selectedItem) {
            let toDelete = this._selectedItem;
            this.selectItem({ item: null });
            this.removeItem(toDelete);
            this._sandbox.raiseEvent(this.ITEM_DELETED_EVENT, { item: toDelete });
        }
    }
}