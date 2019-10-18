'use strict'

class Shape {
    constructor(config) {
        config = config || {};
        this._posX = config.x === undefined ? 0 : config.x;
        this._posY = config.y === undefined ? 0 : config.y;
        this._state = 'default';
        this._pointerOffset = null;
    }

    contains(x, y) { return false }

    draw(context) { }

    getBounds() { return null }

    move(x, y) {
        if (this._pointerOffset) {
            x = x - this._pointerOffset.x;
            y = y - this._pointerOffset.y;
        }
        this._posX = x;
        this._posY = y;
    }

    select(pointerPosition) {
        this._state = 'selected';
        if (pointerPosition) {
            this._pointerOffset = {
                x: pointerPosition.x - this._posX,
                y: pointerPosition.y - this._posY
            }
        }
    }

    unselect() {
        this._state = 'default';
        this._pointerAnchor = null;
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
    constructor(config) {
        config = config || {};
        super(config);
        this._radius = config.radius === undefined ? 50 : config.radius;
        this.isHoverable = !!config.isHoverable;
        this.isSelectable = !!config.isSelectable;
        this.isMovable = !!config.isMovable;
    }

    contains(x, y) {
        let dx = Math.abs(this._posX - x);
        if(dx > this._radius) {
            return false;
        }

        let dy = Math.abs(this._posY - y);
        if(dy > this._radius) {
            return false
        }
        
        if(dx + dy <= this._radius){
            return true
        }

        return dx*dx + dy*dy <= this._radius*this._radius
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
                context.strokeStyle = '#336699';
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

    getBounds() {
        return {
            left: this._posX - this._radius,
            top: this._posY + this._radius,
            right: this._posX + this._radius,
            bottom: this._posY - this._radius
        }
    }
}

export class ShapeFactory {
    constructor(sandbox) {
        // Provides:
        this.CREATE_SHAPE = 'create-shape'

        // Depends on:
        this.APP_INIT_EVENT = 'app-init';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._shapesRegistry = {
            circle: Circle
        };
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, this.onAppInit.bind(this));
            this.isInit = true;
            this.start();
        }
    }

    start() {
        this._sandbox.registerMessageReceiver(this.CREATE_SHAPE, this.createShape.bind(this));
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
    }

    createShape(data) {
        let shapeConstructor = this._shapesRegistry[data.shape];
        if (!shapeConstructor) {
            throw new Error('Shape ' + shape + ' does not exist');
        }
        return new shapeConstructor(data.config);
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