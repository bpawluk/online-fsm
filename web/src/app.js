'use strict'
import { Core } from './core.js';
import { Canvas } from './modules/canvas.js';
import { DomManager } from './modules/dom-manager.js';
import { Interaction } from './modules/interaction.js';
import { Workspace } from './modules/workspace.js';
import { Ruler } from './modules/ruler.js';
import { FSM } from './modules/fsm.js';

(function (domEntrypoint) {
    const core = new Core();
    core.addModule(Canvas, 'canvas', { isInteractive: true });
    core.addModule(DomManager, 'dom-manager', { entrypoint: domEntrypoint });
    core.addModule(Interaction, 'interaction');
    core.addModule(Workspace, 'workspace');
    core.addModule(Ruler, 'ruler', {distance: 25, reach: 3, visibility: true});
    core.addModule(FSM, 'fsm');
    core.init();
})('workspace');