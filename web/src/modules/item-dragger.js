'use strict'

export class ItemDragger {
    constructor(sandbox) {
        // Provides:
        this.MOVE_ITEM = 'workspace-move-item';
        this.BEGIN_DRAG = 'workspace-begin-drag';
        this.END_DRAG = 'workspace-end-drag';
        this.IS_DRAGGING = 'workspace-is-dragging'
        this.ITEM_DRAG_STARTED_EVENT = 'workspace-drag-started';
        this.ITEM_DRAG_ENDED_EVENT = 'workspace-drag-ended';
        this.ITEM_MOVED_EVENT = 'workspace-item-moved';

        // Depends on:
        this.GET_ITEM_AT = 'workspace-get-item';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.PREVENT_SCROLLING = 'prevent-scrolling';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._draggedItem = null;
        this._dragStart = null
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this._sandbox.createEvent(this.ITEM_DRAG_STARTED_EVENT);
            this._sandbox.createEvent(this.ITEM_MOVED_EVENT);
            this._sandbox.createEvent(this.ITEM_DRAG_ENDED_EVENT);
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerListener(this.POINTER_DOWN_EVENT, { callback: this._handlePointerDown, thisArg: this });
            this._sandbox.registerListener(this.POINTER_MOVE_EVENT, { callback: this._handlePointerMove, thisArg: this });
            this._sandbox.registerListener(this.POINTER_UP_EVENT, { callback: this._handlePointerUp, thisArg: this });
            this._sandbox.registerMessageReceiver(this.MOVE_ITEM, this.moveItem.bind(this));
            this._sandbox.registerMessageReceiver(this.BEGIN_DRAG, this.beginDrag.bind(this));
            this._sandbox.registerMessageReceiver(this.END_DRAG, this.endDrag.bind(this));
            this._sandbox.registerMessageReceiver(this.IS_DRAGGING, () => !!this._draggedItem);
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
    }

    beginDrag(data) {
        let item = data.item;
        let point = data.point;
        this.endDrag(point);
        if (item && item.isMovable) {
            this._draggedItem = item;
            this._dragStart = item.getPosition();
            this._sandbox.raiseEvent(this.ITEM_DRAG_STARTED_EVENT, { item: item, point: point });
            this._sandbox.sendMessage(this.PREVENT_SCROLLING, false);
        }

    }

    endDrag(point) {
        if (this._draggedItem) {
            let draggedItem = this._draggedItem;
            this._draggedItem = null;
            this._sandbox.raiseEvent(this.ITEM_DRAG_ENDED_EVENT, {
                item: draggedItem, point: point,
                from: this._dragStart, to: draggedItem.getPosition()
            });
            this._dragStart = null;
            this._sandbox.sendMessage(this.PREVENT_SCROLLING, true);
        }
    }

    moveItem(data) {
        let item = data.item;
        let point = data.point;
        if (item && item.isMovable) {
            item.move(point);
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE, false);
            this._sandbox.raiseEvent(this.ITEM_MOVED_EVENT, { item: item, point: point, source: data.sender });
        }
    }

    stop() {
        if (this.isRunning) {
            this._sandbox.unregisterMessageReceiver(this.MOVE_ITEM);
            this._sandbox.unregisterMessageReceiver(this.BEGIN_DRAG);
            this._sandbox.unregisterMessageReceiver(this.END_DRAG);
            this._sandbox.unregisterMessageReceiver(this.IS_DRAGGING);
            this._sandbox.unregisterListener(this.POINTER_DOWN_EVENT, this._handlePointerDown);
            this._sandbox.unregisterListener(this.POINTER_MOVE_EVENT, this._handlePointerMove);
            this._sandbox.unregisterListener(this.POINTER_UP_EVENT, this._handlePointerUp);
            this.isRunning = false;
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.ITEM_DRAG_STARTED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_DRAG_ENDED_EVENT);
        this._sandbox.deleteEvent(this.ITEM_MOVED_EVENT);
    }

    _handlePointerDown(e) {
        let point = { x: e.x, y: e.y };
        let elementClicked = this._sandbox.sendMessage(this.GET_ITEM_AT, {
            point: point,
            predicate: (item) => item.isMovable
        })
        this.beginDrag({ item: elementClicked, point: point });
    }

    _handlePointerMove(e) {
        if (this._draggedItem) {
            this.moveItem({ item: this._draggedItem, point: { x: e.x, y: e.y } });
        }
    }

    _handlePointerUp(e) {
        this.endDrag({ x: e.x, y: e.y });
    }
}