'use strict'

export class Interaction {
    constructor(sandbox) {
        // Provides:
        this.MAKE_INTERACTIVE = 'make-interactive';
        this.PREVENT_SCROLLING = 'prevent-scrolling';
        this.DOUBLE_CLICK_EVENT = 'double-click';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';
        this.KEY_DOWN_EVENT = 'key-down'
        this.BUTTON_CLICKED_EVENT = 'button-clicked';

        // Depends on:
        this.GET_ELEMENTS_BY_TAG = 'get-element-by-tag';
        this.APP_INIT_EVENT = 'app-init';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._isScrollingEnabled = true;
        this._sandbox = sandbox;

        this._keyDownBind = this._handleKeyDown.bind(this);

        this._sandbox.createEvent(this.DOUBLE_CLICK_EVENT);
        this._sandbox.createEvent(this.POINTER_DOWN_EVENT);
        this._sandbox.createEvent(this.POINTER_MOVE_EVENT);
        this._sandbox.createEvent(this.POINTER_UP_EVENT);
        this._sandbox.createEvent(this.KEY_DOWN_EVENT);
        this._sandbox.createEvent(this.BUTTON_CLICKED_EVENT);
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
            this._sandbox.registerMessageReceiver(this.PREVENT_SCROLLING, this.preventScrolling.bind(this));
            document.addEventListener("keydown", this._keyDownBind);
            this.isRunning = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???)
        let buttons = this._sandbox.sendMessage(this.GET_ELEMENTS_BY_TAG, 'button')
        if (buttons) {
            buttons.forEach(button => {
                button.addEventListener('click', this._handleButtonClick.bind(this));
            });
        }
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

    preventScrolling(shouldScroll) {
        this._isScrollingEnabled = !!shouldScroll;
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            document.removeEventListener("keydown", this._keyDownBind);
            this._sandbox.unregisterMessageReceiver(this.MAKE_INTERACTIVE);
            this._sandbox.unregisterMessageReceiver(this.PREVENT_SCROLLING);
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.DOUBLE_CLICK_EVENT);
        this._sandbox.deleteEvent(this.POINTER_DOWN_EVENT);
        this._sandbox.deleteEvent(this.POINTER_MOVE_EVENT);
        this._sandbox.deleteEvent(this.POINTER_UP_EVENT);
        this._sandbox.deleteEvent(this.KEY_DOWN_EVENT);
        this._sandbox.deleteEvent(this.BUTTON_CLICKED_EVENT);
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
        this._sandbox.raiseEvent(this.DOUBLE_CLICK_EVENT, { target: e.target, x: point.x, y: point.y, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
    }

    _handleMouseDown(e) {
        var point = this._getPointInElement(e.target, e.clientX, e.clientY);
        this._sandbox.raiseEvent(this.POINTER_DOWN_EVENT, { target: e.target, x: point.x, y: point.y, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
    }

    _handleMouseMove(e) {
        var point = this._getPointInElement(e.target, e.clientX, e.clientY);
        this._sandbox.raiseEvent(this.POINTER_MOVE_EVENT, { target: e.target, x: point.x, y: point.y, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
    }

    _handleMouseUp(e) {
        var point = this._getPointInElement(e.target, e.clientX, e.clientY);
        this._sandbox.raiseEvent(this.POINTER_UP_EVENT, { target: e.target, x: point.x, y: point.y, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
    }

    _handleTouchStart(e) {
        let touch = e.changedTouches[0];
        var point = this._getPointInElement(e.target, touch.clientX, touch.clientY);
        this._sandbox.raiseEvent(this.POINTER_DOWN_EVENT, { target: e.target, x: point.x, y: point.y, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
    }

    _handleTouchEnd(e) {
        let touch = e.changedTouches[0];
        var point = this._getPointInElement(e.target, touch.clientX, touch.clientY);
        this._sandbox.raiseEvent(this.POINTER_UP_EVENT, { target: e.target, x: point.x, y: point.y, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
    }

    _handleTouchCancel(e) {
        let touch = e.changedTouches[0];
        var point = this._getPointInElement(e.target, touch.clientX, touch.clientY);
        this._sandbox.raiseEvent(this.POINTER_UP_EVENT, { target: e.target, x: point.x, y: point.y, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
    }

    _handleTouchMove(e) {
        if (!this._isScrollingEnabled) {
            e.preventDefault()
        }
        let touch = e.changedTouches[0];
        var point = this._getPointInElement(e.target, touch.clientX, touch.clientY);
        this._sandbox.raiseEvent(this.POINTER_MOVE_EVENT, { target: e.target, x: point.x, y: point.y, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
    }

    _handleKeyDown(e) {
        this._sandbox.raiseEvent(this.KEY_DOWN_EVENT, { target: e.target, key: e.key });
    }

    _handleButtonClick(e) {
        this._sandbox.raiseEvent(this.BUTTON_CLICKED_EVENT, e.target);
    }
}