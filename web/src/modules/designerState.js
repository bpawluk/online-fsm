'use strict'

class Shape {
    constructor(x, y) {
        this._posX = x === undefined ? 0 : x;
        this._posY = y === undefined ? 0 : y;
        this._state = 'default';
    }

    contains(x, y) { return false }

    draw(context) { }

    move(x, y) {
        this._posX = x;
        this._posY = y;
    }

    select() {
        this._state = 'selected';
    }

    unselect() {
        this._state = 'default';
    }

    pointerOver() {
        if (this._state !== 'selected') {
            this._state = 'hovered';
        }
    }

    pointerOut() {
        if (this._state !== 'selected') {
            this._state = 'default';
        }
    }
}

class Circle extends Shape {
    constructor(ruler, x, y, radius) {
        super(x, y);
        this._radius = radius === undefined ? 50 : x;
        this._ruler = ruler;
    }

    contains(x, y) {
        // TODO: CHANGE SQUARE TO CIRCLE
        return x >= this._posX - this._radius
            && x <= this._posX + this._radius
            && y >= this._posY - this._radius
            && y <= this._posY + this._radius;
    }

    draw(context) {
        context.save();
        switch (this._state) {
            case 'default':
                context.strokeStyle = '#000000';
                break;
            case 'hovered':
                context.strokeStyle = '#3BA7FF';
                break;
            case 'selected':
                context.strokeStyle = '#000089';
                break;
            default:
                throw new Error('There is no ' + this._state + ' state defined.');
        }
        context.beginPath();
        context.arc(this._posX, this._posY, this._radius, 0, 2 * Math.PI);
        context.fillStyle = '#FFFFFF';
        context.fill();
        context.stroke();
        context.restore();
    }

    move(x, y) {
        if (this._ruler) {
            let bounds = {
                left: this._radius,
                top: this._radius,
                right: this._radius,
                bottom: this._radius
            }
            let newPoint = this._ruler.pull(bounds, x, y);
            super.move(newPoint.x, newPoint.y);
        } else {
            super.move(x, y);
        }
    }
}

class Ruler {
    constructor(distance, reach) {
        this._distance = distance === undefined ? 50 : distance;
        this._reach = reach === undefined ? 5 : reach;
    }

    pull(bounds, x, y) {
        return {
            x: this._computePosition(x, bounds.left, bounds.right),
            y: this._computePosition(y, bounds.bottom, bounds.top)
        }
    }

    _computePosition(pos, left, right) {
        let nearestRuler = this._nearestRuler(pos, left, right);
        return nearestRuler.distance <= this._reach ? nearestRuler.position : pos;
    }

    _nearestRuler(pos, left, right) {
        let distToLeft = (pos - left) % this._distance;
        let distToRight = this._distance - ((pos + right) % this._distance);
        let nearestRuler = {};
        if(distToLeft <= distToRight){
            nearestRuler.distance = distToLeft;
            nearestRuler.position = pos - distToLeft;
        } else {
            nearestRuler.distance = distToRight;
            nearestRuler.position = pos + distToRight;
        }
        return nearestRuler;
    }
}

export class DesignerState {
    constructor(sandbox, config) {
        // Provides:
        this.DESIGNER_ELEMENT_INTERFACE = 'workspace-element';
        this.GET_ITEM_AT_POINT = 'get-item-at-point';

        // Depends on:
        // TODO: Const canvas drawable 
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.REDRAW_CANVAS = 'canvas-redraw'
        this.SELECT_ITEM = 'select-item';
        this.APP_INIT_EVENT = 'app-init';
        this.DOUBLE_CLICK_EVENT = 'double-click';
        this.ITEM_DRAGGED_EVENT = 'item-dragged';
        this.ITEM_POINTER_OVER_CHANGED_EVENT = 'item-pointer-over-changed';
        this.ITEM_SELECTION_CHANGED_EVENT = 'item-selection-changed';

        this._isInit = false;
        this._sandbox = sandbox;

        this._items = [];
        this._ruler = null;

        if (config && config.useRulers) {
            this._ruler = new Ruler(config.rulerSpacing, config.rulerReach)
        }

        this._sandbox.declareInterface(this.DESIGNER_ELEMENT_INTERFACE, ['contains', 'draw', 'move', 'select',
            'unselect', 'pointerOver', 'pointerOut'], []);
        this._sandbox.registerMessageReceiver(this.GET_ITEM_AT_POINT, this.getItemAtPoint.bind(this));
    }

    init() {
        if (!this._isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, this.onAppInit.bind(this));
            this._sandbox.registerListener(this.DOUBLE_CLICK_EVENT, this._handleDoubleClick.bind(this));
            this._sandbox.registerListener(this.ITEM_DRAGGED_EVENT, this._handleItemDragged.bind(this));
            this._sandbox.registerListener(this.ITEM_POINTER_OVER_CHANGED_EVENT, this._handlePointerOverChanged.bind(this));
            this._sandbox.registerListener(this.ITEM_SELECTION_CHANGED_EVENT, this._handleSelectionChanged.bind(this));
            this._isInit = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
    }

    addItem(item) {
        this._sandbox.assertInterface(item, this.DESIGNER_ELEMENT_INTERFACE);
        this._items.push(item);
        this._sandbox.sendMessage(this.DRAW_ON_CANVAS, item);
    }

    getItemAtPoint(point) {
        let items = this._items;
        for (let i = items.length - 1; i >= 0; i--) {
            let current = items[i];
            if (current.contains(point.x, point.y)) {
                return current;
            }
        }
        return null;
    }

    stop() {
        // this._sandbox.unregisterListener(this.DOUBLE_CLICK_EVENT, this._handleDoubleClick.bind(this));
        // this._sandbox.unregisterListener(this.POINTER_DOWN_EVENT, this._handlePointerDown.bind(this));
        // this._sandbox.unregisterListener(this.POINTER_MOVE_EVENT, this._handlePointerMove.bind(this));
        // this._sandbox.unregisterListener(this.POINTER_UP_EVENT, this._handlePointerUp.bind(this));
        this._isInit = false;
    }

    cleanUp() {

    }

    _handleDoubleClick(e) {
        let doubleClickedItem = this.getItemAtPoint({ x: e.x, y: e.y });
        if (doubleClickedItem) {
            // TODO: Make accepting state
        } else {
            let newItem = new Circle(this._ruler, e.x, e.y);
            this._sandbox.sendMessage(this.SELECT_ITEM, newItem);
            this.addItem(newItem);
        }
    }

    _handleItemDragged(e) {
        e.item.move(e.point.x, e.point.y);
        this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
    }

    _handlePointerOverChanged(e) {
        let redrawNeeded = false;

        if (e.oldItem) {
            e.oldItem.pointerOut();
            redrawNeeded = true;
        }

        if (e.newItem) {
            e.newItem.pointerOver();
            redrawNeeded = true;
        }

        if (redrawNeeded) {
            this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
        }
    }

    _handleSelectionChanged(e) {
        let redrawNeeded = false;

        if (e.oldItem) {
            e.oldItem.unselect();
            redrawNeeded = true;
        }

        if (e.newItem) {
            e.newItem.select();
            redrawNeeded = true;
        }

        if (redrawNeeded) {
            this._sandbox.sendMessage(this.REDRAW_CANVAS, this._items);
        }
    }
}