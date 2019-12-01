'use strict'

import { State } from '../shapes/state-shape.js';
import { Transition } from '../shapes/transition-shape.js';

export class FSMSimulator {
    constructor(sandbox) {
        // Provides:

        // Depends on:
        this.LOAD_CACHE = 'fsm-load-cache';
        this.CLEAR_CACHE = 'fsm-clear-cache';
        this.SELECT_ITEM = 'workspace-select-item';
        this.GET_ITEMS = 'workspace-get-items';
        this.REFRESH_WORKSPACE = 'workspace-refresh';
        this.SHOW_POPUP = 'popup-show';
        this.HIDE_POPUP = 'popup-hide';
        this.SET_CONTROL_DISABLED = 'disable-control';
        this.ADD_BUTTON_LISTENER = 'add-button-listener';
        this.REMOVE_BUTTON_LISTENER = 'remove-button-listener';
        this.GET_ELEMENT_BY_ID = 'get-element-by-id';
        this.APP_INIT_EVENT = 'app-init';

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;

        this._input;
        this._currentStates;
        this._currentPosition;

        this._alphabet;
        this._entry;
        this._transitions;

        this._messageContainer;
        this._inputContainer;

        this._onBack = () => { if (this.isRunning) this._onSimulationStep(true) };
        this._onStart = () => { if (this.isRunning) this._resetSimulation() };
        this._onRestart = () => { if (this.isRunning) this._onRestartClicked() };
        this._onEnd = () => { if (this.isRunning) this._onEndClicked() };
        this._onForward = () => { if (this.isRunning) this._onSimulationStep(false) };
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
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit);
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'back', listener: this._onBack });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'start', listener: this._onStart });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'restart', listener: this._onRestart });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'end', listener: this._onEnd });
        this._sandbox.sendMessage(this.ADD_BUTTON_LISTENER, { id: 'forward', listener: this._onForward });
        this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'back', disabled: true });
        this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'start', disabled: true });
        this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'end', disabled: true });
        this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'forward', disabled: true });
        this._messageContainer = this._sandbox.sendMessage(this.GET_ELEMENT_BY_ID, { id: 'workspace-message' });
        this._inputContainer = this._sandbox.sendMessage(this.GET_ELEMENT_BY_ID, { id: 'input-string' });
        this._messageContainer.innerHTML = 'Please enter input string to run the simulation.';
        this._loadData();
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
        }
    }

    cleanUp() {
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'back', listener: this._onBack });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'start', listener: this._onStart });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'restart', listener: this._onRestart });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'end', listener: this._onEnd });
        this._sandbox.sendMessage(this.REMOVE_BUTTON_LISTENER, { id: 'forward', listener: this._onForward });
    }

    _resetData() {
        this._entry = null;
        this._alphabet = new Set();
        this._transitions = new Map();
        this._currentPosition = 0;
        this._currentStates = [];
    }

    _loadData() {
        this._resetData();

        const states = this._sandbox.sendMessage(this.GET_ITEMS, (item) => item instanceof State);
        states.forEach(state => this._transitions.set(state, { incoming: new Map(), outgoing: new Map() }));
        this._entry = states.find((item) => item.isEntry);

        const transitions = this._sandbox.sendMessage(this.GET_ITEMS, (item) => item instanceof Transition);
        transitions.forEach(trans => {
            let from = trans.firstItem;
            let to = trans.secondItem;
            let symbols = trans.getConditions();

            let fromOutgoing = this._transitions.get(from).outgoing;
            let toIncoming = this._transitions.get(to).incoming;

            symbols.forEach(symbol => {
                if (symbol !== '$') {
                    this._alphabet.add(symbol)
                }

                if (!fromOutgoing.has(symbol)) {
                    fromOutgoing.set(symbol, new Set());
                }
                fromOutgoing.get(symbol).add(to);

                if (!toIncoming.has(symbol)) {
                    toIncoming.set(symbol, new Set());
                }
                toIncoming.get(symbol).add(from);
            });
        });
    }

    _activateState(state, backward) {
        this._currentStates.push(state);
        state.setActive(true);

        let transitions = backward ? this._transitions.get(state).incoming : this._transitions.get(state).outgoing;
        if (transitions.has('$')) {
            transitions.get('$').forEach((nextState) => {
                if (!this._currentStates.includes(nextState)) {
                    this._activateState(nextState, backward)
                }
            });
        }
    }

    _endReached(accepted) {
        this._messageContainer.innerText = 'Processing completed. Input ' + (accepted ? 'accepted!' : 'rejected!');
    }

    _resetSimulation() {
        this._currentPosition = 0;
        this._currentStates.forEach(state => state.setActive(false));
        this._currentStates = [];
        this._activateState(this._entry);
        this._refreshInput();
        this._sandbox.sendMessage(this.REFRESH_WORKSPACE);
    }

    _onRestartClicked() {
        let save = () => {
            let result = this._sandbox.sendMessage(this.HIDE_POPUP);
            this._setUserInput(result.find((e) => e.name === 'fsm-user-input').value);
        };
        let cancel = () => this._sandbox.sendMessage(this.HIDE_POPUP);
        this._sandbox.sendMessage(this.SHOW_POPUP, {
            message: 'Please enter input for the automaton.\nAny symbols outside of the alphabet { ' + this._alphabet + ' } will be ignored.',
            input: [{ name: 'fsm-user-input', label: 'Word to process' }],
            buttons: [{ text: 'Save', onClick: save }, { text: 'Cancel', onClick: cancel }],
            onEscape: cancel,
            onEnter: save
        });
    }

    _onEndClicked() {

    }

    _onSimulationStep(backward) {
        const nextPosition = backward ? this._currentPosition - 1 : this._currentPosition + 1;
        if (0 <= nextPosition && nextPosition < this._input.length) {
            let symbol = this._input.charAt(this._currentPosition);
            let nextStates = new Set();
            while (this._currentStates.length > 0) {
                const current = this._currentStates.pop();
                current.setActive(false);

                const transitions = backward ? this._transitions.get(current).incoming : this._transitions.get(current).outgoing;

                if (!transitions.has(symbol) || transitions.get(symbol).size === 0) {
                    nextStates.add(current);
                } else {
                    transitions.get(symbol).forEach((state) => nextStates.add(state));
                }
            }

            this._currentPosition = nextPosition;
            this._refreshInput();
            nextStates.forEach(state => this._activateState(state, backward));
            this._sandbox.sendMessage(this.REFRESH_WORKSPACE);

            if(this._currentPosition >= this._input.length) {
                this._endReached(!!this._currentStates.find((state) => state.isAccepting));
            }
        }
    }

    _setUserInput(input) {
        let newInput = '';
        for (let i = 0, len = input.length; i < len; i++) {
            const char = input.charAt(i);
            if (this._alphabet.has(char)) {
                newInput += char;
            }
        }
        this._input = newInput;
        this._resetSimulation();

        if (this._input.length > 0) {
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'back', disabled: false });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'start', disabled: false });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'end', disabled: false });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'forward', disabled: false });
            this._messageContainer.innerHTML = 'Use bottom panel to control the simulation.';
        } else {
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'back', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'start', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'end', disabled: true });
            this._sandbox.sendMessage(this.SET_CONTROL_DISABLED, { id: 'forward', disabled: true });
            this._messageContainer.innerHTML = 'Please enter input string to run the simulation.';
        }

    }

    _refreshInput() {
        if (this._currentPosition >= 0 && this._currentPosition < this._input.length) {
            this._inputContainer.innerHTML =
                this._input.substring(0, this._currentPosition)
                + '<span class="current-input">'
                + this._input.substring(this._currentPosition, this._currentPosition + 1)
                + '</span>'
                + this._input.substring(this._currentPosition + 1, this._input.length);
        } else {
            this._inputContainer.innerHTML = this._input;
        }
    }
}