'use strict'

export class Canvas {
    constructor(sandbox, config) {
        // Provides:
        this.SET_TRANSFORM = 'canvas-set-transform';
        this.GET_SIZE = 'canvas-get-size';
        this.CLEAR_CANVAS = 'canvas-clear';
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.REDRAW_CANVAS = 'canvas-redraw';
        this.CANVAS_CLEARED_EVENT = 'canvas-cleared';
        this.CANVAS_DRAWN_EVENT = 'canvas-drawn';
        this.CANVAS_RESIZED_EVENT = 'canvas-resized';

        // Depends on:
        this.APPEND_DOM_ELEMENT = 'append-dom-element';
        this.GET_APP_SIZE = 'get-app-size';
        this.ADD_MOUSE_LISTENERS = 'add-mouse-listeners';
        this.APP_INIT_EVENT = 'app-init';
        this.APP_RESIZED_EVENT = 'app-resized';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._isInteractive = config && config.isInteractive !== undefined ? config.isInteractive : false;
        this._size = config.size || { width: 'auto', height: 'auto' }
        this._minSize = config.minSize || { width: 0, height: 0 };
        this._transform = config.transform;
        this._sandbox = sandbox;
        this._canvas;
        this._context;
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this._sandbox.createEvent(this.CANVAS_CLEARED_EVENT);
            this._sandbox.createEvent(this.CANVAS_DRAWN_EVENT);
            this._sandbox.createEvent(this.CANVAS_RESIZED_EVENT);
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerMessageReceiver(this.CLEAR_CANVAS, this.clear.bind(this));
            this._sandbox.registerMessageReceiver(this.DRAW_ON_CANVAS, this.draw.bind(this));
            this._sandbox.registerMessageReceiver(this.REDRAW_CANVAS, this.redraw.bind(this));
            this._sandbox.registerMessageReceiver(this.SET_TRANSFORM, this.setTransform.bind(this));
            this._sandbox.registerMessageReceiver(this.GET_SIZE, this.getSize.bind(this));
            this.isRunning = true;
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
        let width = this._size.width;
        let height = this._size.height;
        if (this._size.width === 'auto' || this._size.height === 'auto') {
            let appSize = this._sandbox.sendMessage(this.GET_APP_SIZE);
            width = this._size.width === 'auto' ? Math.max(appSize.width, this._minSize.width) : this._size.width;
            height = this._size.height === 'auto' ? Math.max(appSize.height, this._minSize.height) : this._size.height;
            this._sandbox.registerListener(this.APP_RESIZED_EVENT, { callback: this._onAppResized, thisArg: this });
        }
        this._canvas = this._sandbox.sendMessage(this.APPEND_DOM_ELEMENT, { type: 'canvas', width: width, height: height });
        this._context = this._canvas.getContext('2d', { alpha: false });
        if (this._isInteractive) {
            this._sandbox.sendMessage(this.ADD_MOUSE_LISTENERS, this._canvas);
        }
        this.clear();
        this._sandbox.raiseEvent(this.CANVAS_RESIZED_EVENT, { width: width, height: height });
    }

    clear() {
        this._context.save();
        this._context.fillStyle = '#FFFFFF';
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        this._context.restore();
        this._sandbox.raiseEvent(this.CANVAS_CLEARED_EVENT, this._canvas);
    }

    draw(drawables) {
        this._context.save();
        if (this._transform) this._transform(this._context);
        if (drawables instanceof Array) {
            for (let i = 0, len = drawables.length; i < len; i++) {
                drawables[i].draw(this._context);
            }
        } else {
            drawables.draw(this._context);
        }
        this._context.restore();
        this._sandbox.raiseEvent(this.CANVAS_DRAWN_EVENT, { canvas: this._canvas, drawables: drawables });
    }

    redraw(drawables) {
        this.clear();
        this.draw(drawables);
    }

    getSize() {
        return {
            width: this._canvas.width,
            height: this._canvas.height
        }
    }

    resize(size) {
        this._canvas.width = size.width;
        this._canvas.height = size.height;
        this.clear();
        this._sandbox.raiseEvent(this.CANVAS_RESIZED_EVENT, size);
    }

    setTransform(transform) {
        this._transform = transform;
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterMessageReceiver(this.CLEAR_CANVAS);
            this._sandbox.unregisterMessageReceiver(this.DRAW_ON_CANVAS);
            this._sandbox.unregisterMessageReceiver(this.REDRAW_CANVAS);
            this._sandbox.unregisterMessageReceiver(this.SET_TRANSFORM);
            this._sandbox.unregisterMessageReceiver(this.GET_SIZE);
        }
    }

    cleanUp() {
        this._sandbox.unregisterListener(this.APP_RESIZED_EVENT, this._onAppResized);
        this._sandbox.deleteEvent(this.CANVAS_CLEARED_EVENT);
        this._sandbox.deleteEvent(this.CANVAS_DRAWN_EVENT);
    }

    _onAppResized(size) {
        if (this.isRunning) {
            this.resize({
                width: this._size.width === 'auto' ? Math.max(size.width, this._minSize.width) : this._size.width,
                height: this._size.height === 'auto' ? Math.max(size.height, this._minSize.height) : this._size.height
            });
        }
    }
}