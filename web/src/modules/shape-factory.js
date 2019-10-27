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

    isPointInCircle: function (point, center, radius) {
        let dx = Math.abs(center.x - point.x);
        if (dx > radius) {
            return false;
        }

        let dy = Math.abs(center.y - point.y);
        if (dy > radius) {
            return false
        }

        if (dx + dy <= radius) {
            return true
        }

        return dx * dx + dy * dy <= radius * radius
    },

    getPointOnCircleGivenAngle: function (center, radius, angle) {
        return {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        }
    },

    getNormalVector: function (a, b, reversed) {
        if (this.arePointsEqual(a, b)) {
            throw new Error("Cannot create normal vector from equal points");
        }
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let length = this.distance(a, b);
        if (reversed) {
            return {
                x: -dy / length,
                y: dx / length
            }
        }
        else {
            return {
                x: dy / length,
                y: -dx / length
            }
        }
    },

    getUnitVector: function (a, b) {
        if (this.arePointsEqual(a, b)) {
            throw new Error("Cannot create vector from equal points");
        }
        let vector = {};
        vector.x = b.x - a.x;
        vector.y = b.y - a.y;
        let length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        vector.x = vector.x / length;
        vector.y = vector.y / length;
        return vector;
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
    },

    translateVector: function (vector, point) {
        return {
            x: vector.x + point.x,
            y: vector.y + point.y
        }
    },

    vecByScalMul: function (vector, scalar) {
        return {
            x: vector.x * scalar,
            y: vector.y * scalar
        }
    }
}

class Shape {
    constructor(config) {
        config = config || {};
        this._position = config.position ? Object.assign({}, config.position) : { x: 0, y: 0 };
        this.isHoverable = !!config.isHoverable;
        this.isSelectable = !!config.isSelectable;
        this.isMovable = !!config.isMovable;
        this.isPullable = !!config.isPullable;
        this.isConnectible = !!config.isConnectible;
        this._state = 'default';
        this._pointerOffset = null;
    }

    contains(point) { return false }

    draw(context) { }

    getBounds() {
        return {
            left: this._position.x,
            top: this._position.y,
            right: this._position.x,
            bottom: this._position.y
        }
    }

    getPosition() {
        return Object.assign({}, this._position);
    }

    move(point) {
        this._position.x = point.x;
        this._position.y = point.y;
    }

    select(pointerPosition) {
        this._state = 'selected';
        if (pointerPosition) {
            this._pointerOffset = {
                x: pointerPosition.x - this._position.x,
                y: pointerPosition.y - this._position.y
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

        this._startPoint = Object.assign({}, config.start);
        this._distanceToleration = 5;
    }

    setStart(point) {
        this._startPoint.x = point.x;
        this._startPoint.y = point.y;
    }

    contains(point) {
        return MathHelper.isPointCloseToSection(this._startPoint, this._position, point, this._distanceToleration);
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
        context.lineTo(this._position.x, this._position.y);
        context.stroke();
        context.restore();
    }

    getBounds() {
        return {
            left: Math.min(this._position.x, this._startPoint.x),
            top: Math.max(this._position.y, this._startPoint.y),
            right: Math.max(this._position.x, this._startPoint.x),
            bottom: Math.min(this._position.y, this._startPoint.y)
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

    contains(point) {
        let onCircle = Math.abs(MathHelper.distance(this._position, point) - this._radius) <= this._distanceToleration;
        if (onCircle) {
            let direction = { x: point.x - this._position.x, y: point.y - this._position.y };
            let angle = Math.atan2(direction.y, direction.x);
            if (this._startAngle <= this._endAngle) {
                let contains = this._startAngle <= angle && angle <= this._endAngle;
                return this._reverse ? !contains : contains;
            }
            else {
                let contains = angle >= this._startAngle || angle <= this._endAngle;
                return this._reverse ? !contains : contains;
            }
        } else return false;
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
        context.arc(this._position.x, this._position.y, this._radius, this._startAngle, this._endAngle, this._reverse);
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

    contains(point) {
        return MathHelper.isPointInCircle(point, this._position, this._radius);
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
        context.arc(this._position.x, this._position.y, this._radius, 0, 2 * Math.PI);
        context.fillStyle = '#FFFFFF';
        context.fill();
        context.stroke();
        context.restore();
    }

    move(point) {
        if (this._pointerOffset) {
            super.move({ x: point.x - this._pointerOffset.x, y: point.y - this._pointerOffset.y });
        }
        else {
            super.move(point);
        }
    }

    getRadius() {
        return this._radius;
    }

    getBounds() {
        return {
            left: this._position.x - this._radius,
            top: this._position.y + this._radius,
            right: this._position.x + this._radius,
            bottom: this._position.y - this._radius
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

        this._isLinear = config.isLinear === undefined ? true : config.isLinear;
        this._firstItem = config.first;
        this._secondItem = config.second || config.first;
        this._sagitta = null;
        this._isReversed = null;
        this._lastData = null;
        this._innerShape = null;
        this._updateInnerShape();

        this._colinearTolerance = 5;
    }

    contains(point) {
        this._updateInnerShape();
        return this._innerShape.contains(point);
    }

    move(point) {
        super.move(point);
        if (this.isSet) {
            this._isLinear = MathHelper.isPointCloseToSection(this._firstItem.getPosition(),
                this._secondItem.getPosition(), this._position, this._colinearTolerance);
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
            if (!MathHelper.arePointsEqual(from, to)) {
                let newfrom = MathHelper.translateVector(MathHelper.vecByScalMul(MathHelper.getUnitVector(from, to), this._firstItem.getRadius()), this._firstItem.getPosition());
                if (this._secondItem) {
                    let newTo = MathHelper.translateVector(MathHelper.vecByScalMul(MathHelper.getUnitVector(to, from), this._secondItem.getRadius()), this._secondItem.getPosition());
                    to = newTo;
                }
                from = newfrom;
            }

            this._innerShape = new LineTo({
                start: from,
                position: to,
                isMovable: true, isSelectable: true,
                isHoverable: true, isPullable: false
            });
            this._innerShape._state = this._state;

            this._lastData = { from: from, to: to, position: this.getPosition() };
        }

        else if (!this._lastData || !(MathHelper.arePointsEqual(this._lastData.from, from)
            && MathHelper.arePointsEqual(this._lastData.to, to))) {

            if (!MathHelper.arePointsEqual(from, to)) {
                let newfrom = MathHelper.translateVector(MathHelper.vecByScalMul(MathHelper.getUnitVector(from, to), this._firstItem.getRadius()), this._firstItem.getPosition());
                if (this._secondItem) {
                    let newTo = MathHelper.translateVector(MathHelper.vecByScalMul(MathHelper.getUnitVector(to, from), this._secondItem.getRadius()), this._secondItem.getPosition());
                    to = newTo;
                }
                from = newfrom;
            }

            this._innerShape.setStart(from);
            this._innerShape.move(to);
            this._lastData = { from: from, to: to, position: this.getPosition() };
        }
    }

    _connectArc() {
        if (!(this._innerShape instanceof Arc)) {
            let arcData = this._calculateArcData();
            this._innerShape = new Arc({
                start: arcData.startAngle,
                end: arcData.endAngle,
                position: arcData.center,
                radius: arcData.radius,
                reverse: arcData.reverse,
                isMovable: true, isSelectable: true,
                isHoverable: true, isPullable: false
            });
            this._innerShape._state = this._state;
        }

        else if (!this._lastData || !(MathHelper.arePointsEqual(this._lastData.from, this._firstItem.getPosition())
            && MathHelper.arePointsEqual(this._lastData.to, this._secondItem.getPosition())
            && MathHelper.arePointsEqual(this._lastData.position, this.getPosition()))) {

            let arcData = this._calculateArcData(MathHelper.arePointsEqual(this._lastData.position, this.getPosition()));
            this._innerShape.move(arcData.center);
            this._innerShape.setStart(arcData.startAngle);
            this._innerShape.setEnd(arcData.endAngle);
            this._innerShape.setRadius(arcData.radius);
            this._innerShape.setReverse(arcData.reverse);
        }
    }

    _calculateArcData(keepAnchor) {
        let arcData = {};
        let from = this._firstItem.getPosition();
        let to = this._secondItem.getPosition();
        let midPoint = {
            x: (from.x + to.x) / 2,
            y: (from.y + to.y) / 2
        }

        if (MathHelper.arePointsEqual(from, to)) {
            arcData = {
                center: { x: 0, y: 0 },
                startAngle: 0,
                endAngle: 0,
                radius: 0,
            }
        }
        else {
            if (keepAnchor && this._sagitta) {
                let normal = MathHelper.getNormalVector(from, to, this._isReversed);
                let position = MathHelper.translateVector(MathHelper.vecByScalMul(normal, this._sagitta), midPoint);
                arcData.center = MathHelper.centerOfCircleFrom3Points(from, to, position);
            }
            else {
                arcData.center = MathHelper.centerOfCircleFrom3Points(from, to, this.getPosition());
                let v1 = { x: this._position.x - from.x, y: this._position.y - from.y };
                let v2 = { x: this._position.x - to.x, y: this._position.y - to.y };
                this._isReversed = (v1.x * v2.y - v2.x * v1.y) > 0;
            }

            arcData.radius = MathHelper.distance(arcData.center, from);
            arcData.reverse = this._isReversed;

            let scale = this._isReversed ? 1 : -1;
            arcData.startAngle = Math.atan2(from.y - arcData.center.y, from.x - arcData.center.x) - 2 * scale * Math.asin(this._firstItem.getRadius() / (2 * arcData.radius));
            arcData.endAngle = Math.atan2(to.y - arcData.center.y, to.x - arcData.center.x) + 2 * scale * Math.asin(this._secondItem.getRadius() / (2 * arcData.radius));

            if (!keepAnchor) {
                let direction = MathHelper.getNormalVector(from, to, this._isReversed);
                let midAngle = Math.atan2(direction.y, direction.x);
                let temp = MathHelper.getPointOnCircleGivenAngle(arcData.center, arcData.radius, midAngle);
                this._sagitta = MathHelper.distance(midPoint, temp);
            }
        }

        this._lastData = { from: from, to: to, position: this.getPosition() };
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
                this._connectLine(this.getPosition());
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