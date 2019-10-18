'use strict'

export class Workspace {
    constructor(sandbox) {
        // Provides:
        this.ADD_ITEM = 'workspace-add-item';
        this.MOVE_ITEM = 'workspace-move-item';
        this.SELECT_ITEM = 'workspace-select-item';
        this.ITEM_MOVED_EVENT = 'workspace-item-moved';
        this.ITEM_POINTER_OVER_CHANGED_EVENT = 'workspace-item-pointer-over-changed';
        this.ITEM_SELECTION_CHANGED_EVENT = 'workspace-item-selection-changed';

        // Depends on:
        this.CLEAR_CANVAS = 'canvas-clear';
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.REDRAW_CANVAS = 'canvas-redraw';
        this.CREATE_SHAPE = 'create-shape'
        this.APP_INIT_EVENT = 'app-init';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';
        this.DOUBLE_CLICK_EVENT = 'double-click';

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

        this._sandbox.createEvent(this.ITEM_MOVED_EVENT);
        this._sandbox.createEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT);
        this._sandbox.createEvent(this.ITEM_SELECTION_CHANGED_EVENT);
        this._sandbox.declareInterface(this.DRAWABLE_INTERFACE, ['draw'], []);
        this._sandbox.declareInterface(this.HOVERABLE_INTERFACE, ['contains', 'pointerOver', 'pointerOut'], ['isHoverable']);
        this._sandbox.declareInterface(this.MOVABLE_INTERFACE, ['move', 'getBounds'], ['isMovable']);
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
            this._sandbox.registerListener(this.DOUBLE_CLICK_EVENT, this._handleDoubleClick.bind(this));
            this._sandbox.registerMessageReceiver(this.ADD_ITEM, this.addItem.bind(this));
            this._sandbox.registerMessageReceiver(this.MOVE_ITEM, this.moveItem.bind(this));
            this._sandbox.registerMessageReceiver(this.SELECT_ITEM, this.selectItem.bind(this));
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

    getItemAt(point) {
        let items = this._items;
        for (let i = items.length - 1; i >= 0; i--) {
            let current = items[i];
            if (current.contains && current.contains(point.x, point.y)) {
                return current;
            }
        }
        return null;
    }

    moveItem(data) {
        let item = data.item;
        let point = data.point;
        if (item && this._items.includes(item) && item.isMovable) {
            item.move(point.x, point.y);
            this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
            this._sandbox.raiseEvent(this.ITEM_MOVED_EVENT, { item: this._draggedItem, point: point, source: data.sender });
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

    selectItem(item, point = null) {
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
            this._sandbox.unregisterMessageReceiver(this.SELECT_ITEM);
            // this._sandbox.unregisterListener(this.DOUBLE_CLICK_EVENT, this._handleDoubleClick.bind(this));
            // this._sandbox.unregisterListener(this.POINTER_DOWN_EVENT, this._handlePointerDown.bind(this));
            // this._sandbox.unregisterListener(this.POINTER_MOVE_EVENT, this._handlePointerMove.bind(this));
            // this._sandbox.unregisterListener(this.POINTER_UP_EVENT, this._handlePointerUp.bind(this));
            this.isRunning = false;
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.ITEM_MOVED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_SELECTION_CHANGED_EVENT);
    }

    _handlePointerDown(e) {
        let point = { x: e.x, y: e.y };
        let elementClicked = this.getItemAt(point);
        this._draggedItem = elementClicked;
        this.selectItem(elementClicked, point);
    }

    _handlePointerMove(e) {
        let point = { x: e.x, y: e.y };
        if (this._draggedItem) {
            this.moveItem({ item: this._draggedItem, point: point });
        }
        else {
            let newHovered = this.getItemAt(point);
            if (this._hoveredItem || newHovered) {
                this.hoverItem(newHovered, point);
            }
        }
    }

    _handlePointerUp(e) {
        this._draggedItem = null;
    }

    _handleDoubleClick(e) {
        let point = { x: e.x, y: e.y };
        let doubleClickedItem = this.getItemAt(point);
        if (doubleClickedItem) {
            // TODO: Make accepting state
        } else {
            let newItem = this._sandbox.sendMessage(this.CREATE_SHAPE, { shape: 'circle', config: { x: e.x, y: e.y, isHoverable: true, isMovable: true, isSelectable: true } });
            this.addItem(newItem);
            this.selectItem(newItem, point);
        }
    }
}