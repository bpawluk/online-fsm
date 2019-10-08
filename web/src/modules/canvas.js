'use strict'

export class Canvas {
    constructor(sandbox, config) {
        // Provides:
        this.CLEAR_CANVAS = 'canvas-clear';
        this.DRAW_ON_CANVAS = 'canvas-draw';
        this.REDRAW_CANVAS = 'canvas-redraw';
        this.CANVAS_CLEARED_EVENT = 'canvas-cleared';
        this.CANVAS_DRAWN_EVENT = 'canvas-drawn';
        this.CANVAS_REDRAWN_EVENT = 'canvas-redrawn';

        // Depends on:
        this.APPEND_DOM_ELEMENT = 'append-dom-element';
        this.MAKE_INTERACTIVE = 'make-interactive';
        this.APP_INIT_EVENT = 'app-init';

        this._isInit = false;
        this._isInteractive = config && config.isInteractive !== undefined ? config.isInteractive : false;
        this._sandbox = sandbox;
        this._canvas;
        this._context;

        this._sandbox.registerMessageReceiver(this.CLEAR_CANVAS, this.clear.bind(this));
        this._sandbox.registerMessageReceiver(this.DRAW_ON_CANVAS, this.draw.bind(this));
        this._sandbox.registerMessageReceiver(this.REDRAW_CANVAS, this.redraw.bind(this));
        this._sandbox.createEvent(this.CANVAS_CLEARED_EVENT);
        this._sandbox.createEvent(this.CANVAS_DRAWN_EVENT);
        this._sandbox.createEvent(this.CANVAS_REDRAWN_EVENT);
    }

    init() {
        if (!this._isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, this.onAppInit.bind(this));
            this._isInit = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???);
        this._canvas = this._sandbox.sendMessage(this.APPEND_DOM_ELEMENT, { type: 'canvas', width: '800px', height: '600px' });
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
    }

    draw(drawables) {
        if (drawables instanceof Array) {
            for (let i = 0, len = drawables.length; i < len; i++) {
                drawables[i].draw(this._context);
            }
        } else {
            drawables.draw(this._context);
        }
    }

    redraw(drawables) {
        this.clear();
        this.draw(drawables);
    }

    stop() {

    }

    cleanUp() {
        this._sandbox.unregisterMessageReceiver(this.CLEAR_CANVAS);
        this._sandbox.unregisterMessageReceiver(this.DRAW_ON_CANVAS);
        this._sandbox.unregisterMessageReceiver(this.REDRAW_CANVAS);
        this._sandbox.deleteEvent(this.CANVAS_CLEARED_EVENT);
        this._sandbox.deleteEvent(this.CANVAS_DRAWN_EVENT);
        this._sandbox.deleteEvent(this.CANVAS_REDRAWN_EVENT);
    }
}