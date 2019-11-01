'use strict'

export class Interaction {
    constructor(sandbox) {
        // Provides:
        this.MAKE_INTERACTIVE = 'make-interactive';
        this.DOUBLE_CLICK_EVENT = 'double-click';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';

        // Depends on:
        this.APP_INIT_EVENT = 'app-init';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._sandbox.createEvent(this.DOUBLE_CLICK_EVENT);
        this._sandbox.createEvent(this.POINTER_DOWN_EVENT);
        this._sandbox.createEvent(this.POINTER_MOVE_EVENT);
        this._sandbox.createEvent(this.POINTER_UP_EVENT);
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
            this._sandbox.registerMessageReceiver(this.MAKE_INTERACTIVE, this.makeInteractive.bind(this));
            this.isRunning = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???)
    }

    makeInteractive(element) {
        element.addEventListener('selectstart', function (e) { e.preventDefault(); return false; }, false);
        element.addEventListener('dblclick', this._handleDoubleClick.bind(this));
        element.addEventListener('mousedown', this._handleMouseDown.bind(this));
        element.addEventListener('mousemove', this._handleMouseMove.bind(this));
        element.addEventListener('mouseup', this._handleMouseUp.bind(this));
        element.addEventListener("touchstart", this._handleTouchStart.bind(this));
        element.addEventListener("touchend", this._handleTouchEnd.bind(this));
        element.addEventListener("touchcancel", this._handleTouchCancel.bind(this));
        element.addEventListener("touchmove", this._handleTouchMove.bind(this));
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterMessageReceiver(this.MAKE_INTERACTIVE);
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.DOUBLE_CLICK_EVENT);
        this._sandbox.deleteEvent(this.POINTER_DOWN_EVENT);
        this._sandbox.deleteEvent(this.POINTER_MOVE_EVENT);
        this._sandbox.deleteEvent(this.POINTER_UP_EVENT);
    }

    _getPointInElement(element, clientX, clientY) {
        var bounds = element.getBoundingClientRect();
        return {
            x: clientX - bounds.left,
            y: clientY - bounds.top
        };
    }

    _handleDoubleClick(e) {
        var point = this._getPointInElement(e.target, e.clientX, e.clientY);
        this._sandbox.raiseEvent(this.DOUBLE_CLICK_EVENT, { target: e.target, x: point.x, y: point.y });
    }

    _handleMouseDown(e) {
        var point = this._getPointInElement(e.target, e.clientX, e.clientY);
        this._sandbox.raiseEvent(this.POINTER_DOWN_EVENT, { target: e.target, x: point.x, y: point.y });
    }

    _handleMouseMove(e) {
        var point = this._getPointInElement(e.target, e.clientX, e.clientY);
        this._sandbox.raiseEvent(this.POINTER_MOVE_EVENT, { target: e.target, x: point.x, y: point.y });
    }

    _handleMouseUp(e) {
        var point = this._getPointInElement(e.target, e.clientX, e.clientY);
        this._sandbox.raiseEvent(this.POINTER_UP_EVENT, { target: e.target, x: point.x, y: point.y });
    }

    _handleTouchStart(e) {
        let touch = e.changedTouches[0];
        var point = this._getPointInElement(e.target, touch.clientX, touch.clientY);
        this._sandbox.raiseEvent(this.POINTER_DOWN_EVENT, { target: e.target, x: point.x, y: point.y });
    }

    _handleTouchEnd(e) {
        let touch = e.changedTouches[0];
        var point = this._getPointInElement(e.target, touch.clientX, touch.clientY);
        this._sandbox.raiseEvent(this.POINTER_UP_EVENT, { target: e.target, x: point.x, y: point.y });
    }

    _handleTouchCancel(e) {
        let touch = e.changedTouches[0];
        var point = this._getPointInElement(e.target, touch.clientX, touch.clientY);
        this._sandbox.raiseEvent(this.POINTER_UP_EVENT, { target: e.target, x: point.x, y: point.y });
    }

    _handleTouchMove(e) {
        e.preventDefault()
        let touch = e.changedTouches[0];
        var point = this._getPointInElement(e.target, touch.clientX, touch.clientY);
        this._sandbox.raiseEvent(this.POINTER_MOVE_EVENT, { target: e.target, x: point.x, y: point.y });
    }
}