'use strict'
import { Core } from './core.js';
import { Canvas } from './modules/canvas.js';
import { DomManager } from './modules/dom-manager.js';
import { Interaction } from './modules/interaction.js';
import { Workspace } from './modules/workspace.js';
import { ShapeFactory } from './modules/shape-factory.js';
import { Ruler } from './modules/ruler.js';

(function (domEntrypoint) {
    const core = new Core();
    core.addModule(Canvas, 'canvas', { isInteractive: true });
    core.addModule(DomManager, 'dom-manager', { entrypoint: domEntrypoint });
    core.addModule(Interaction, 'interaction');
    core.addModule(Workspace, 'workspace');
    core.addModule(ShapeFactory, 'shape-factory');
    core.addModule(Ruler, 'ruler', {distance: 25, reach: 3, visibility: true});
    core.init();
})('workspace');