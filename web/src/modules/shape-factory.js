'use strict'

let MathHelper = {
    arePointsColinear: function (a, b, c, tolerance = 0) {
        return Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) <= tolerance;
    },

    arePointsEqual: function (a, b) {
        return a.x === b.x && a.y === b.y;
    },

    isPointCloseToSection: function (a, b, point, maxDistance = 0) {
        let x = point.x;
        let y = point.y;
        let dx = b.x - a.x;
        let dy = b.y - a.y;

        let closestPointOnLine = {};
        if (dx === 0 && dy === 0) {
            closestPointOnLine = a;
        }
        else {
            let direction = ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy);
            closestPointOnLine.x = a.x + direction * (b.x - a.x);
            closestPointOnLine.y = a.y + direction * (b.y - a.y);
        }

        if (!this.isPointOnSection(a, b, closestPointOnLine)) {
            return false;
        }
        else {
            dx = x - closestPointOnLine.x;
            dy = y - closestPointOnLine.y;
            return Math.sqrt(dx * dx + dy * dy) <= maxDistance;
        }
    },

    isPointOnSection: function (a, b, point) {
        let minX = Math.min(a.x, b.x);
        let maxX = Math.max(a.x, b.x);
        let minY = Math.min(a.y, b.y);
        let maxY = Math.max(a.y, b.y);
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    }
}

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

class LineTo extends Shape {
    constructor(config) {
        config = config || {};
        super(config);

        if (!config.start) {
            throw new Error('Line needs to have a starting point')
        }

        this._startPoint = config.start;
        this._distanceToleration = 5;
    }

    setStart(point) {
        this._startPoint = point;
    }

    contains(x, y) {
        return MathHelper.isPointCloseToSection(this._startPoint, { x: this._posX, y: this._posY }, { x: x, y: y }, this._distanceToleration);
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
        context.moveTo(this._startPoint.x, this._startPoint.y);
        context.lineTo(this._posX, this._posY);
        context.stroke();
        context.restore();
    }

    getBounds() {
        return {
            left: Math.min(this._posX, this._startPoint.x),
            top: Math.max(this._posY, this._startPoint.y),
            right: Math.max(this._posX, this._startPoint.x),
            bottom: Math.min(this._posY, this._startPoint.y)
        }
    }
}

class Arc extends Shape {
    constructor(config) {
        config = config || {};
        super(config);

        if (!config.start || !config.end) {
            throw new Error('Arc needs to have a start and end defined')
        }

        this._startPoint = config.start;
        this._endPoint = config.end;

        this._sagitta = null;
        this._center = null;
        this._radius = null;
        this._startAngle = null;
        this._endAngle = null;
        this._calculateArc();

        this._distanceToleration = 5;
    }

    setStart(point) {
        if (!MathHelper.arePointsEqual(this._startPoint, point)) {
            this._startPoint = point;
            _calculateArc();
        }
    }

    setEnd(point) {
        if (!MathHelper.arePointsEqual(this._endPoint, point)) {
            this._endPoint = point;
            _calculateArc();
        }
    }

    move(x, y) {
        if (!MathHelper.arePointsEqual(this._endPoint, { x: x, y: y })) {
            super.move(x, y);
            _calculateArc(true);
        }
    }

    contains(x, y) {
        return false;
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
        context.arc(this._center.x, this._center.y, this._radius, this._startAngle, this._endAngle);
        context.stroke();
        context.restore();
    }

    getBounds() {
        return {
            left: Math.min(this._posX, this._startPoint.x),
            top: Math.max(this._posY, this._startPoint.y),
            right: Math.max(this._posX, this._startPoint.x),
            bottom: Math.min(this._posY, this._startPoint.y)
        }
    }

    _calculateArc(sagittaChanged = false){

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
        this.isSet = !!config.second;

        this._isLinear = true;
        this._firstItem = config.first;
        this._secondItem = config.second || config.first;
        this._innerShape = null;
        this._updateInnerShape();

        this._colinearTolerance = 15;
    }

    contains(x, y) {
        this._updateInnerShape();
        return this._innerShape.contains(x, y);
    }

    move(x, y) {
        super.move(x, y);
        if (this.isSet) {
            this._isLinear = MathHelper.arePointsColinear(this._firstItem.getPosition(), this._secondItem.getPosition(),
                { x: this._posX, y: this._posY }, this._colinearTolerance);
        }
    }

    setEndTemporarily(item) {
        this._secondItem = item;
    }

    setEnd(item) {
        this._secondItem = item;
        this.isSet = true;
    }

    draw(context) {
        this._updateInnerShape();
        this._innerShape.draw(context);
    }

    select(pointerPosition) {
        super.select(pointerPosition);
        this._innerShape.select(pointerPosition);
    }

    unselect() {
        super.unselect();
        this._innerShape.unselect();
    }

    pointerOver() {
        super.pointerOver();
        this._innerShape.pointerOver();
    }

    pointerOut() {
        super.pointerOut();
        this._innerShape.pointerOut();
    }

    _connectLine(from, to) {
        if (this._innerShape instanceof LineTo) {
            this._innerShape.setStart(from);
            this._innerShape.move(to.x, to.y);
        }
        else {
            this._innerShape = new LineTo({
                start: from,
                x: to.x,
                y: to.y,
                isMovable: true
            });
        }
    }

    _connectArc(from, to) {
        if (this._innerShape instanceof Arc) {
            this._innerShape.setStart(from);
            this._innerShape.setEnd(to);
            this._innerShape.move(this._posX, this._posY);
        }
        else {
            this._innerShape = new Arc({
                start: from,
                end: to,
                x: this._posX,
                y: this._posY,
                isMovable: true
            });
        }
    }

    _updateInnerShape() {
        if (this.isSet) {
            if (this._isLinear) {
                this._connectLine(this._firstItem.getPosition(), this._secondItem.getPosition());
            }
            else {
                this._connectArc(this._firstItem.getPosition(), this._secondItem.getPosition());
            }
        }
        else {
            if (this._secondItem) {
                this._connectLine(this._firstItem.getPosition(), this._secondItem.getPosition());
            }
            else {
                this._connectLine(this._firstItem.getPosition(), { x: this._posX, y: this._posY });
            }
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