'use strict'

class Circle {
    constructor(x, y, radius) {
        this._posX = x === undefined ? 0 : x;
        this._posY = y === undefined ? 0 : y;
        this._radius = radius === undefined ? 50 : x;;
        this._state = 'default';
    }

    contains(x, y) {
        return x >= this._posX - this._radius
            && x <= this._posX + this._radius
            && y >= this._posY - this._radius
            && y <= this._posY + this._radius;
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
                context.strokeStyle = '#000089';
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

    setCoords(x, y) {
        this._posX = x;
        this._posY = y;
    }

    setState(state) {
        this._state = state;
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
        this._hoveredElement = null;

        this._sandbox.declareInterface(this.WORKSPACE_ELEMENT_INTERFACE, ['contains', 'draw', 'setCoords', 'setState'], []);
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
        let elementClicked = this._getElementAtPoint(e.x, e.y);
        if (elementClicked) {
            if (this._selectedElement) {
                this._selectedElement.setState('default');
            }
            this._selectedElement = elementClicked;
            elementClicked.setState('selected')
        }
    }

    _handlePointerMove(e) {
        let redrawNeeded = false;
        if (this._selectedElement) {
            this._selectedElement.setCoords(e.x, e.y);
            redrawNeeded = true;
        } else {
            let elementHovered = this._getElementAtPoint(e.x, e.y);
            if (elementHovered) {
                if (this._hoveredElement) {
                    this._hoveredElement.setState('default');
                }
                this._hoveredElement = elementHovered;
                elementHovered.setState('hovered');
                redrawNeeded = true;
            } else if (this._hoveredElement) {
                this._hoveredElement.setState('default');
                this._hoveredElement = null;
                redrawNeeded = true;
            }
        }
        if (redrawNeeded) {
            this._sandbox.sendMessage(this.REDRAW_CANVAS, this._elements);
        }
    }

    _handlePointerUp(e) {
        if (this._selectedElement) {
            this._selectedElement = null;
        }
    }

    _getElementAtPoint(x, y) {
        let elements = this._elements;
        for (let i = elements.length - 1; i >= 0; i--) {
            let current = elements[i];
            if (current.contains(x, y)) {
                return current;
            }
        }
        return null;
    }
}