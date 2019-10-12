var assert = require('assert');
// import { ObjectUtils, ArrayUtils } from "../common-utils.js";
require = require('esm')(module)
var utils = require('../common-utils.js')

describe('Testing common-utils.js', function () {
    describe('ArrayUtils', function () {
        describe('remove()', function () {
            var first, second, third, testedArray;

            beforeEach(function () {
                first = new Object();
                second = new Object();
                third = new Object();
                testedArray = [first, second, third];
            });

            it('should remove requested item from Array', function () {
                assert.equal(testedArray.length, 3);
                assert.notEqual(testedArray.indexOf(second), -1);
                utils.ArrayUtils.remove(second, testedArray);
                assert.equal(testedArray.length, 2);
                assert.equal(testedArray.indexOf(second), -1);
            });

            it('should return false when item is not in Array', function () {
                assert.equal(testedArray.length, 3);
                assert.equal(utils.ArrayUtils.remove({}, testedArray), false);
                assert.equal(testedArray.length, 3);
            });
        });
    });

    describe('ObjectUtils', function () {
        describe('forEachOwnProperty', function () {
            var obj;

            beforeEach(function () {
                obj = {
                    first: 1,
                    second: 2,
                    third: function(){}
                }
            });

            it('should iterate over own properties', function () {
                var result = 0;
                utils.ObjectUtils.forEachOwnProperty(obj, () => result++);
                assert.equal(result, 3);
            });
        });
    });
});