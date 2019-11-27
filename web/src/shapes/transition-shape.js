'use strict'

import { MathUtils } from '../common-utils.js';
import { Shape } from './shape.js';
import { TextBox, CircularArrow, StraightArrow } from './basic-shapes.js';

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
            throw new Error('You need to specify at least one state for a transition')
        }

        this.isSet = !!config.second;
        this.firstItem = config.first;
        this.secondItem = config.second || config.first;
        this._sagitta = config.sagitta === undefined ? 0 : config.sagitta;
        this._isReversed = !!config.reverse;

        this._selfLinkDistance = config.selfLinkSize === undefined ? 30 : config.selfLinkSize;
        this._selfLinkDirection = config.selfLinkDirection || { x: 0, y: -1 };
        this._selfLinkAngle = 0.75;
        this._colinearTolerance = 5;

        this._textBox = new TextBox({
            position: this._position,
            text: config.text || '',
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

    getText() {
        return this._textBox._text;
    }

    isSelfLink() {
        return this.firstItem === this.secondItem;
    }

    contains(point) {
        this._updateArrowIfNeeded();
        return this._arrow.contains(point);
    }

    move(point) {
        super.move(point);
        if (this.isSelfLink()) {
            if (!MathUtils.arePointsEqual(this.firstItem.getPosition(), this._position)) {
                this._selfLinkDirection = MathUtils.getUnitVector(this.firstItem.getPosition(), this._position);
            }
        }
        else if (this.isSet) {
            if (MathUtils.arePointsColinear(this.firstItem.getPosition(), this.secondItem.getPosition(), this._position, this._colinearTolerance)) {
                this._sagitta = 0;
            }
            else {
                let from = this.firstItem.getPosition();
                let to = this.secondItem.getPosition();
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
        this.secondItem = item;
    }

    setEnd(item) {
        this.secondItem = item;
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
        let from = this.firstItem.getPosition();
        let angle = Math.atan2(this._selfLinkDirection.y, this._selfLinkDirection.x);
        let middlePoint = MathUtils.getPointOnCircleGivenAngle(from, this.firstItem.getRadius(), angle);
        let firstPoint = MathUtils.getPointOnCircleGivenAngle(from, this.firstItem.getRadius(), angle - this._selfLinkAngle / 2);
        let secondPoint = MathUtils.getPointOnCircleGivenAngle(from, this.firstItem.getRadius(), angle + this._selfLinkAngle / 2);
        data.center = MathUtils.centerOfCircleFrom3Points(firstPoint, secondPoint, MathUtils.translateVector(MathUtils.vecByScalMul(this._selfLinkDirection, this._selfLinkDistance), middlePoint));
        data.radius = MathUtils.distance(data.center, firstPoint);
        data.startAngle = Math.atan2(firstPoint.y - data.center.y, firstPoint.x - data.center.x)
        data.endAngle = Math.atan2(secondPoint.y - data.center.y, secondPoint.x - data.center.x)
        data.reverse = false;
        this._applyArrowChanges(CircularArrow, data);
    }

    _createStraightTransition() {
        let from = this.firstItem.getPosition();
        let to = this.secondItem ? this.secondItem.getPosition() : this.getPosition();
        if (!MathUtils.arePointsEqual(from, to)) {
            let newfrom = MathUtils.translateVector(MathUtils.vecByScalMul(MathUtils.getUnitVector(from, to), this.firstItem.getRadius()), this.firstItem.getPosition());
            if (this.secondItem) {
                let newTo = MathUtils.translateVector(MathUtils.vecByScalMul(MathUtils.getUnitVector(to, from), this.secondItem.getRadius()), this.secondItem.getPosition());
                to = newTo;
            }
            from = newfrom;
        }
        this._applyArrowChanges(StraightArrow, { from: from, to: to });
    }

    _createCircularTransition() {
        let data = {};
        let from = this.firstItem.getPosition();
        let to = this.secondItem.getPosition();
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
            data.startAngle = Math.atan2(from.y - data.center.y, from.x - data.center.x) - 2 * scale * Math.asin(this.firstItem.getRadius() / (2 * data.radius));
            data.endAngle = Math.atan2(to.y - data.center.y, to.x - data.center.x) + 2 * scale * Math.asin(this.secondItem.getRadius() / (2 * data.radius));
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
                this._arrow._visualState = this._visualState;
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
                this._arrow._visualState = this._visualState;
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
        let position = { x: null, y: null };
        let offsetX = null;
        let offsetY = null;
        if (type === StraightArrow && !MathUtils.arePointsEqual(data.from, data.to)) {
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
        let from = this.firstItem.getPosition();
        let to = this.secondItem ? this.secondItem.getPosition() : this.getPosition();
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