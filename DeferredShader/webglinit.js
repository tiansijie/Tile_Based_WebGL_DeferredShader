var message = document.getElementById("message");
var canvas = document.getElementById("canvas");
var gl = createWebGLContext(canvas, message);
if (!gl) {
    alert("No WebGL Supported on Your Browser");
}

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);

console.log(canvas.width + " " + canvas.height);

var near = 0.1;
var far = 3000.0;

var persp = mat4.create();
mat4.perspective(45.0, canvas.width/canvas.height, near, far, persp);

var display_depth = 0;
var display_normal = 1;
var display_position = 2;
var display_color = 3;
var display_total = 4;
var display_light = 5;
var display_nontilelight = 6;
var display_ink = 7;
var display_debugtile = 8;

//var model;
//var mv;
var invTrans;

var radius = 100.0;
var azimuth = Math.PI;
var elevation = 0.0001;


function sphericalToCartesian( r, a, e ) {
    var x = r * Math.cos(e) * Math.cos(a);
    var y = r * Math.sin(e);
    var z = r * Math.cos(e) * Math.sin(a);

    return [x,y,z];
}

//camera
var eye = sphericalToCartesian(radius, azimuth, elevation);
var center = [0.0, 0.0, 0.0];
var eyedis = 1.0;
var cam_dir = vec3.normalize(vec3.create([center[0]-eye[0], center[1]-eye[1], center[2]-eye[2]]));    
var up = [0.0, 1.0, 0.0];
var view = mat4.create();
mat4.lookAt(eye, center, up, view);

var viewVector = cam_dir;

//For tile base lighting
var tileSize = 32;
var tileWidth = Math.floor(canvas.width / tileSize);
var tileHeight = Math.floor(canvas.height/tileSize);
var numTile = tileWidth * tileHeight;


var lights = [];
var lightVel = [];
var lightAccel = [];
var lightPosition = [];
var lightColorRadius = [];
var lightGrid = [];
var lightIndex = [];
var lightNum = 200;//Light numbers
