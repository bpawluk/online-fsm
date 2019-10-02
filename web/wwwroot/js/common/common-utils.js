'use strict'

export let ArrayUtils = {
    remove: function (element, array) {
        let success = false;

        if (array && array instanceof Array) {
            for (let i = 0, len = array.length; i < len; i++) {
                if (array[i] === element) {
                    array.splice(i, 1);
                    success = true;
                }
            }
        }

        return success;
    }
};