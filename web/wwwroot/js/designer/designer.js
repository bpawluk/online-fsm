window.onload = function(){
    var canvas = document.getElementById('canvas');
    var button = document.getElementById('addState');
    var ctx = canvas.getContext('2d');
    var lastPos = 5;
    button.onclick = function(){
        ctx.beginPath();
        ctx.arc(lastPos, lastPos, 5, 0, 2 * Math.PI);
        ctx.stroke();
        lastPos = lastPos + 10
    }
}