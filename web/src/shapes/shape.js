'use strict'

export class Shape {
    constructor(config) {
        config = config || {};
        this._position = config.position ? Object.assign({}, config.position) : { x: 0, y: 0 };
        this.isHoverable = !!config.isHoverable;
        this.isSelectable = !!config.isSelectable;
        this.isMovable = !!config.isMovable;
        this.isPullable = !!config.isPullable;
        this.fill = !!config.fill;

        this._visualState = 'default';
        this._pointerOffset = null;
    }

    contains(point) { return false }

    draw(context) {
        if (this._position.x !== null && this._position.y !== null) {
            context.save();
            switch (this._visualState) {
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
                    throw new Error('There is no ' + this._visualState + ' visual state defined.');
            }
            context.fillStyle = this.fill ? context.strokeStyle : '#FFFFFF'
            this._decoratedDraw(context);
            context.restore();
        }
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
        this._visualState = 'selected';
        if (pointerPosition) {
            this._pointerOffset = {
                x: pointerPosition.x - this._position.x,
                y: pointerPosition.y - this._position.y
            };
        }
    }

    unselect() {
        this._visualState = 'default';
        this._pointerAnchor = null;
    }

    pointerOver() {
        if (this._visualState !== 'selected') {
            this._visualState = 'hovered';
        }
    }

    pointerOut() {
        if (this._visualState !== 'selected') {
            this._visualState = 'default';
        }
    }

    _decoratedDraw(context) { }
}