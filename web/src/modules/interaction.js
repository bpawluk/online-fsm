'use strict'

export class Interaction {
    constructor(sandbox) {
        // Provides:
        this.ADD_BUTTON_LISTENER = 'add-button-listener';
        this.ADD_KEY_LISTENER = 'add-key-listener';
        this.ADD_MOUSE_LISTENERS = 'add-mouse-listeners';
        this.REMOVE_BUTTON_LISTENER = 'remove-button-listener';
        this.REMOVE_KEY_LISTENER = 'remove-key-listener';
        this.REMOVE_MOUSE_LISTENERS = 'remove-mouse-listeners';
        this.PREVENT_SCROLLING = 'prevent-scrolling';

        this.DOUBLE_CLICK_EVENT = 'double-click';
        this.POINTER_DOWN_EVENT = 'pointer-down';
        this.POINTER_MOVE_EVENT = 'pointer-move';
        this.POINTER_UP_EVENT = 'pointer-up';

        // Depends on:
        this.GET_ELEMENT_BY_ID = 'get-element-by-id';
        this.APP_INIT_EVENT = 'app-init';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._keyDownListeners = new Map()
        this._bindedListeners = Object.create(null);
        this._isScrollingEnabled = true;
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this._sandbox.createEvent(this.DOUBLE_CLICK_EVENT);
            this._sandbox.createEvent(this.POINTER_DOWN_EVENT);
            this._sandbox.createEvent(this.POINTER_MOVE_EVENT);
            this._sandbox.createEvent(this.POINTER_UP_EVENT);

            const props = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
            props.forEach(prop => {
                if (typeof this[prop] === 'function' && prop.startsWith('_handle')) {
                    this._bindedListeners[prop] = this[prop].bind(this);
                }
            });

            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerMessageReceiver(this.ADD_BUTTON_LISTENER, this.addButtonListener.bind(this));
            this._sandbox.registerMessageReceiver(this.ADD_KEY_LISTENER, this.addKeyListener.bind(this));
            this._sandbox.registerMessageReceiver(this.ADD_MOUSE_LISTENERS, this.addMouseListeners.bind(this));
            this._sandbox.registerMessageReceiver(this.REMOVE_BUTTON_LISTENER, this.removeButtonListener.bind(this));
            this._sandbox.registerMessageReceiver(this.REMOVE_KEY_LISTENER, this.removeKeyListener.bind(this));
            this._sandbox.registerMessageReceiver(this.REMOVE_MOUSE_LISTENERS, this.removeMouseListeners.bind(this));
            this._sandbox.registerMessageReceiver(this.PREVENT_SCROLLING, (shouldScroll) => this._isScrollingEnabled = !!shouldScroll);
            document.addEventListener("keydown", this._bindedListeners[this._handleKeyDown.name]);
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit)
    }

    addButtonListener(data) {
        let button = this._sandbox.sendMessage(this.GET_ELEMENT_BY_ID, { id: data.id });
        if (button) {
            button.addEventListener('click', data.listener);
        }
    }

    addKeyListener(data) {
        if (this._keyDownListeners.has(data.key)) {
            this._keyDownListeners.get(data.key).push(data.listener);
        } else {
            this._keyDownListeners.set(data.key, [data.listener]);
        }
    }

    addMouseListeners(element) {
        element.addEventListener('selectstart', this._bindedListeners[this._handleSelectStart.name], false);
        element.addEventListener('dblclick', this._bindedListeners[this._handleDoubleClick.name]);
        element.addEventListener('mousedown', this._bindedListeners[this._handleMouseDown.name]);
        element.addEventListener('mousemove', this._bindedListeners[this._handleMouseMove.name]);
        element.addEventListener('mouseup', this._bindedListeners[this._handleMouseUp.name]);
        element.addEventListener("touchstart", this._bindedListeners[this._handleTouchStart.name]);
        element.addEventListener("touchend", this._bindedListeners[this._handleTouchEnd.name]);
        element.addEventListener("touchcancel", this._bindedListeners[this._handleTouchCancel.name]);
        element.addEventListener("touchmove", this._bindedListeners[this._handleTouchMove.name]);
    }

    removeButtonListener() {
        let button = this._sandbox.sendMessage(this.GET_ELEMENT_BY_ID, { id: data.id });
        if (button) {
            button.removeEventListener('click', data.listener);
        }
    }

    removeKeyListener(data) {
        if (this._keyDownListeners.has(data.key)) {
            let listeners = this._keyDownListeners.get(data.key);
            for (let i = 0; i < listeners.length; i++) {
                if (listeners[i] === data.listener) {
                    listeners.splice(i, 1);
                }
            }
        }
    }

    removeMouseListeners(element) {
        element.removeEventListener('selectstart', this._bindedListeners[this._handleSelectStart.name]);
        element.removeEventListener('dblclick', this._bindedListeners[this._handleDoubleClick.name]);
        element.removeEventListener('mousedown', this._bindedListeners[this._handleMouseDown.name]);
        element.removeEventListener('mousemove', this._bindedListeners[this._handleMouseMove.name]);
        element.removeEventListener('mouseup', this._bindedListeners[this._handleMouseUp.name]);
        element.removeEventListener("touchstart", this._bindedListeners[this._handleTouchStart.name]);
        element.removeEventListener("touchend", this._bindedListeners[this._handleTouchEnd.name]);
        element.removeEventListener("touchcancel", this._bindedListeners[this._handleTouchCancel.name]);
        element.removeEventListener("touchmove", this._bindedListeners[this._handleTouchMove.name]);
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            document.removeEventListener("keydown", this._bindedListeners[this._handleKeyDown.name]);
            this._sandbox.unregisterMessageReceiver(this.ADD_BUTTON_LISTENER);
            this._sandbox.unregisterMessageReceiver(this.ADD_KEY_LISTENER);
            this._sandbox.unregisterMessageReceiver(this.ADD_MOUSE_LISTENERS);
            this._sandbox.unregisterMessageReceiver(this.REMOVE_BUTTON_LISTENER);
            this._sandbox.unregisterMessageReceiver(this.REMOVE_KEY_LISTENER);
            this._sandbox.unregisterMessageReceiver(this.REMOVE_MOUSE_LISTENERS);
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

    _handleKeyDown(e) {
        if (this._keyDownListeners.has(e.key)) {
            let listeners = this._keyDownListeners.get(e.key).slice();
            for (let i = 0; i < listeners.length; i++) {
                listeners[i]();
            }
        }
    }

    _handleSelectStart(e) {
        e.preventDefault();
        return false;
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
}