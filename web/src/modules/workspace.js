'use strict'

export class Workspace {
    constructor(sandbox) {
        // Provides:
        this.SELECT_ITEM = 'select-item'
        this.ITEM_DRAGGED_EVENT = 'item-dragged';
        this.ITEM_POINTER_OVER_CHANGED_EVENT = 'item-pointer-over-changed';
        this.ITEM_SELECTION_CHANGED_EVENT = 'item-selection-changed';

        // Depends on:
        this.CLEAR_CANVAS = 'canvas-clear';
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.GET_ITEM_AT_POINT = 'get-item-at-point';
        this.APP_INIT_EVENT = 'app-init';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';

        this._isInit = false;
        this._sandbox = sandbox;

        this._draggedItem = null;
        this._itemPointerOver = null;
        this._selectedItem = null;

        this._sandbox.registerMessageReceiver(this.SELECT_ITEM, this.selectItem.bind(this));
        this._sandbox.createEvent(this.ITEM_DRAGGED_EVENT);
        this._sandbox.createEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT);
        this._sandbox.createEvent(this.ITEM_SELECTION_CHANGED_EVENT);
    }

    init() {
        if (!this._isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, this.onAppInit.bind(this));
            this._sandbox.registerListener(this.POINTER_DOWN_EVENT, this._handlePointerDown.bind(this));
            this._sandbox.registerListener(this.POINTER_MOVE_EVENT, this._handlePointerMove.bind(this));
            this._sandbox.registerListener(this.POINTER_UP_EVENT, this._handlePointerUp.bind(this));
            this._isInit = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
    }

    selectItem(item, point = null) {
        let itemSelectionChangedEventData = {
            point: point,
            oldItem: this._selectedItem,
            newItem: item
        };
        this._selectedItem = item;
        this._sandbox.raiseEvent(this.ITEM_SELECTION_CHANGED_EVENT, itemSelectionChangedEventData);
    }

    stop() {
        // this._sandbox.unregisterListener(this.DOUBLE_CLICK_EVENT, this._handleDoubleClick.bind(this));
        // this._sandbox.unregisterListener(this.POINTER_DOWN_EVENT, this._handlePointerDown.bind(this));
        // this._sandbox.unregisterListener(this.POINTER_MOVE_EVENT, this._handlePointerMove.bind(this));
        // this._sandbox.unregisterListener(this.POINTER_UP_EVENT, this._handlePointerUp.bind(this));
        this._isInit = false;
    }

    cleanUp() {
        this._sandbox.unregisterMessageReceiver(this.SELECT_ITEM);
    }

    _handlePointerDown(e) {
        let point = { x: e.x, y: e.y };
        let elementClicked = this._sandbox.sendMessage(this.GET_ITEM_AT_POINT, point);
        this._draggedItem = elementClicked;
        this.selectItem(elementClicked, point);
    }

    _handlePointerMove(e) {
        let point = { x: e.x, y: e.y };

        if (this._draggedItem) {
            let itemDraggedEventData = {
                point: point,
                item: this._draggedItem
            }
            this._sandbox.raiseEvent(this.ITEM_DRAGGED_EVENT, itemDraggedEventData);
        } else {
            let newItemPointerOver = this._sandbox.sendMessage(this.GET_ITEM_AT_POINT, point);
            if (this._itemPointerOver || newItemPointerOver) {
                let itemPointerOverEventData = {
                    point: point,
                    oldItem: this._itemPointerOver,
                    newItem: newItemPointerOver
                }
                this._itemPointerOver = newItemPointerOver;
                this._sandbox.raiseEvent(this.ITEM_POINTER_OVER_CHANGED_EVENT, itemPointerOverEventData);
            }
        }
    }

    _handlePointerUp(e) {
        this._draggedItem = null;
    }
}