'use strict'

class Circle {
    constructor(x, y, radius) {
        this._radius = radius === undefined ? 50 : x;;
        this._posX = x === undefined ? 0 : x;
        this._posY = y === undefined ? 0 : y;
    }

    contains(x, y) {
        return x >= this._posX - this._radius
            && x <= this._posX + this._radius
            && y >= this._posY - this._radius
            && y <= this._posY + this._radius;
    }

    draw(context) {
        context.beginPath();
        context.arc(this._posX, this._posY, this._radius, 0, 2 * Math.PI);
        context.stroke();
    }

    setCoords(x, y) {
        this._posX = x;
        this._posY = y;
    }  
}

export class Workspace {
    constructor(sandbox) {
        // Provides:
        this.WORKSPACE_ELEMENT_INTERFACE = 'workspace-element';

        // Depends on:
        this.APP_INIT_EVENT = 'app-init';
        this.CLEAR_CANVAS = 'canvas-clear';
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.REDRAW_CANVAS = 'canvas-redraw';
        this.DOUBLE_CLICK_EVENT = 'double-click';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';

        this._isInit = false;
        this._sandbox = sandbox;
        this._elements = [];
        this._selectedElement = null;

        this._sandbox.declareInterface(this.WORKSPACE_ELEMENT_INTERFACE, ['contains', 'draw','setCoords'], []);
    }

    init() {
        if (!this._isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, this.onAppInit.bind(this));
            this._sandbox.registerListener(this.DOUBLE_CLICK_EVENT, this._handleDoubleClick.bind(this));
            this._sandbox.registerListener(this.POINTER_DOWN_EVENT, this._handlePointerDown.bind(this));
            this._sandbox.registerListener(this.POINTER_MOVE_EVENT, this._handlePointerMove.bind(this));
            this._sandbox.registerListener(this.POINTER_UP_EVENT, this._handlePointerUp.bind(this));
            this._isInit = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
    }

    add(element) {
        this._sandbox.assertInterface(element, this.WORKSPACE_ELEMENT_INTERFACE);
        this._elements.push(element);
        this._sandbox.sendMessage(this.DRAW_ON_CANVAS, element);
    }

    stop() {
        // this._sandbox.unregisterListener(this.DOUBLE_CLICK_EVENT, this._handleDoubleClick.bind(this));
        // this._sandbox.unregisterListener(this.POINTER_DOWN_EVENT, this._handlePointerDown.bind(this));
        // this._sandbox.unregisterListener(this.POINTER_MOVE_EVENT, this._handlePointerMove.bind(this));
        // this._sandbox.unregisterListener(this.POINTER_UP_EVENT, this._handlePointerUp.bind(this));
    }

    cleanUp() {

    }

    _handleDoubleClick(e) {
        this.add(new Circle(e.x, e.y));
    }

    _handlePointerDown(e) {
        let elements = this._elements;
        for (let i = elements.length - 1; i >= 0; i--) {
            let current = elements[i];
            if (elements[i].contains(e.x, e.y)) {
                this._selectedElement = current;
                break;
            }
        }
    }

    _handlePointerMove(e) {
        if (this._selectedElement) {
            this._selectedElement.setCoords(e.x, e.y);
            this._sandbox.sendMessage(this.REDRAW_CANVAS, this._elements);
        }
    }

    _handlePointerUp(e) {
        if (this._selectedElement) {
            this._selectedElement = null;
        }
    }
}