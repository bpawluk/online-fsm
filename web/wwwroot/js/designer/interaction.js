'use strict'

export class Interaction {
    constructor(sandbox) {
        this._isInit = false;
        this._sandbox = sandbox;

        this._sandbox.createEvent('pointer-down');
        this._sandbox.createEvent('pointer-move');
        this._sandbox.createEvent('pointer-up');
        this._sandbox.declareInterface('interaction-target', ['addEventListener'], []);
    }

    _handleDoubleClick() {

    }

    _handleMouseDown() {

    }

    _handleMouseMove() {

    }

    _handleMouseUp() {

    }

    init() {
        if (!this._isInit) {
            this._sandbox.registerListener('app-init', this.onAppInit.bind(this));
            this._sandbox.registerListener('interaction-target-created', this.makeInteractive);
            this._isInit = true;
        }
    }

    onAppInit() {
        //this._sandbox.unregisterListener('app-init', ???)
    }

    makeInteractive(element) {
        this._sandbox.assertInterface(element, 'interaction-target');
        element.addEventListener('dblclick', null);
        element.addEventListener('mousedown', null);
        element.addEventListener('mousemove', null);
        element.addEventListener('mouseup', null);
    }

    stop() {
        //this._sandbox.unregisterListener('interaction-target-created', ???)
    }

    cleanUp() {
        this._sandbox.deleteEvent('pointer-down');
        this._sandbox.deleteEvent('pointer-move');
        this._sandbox.deleteEvent('pointer-up');
    }
}