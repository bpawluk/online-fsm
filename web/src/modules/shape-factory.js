'use strict'

let MathHelper = {
    distance: function (a, b) {
        let vectorX = b.x - a.x;
        let vectorY = b.y - a.y
        return Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    },

    arePointsColinear: function (a, b, c, tolerance) {
        tolerance = tolerance === undefined ? 0.01 : tolerance;
        return Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) <= tolerance;
    },

    arePointsEqual: function (a, b) {
        return a.x === b.x && a.y === b.y;
    },

    isPointCloseToSection: function (a, b, point, maxDistance) {
        maxDistance = maxDistance === undefined ? 0.01 : maxDistance;
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
    },

    centerOfCircleFrom3Points: function (a, b, c) {
        let xa = a.x - c.x;
        let ya = a.y - c.y;
        let xb = b.x - c.x;
        let yb = b.y - c.y;
        let det = 2 * (xa * yb - xb * ya);
        let tempA = xa * xa + ya * ya;
        let tempB = xb * xb + yb * yb;
        let center = {};
        center.x = ((yb * tempA - ya * tempB) / det) + c.x;
        center.y = ((xa * tempB - xb * tempA) / det) + c.y;
        return center;
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

        this._radius = config.radius === undefined ? 0 : config.radius;
        this._startAngle = config.start === undefined ? 0 : config.start;
        this._endAngle = config.end === undefined ? 0 : config.end;
        this._reverse = config.reverse === undefined ? 0 : config.reverse;

        this._distanceToleration = 5;
    }

    setStart(angle) {
        this._startAngle = angle;
    }

    setEnd(angle) {
        this._endAngle = angle;
    }

    setRadius(radius) {
        this._radius = radius;
    }

    setReverse(reverse) {
        this._reverse = reverse;
    }

    contains(x, y) {
        // to be changed
        return Math.abs(MathHelper.distance({ x: this._posX, y: this._posY }, { x: x, y: y }) - this._radius) <= this._distanceToleration;
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
        context.arc(this._posX, this._posY, this._radius, this._startAngle, this._endAngle, this._reverse);
        context.stroke();
        context.restore();
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
        this._lastData = null;
        this._innerShape = null;
        this._updateInnerShape();

        this._colinearTolerance = 5;
    }

    contains(x, y) {
        this._updateInnerShape();
        return this._innerShape.contains(x, y);
    }

    move(x, y) {
        super.move(x, y);
        if (this.isSet) {
            this._isLinear = MathHelper.isPointCloseToSection(this._firstItem.getPosition(), this._secondItem.getPosition(),
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

    _connectLine(endPoint) {
        let from = this._firstItem.getPosition();
        let to = endPoint ? endPoint : this._secondItem.getPosition();
        if (!(this._innerShape instanceof LineTo)) {
            this._innerShape = new LineTo({
                start: from,
                x: to.x,
                y: to.y,
                isMovable: true, isSelectable: true,
                isHoverable: true, isPullable: false
            });
            this._innerShape._state = this._state;
            this._lastData = { from: from, to: to, position: { x: this._posX, y: this._posY } };
        }
        else if (!this._lastData || !(MathHelper.arePointsEqual(this._lastData.from, from)
            && MathHelper.arePointsEqual(this._lastData.to, to))) {
            this._innerShape.setStart(from);
            this._innerShape.move(to.x, to.y);
            this._lastData = { from: from, to: to, position: { x: this._posX, y: this._posY } };
        }
    }

    _connectArc() {
        if (!(this._innerShape instanceof Arc)) {
            let arcData = this._calculateArcData();
            this._innerShape = new Arc({
                start: arcData.startAngle,
                end: arcData.endAngle,
                x: arcData.center.x,
                y: arcData.center.y,
                radius: arcData.radius,
                reverse: arcData.reverse,
                isMovable: true, isSelectable: true,
                isHoverable: true, isPullable: false
            });
            this._innerShape._state = this._state;
        }
        else if (!this._lastData || !(MathHelper.arePointsEqual(this._lastData.from, this._firstItem.getPosition())
            && MathHelper.arePointsEqual(this._lastData.to, this._secondItem.getPosition())
            && MathHelper.arePointsEqual(this._lastData.position, { x: this._posX, y: this._posY }))) {
            let arcData = this._calculateArcData();
            this._innerShape.move(arcData.center.x, arcData.center.y);
            this._innerShape.setStart(arcData.startAngle);
            this._innerShape.setEnd(arcData.endAngle);
            this._innerShape.setRadius(arcData.radius);
            this._innerShape.setReverse(arcData.reverse);
        }
    }

    _calculateArcData() {
        let arcData = {};
        let from = this._firstItem.getPosition();
        let to = this._secondItem.getPosition();
        arcData.center = MathHelper.centerOfCircleFrom3Points(from, to, { x: this._posX, y: this._posY });
        arcData.radius = MathHelper.distance(arcData.center, from);
        let v1 = { x: this._posX - from.x, y: this._posY - from.y };
        let v2 = { x: this._posX - to.x, y: this._posY - to.y };
        arcData.reverse = (v1.x * v2.y - v2.x * v1.y) > 0;
        let scale = arcData.reverse ? 1 : -1;
        arcData.startAngle = Math.atan2(from.y - arcData.center.y, from.x - arcData.center.x) - scale * this._firstItem.getRadius() / arcData.radius;
        arcData.endAngle = Math.atan2(to.y - arcData.center.y, to.x - arcData.center.x) + scale * this._secondItem.getRadius() / arcData.radius;
        this._lastData = { from: from, to: to, position: { x: this._posX, y: this._posY } };
        return arcData;
    }

    _updateInnerShape() {
        if (this.isSet) {
            if (this._isLinear) {
                this._connectLine();
            }
            else {
                this._connectArc();
            }
        }
        else {
            if (this._secondItem) {
                this._connectLine();
            }
            else {
                this._connectLine({ x: this._posX, y: this._posY });
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