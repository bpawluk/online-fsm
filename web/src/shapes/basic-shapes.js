'use strict'

import { MathUtils } from '../common-utils.js';
import { Shape } from "./shape.js";

export class TextBox extends Shape {
    constructor(config) {
        config = config || {};
        super(config);

        this._text = config.text;
        this._font = '1em sans-serif';
        this._offsetX = 0;
        this._offsetY = 0;
        this._width = 0;
        this._height = 0;
        this.configure(config);
        this._measureText();
    }

    configure(config) {
        this._font = config.font || this._font;
        this._offsetX = config.offsetX === undefined ? this._offsetX : config.offsetX;
        this._offsetY = config.offsetY === undefined ? this._offsetY : config.offsetY;
    }

    setText(text) {
        this._text = text;
        this._measureText();
    }

    getWidth() {
        return this._width;
    }

    getHeight() {
        return this._height;
    }

    _measureText(context) {
        if (!context) {
            context = document.createElement('canvas').getContext('2d');
            context.font = this.font;
        }
        this._width = context.measureText(this._text).width;
        this._height = context.measureText('O').width; // dirty approximation
    }

    _decoratedDraw(context) {
        if (this._text && this._position.x !== null && this._position.y !== null) {
            context.font = this._font;
            let temp = context.fillStyle;
            context.fillStyle = context.strokeStyle;
            this._measureText(context);
            context.fillText(this._text, this._position.x - this._width * this._offsetX, this._position.y + this._height * this._offsetY);
            context.fillStyle = temp;
        }
    }
}

export class Line extends Shape {
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

    getBounds() {
        return {
            left: Math.min(this._startPoint.x, this._position.x),
            top: Math.min(this._startPoint.y, this._position.y),
            right: Math.max(this._startPoint.x, this._position.x),
            bottom: Math.max(this._startPoint.y, this._position.y)
        }
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

export class Arc extends Shape {
    constructor(config) {
        config = config || {};
        super(config);

        this._radius = config.radius === undefined ? 0 : config.radius;
        this._startAngle = config.start === undefined ? 0 : config.start;
        this._endAngle = config.end === undefined ? 0 : config.end;
        this._reverse = config.reverse === undefined ? 0 : config.reverse;
        this._distanceToleration = config.distanceToleration === undefined ? 5 : config.distanceToleration;
    }

    getBounds() {
        let from = MathUtils.getPointOnCircleGivenAngle(this._position, this._radius, this._startAngle);
        let mid = MathUtils.getPointOnCircleGivenAngle(this._position, this._radius, MathUtils.getMidAngleOfArc(this._startAngle, this._endAngle, this._reverse));
        let to = MathUtils.getPointOnCircleGivenAngle(this._position, this._radius, this._endAngle);
        return {
            left: Math.min(Math.min(from.x, mid.x), to.x),
            top: Math.min(Math.min(from.y, mid.y), to.y),
            right: Math.max(Math.max(from.x, mid.x), to.x),
            bottom: Math.max(Math.max(from.y, mid.y), to.y)
        }
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

export class Circle extends Shape {
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
            top: this._position.y - this._radius,
            right: this._position.x + this._radius,
            bottom: this._position.y + this._radius
        }
    }

    _decoratedDraw(context) {
        context.beginPath();
        context.arc(this._position.x, this._position.y, this._radius, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
    }
}

export class Triangle extends Shape {
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
            top: Math.min(this._vertices.top.y, this._vertices.left.y, this._vertices.right.y),
            right: Math.max(this._vertices.top.x, this._vertices.left.x, this._vertices.right.x),
            bottom: Math.max(this._vertices.top.y, this._vertices.left.y, this._vertices.right.y)
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
    }
}

export class StraightArrow extends Line {
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

export class CircularArrow extends Arc {
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