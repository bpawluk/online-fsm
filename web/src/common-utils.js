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

export let ObjectUtils = {
    forEachOwnProperty: function (object, action) {
        for (let key in object) {
            if (object.hasOwnProperty(key))
                action(key, object[key]);
        }
    }
}

export let MathUtils = {
    distance: function (a, b) {
        let vectorX = b.x - a.x;
        let vectorY = b.y - a.y
        return Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    },

    arePointsColinear: function (a, b, c, tolerance) {
        tolerance = tolerance === undefined ? 0.01 : tolerance;
        return Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) <= tolerance;
    },

    arePointsEqual: function (a, b) {
        return a.x === b.x && a.y === b.y;
    },

    isPointCloseToSegment: function (a, b, point, maxDistance) {
        maxDistance = maxDistance === undefined ? 0.01 : maxDistance;
        let x = point.x;
        let y = point.y;
        let dx = b.x - a.x;
        let dy = b.y - a.y;

        let closestPointOnLine = {};
        if (dx === 0 && dy === 0) {
            closestPointOnLine = a;
        }
        else {
            let direction = ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy);
            closestPointOnLine.x = a.x + direction * (b.x - a.x);
            closestPointOnLine.y = a.y + direction * (b.y - a.y);
        }

        if (!this.isPointOnSegment(a, b, closestPointOnLine)) {
            return false;
        }
        else {
            dx = x - closestPointOnLine.x;
            dy = y - closestPointOnLine.y;
            return Math.sqrt(dx * dx + dy * dy) <= maxDistance;
        }
    },

    isPointOnSegment: function (a, b, point) {
        let minX = Math.min(a.x, b.x);
        let maxX = Math.max(a.x, b.x);
        let minY = Math.min(a.y, b.y);
        let maxY = Math.max(a.y, b.y);
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    },

    getNormalVector: function (a, b, reversed) {
        if (this.arePointsEqual(a, b)) {
            throw new Error("Cannot create normal vector from equal points");
        }
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let length = this.distance(a, b);
        if (reversed) {
            return {
                x: -dy / length,
                y: dx / length
            }
        }
        else {
            return {
                x: dy / length,
                y: -dx / length
            }
        }
    },

    getVector: function (a, b) {
        if (this.arePointsEqual(a, b)) {
            throw new Error("Cannot create vector from equal points");
        }
        let vector = {};
        vector.x = b.x - a.x;
        vector.y = b.y - a.y;
        return vector;
    },

    getUnitVector: function (a, b) {
        let vector = this.getVector(a, b);
        let length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        vector.x = vector.x / length;
        vector.y = vector.y / length;
        return vector;
    },

    translateVector: function (vector, point) {
        return {
            x: vector.x + point.x,
            y: vector.y + point.y
        }
    },

    vecByScalMul: function (vector, scalar) {
        return {
            x: vector.x * scalar,
            y: vector.y * scalar
        }
    },

    isPointInCircle: function (point, center, radius) {
        let dx = Math.abs(center.x - point.x);
        if (dx > radius) {
            return false;
        }

        let dy = Math.abs(center.y - point.y);
        if (dy > radius) {
            return false
        }

        if (dx + dy <= radius) {
            return true
        }

        return dx * dx + dy * dy <= radius * radius
    },

    getPointOnCircleGivenAngle: function (center, radius, angle) {
        return {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        }
    },

    centerOfCircleFrom3Points: function (a, b, c) {
        let xa = a.x - c.x;
        let ya = a.y - c.y;
        let xb = b.x - c.x;
        let yb = b.y - c.y;
        let det = 2 * (xa * yb - xb * ya);
        let tempA = xa * xa + ya * ya;
        let tempB = xb * xb + yb * yb;
        let center = {};
        center.x = ((yb * tempA - ya * tempB) / det) + c.x;
        center.y = ((xa * tempB - xb * tempA) / det) + c.y;
        return center;
    },

    getMidAngleOfArc: function(start, end, reversed){
        let mid = (start + end) / 2
        if((start <= end && reversed) || (start > end && !reversed)){
            if(mid <= 0){
                return mid + Math.PI;
            } else {
                return mid - Math.PI;
            }
        }
        return mid;
    }
}