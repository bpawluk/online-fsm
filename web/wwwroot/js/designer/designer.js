"use strict"

window.onload = function () {
    var workspace = new Workspace();
    workspace.init(document.getElementById('canvas'));

    document.getElementById('addState').onclick = function () {
        var state = new State();
        workspace.add(state);
    }
}

function getPointInElement(element, clientX, clientY){
    var bounds = element.getBoundingClientRect();
    return {
        x: clientX - bounds.left,
        y: clientY - bounds.top
    };
}

// ----------------- WORKSPACE -----------------

function Workspace(){
    // Private members
    this._drawables = [];
    this._canvas;
    this._context;
    this._dragged;
    // Public members
}

Workspace.prototype._guard = function(){
    if(!this._canvas){
        throw new Error('Workspace is not initialized');
    }
}

Workspace.prototype._onDoubleClick = function(){
    var self = this;
    return function(e){
        var point = getPointInElement(self._canvas, e.clientX, e.clientY);
        self.add(new State(point.x, point.y));
    };
}

Workspace.prototype._onMouseDown = function(){
    var self = this;
    return function(e){
        var point = getPointInElement(self._canvas, e.clientX, e.clientY);
        var drawables = self._drawables;
        var i = drawables.length;
        while(i--){
            if(drawables[i].contains(point.x, point.y)){
                console.log(drawables[i]);
                self._dragged = drawables[i];
            }
        }
    };
}

Workspace.prototype._onMouseMove = function(){
    var self = this;
    return function(e){
        var point = getPointInElement(self._canvas, e.clientX, e.clientY);
        if(self._dragged){
            self._dragged._posX = point.x;
            self._dragged._posY = point.y;
            self.draw();
        }
    };
}

Workspace.prototype._onMouseUp = function(){
    var self = this;
    return function(e){
        if(self._dragged){
            self._dragged = null;
        }
    };
}

Workspace.prototype.init = function(canvas){
    this._canvas = canvas;
    this._canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
    this._canvas.addEventListener('dblclick', this._onDoubleClick());
    this._canvas.addEventListener('mousedown', this._onMouseDown());
    this._canvas.addEventListener('mousemove', this._onMouseMove());
    this._canvas.addEventListener('mouseup', this._onMouseUp());
    this._context = canvas.getContext('2d', { alpha: false });
    this._context.fillStyle = '#000000';
    this.clear();
}

Workspace.prototype.clear = function(){
    this._guard();
    this._context.save();
    this._context.fillStyle = '#FFFFFF'
    this._context.fillRect(0,0,canvas.width,canvas.height);
    this._context.restore();
}

Workspace.prototype.add = function(drawable){
    this._guard();
    if(drawable.draw instanceof Function){
        this._drawables.push(drawable);
        drawable.draw(this._context);
    }
}

Workspace.prototype.draw = function(){
    var length = this._drawables.length;
    this.clear();
    for(var i = 0; i < length; i++){
        this._drawables[i].draw(this._context);
    }
}

// ----------------- STATE -----------------

function State(x,y){
    this._radius = 50;
    this._posX = x === undefined ? this._radius : x;
    this._posY = y === undefined ? this._radius : y;
}

State.prototype.draw = function(context){
    context.beginPath();
    context.arc(this._posX, this._posY, this._radius, 0, 2 * Math.PI);
    context.stroke();
}

State.prototype.contains = function(x, y){
    return x >= this._posX - this._radius
        && x <= this._posX + this._radius
        && y >= this._posY - this._radius
        && y <= this._posY + this._radius
}