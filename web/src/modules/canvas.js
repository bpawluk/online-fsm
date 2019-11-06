'use strict'

export class Canvas {
    constructor(sandbox, config) {
        // Provides:
        this.CLEAR_CANVAS = 'canvas-clear';
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.REDRAW_CANVAS = 'canvas-redraw';
        this.CANVAS_CLEARED_EVENT = 'canvas-cleared';
        this.CANVAS_DRAWN_EVENT = 'canvas-drawn';
        //this.CANVAS_SIZE_CHANGING = 'canvas-size-changing';
        this.CANVAS_RESIZED_EVENT = 'canvas-resized';

        // Depends on:
        this.APPEND_DOM_ELEMENT = 'append-dom-element';
        this.GET_APP_SIZE = 'get-app-size';
        this.MAKE_INTERACTIVE = 'make-interactive';
        this.APP_INIT_EVENT = 'app-init';
        this.APP_RESIZED_EVENT = 'app-resized';

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._isInteractive = config && config.isInteractive !== undefined ? config.isInteractive : false;
        this._size = config.size || { width: 'auto', height: 'auto' }
        this._minSize = config.minSize || { width: 0, height: 0 };
        this._sandbox = sandbox;
        this._canvas;
        this._context;

        this._sandbox.createEvent(this.CANVAS_CLEARED_EVENT);
        this._sandbox.createEvent(this.CANVAS_DRAWN_EVENT);
        this._sandbox.createEvent(this.CANVAS_RESIZED_EVENT);
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
            this._sandbox.registerMessageReceiver(this.CLEAR_CANVAS, this.clear.bind(this));
            this._sandbox.registerMessageReceiver(this.DRAW_ON_CANVAS, this.draw.bind(this));
            this._sandbox.registerMessageReceiver(this.REDRAW_CANVAS, this.redraw.bind(this));
            this.isRunning = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
        let width = this._size.width;
        let height = this._size.height;
        if (this._size.width === 'auto' || this._size.height === 'auto') {
            let appSize = this._sandbox.sendMessage(this.GET_APP_SIZE);
            width = this._size.width === 'auto' ? Math.max(appSize.width, this._minSize.width) : this._size.width;
            height = this._size.height === 'auto' ? Math.max(appSize.height, this._minSize.height) : this._size.height;
            this._sandbox.registerListener(this.APP_RESIZED_EVENT, this._onAppResized.bind(this));
        }
        this._canvas = this._sandbox.sendMessage(this.APPEND_DOM_ELEMENT, { type: 'canvas', width: width, height: height });
        this._context = this._canvas.getContext('2d', { alpha: false });
        if (this._isInteractive) {
            this._sandbox.sendMessage(this.MAKE_INTERACTIVE, this._canvas);
        }
        this.clear();
    }

    clear() {
        this._context.save();
        this._context.fillStyle = '#FFFFFF';
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        this._context.restore();
        this._sandbox.raiseEvent(this.CANVAS_CLEARED_EVENT, this._canvas);
    }

    draw(drawables) {
        if (drawables instanceof Array) {
            for (let i = 0, len = drawables.length; i < len; i++) {
                drawables[i].draw(this._context);
            }
        } else {
            drawables.draw(this._context);
        }
        this._sandbox.raiseEvent(this.CANVAS_DRAWN_EVENT, { canvas: this._canvas, drawables: drawables });
    }

    redraw(drawables) {
        this.clear();
        this.draw(drawables);
    }

    resize(size) {
        this._canvas.width = size.width;
        this._canvas.height = size.height;
        this.clear();
        this._sandbox.raiseEvent(this.CANVAS_RESIZED_EVENT, size);
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterMessageReceiver(this.CLEAR_CANVAS);
            this._sandbox.unregisterMessageReceiver(this.DRAW_ON_CANVAS);
            this._sandbox.unregisterMessageReceiver(this.REDRAW_CANVAS);
        }
    }

    cleanUp() {
        this._sandbox.deleteEvent(this.CANVAS_CLEARED_EVENT);
        this._sandbox.deleteEvent(this.CANVAS_DRAWN_EVENT);
    }

    _onAppResized(size){
        this.resize({
            width: this._size.width === 'auto' ? Math.max(size.width, this._minSize.width) : this._size.width,
            height: this._size.height === 'auto' ? Math.max(size.height, this._minSize.height) : this._size.height
        });
    }
}