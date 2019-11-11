var assert = require('assert');
require = require('esm')(module);
var utils = require('../core-utils.js');

var Event = utils.Event;

describe('Testing core-utils.js', function () {
    describe('Event class', function () {
        describe('unregisterListener()', function () {
            var event;
            var firstCallback = () => true;
            var secondCallback = () => 'abc';
            var thirdCallback = () => 100;

            beforeEach(function () {
                event = new Event();
                event.registerListener({
                    callback: firstCallback
                });
                event.registerListener({
                    callback: secondCallback
                });
                event.registerListener({
                    callback: thirdCallback
                });
            });

            it('should unregister listener', function () {
                assert.equal(event._listeners.length, 3);
                assert.notEqual(event._listeners.indexOf(event._listeners.find(item => item.callback === secondCallback)), -1);
                event.unregisterListener(secondCallback);
                assert.equal(event._listeners.length, 2);
                assert.equal(event._listeners.indexOf(event._listeners.find(item => item.callback === secondCallback)), -1);
            });
        });

        describe('invoke()', function () {
            var event;
            var thisArg = { value: 1 }
            var callback = function (arg) {
                arg.value = this.value;
            }

            beforeEach(function () {
                event = new Event();
            });

            it('listener with thisArg should be callend upon thisArg', function () {
                event.registerListener({ callback: callback, thisArg: thisArg });
                assert.equal(event._listeners.length, 1);
                let result = { value: 0 };
                event.invoke(result);
                assert.equal(result.value, thisArg.value);
            });
            
            it('listener without thisArg should also work', function () {
                event.registerListener({ callback: callback });
                assert.equal(event._listeners.length, 1);
                let result = { value: 1 };
                event.invoke(result);
                assert.equal(result.value, undefined);
            });
        });
    });
});