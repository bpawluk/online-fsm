'use strict'

import { State, Transition } from './fsm-shapes.js'

export class FSMSerializer {
    constructor(sandbox, config) {
        // Provides:
        this.SERIALIZE_FSM = 'fsm-serialize';
        this.DESERIALIZE_FSM = 'fsm-deserialize';

        // Depends on:

        // Requires interfaces:

        this.isInit = false;
        this.isRunning = false;
        this._sandbox = sandbox;
    }

    init() {
        if (!this.isInit) {
            this._sandbox.registerListener(this.APP_INIT_EVENT, { callback: this.onAppInit, thisArg: this });
            this.isInit = true;
            this.start();
        }
    }

    start() {
        if (!this.isRunning) {
            this._sandbox.registerMessageReceiver(this.SERIALIZE_FSM, this.serialize.bind(this));
            this._sandbox.registerMessageReceiver(this.DESERIALIZE_FSM, this.deserialize.bind(this));
        }
    }

    onAppInit() {
        this._sandbox.unregisterListener(this.APP_INIT_EVENT, this.onAppInit)
    }

    serialize(data) {
        let blob = {};
        if (data && data.states instanceof Array && data.transitions instanceof Array) {
            let ids = data.states.reduce((map, curr, i) => map.set(curr, i), new Map());
            blob.states = data.states.map((state) => ({
                id: ids.get(state),
                pos: state.getPosition(),
                txt: state.getText(),
                acc: state.isAccepting,
                ent: state.isEntry
            }));
            blob.transitions = data.transitions.map((transition) => {
                let trans = {
                    frm: ids.get(transition.firstItem),
                    to: ids.get(transition.secondItem),
                    con: transition.getText(),
                };
                if (transition.isSelfLink()) {
                    let dir = transition._selfLinkDirection;
                    trans.dir = { x: +dir.x.toFixed(2), y: +dir.y.toFixed(2) }
                }
                else if (transition._sagitta) {
                    trans.sag = Math.round(transition._sagitta);
                    trans.rev = transition._isReversed;
                }
                return trans;
            });
        }
        return JSON.stringify(blob);
    }

    deserialize(text) {
        let data = {};
        data.states = [];
        data.transitions = [];

        let dataRead = null;
        try {
            dataRead = JSON.parse(text);
        } catch (e) {
            console.log('Error parsing JSON data')
        }

        if (dataRead && dataRead.states instanceof Array && dataRead.transitions instanceof Array) {
            let ids = new Map();

            let lastNum = 0;
            let entryDefined = false;
            dataRead.states.forEach(state => {
                if (state && state.id !== undefined) {
                    let position = state.pos || { x: 50, y: 50 };
                    let current = new State({
                        text: state.txt === undefined ? 'S' + lastNum++ : state.txt,
                        position: position,
                        accept: state.acc,
                        entry: entryDefined ? false : state.ent
                    });
                    ids.set(state.id, current);
                    data.states.push(current);
                    if (state.ent) entryDefined = true;
                }
            });

            dataRead.transitions.forEach(trans => {
                let from = ids.get(trans.frm);
                let to = ids.get(trans.to);
                if (trans && from !== undefined && to !== undefined) {
                    let config = {
                        first: from,
                        second: to
                    };
                    if (from === to) {
                        config.selfLinkDirection = trans.dir || { x: 0, y: -1 };
                    }
                    else if (trans.sag) {
                        config.sagitta = trans.sag;
                        config.reverse = trans.rev;
                    }
                    data.transitions.push(new Transition(config));
                }
            });
        }

        return data;
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this._sandbox.unregisterMessageReceiver(this.SERIALIZE_FSM);
            this._sandbox.unregisterMessageReceiver(this.DESERIALIZE_FSM);
        }
    }

    cleanUp() { }
}