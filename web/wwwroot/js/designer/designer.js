window.onload = function () {
    var workspace = new Workspace();
    workspace.init(document.getElementById('canvas'));

    document.getElementById('addState').onclick = function () {
        var state = new State();
        workspace.add(state);
    }
}

function Workspace(){
    // Private members
    this._drawables = [];
    this._canvas;
    this._context;

    // Public members
}

Workspace.prototype.init = function(canvas){
    this._canvas = canvas;
    this._canvas.addEventListener();
    this._context = canvas.getContext('2d', { alpha: false });
    this._context.fillStyle = '#000000';
    this.clear();
}

Workspace.prototype.guard = function(){
    if(!this._canvas){
        throw new Error('Workspace is not initialized');
    }
}

Workspace.prototype.clear = function(){
    this.guard();
    this._context.save();
    this._context.fillStyle = '#FFFFFF'
    this._context.fillRect(0,0,canvas.width,canvas.height);
    this._context.restore();
}

Workspace.prototype.add = function(drawable){
    this.guard();
    if(drawable.draw instanceof Function){
        this._drawables.push(drawable);
        drawable.draw(this._context);
    }
}

Workspace.prototype.draw = function(){
    var length = this._drawables.length;
    this.clear();
    for(var i = 0; i < length; i++){
        _drawables[i].draw(this._context);
    }
}

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