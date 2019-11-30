'use strict'
import { Core } from './core.js';
import { Canvas } from './modules/canvas.js';
import { DomManager } from './modules/dom-manager.js';
import { Interaction } from './modules/interaction.js';
import { Workspace } from './modules/workspace.js';
import { FSMCacheManager } from './modules/fsm-cache-manager.js';
import { FSMSerializer } from './modules/fsm-serializer.js';
import { PopupManager } from './modules/popup-manager.js';
import { FSMLoader } from './modules/fsm-loader.js';

(function (domEntrypoint) {
    const core = new Core();
    core.addModule(Canvas, 'canvas', { isInteractive: true, minSize: { width: 800, height: 600 } });
    core.addModule(DomManager, 'dom-manager', { entrypoint: domEntrypoint });
    core.addModule(Interaction, 'interaction');
    core.addModule(Workspace, 'workspace');
    core.addModule(FSMLoader, 'fsm-loader');
    core.addModule(FSMCacheManager, 'fsm-cache-manager');
    core.addModule(FSMSerializer, 'fsm-serializer');
    core.addModule(PopupManager, 'popup-manager')
    core.init();
})('workspace');