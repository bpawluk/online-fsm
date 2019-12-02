'use strict'

export class WorkspaceScaler {
    constructor(sandbox) {
        // Provides:

        // Depends on:
        this.SET_TRANSFORM = 'canvas-set-transform';
        this.GET_ITEMS = 'workspace-get-items';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.APP_INIT_EVENT = 'app-init';
        this.CANVAS_RESIZED_EVENT = 'canvas-resized';

        this._margin = 50;

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this.isInit = true;
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this._sandbox.registerListener(this.CANVAS_RESIZED_EVENT, { callback: this._onCanvasResized, thisArg: this });
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
        }
    }

    cleanUp() { }

    _getWorkspaceBounds() {
        let items = this._sandbox.sendMessage(this.GET_ITEMS, (item) => typeof item.getBounds === 'function');
        let bounds = items.reduce(
            (bounds, item) => {
                const current = item.getBounds();
                bounds.left = Math.min(bounds.left, current.left);
                bounds.top = Math.min(bounds.top, current.top);
                bounds.right = Math.max(bounds.right, current.right);
                bounds.bottom = Math.max(bounds.bottom, current.bottom);
                return bounds;
            },
            {
                left: Number.MAX_SAFE_INTEGER, top: Number.MAX_SAFE_INTEGER,
                right: Number.MIN_SAFE_INTEGER, bottom: Number.MIN_SAFE_INTEGER
            });
        bounds.left -= this._margin;
        bounds.top -= this._margin;
        bounds.right += this._margin;
        bounds.bottom += this._margin;
        return bounds;
    }

    _getScale(size, width, height) {
        let widthScale = 1;
        if (width > size.width) {
            widthScale = size.width / width;
        }

        let heightScale = 1;
        if (height > size.height) {
            heightScale = size.height / height;
        }

        return Math.min(heightScale, widthScale);
    }

    _findCenter(bounds) {
        return {
            x: (bounds.left + bounds.right) / 2,
            y: (bounds.top + bounds.bottom) / 2
        };
    }

    _onCanvasResized(size) {
        const bounds = this._getWorkspaceBounds();
        const boundsCentre = this._findCenter(bounds);
        const width = bounds.right - bounds.left;
        const height = bounds.bottom - bounds.top;
        const scale = this._getScale(size, width, height);
        const transform = (context) => {
            context.translate(size.width / 2, size.height / 2);
            context.scale(scale, scale);
            context.translate(-boundsCentre.x, -boundsCentre.y);
        };
        this._sandbox.sendMessage(this.SET_TRANSFORM, transform);
        this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
    }
}