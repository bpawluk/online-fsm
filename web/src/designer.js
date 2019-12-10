'use strict'
import { Core } from './core.js';
import { Canvas } from './modules/canvas.js';
import { DomManager } from './modules/dom-manager.js';
import { Interaction } from './modules/interaction.js';
import { Workspace } from './modules/workspace.js';
import { Ruler } from './modules/ruler.js';
import { FSMCacheManager } from './modules/fsm-cache-manager.js';
import { FSMSerializer } from './modules/fsm-serializer.js';
import { ItemDragger } from './modules/item-dragger.js';
import { ItemSelector } from './modules/item-selector.js';
import { PopupManager } from './modules/popup-manager.js';
import { FSMStateManager } from './modules/fsm-state-manager.js';
import { FSMTransitionManager } from './modules/fsm-transition-manager.js';
import { FSMLoader } from './modules/fsm-loader.js';
import { WorkspaceScaler } from './modules/workspace-scaler.js';

(function (domEntrypoint) {
    const core = new Core();
    core.addModule(Canvas, 'canvas', { isInteractive: true, minSize: { width: 800, height: 600 } });
    core.addModule(DomManager, 'dom-manager', { entrypoint: domEntrypoint });
    core.addModule(Interaction, 'interaction');
    core.addModule(Workspace, 'workspace');
    core.addModule(WorkspaceScaler, 'workspace-scaler');
    core.addModule(ItemSelector, 'item-selector');
    core.addModule(ItemDragger, 'item-dragger')
    core.addModule(Ruler, 'ruler', { distance: 15, reach: 3, visibility: true });
    core.addModule(FSMLoader, 'fsm-loader');
    core.addModule(FSMCacheManager, 'fsm-cache-manager', { autosaving: true });
    core.addModule(FSMStateManager, 'fsm-state-manager');
    core.addModule(FSMTransitionManager, 'fsm-transition-manager');
    core.addModule(FSMSerializer, 'fsm-serializer');
    core.addModule(PopupManager, 'popup-manager')
    core.init();
})('workspace');