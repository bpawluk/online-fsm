export class Ruler {
    constructor(sandbox, config) {
        // Provides:

        // Depends on:
        this.ADD_ITEM = 'workspace-add-item';
        this.MOVE_ITEM = 'workspace-move-item';
        this.APP_INIT_EVENT = 'app-init';
        this.ITEM_MOVED_EVENT = 'workspace-item-moved';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        config = config || {};
        this._distance = config.distance === undefined ? 50 : config.distance;
        this._reach = config.reach === undefined ? 5 : config.reach;
        this._isVisible = config.visibility;
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
            this.isRunning = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
        if (this._isVisible) {
            this._sandbox.sendMessage(this.ADD_ITEM, this);
        }
    }

    draw(context) {
        let canvas = context.canvas;

        let smallerDim = {
            name: 'height',
            value: canvas.height
        };
        let biggerDim = {
            name: 'width',
            value: canvas.width
        };

        if (canvas.width < canvas.height) {
            let temp = smallerDim;
            smallerDim = biggerDim;
            biggerDim = temp;
        }

        context.save();
        context.strokeStyle = '#F0F0F0'
        context.beginPath();

        let i = this._distance;
        for (; i < smallerDim.value; i += this._distance) {
            context.moveTo(0, i);
            context.lineTo(canvas.width, i);
            context.moveTo(i, 0);
            context.lineTo(i, canvas.height);
        }
        for (; i < biggerDim.value; i += this._distance) {
            if (biggerDim.name = 'width') {
                context.moveTo(i, 0);
                context.lineTo(i, canvas.height);
            } else {
                context.moveTo(0, i);
                context.lineTo(canvas.width, i);
            }
        }

        context.stroke();
        context.restore();
    }

    onItemMoved(e) {
        if (e.item.isPullable) {
            let newPos = this._pull(e.item.getBounds(), e.point.x, e.point.y);
            if (e.source !== this && (newPos.x !== e.point.x || newPos.y !== e.point.y)) {
                this._sandbox.sendMessage(this.MOVE_ITEM, { item: e.item, point: newPos, sender: this });
            }
        }
    }

    stop() {
        if (this.isRunning) {
            // this._sandbox.unregisterListener(this.DOUBLE_CLICK_EVENT, this._handleDoubleClick.bind(this));
            this.isRunning = false;
        }
    }

    cleanUp() { }

    _pull(bounds, x, y) {
        return {
            x: this._computePosition(x, bounds.left, bounds.right),
            y: this._computePosition(y, bounds.bottom, bounds.top)
        }
    }

    _computePosition(pos, leftBound, rightBound) {
        let nearestRuler = this._nearestRuler(pos, leftBound, rightBound);
        return nearestRuler.distance <= this._reach ? nearestRuler.position : pos;
    }

    _nearestRuler(pos, leftBound, rightBound) {
        let distToLeft = leftBound % this._distance;
        let distToRight = this._distance - (rightBound % this._distance);
        let nearestRuler = {};
        if (distToLeft <= distToRight) {
            nearestRuler.distance = distToLeft;
            nearestRuler.position = pos - distToLeft;
        } else {
            nearestRuler.distance = distToRight;
            nearestRuler.position = pos + distToRight;
        }
        return nearestRuler;
    }
}