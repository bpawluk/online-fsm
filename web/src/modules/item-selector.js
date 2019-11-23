'use strict'

export class ItemSelector {
    constructor(sandbox) {
        // Provides:
        this.SELECT_ITEM = 'workspace-select-item';
        this.GET_SELECTED_ITEM = 'workspace-get-selection';
        this.ITEM_PRESSED_EVENT = 'workspace-item-pressed';
        this.ITEM_POINTER_OVER_CHANGED_EVENT = 'workspace-item-pointer-over-changed';
        this.ITEM_SELECTION_CHANGED_EVENT = 'workspace-item-selection-changed';

        // Depends on:
        this.GET_ITEM_AT = 'workspace-get-item';
        this.IS_DRAGGING = 'workspace-is-dragging';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.APP_INIT_EVENT = 'app-init';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this._sandbox.createEvent(this.ITEM_PRESSED_EVENT);
            this._sandbox.createEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT);
            this._sandbox.createEvent(this.ITEM_SELECTION_CHANGED_EVENT);
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerListener(this.POINTER_DOWN_EVENT, { callback: this._handlePointerDown, thisArg: this });
            this._sandbox.registerListener(this.POINTER_MOVE_EVENT, { callback: this._handlePointerMove, thisArg: this });
            this._sandbox.registerListener(this.POINTER_UP_EVENT, { callback: this._handlePointerUp, thisArg: this });
            this._sandbox.registerMessageReceiver(this.SELECT_ITEM, this.selectItem.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_SELECTED_ITEM, () => this._selectedItem);
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
    }

    hoverItem(item, point) {
        let oldItem = this._hoveredItem;
        let newItem = item && item.isHoverable ? item : null;
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
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        }

        this._sandbox.raiseEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT, { point: point, oldItem: oldItem, newItem: newItem });
    }

    selectItem(data) {
        let item = data.item;
        let point = data.point;
        let oldItem = this._selectedItem
        let newItem = item && item.isSelectable ? item : null;
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
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
        }

        this._sandbox.raiseEvent(this.ITEM_SELECTION_CHANGED_EVENT, { point: point, oldItem: oldItem, newItem: newItem });
    }

    stop() {
        if (this.isRunning) {
            this._sandbox.unregisterMessageReceiver(this.SELECT_ITEM);
            this._sandbox.unregisterMessageReceiver(this.GET_SELECTED_ITEM);
            this._sandbox.unregisterListener(this.POINTER_DOWN_EVENT, this._handlePointerDown);
            this._sandbox.unregisterListener(this.POINTER_MOVE_EVENT, this._handlePointerMove);
            this._sandbox.unregisterListener(this.POINTER_UP_EVENT, this._handlePointerUp);
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
        let elementClicked = this._sandbox.sendMessage(this.GET_ITEM_AT, {
            point: point,
            predicate: (item) => item.isSelectable
        });
        this.selectItem({ item: elementClicked, point: point });
    }

    _handlePointerMove(e) {
        let point = { x: e.x, y: e.y };
        if (!this._sandbox.sendMessage(this.IS_DRAGGING)) {
            let newHovered = this._sandbox.sendMessage(this.GET_ITEM_AT, {
                point: point,
                predicate: (item) => item.isHoverable
            });            
            if (this._hoveredItem || newHovered) {
                this.hoverItem(newHovered, point);
            }
        }
    }

    _handlePointerUp(e) {
        let point = { x: e.x, y: e.y };
        let elementAtPoint = this._sandbox.sendMessage(this.GET_ITEM_AT, {
            point: point,
            predicate: (item) => item.isSelectable
        });
        if (this._selectedItem && elementAtPoint === this._selectedItem) {
            this._sandbox.raiseEvent(this.ITEM_PRESSED_EVENT, { point: point, item: elementAtPoint, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
        }
    }
}