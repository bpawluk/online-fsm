export class ItemConnector {
    constructor(sandbox) {
        // Provides:

        // Depends on:
        this.ADD_ITEM = 'workspace-add-item';
        this.REMOVE_ITEM = 'workspace-remove-item';
        this.BEGIN_DRAG = 'workspace-begin-drag';
        this.CREATE_SHAPE = 'create-shape'
        this.GET_ITEM_AT = 'workspace-get-item';
        this.APP_INIT_EVENT = 'app-init';
        this.ITEM_MOVED_EVENT = 'workspace-item-moved';
        this.ITEM_PRESSED_EVENT = 'workspace-item-pressed';
        this.ITEM_DRAG_ENDED_EVENT = 'workspace-drag-ended';

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
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
    }

    onItemPressed(e) {
        if (e.item.isConnectible) {
            let newArrow = this._sandbox.sendMessage(this.CREATE_SHAPE, { shape: 'arrow', config: { first: e.item, x: e.point.x, y: e.point.y, isMovable: true, isPullable: false } });
            this._sandbox.sendMessage(this.ADD_ITEM, newArrow);
            this._sandbox.sendMessage(this.BEGIN_DRAG, { item: newArrow, point: { x: e.x, y: e.y } });
        }
    }

    onItemMoved(e) {
        if (e.item.isConnector && !e.item.isSet) {
            let itemAt = this._sandbox.sendMessage(this.GET_ITEM_AT, e.point);
            if (itemAt && itemAt.isConnectible) {
                e.item.setEndTemporarily(itemAt);
            } 
            else {
                e.item.setEndTemporarily(null);
            }
        }
    }

    onDragEnded(e) {
        if (e.item.isConnector && !e.item.isSet) {
            let itemAt = this._sandbox.sendMessage(this.GET_ITEM_AT, e.point);
            if (itemAt && itemAt.isConnectible) {
                e.item.setEnd(itemAt);
            }
            else {
                this._sandbox.sendMessage(this.REMOVE_ITEM, e.item);
            }
        }
    }

    stop() {
        if (this.isRunning) {
            this._sandbox.unregisterMessageReceiver(this.CREATE_SHAPE);
            this.isRunning = false;
        }
    }

    cleanUp() {
        this._sandbox.unregisterMessageReceiver(this.CREATE_SHAPE);
    }
}