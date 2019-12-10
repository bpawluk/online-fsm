'use strict'

import { TextBox, Circle, StraightArrow } from "./basic-shapes.js";

export class State extends Circle {
    constructor(config) {
        config = config || {};
        config.isHoverable = true;
        config.isSelectable = true;
        config.isMovable = true;
        config.isPullable = true;
        super(config);

        this.isAccepting = config.accept === undefined ? false : config.accept;
        this.isEntry = config.entry === undefined ? false : config.entry;
        this._isActive = false;
        this._textBox = new TextBox({
            position: this._position,
            text: config.text || '',
            offsetX: 0.5,
            offsetY: 0.5
        });
        this._entryArrow = null;
    }

    accept(value) {
        this.isAccepting = !!value;
    }

    setActive(active) {
        this._isActive = !!active;
    }

    setAsEntry(value) {
        this.isEntry = !!value;
    }

    setText(text) {
        this._textBox.setText(text);
    }

    getBounds() {
        let bounds = super.getBounds();
        if (this.isEntry) {
            bounds.left = bounds.left - 1.5 * this._radius;
        }
        return bounds;
    }

    getText() {
        return this._textBox._text;
    }

    move(point) {
        super.move(point);
        this._textBox.move(this._position);
    }

    _decoratedDraw(context) {
        if (this._isActive) {
            context.fillStyle = '#B2DFEE'
            context.strokeStyle = '#000000'
        }
        super._decoratedDraw(context);
        this._textBox._decoratedDraw(context);
        if (this.isAccepting) {
            context.beginPath();
            context.arc(this._position.x, this._position.y, 0.85 * this._radius, 0, 2 * Math.PI);
            context.stroke();
        }
        if (this.isEntry) {
            let tempFill = context.fillStyle;
            let tempStroke = context.strokeStyle;
            context.fillStyle = '#000000';
            context.strokeStyle = '#000000'
            context.beginPath();
            context.arc(this._position.x - 2.25 * this._radius, this._position.y, 0.25 * this._radius, 0, 2 * Math.PI);
            context.fill();
            if (!this._entryArrow) {
                this._entryArrow = new StraightArrow({ start: { x: this._position.x - 2 * this._radius, y: this._position.y }, position: { x: this._position.x - this._radius, y: this._position.y } });
            }
            else {
                this._entryArrow.move({ x: this._position.x - this._radius, y: this._position.y });
                this._entryArrow.setStart({ x: this._position.x - 2 * this._radius, y: this._position.y });
            }
            this._entryArrow._decoratedDraw(context);
            context.fillStyle = tempFill;
            context.strokeStyle = tempStroke;
        }
    }
}