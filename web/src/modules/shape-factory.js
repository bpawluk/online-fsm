'use strict'

class Shape {
    constructor(config) {
        config = config || {};
        this._posX = config.x === undefined ? 0 : config.x;
        this._posY = config.y === undefined ? 0 : config.y;
        this.isHoverable = !!config.isHoverable;
        this.isSelectable = !!config.isSelectable;
        this.isMovable = !!config.isMovable;
        this.isPullable = !!config.isPullable;
        this.isConnectible = !!config.isConnectible;
        this._state = 'default';
        this._pointerOffset = null;
    }

    contains(x, y) { return false }

    draw(context) { }

    getBounds() {
        return {
            left: this._posX,
            top: this._posY,
            right: this._posX,
            bottom: this._posY
        }
    }

    getPosition() {
        return { x: this._posX, y: this._posY };
    }

    move(x, y) {
        this._posX = x;
        this._posY = y;
    }

    select(pointerPosition) {
        this._state = 'selected';
        if (pointerPosition) {
            this._pointerOffset = {
                x: pointerPosition.x - this._posX,
                y: pointerPosition.y - this._posY
            };
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
    }

    contains(x, y) {
        let dx = Math.abs(this._posX - x);
        if (dx > this._radius) {
            return false;
        }

        let dy = Math.abs(this._posY - y);
        if (dy > this._radius) {
            return false
        }

        if (dx + dy <= this._radius) {
            return true
        }

        return dx * dx + dy * dy <= this._radius * this._radius
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

    move(x, y) {
        if (this._pointerOffset) {
            super.move(x - this._pointerOffset.x, y - this._pointerOffset.y);
        }
        else {
            super.move(x, y);
        }
    }

    getRadius() {
        return this._radius;
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

class CircleConnector extends Shape {
    constructor(config) {
        config = config || {};
        super(config);

        if (!config.first) {
            throw new Error('Arrow needs to connect at least one item')
        }

        this.isConnector = true;
        this.isSet = false;
        this.firstItem = config.first;
        this.secondItem = config.second || config.first;

        this._angleOffset = 0;
        this._containsToleration = 5;
        this._angleOffsetToleration = 0.15;
    }

    contains(x, y) {
        if (this.isSet) {
            let closestPoint = this._getPointClosestTo(x, y);
            let dx = x - closestPoint.x;
            let dy = y - closestPoint.y;
            if (Math.sqrt(dx * dx + dy * dy) <= this._containsToleration) {
                return true;
            }
        }
        return false;
    }

    move(x, y) {
        if (this.isSet) {
            let firstPoint = this.firstItem.getPosition();
            //let secondPoint = this.secondItem.getPosition();
            let vector = { x: x - firstPoint.x, y: y - firstPoint.y }
            this._angleOffset = -Math.atan2(vector.y, -vector.x) + Math.PI;
            console.log(this._angleOffset);
            // //let firstVector = { x: secondPoint.x - firstPoint.x, y: secondPoint.y - firstPoint.y };
            // let firstVector = { x: 1, y: 0 };
            // let secondVector = { x: x - firstPoint.x, y: y - firstPoint.y };
            // let dot = firstVector.x * secondVector.x + firstVector.y * secondVector.y;
            // let det = firstVector.x * secondVector.y - firstVector.y * secondVector.x;
            // this._angleOffset = Math.atan2(det, dot) + Math.PI;
            // console.log(this._angleOffset);

            // let firstVector = { x: secondPoint.x - firstPoint.x, y: secondPoint.y - firstPoint.y };
            // let firstVectorLength = Math.sqrt(firstVector.x * firstVector.x + firstVector.y * firstVector.y);
            // let secondVector = { x: x - firstPoint.x, y: y - firstPoint.y };
            // let secondVectorLength = Math.sqrt(secondVector.x * secondVector.x + secondVector.y * secondVector.y);
            // this._angleOffset = Math.acos((firstVector.x * secondVector.x + firstVector.y + secondVector.y) / (firstVectorLength * secondVectorLength));
            // console.log(this._angleOffset);
        }
        else if (!this.secondItem) {
            super.move(x, y);
        }
    }

    setEndTemporarily(item) {
        this.secondItem = item;
    }

    setEnd(item) {
        this.secondItem = item;
        this.isSet = true;
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
        let from = this.firstItem.getPosition();
        let to = this.secondItem ? this.secondItem.getPosition() : { x: this._posX, y: this._posY };
        context.beginPath();
        if (this._angleOffset <= this._angleOffsetToleration) {
            context.moveTo(from.x, from.y);
            context.lineTo(to.x, to.y);
        }
        else {
            let x = from.x + this.firstItem.getRadius() * Math.cos(this._angleOffset);
            let y = from.y + this.firstItem.getRadius() * Math.sin(this._angleOffset);
            context.arc(x, y, 5, 0, 2 * Math.PI);
        }
        context.stroke();
        context.restore();
    }

    _getPointClosestTo(x, y) {
        if (this._angleOffset <= this._angleOffsetToleration) {
            let firstPoint = this.firstItem.getPosition();
            let secondPoint = this.secondItem.getPosition();
            let dx = secondPoint.x - firstPoint.x;
            let dy = secondPoint.y - firstPoint.y;
            if (dx === 0 && dy === 0) {
                return firstPoint;
            }
            var direction = ((x - firstPoint.x) * dx + (y - firstPoint.y) * dy) / (dx * dx + dy * dy);
            let newX = firstPoint.x + direction * (secondPoint.x - firstPoint.x);
            let newY = firstPoint.y + direction * (secondPoint.y - firstPoint.y);
            let minX = Math.min(firstPoint.x, secondPoint.x);
            let maxX = Math.max(firstPoint.x, secondPoint.x);
            let minY = Math.min(firstPoint.y, secondPoint.y);
            let maxY = Math.max(firstPoint.y, secondPoint.y);
            return ({
                x: newX > maxX ? maxX : newX < minX ? minX : newX,
                y: newY > maxY ? maxY : newY < minY ? minY : newY
            });
        }
        else {

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
            circle: Circle,
            circleConnector: CircleConnector
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
        if (!this.isRunning) {
            this._sandbox.registerMessageReceiver(this.CREATE_SHAPE, this.createShape.bind(this));
        }
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