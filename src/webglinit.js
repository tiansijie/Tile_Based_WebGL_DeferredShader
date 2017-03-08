var message = document.getElementById("message");
var canvas = document.getElementById("canvas");
var gl = createWebGLContext(canvas, message);
if (!gl) {
    alert("No WebGL Supported on Your Browser");
}
resizeCanvas(gl);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);

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
var display_scissor = -1;

var invTrans = mat4.create();

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
var center = [0.0, 3.0, 0.0];
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
var lightNum = 240;//Light numbers
document.getElementById(
  "helpmode"
).innerHTML = "Tile Based Deferred Shading";


var positionLocation;
var normalLocation;
var texCoordLocation;
var u_textureLocation;

var u_InvTransLocation;
var u_ModelLocation;
var u_ViewLocation;
var u_PerspLocation;
var u_CameraSpaceDirLightLocation;
var u_ColorSamplerLocation;
var u_Drawmode;

var positionLocationdepth;
var normalLocationdepth;
var u_InvTransLocationdepth;
var u_ModelLocationdepth;
var u_ViewLocationdepth;
var u_PerspLocationdepth;
var u_CameraSpaceDirLightLocationdepth;
var u_ColorSamplerLocationdepth;

var u_DisplayTypeLocation;
var u_NearLocation;
var u_FarLocation;
var u_DepthtexLocation;
var u_NormaltexLocation;
var u_PositiontexLocation;
var u_ColortexLocation;

var quad_positionLocation = 0;
var quad_texCoordLocation = 1;

var u_TileSizeLocation;
var u_LightNumLocation;
var u_WidthTileLocation;
var u_HeightTileLocation;
var u_MaxTileLightNumLocation;
var u_LightGridtexLocation;
var u_LightIndexImageSizeLocation;
var u_FloatLightIndexSizeLocation;
var u_LightIndextexLocation;
var u_LightPositiontexLocation;
var u_LightColorRadiustexLocation;

var nonLightLoc_Light;
var nonLightLoc_LightColor;

var ambientLoc_Light;

var diagnosticLoc_Light;

var diagnosticLocs = [];
var ambientLocs = [];
var lightLocs = [];
var nonlightLocs = [];
var edgeLocs = [];

var edgeLoc_Light;
var edgeLoc_Quatcolorsampler;

var strokeLoc_Width;
var strokeLoc_Height;
var strokeLoc_SilColorSample;

var strokeblurLoc_Width;
var strokeblurLoc_Height;
var strokeblurLoc_StrokeSample;

var spatterLoc_Displaytype;
var spatterLoc_Width;
var spatterLoc_Height;
var spatterLoc_QuatColorSampler;

var postLoc_Displaytype;
var postLoc_Width;
var postLoc_Height;
var postLoc_Possttex;
var postLoc_StrokeBlurtex;

var isLoadingComplete = false;


var isDeferredshading = true;


var f_positionLocation;
var f_normalLocation;
var f_texCoordLocation;
var u_f_textureLocation;
var u_f_ModelLocation;
var u_f_ViewLocation;
var u_f_PerspLocation;
var u_f_InvTransLocation;
var u_f_ColorSamplerLocation;
var u_f_lightPos;
var u_f_lightColor;
var u_f_lightRadius;
var u_f_ambientLightLoc;
var u_f_drawmodeLoc;
