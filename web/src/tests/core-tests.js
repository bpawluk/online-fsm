var assert = require('assert');
require = require('esm')(module);
var core = require('../core.js');
var canvas = require('../modules/canvas.js')

describe('Testing core.js', function () {
    describe('addModule', function () {
        beforeEach(function () {
            first = new Object();
            second = new Object();
            third = new Object();
            testedArray = [first, second, third];
        });

        it('should throw error', function () {
            let coreInstance = new core.Core();
            coreInstance.addModule(canvas.Canvas, 'canvas', { isInteractive: true });
        });
    });
});