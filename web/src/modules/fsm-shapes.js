'use strict'

import { MathUtils } from '../common-utils.js';

class Shape {
    constructor(config) {
        config = config || {};

        this._position = config.position ? Object.assign({}, config.position) : { x: 0, y: 0 };
        this.isHoverable = !!config.isHoverable;
        this.isSelectable = !!config.isSelectable;
        this.isMovable = !!config.isMovable;
        this.isPullable = !!config.isPullable;
        this.fill = !!config.fill;

        this._state = 'default';
        this._pointerOffset = null;
    }

    contains(point) { return false }

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
        context.fillStyle = this.fill ? context.strokeStyle : '#FFFFFF'
        this._decoratedDraw(context);
        context.restore();
    }

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

    _decoratedDraw(context) { }
}

class TextBox extends Shape {
    constructor(config) {
        config = config || {};
        super(config);

        this._text = config.text;
        this._font = '1em sans-serif';
        this._offsetX = 0;
        this._offsetY = 0;
        this.configure(config);
    }

    configure(config) {
        this._font = config.font || this._font;
        this._offsetX = config.offsetX === undefined ? this._offsetX : config.offsetX;
        this._offsetY = config.offsetY === undefined ? this._offsetY : config.offsetY;
    }

    setText(text) {
        this._text = text;
    }

    _decoratedDraw(context) {
        if (this._text) {
            context.font = this._font;
            let width = context.measureText(this._text).width;
            let height = context.measureText('O').width; // dirty approximation
            let temp = context.fillStyle;
            context.fillStyle = context.strokeStyle;
            context.fillText(this._text, this._position.x - width * this._offsetX, this._position.y + height * this._offsetY);
            context.fillStyle = temp;
        }
    }
}

class Line extends Shape {
    constructor(config) {
        config = config || {};
        super(config);

        this._startPoint = config.start ? Object.assign({}, config.start) : { x: 0, y: 0 };
        // endPoint is current position
        this._distanceToleration = config.distanceToleration === undefined ? 5 : config.distanceToleration;
    }

    getStart() {
        return Object.assign({}, this._startPoint);
    }

    setStart(point) {
        this._startPoint.x = point.x;
        this._startPoint.y = point.y;
    }

    contains(point) {
        return MathUtils.isPointCloseToSegment(this._startPoint, this._position, point, this._distanceToleration);
    }

    _decoratedDraw(context) {
        context.beginPath();
        context.moveTo(this._startPoint.x, this._startPoint.y);
        context.lineTo(this._position.x, this._position.y);
        context.stroke();
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
        this._distanceToleration = config.distanceToleration === undefined ? 5 : config.distanceToleration;
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
        let onCircle = Math.abs(MathUtils.distance(this._position, point) - this._radius) <= this._distanceToleration;
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

    _decoratedDraw(context) {
        context.beginPath();
        context.arc(this._position.x, this._position.y, this._radius, this._startAngle, this._endAngle, this._reverse);
        context.stroke();
    }
}

class Circle extends Shape {
    constructor(config) {
        config = config || {};
        super(config);

        this._radius = config.radius === undefined ? 30 : config.radius;
    }

    contains(point) {
        return MathUtils.isPointInCircle(point, this._position, this._radius);
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

    _decoratedDraw(context) {
        context.beginPath();
        context.arc(this._position.x, this._position.y, this._radius, 0, 2 * Math.PI);
        context.fillStyle = '#FFFFFF';
        context.fill();
        context.stroke();
    }
}

class Triangle extends Shape {
    constructor(config) {
        config = config || {};
        super(config);
        this._rotation = config.rotation === undefined ? 0 : config.rotation;
        this._height = config.height === undefined ? 8 : config.height;
        this._base = config.base === undefined ? 8 : config.base;

        this._vertices = null;
        this._calculateVertices();
    }

    move(point) {
        super.move(point);
        this._calculateVertices();
    }

    rotate(radians) {
        this._rotation = radians;
        this._calculateVertices();
    }

    getBounds() {
        return {
            left: Math.min(this._vertices.top.x, this._vertices.left.x, this._vertices.right.x),
            top: Math.max(this._vertices.top.y, this._vertices.left.y, this._vertices.right.y),
            right: Math.max(this._vertices.top.x, this._vertices.left.x, this._vertices.right.x),
            bottom: Math.min(this._vertices.top.y, this._vertices.left.y, this._vertices.right.y)
        }
    }

    _calculateVertices() {
        let top = this._position;
        let bottom = {
            x: -Math.cos(this._rotation) * this._height + top.x,
            y: -Math.sin(this._rotation) * this._height + top.y
        };
        let firstNormal = MathUtils.getNormalVector(bottom, top);
        let secondNormal = { x: -firstNormal.x, y: -firstNormal.y };
        let left = MathUtils.translateVector(MathUtils.vecByScalMul(firstNormal, this._base / 2), bottom);
        let right = MathUtils.translateVector(MathUtils.vecByScalMul(secondNormal, this._base / 2), bottom);
        this._vertices = { top: top, left: left, right: right };
    }

    _decoratedDraw(context) {
        context.beginPath();
        context.moveTo(this._vertices.top.x, this._vertices.top.y);
        context.lineTo(this._vertices.left.x, this._vertices.left.y);
        context.lineTo(this._vertices.right.x, this._vertices.right.y);
        context.fill();
        context.stroke();
        context.restore();
    }
}

class StraightArrow extends Line {
    constructor(config) {
        config = config || {};
        config.fill = true;
        super(config);

        this._arrowTip = null;
        this._updateArrowTip();
    }

    move(point) {
        super.move(point);
        this._updateArrowTip();
    }

    setStart(point) {
        super.setStart(point);
        this._updateArrowTip();
    }

    _updateArrowTip() {
        let tipStart = this._startPoint;
        let tipEnd = this._position;
        if (!MathUtils.arePointsEqual(tipStart, tipEnd)) {
            let tipDirection = MathUtils.getVector(tipStart, tipEnd);
            let angle = Math.atan2(tipDirection.y, tipDirection.x);
            if (this._arrowTip) {
                this._arrowTip.move(tipEnd);
                this._arrowTip.rotate(angle);
            }
            else {
                this._arrowTip = new Triangle({ position: tipEnd, rotation: angle });
            }
        }
        else {
            this._arrowTip = null;
        }
    }

    _decoratedDraw(context) {
        super._decoratedDraw(context);
        if (this._arrowTip) this._arrowTip._decoratedDraw(context);
    }
}

class CircularArrow extends Arc {
    constructor(config) {
        config = config || {};
        config.fill = true;
        super(config);

        this._arrowTip = null;
        this._updateArrowTip();
    }

    move(point) {
        super.move(point);
        this._updateArrowTip();
    }

    setStart(angle) {
        super.setStart(angle);
        this._updateArrowTip();
    }

    setEnd(angle) {
        super.setEnd(angle);
        this._updateArrowTip();
    }

    setRadius(radius) {
        super.setRadius(radius);
        this._updateArrowTip();
    }

    setReverse(reverse) {
        super.setReverse(reverse);
        this._updateArrowTip();
    }

    _updateArrowTip() {
        if (this._startAngle !== this._endAngle) {
            let scale = this._reverse ? 1 : -1;
            let tipEnd = MathUtils.getPointOnCircleGivenAngle(this._position, this._radius, this._endAngle);
            let tipStart = MathUtils.getPointOnCircleGivenAngle(this._position, this._radius, this._endAngle + scale * 10 / this._radius);
            let tipDirection = MathUtils.getVector(tipStart, tipEnd);
            let angle = Math.atan2(tipDirection.y, tipDirection.x);
            if (this._arrowTip) {
                this._arrowTip.move(tipEnd);
                this._arrowTip.rotate(angle);
            }
            else {
                this._arrowTip = new Triangle({ position: tipEnd, rotation: angle });
            }
        }
        else {
            this._arrowTip = null;
        }
    }

    _decoratedDraw(context) {
        super._decoratedDraw(context);
        if (this._arrowTip) this._arrowTip._decoratedDraw(context);
    }
}

export class State extends Circle {
    constructor(config) {
        config = config || {};
        config.isHoverable = true;
        config.isSelectable = true;
        config.isMovable = true;
        config.isPullable = true;
        super(config);

        this._textBox = new TextBox({
            position: this._position,
            text: "Paweł",
            offsetX: 0.5,
            offsetY: 0.5
        });
    }

    setText(text) {
        this._textBox.setText(text);
    }

    move(point) {
        super.move(point);
        this._textBox.move(this._position);
    }

    _decoratedDraw(context) {
        super._decoratedDraw(context);
        this._textBox._decoratedDraw(context);
    }
}

export class Transition extends Shape {
    constructor(config) {
        config = config || {};
        config.isHoverable = true;
        config.isSelectable = true;
        config.isMovable = true;
        config.isPullable = true;
        config.fill = true;
        super(config);

        if (!config.first) {
            throw new Error('You need to specify at least one state for the transition')
        }

        this.isSet = !!config.second;
        this._firstItem = config.first;
        this._secondItem = config.second || config.first;
        this._sagitta = config.sagitta === undefined ? 0 : config.sagitta;
        this._isReversed = !!config.reverse;

        this._colinearTolerance = config.tolerance === undefined ? 5 : config.tolerance;
        this._selfLinkDistance = config.selfLinkSize === undefined ? 30 : config.selfLinkSize;
        this._selfLinkAngle = 0.75;
        this._selfLinkDirection = { x: 0, y: -1 };

        this._textBox = new TextBox({
            position: this._position,
            text: "Aneta",
            offsetX: 0,
            offsetY: 0
        });

        this._lastData = null;
        this._arrow = null;
        this._updateArrowIfNeeded();
    }

    setText(text) {
        this._textBox.setText(text);
    }

    isSelfLink() {
        return this._firstItem === this._secondItem;
    }

    contains(point) {
        this._updateArrowIfNeeded();
        return this._arrow.contains(point);
    }

    move(point) {
        super.move(point);
        if (this.isSelfLink()) {
            if (!MathUtils.arePointsEqual(this._firstItem.getPosition(), this._position)) {
                this._selfLinkDirection = MathUtils.getUnitVector(this._firstItem.getPosition(), this._position);
            }
        }
        else if (this.isSet) {
            if (MathUtils.arePointsColinear(this._firstItem.getPosition(), this._secondItem.getPosition(), this._position, this._colinearTolerance)) {
                this._sagitta = 0;
            }
            else {
                let from = this._firstItem.getPosition();
                let to = this._secondItem.getPosition();
                let lineMidPoint = {
                    x: (from.x + to.x) / 2,
                    y: (from.y + to.y) / 2
                }
                if (!MathUtils.arePointsEqual(from, to)) {
                    let center = MathUtils.centerOfCircleFrom3Points(from, to, this.getPosition());

                    let v1 = { x: this._position.x - from.x, y: this._position.y - from.y };
                    let v2 = { x: this._position.x - to.x, y: this._position.y - to.y };
                    this._isReversed = (v1.x * v2.y - v2.x * v1.y) > 0;

                    let direction = MathUtils.getNormalVector(from, to, this._isReversed);
                    let radius = MathUtils.distance(center, from);
                    let midAngle = Math.atan2(direction.y, direction.x);
                    let arcMidPoint = MathUtils.getPointOnCircleGivenAngle(center, radius, midAngle);
                    this._sagitta = MathUtils.distance(lineMidPoint, arcMidPoint);
                } else {
                    this._sagitta = 0;
                }
            }
        }
    }

    setEndTemporarily(item) {
        this._secondItem = item;
    }

    setEnd(item) {
        this._secondItem = item;
        this.isSet = true;
    }

    select(pointerPosition) {
        super.select(pointerPosition);
        this._arrow.select(pointerPosition);
    }

    unselect() {
        super.unselect();
        this._arrow.unselect();
    }

    pointerOver() {
        super.pointerOver();
        this._arrow.pointerOver();
    }

    pointerOut() {
        super.pointerOut();
        this._arrow.pointerOut();
    }

    _pointsWereMoved(from, to, position) {
        if (!this._lastData) {
            return true;
        }
        let fromChanged = from ? !MathUtils.arePointsEqual(this._lastData.from, from) : false;
        let toChanged = to ? !MathUtils.arePointsEqual(this._lastData.to, to) : false;
        let positionChanged = position ? !MathUtils.arePointsEqual(this._lastData.position, position) : false;
        return fromChanged || toChanged || positionChanged;
    }

    _createSelfTransition() {
        let data = {};
        let from = this._firstItem.getPosition();
        let angle = Math.atan2(this._selfLinkDirection.y, this._selfLinkDirection.x);
        let middlePoint = MathUtils.getPointOnCircleGivenAngle(from, this._firstItem.getRadius(), angle);
        let firstPoint = MathUtils.getPointOnCircleGivenAngle(from, this._firstItem.getRadius(), angle - this._selfLinkAngle / 2);
        let secondPoint = MathUtils.getPointOnCircleGivenAngle(from, this._firstItem.getRadius(), angle + this._selfLinkAngle / 2);
        data.center = MathUtils.centerOfCircleFrom3Points(firstPoint, secondPoint, MathUtils.translateVector(MathUtils.vecByScalMul(this._selfLinkDirection, this._selfLinkDistance), middlePoint));
        data.radius = MathUtils.distance(data.center, firstPoint);
        data.startAngle = Math.atan2(firstPoint.y - data.center.y, firstPoint.x - data.center.x)
        data.endAngle = Math.atan2(secondPoint.y - data.center.y, secondPoint.x - data.center.x)
        data.reverse = false;
        this._applyArrowChanges(CircularArrow, data);
    }

    _createStraightTransition() {
        let from = this._firstItem.getPosition();
        let to = this._secondItem ? this._secondItem.getPosition() : this.getPosition();
        if (!MathUtils.arePointsEqual(from, to)) {
            let newfrom = MathUtils.translateVector(MathUtils.vecByScalMul(MathUtils.getUnitVector(from, to), this._firstItem.getRadius()), this._firstItem.getPosition());
            if (this._secondItem) {
                let newTo = MathUtils.translateVector(MathUtils.vecByScalMul(MathUtils.getUnitVector(to, from), this._secondItem.getRadius()), this._secondItem.getPosition());
                to = newTo;
            }
            from = newfrom;
        }
        this._applyArrowChanges(StraightArrow, { from: from, to: to });
    }

    _createCircularTransition() {
        let data = {};
        let from = this._firstItem.getPosition();
        let to = this._secondItem.getPosition();
        let midPoint = {
            x: (from.x + to.x) / 2,
            y: (from.y + to.y) / 2
        }

        if (MathUtils.arePointsEqual(from, to)) {
            data = {
                center: { x: 0, y: 0 },
                startAngle: 0,
                endAngle: 0,
                radius: 0,
            }
        }
        else {
            let normal = MathUtils.getNormalVector(from, to, this._isReversed);
            let position = MathUtils.translateVector(MathUtils.vecByScalMul(normal, this._sagitta), midPoint);
            data.center = MathUtils.centerOfCircleFrom3Points(from, to, position);
            data.radius = MathUtils.distance(data.center, from);
            data.reverse = this._isReversed;

            let scale = this._isReversed ? 1 : -1;
            data.startAngle = Math.atan2(from.y - data.center.y, from.x - data.center.x) - 2 * scale * Math.asin(this._firstItem.getRadius() / (2 * data.radius));
            data.endAngle = Math.atan2(to.y - data.center.y, to.x - data.center.x) + 2 * scale * Math.asin(this._secondItem.getRadius() / (2 * data.radius));
        }

        this._applyArrowChanges(CircularArrow, data);
    }

    _applyArrowChanges(type, data) {
        if (type === StraightArrow) {
            if (!(this._arrow instanceof StraightArrow)) {
                this._arrow = new StraightArrow({
                    start: data.from,
                    position: data.to,
                    isMovable: true, isSelectable: true,
                    isHoverable: true, isPullable: true
                });
                this._arrow._state = this._state;
            }
            else {
                this._arrow.setStart(data.from);
                this._arrow.move(data.to);
            }
        }
        else if (type === CircularArrow) {
            if (!(this._arrow instanceof CircularArrow)) {
                this._arrow = new CircularArrow({
                    start: data.startAngle,
                    end: data.endAngle,
                    position: data.center,
                    radius: data.radius,
                    reverse: data.reverse,
                    isMovable: true, isSelectable: true,
                    isHoverable: true, isPullable: false
                });
                this._arrow._state = this._state;
            }
            else {
                this._arrow.move(data.center);
                this._arrow.setStart(data.startAngle);
                this._arrow.setEnd(data.endAngle);
                this._arrow.setRadius(data.radius);
                this._arrow.setReverse(data.reverse);
            }
        }
        this._repositionText(type, data);
    }

    _repositionText(type, data) {
        let position = null;
        let offsetX = null;
        let offsetY = null;
        if (type === StraightArrow) {
            position = MathUtils.translateVector(MathUtils.vecByScalMul(MathUtils.getVector(data.from, data.to), 0.5), data.from);
        }
        else if (type === CircularArrow) {
            position = MathUtils.getPointOnCircleGivenAngle(data.center, data.radius, MathUtils.getMidAngleOfArc(data.startAngle, data.endAngle, data.reverse));
        }
        this._textBox.move(position);
        this._textBox.configure({
            offsetX: offsetX,
            offsetY: offsetY
        });
    }

    _updateArrowIfNeeded() {
        let from = this._firstItem.getPosition();
        let to = this._secondItem ? this._secondItem.getPosition() : this.getPosition();
        let position = this.getPosition();
        if (this.isSelfLink()) {
            if (this._pointsWereMoved(from, null, position)) {
                this._createSelfTransition();
            }
        }
        else if (!this.isSet || this._sagitta === 0) {
            if (this._pointsWereMoved(from, to, position)) {
                this._createStraightTransition();
            }
        }
        else {
            if (this._pointsWereMoved(from, to, position)) {
                this._createCircularTransition();
            }
        }
        this._lastData = { from: from, to: to, position: position };
    }

    _decoratedDraw(context) {
        this._updateArrowIfNeeded();
        this._arrow._decoratedDraw(context);
        this._textBox._decoratedDraw(context);
    }
}