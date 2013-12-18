(function() {

	function sphericalToCartesian( r, a, e ) {
        var x = r * Math.cos(e) * Math.cos(a);
        var y = r * Math.sin(e);
        var z = r * Math.cos(e) * Math.sin(a);

        return [x,y,z];
    }


	var NUM_WIDTH_PTS = 30;
    var NUM_HEIGHT_PTS = 30;

    var message = document.getElementById("message");
    var canvas = document.getElementById("canvas");
    var gl = createWebGLContext(canvas, message);
    if (!gl) {
        return;
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
    var lightPosition = [];
    var lightColorRadius = [];
    var lightGrid = [];
    var lightIndex = [];
    var lightNum = 200;   


    var positionLocation;
    var normalLocation;
    var texCoordLocation;
    var u_InvTransLocation;
    var u_ModelLocation;
    var u_ViewLocation;
    var u_PerspLocation;
    var u_CameraSpaceDirLightLocation;
    var u_ColorSamplerLocation;

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

    var siledge_positionLocation;

    //difererent shaders
    var pass_prog;
    var depth_prog;
    var diagnostic_prog;
    var light_prog;
    var nontilelight_prog;
    var ambient_prog;
    var post_prog;
    var spatter_prog;
    var siledge_prog;
    var silcull_prog;
    var stroke_prog;
    var strokeblur_prog;
    var edge_prog;

    var ext = null;

    function initializeShader() {

        //for extension 
    	ext = gl.getExtension("WEBGL_draw_buffers");
        if (!ext) {
            return alert("You need WebGL Draw Buffer Extension by turning on 'Enable WebGL Draft Extensions' on your web browser. Chrome keys in chrome://flags. Firefox keys in about:config.");
            //console.log("No WEBGL_draw_buffers support -- this is legal");
        } else {
            console.log("Successfully enabled WEBGL_draw_buffers extension");
        }

        //First shader
        var vs = getShaderSource(document.getElementById("pass_vs"));
        var fs = getShaderSource(document.getElementById("pass_fs"));

        pass_prog = createProgram(gl, vs, fs, message);    

        if (!gl.getProgramParameter(pass_prog, gl.LINK_STATUS)) {
            alert("Could not initialise pass_fs");
        }

        positionLocation = gl.getAttribLocation(pass_prog, "Position");
        normalLocation = gl.getAttribLocation(pass_prog, "Normal");
        //texCoordLocation = gl.getAttribLocation(pass_prog, "Texcoord");

        u_ModelLocation = gl.getUniformLocation(pass_prog,"u_Model");
        u_ViewLocation = gl.getUniformLocation(pass_prog,"u_View");
        u_PerspLocation = gl.getUniformLocation(pass_prog,"u_Persp");
        u_InvTransLocation = gl.getUniformLocation(pass_prog,"u_InvTrans");
        u_ColorSamplerLocation = gl.getUniformLocation(pass_prog,"u_ColorSampler");

        //Second shaders
    	vs = getShaderSource(document.getElementById("shade_vs"));
    	fs = getShaderSource(document.getElementById("diagnostic_fs"));
    	
    	diagnostic_prog = createProgram(gl, vs, fs, message);
    	gl.bindAttribLocation(diagnostic_prog, quad_positionLocation, "Position");
    	gl.bindAttribLocation(diagnostic_prog, quad_texCoordLocation, "Texcoord");
    	
    	if (!gl.getProgramParameter(diagnostic_prog, gl.LINK_STATUS)) {
            alert("Could not initialise diagnostic_fs");
        }

    	vs = getShaderSource(document.getElementById("shade_vs"));
    	fs = getShaderSource(document.getElementById("ambient_fs"));
    	
    	ambient_prog = createProgram(gl, vs, fs, message);
    	gl.bindAttribLocation(ambient_prog, quad_positionLocation, "Position");
    	gl.bindAttribLocation(ambient_prog, quad_texCoordLocation, "Texcoord");
    	
    	if (!gl.getProgramParameter(ambient_prog, gl.LINK_STATUS)) {
            alert("Could not initialise ambient_fs");
        }

        vs = getShaderSource(document.getElementById("shade_vs"));
        fs = getShaderSource(document.getElementById("edgefs"));
        
        edge_prog = createProgram(gl, vs, fs, message);
        gl.bindAttribLocation(edge_prog, quad_positionLocation, "Position");
        gl.bindAttribLocation(edge_prog, quad_texCoordLocation, "Texcoord");
        
        if (!gl.getProgramParameter(edge_prog, gl.LINK_STATUS)) {
            alert("Could not initialise edgefs");
        }

        vs = getShaderSource(document.getElementById("shade_vs"));
        fs = getShaderSource(document.getElementById("light_fs"));
        
        light_prog = createProgram(gl, vs, fs, message);
        gl.bindAttribLocation(diagnostic_prog, quad_positionLocation, "Position");
        gl.bindAttribLocation(diagnostic_prog, quad_texCoordLocation, "Texcoord");
        
        if (!gl.getProgramParameter(diagnostic_prog, gl.LINK_STATUS)) {
            alert("Could not initialise light_fs");
        }

        vs = getShaderSource(document.getElementById("shade_vs"));
        fs = getShaderSource(document.getElementById("nontilelight_fs"));
        
        nontilelight_prog = createProgram(gl, vs, fs, message);
        gl.bindAttribLocation(nontilelight_prog, quad_positionLocation, "Position");
        gl.bindAttribLocation(nontilelight_prog, quad_texCoordLocation, "Texcoord");
        
        if (!gl.getProgramParameter(nontilelight_prog, gl.LINK_STATUS)) {
            alert("Could not initialise nontilelight_fs");
        }

        //Third shader
    	vs = getShaderSource(document.getElementById("post_vs"));
    	fs = getShaderSource(document.getElementById("post_fs"));
    
    	post_prog = createProgram(gl, vs, fs, message);
    	gl.bindAttribLocation(post_prog, quad_positionLocation, "Position");
    	gl.bindAttribLocation(post_prog, quad_texCoordLocation, "Texcoord");

    	if (!gl.getProgramParameter(post_prog, gl.LINK_STATUS)) {
            alert("Could not initialise post_fs");
        }

        //Spatter Shader
        vs = getShaderSource(document.getElementById("post_vs"));
        fs = getShaderSource(document.getElementById("spatterfs"));
    
        spatter_prog = createProgram(gl, vs, fs, message);
        gl.bindAttribLocation(spatter_prog, quad_positionLocation, "Position");
        gl.bindAttribLocation(spatter_prog, quad_texCoordLocation, "Texcoord");

        if (!gl.getProgramParameter(spatter_prog, gl.LINK_STATUS)) {
            alert("Could not initialise spatter_prog");
        }    	


        //Sil Shader
        vs = getShaderSource(document.getElementById("siledgevs"));
        fs = getShaderSource(document.getElementById("siledgefs"));
    
        siledge_prog = createProgram(gl, vs, fs, message);
        siledge_prog.positionLocation = gl.getAttribLocation(siledge_prog, "Position");

        siledge_prog.u_ModelLocation = gl.getUniformLocation(siledge_prog,"u_Model");
        siledge_prog.u_ViewLocation = gl.getUniformLocation(siledge_prog,"u_View");
        siledge_prog.u_PerspLocation = gl.getUniformLocation(siledge_prog,"u_Persp");
        siledge_prog.u_InvTransLocation = gl.getUniformLocation(siledge_prog,"u_InvTrans");

        if (!gl.getProgramParameter(siledge_prog, gl.LINK_STATUS)) {
            alert("Could not initialise siledge_prog");
        }


        //silCullfs Shader
        vs = getShaderSource(document.getElementById("shade_vs"));
        fs = getShaderSource(document.getElementById("silCullfs"));
    
        silcull_prog = createProgram(gl, vs, fs, message);
        gl.bindAttribLocation(silcull_prog, quad_positionLocation, "Position");
        gl.bindAttribLocation(silcull_prog, quad_texCoordLocation, "Texcoord");

        if (!gl.getProgramParameter(silcull_prog, gl.LINK_STATUS)) {
            alert("Could not initialise silcull_prog");
        }    


         //stroke Shader
        vs = getShaderSource(document.getElementById("shade_vs"));
        fs = getShaderSource(document.getElementById("strokefs"));
    
        stroke_prog = createProgram(gl, vs, fs, message);
        gl.bindAttribLocation(stroke_prog, quad_positionLocation, "Position");
        gl.bindAttribLocation(stroke_prog, quad_texCoordLocation, "Texcoord");

        if (!gl.getProgramParameter(stroke_prog, gl.LINK_STATUS)) {
            alert("Could not initialise stroke_prog");
        }                  


         //stroke blur Shader
        vs = getShaderSource(document.getElementById("shade_vs"));
        fs = getShaderSource(document.getElementById("strokeblurfs"));
    
        strokeblur_prog = createProgram(gl, vs, fs, message);
        gl.bindAttribLocation(strokeblur_prog, quad_positionLocation, "Position");
        gl.bindAttribLocation(strokeblur_prog, quad_texCoordLocation, "Texcoord");

        if (!gl.getProgramParameter(strokeblur_prog, gl.LINK_STATUS)) {
            alert("Could not initialise stroke_prog");
        }          
	}




	var depthTexture = gl.createTexture();
	var normalTexture = gl.createTexture();
	var positionTexture = gl.createTexture();
	var colorTexture = gl.createTexture();
	var postTexture = gl.createTexture();
    var depthRGBTexture = gl.createTexture();
    var spatterTexture = gl.createTexture();

    var silcolorTexture = gl.createTexture();
    var sildepthTexture = gl.createTexture();

    var silCullTexture = gl.createTexture();

    var strokeTexture = gl.createTexture();

    var edgeTexture = gl.createTexture();

    var strokeblurTexture = gl.createTexture();

	var FBO = [];


	//from extension file
	function makeArray(size, value) {
	  var array = []
	  for (var ii = 0; ii < size; ++ii) {
	    array.push(value);
	  }
	  return array;
	}

	function makeColorAttachmentArray(size) {
      var array = []
      for (var ii = 0; ii < size; ++ii) {
        array.push(gl.COLOR_ATTACHMENT0 + ii);
      }
      return array;
    }

    var depthFrameBuffer;

	function initializeFBO() {

		console.log("initFBO");

		gl.getExtension("OES_texture_float");
        gl.getExtension("OES_texture_float_linear");
        var extDepth = gl.getExtension("WEBGL_depth_texture");

        if(!extDepth)
        	console.log("Extension Depth buffer is not working");


        //Geometry Frame Buffer
		gl.bindTexture(gl.TEXTURE_2D, depthTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, canvas.width, canvas.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);


		gl.bindTexture(gl.TEXTURE_2D, normalTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);


        gl.bindTexture(gl.TEXTURE_2D, positionTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);
        

        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);


        gl.bindTexture(gl.TEXTURE_2D, depthRGBTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

        FBO[0] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[0]);
        var maxDrawingBuffers = gl.getParameter(ext.MAX_DRAW_BUFFERS_WEBGL);
  		var maxColorAttachments = gl.getParameter(ext.MAX_COLOR_ATTACHMENTS_WEBGL);
  		var bufs = makeColorAttachmentArray(maxDrawingBuffers);
  		bufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
    	bufs[1] = ext.COLOR_ATTACHMENT1_WEBGL;
    	bufs[2] = ext.COLOR_ATTACHMENT2_WEBGL;
        bufs[3] = ext.COLOR_ATTACHMENT3_WEBGL;
    	ext.drawBuffersWEBGL(bufs);

		gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, depthRGBTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[0], gl.TEXTURE_2D, depthRGBTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[1], gl.TEXTURE_2D, normalTexture, 0);
    	gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[2], gl.TEXTURE_2D, positionTexture, 0);    
    	gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[3], gl.TEXTURE_2D, colorTexture, 0);    


    	var FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    	if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
        	console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[0]\n");        	
    	}    	


        //Spatter Frame Buffer
        gl.bindTexture(gl.TEXTURE_2D, spatterTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);


        FBO[1] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[1]);
        //gl.renderbufferStorage(gl.FRAMEBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
        var spatterbufs = makeColorAttachmentArray(maxDrawingBuffers);
        spatterbufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
        ext.drawBuffersWEBGL(spatterbufs);

        gl.bindTexture(gl.TEXTURE_2D, spatterTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, spatterbufs[0], gl.TEXTURE_2D, spatterTexture, 0);

        FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
            console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[1]\n");         
        }

        //Post Frame Buffer
        gl.bindTexture(gl.TEXTURE_2D, postTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

        FBO[2] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[2]);
        var postbufs = makeColorAttachmentArray(maxDrawingBuffers);
        postbufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
        ext.drawBuffersWEBGL(postbufs);

        gl.bindTexture(gl.TEXTURE_2D, postTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, postbufs[0], gl.TEXTURE_2D, postTexture, 0);

        FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
            console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[2]\n");        
        }

        //Sil Frame Buffer

        gl.bindTexture(gl.TEXTURE_2D, silcolorTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

        gl.bindTexture(gl.TEXTURE_2D, sildepthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

        FBO[3] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[3]);
        var silbufs = makeColorAttachmentArray(maxDrawingBuffers);
        silbufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
        silbufs[1] = ext.COLOR_ATTACHMENT1_WEBGL;
        ext.drawBuffersWEBGL(silbufs);

        gl.bindTexture(gl.TEXTURE_2D, silcolorTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, silbufs[0], gl.TEXTURE_2D, silcolorTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, sildepthTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, silbufs[1], gl.TEXTURE_2D, sildepthTexture, 0);

        FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
            console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[3]\n");        
        }


        //Stroke Frame buffer //Edge Texture Frame Buffer
        gl.bindTexture(gl.TEXTURE_2D, silCullTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

        FBO[4] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[4]);
        var sillCullbufs = makeColorAttachmentArray(maxDrawingBuffers);
        sillCullbufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
        ext.drawBuffersWEBGL(sillCullbufs);

        gl.bindTexture(gl.TEXTURE_2D, silCullTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, sillCullbufs[0], gl.TEXTURE_2D, silCullTexture, 0);

        FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
            console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[4]\n");        
        }


         //Stroke Blur Frame buffer
        gl.bindTexture(gl.TEXTURE_2D, strokeTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

        FBO[5] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[5]);
        var strokeblurbufs = makeColorAttachmentArray(maxDrawingBuffers);
        strokeblurbufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
        ext.drawBuffersWEBGL(strokeblurbufs);

        gl.bindTexture(gl.TEXTURE_2D, strokeTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, strokeblurbufs[0], gl.TEXTURE_2D, strokeTexture, 0);

        FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
            console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[5]\n");        
        }


        gl.bindTexture(gl.TEXTURE_2D, strokeblurTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

        FBO[6] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[6]);
        var blurbufs = makeColorAttachmentArray(maxDrawingBuffers);
        blurbufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
        ext.drawBuffersWEBGL(blurbufs);

        gl.bindTexture(gl.TEXTURE_2D, strokeblurTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, blurbufs[0], gl.TEXTURE_2D, strokeblurTexture, 0);

        FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
            console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[6]\n");        
        }


        gl.bindTexture(gl.TEXTURE_2D, edgeTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

        FBO[7] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[7]);
        var edgebufs = makeColorAttachmentArray(maxDrawingBuffers);
        edgebufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
        ext.drawBuffersWEBGL(blurbufs);

        gl.bindTexture(gl.TEXTURE_2D, edgeTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, edgebufs[0], gl.TEXTURE_2D, edgeTexture, 0);

        FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
            console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[7]\n");        
        }


    	gl.clear(gl.DEPTH_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

    


    //OBJ
    var meshes = [];    
    var models = [];
   

     function setmodelMatrix()
    {
        //var meshNum = meshes.length;
        //console.log("mesh number : "+ meshNum);   

        var matrix = mat4.create();
        mat4.identity(matrix);
        //mat4.scale(matrix,[0.01,0.01,0.01]); 
        //mat4.scale(matrix,[0.1,0.1,0.1]); 
        //mat4.scale(matrix,[2,2,2]); 
        //mat4.translate(matrix,[0,0,0]);       
        models.push(matrix);
    }


    var meshVertices = [];//new Float32Array();
    var meshNormals = [];//new Float32Array();
    var meshIndex = [];//new Uint16Array();

    //ADD
    var meshisFrontFace = [];
    var meshedges = []; // store edge vertex indices 3,5 // connect vertex 3 and vertex 5
    var meshedgefaces = []; //stroe each edge's face list  1,3 // connect face 1 and face 3
    var meshfacenormals = [];

    var bufferVertices = [];
    var bufferIndex = [];

    var vertexBuffer;
    var normalBuffer;
    var indexBuffer;

    var vBuffers = [];
    var nBuffers = [];
    var iBuffers = [];
    

    //ADD
    var iLens = [];

    var silEdgeMeshes;
    // var silvBuffers = [];
    // var siliBuffers = [];
    var silEdgeMeshesvbo;
    var silEdgeMeshesibo;
    var silEdgeMeshescbo = [];



    var bufferVertices = [];
    var bufferIndex = [];

    var vertexBuffer;
    var normalBuffer;
    var indexBuffer;

    var vBuffers = [];
    var nBuffers = [];
    var iBuffers = [];
    var uBuffers = [];

    var iLens = [];

    var meshNum = 0;


    function getSilEdges(edgefacesArray, edgesArray,verticesArray)
    {
       
        var edgeVerts = [];
        var edgeindices = [];        
        var verNum = 0;
       

        for(var idx = 0; idx < edgesArray.length;++idx){
            //console.log(mesh.edgeArray[idx]);           
            var edgefaces = edgefacesArray[idx];
           // console.log(edgefaces);
            if((meshisFrontFace[edgefaces[0]] == 0 && meshisFrontFace[edgefaces[1]] == 1)
                ||(meshisFrontFace[edgefaces[0]] == 1 && meshisFrontFace[edgefaces[1]] == 0))
            {
                //console.log("sil edge " + mesh.edgeArray[idx]);
                var veridx = [edgesArray[idx][0],edgesArray[idx][1]];
                var ver1 = vec4.create(
                                    [verticesArray[veridx[0]*3],
                                    verticesArray[veridx[0]*3+1],
                                    verticesArray[veridx[0]*3+2],
                                    1.0]
                                    );
              
                var ver2 = vec4.create(
                                    [verticesArray[veridx[1]*3],
                                    verticesArray[veridx[1]*3+1],
                                    verticesArray[veridx[1]*3+2],
                                    1.0 ]                               
                                    );
              

                edgeVerts.push(verticesArray[veridx[0]*3]); 
                edgeVerts.push(verticesArray[veridx[0]*3+1]); 
                edgeVerts.push(verticesArray[veridx[0]*3+2]);
                // edgecolor.push(1.0); edgecolor.push(1.0); edgecolor.push(0.0);
                edgeindices.push(verNum);
                verNum ++;
           
                edgeVerts.push(verticesArray[veridx[1]*3]); 
                edgeVerts.push(verticesArray[veridx[1]*3+1]); 
                edgeVerts.push(verticesArray[veridx[1]*3+2]);
                edgeindices.push(verNum);
                verNum ++;              
                // edgecolor.push(1.0); edgecolor.push(1.0); edgecolor.push(0.0);
                //group of each edge

                // edgegroup.push(0);
            }
        }
        silEdgeMeshesvbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,silEdgeMeshesvbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edgeVerts), gl.STATIC_DRAW);
        silEdgeMeshesvbo.itemSize = 3;
        silEdgeMeshesvbo.numItems = edgeVerts.length/3;
       
        // silEdgeMeshescbo = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER,silEdgeMeshescbo);
        // gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(edgecolor),gl.STATIC_DRAW);
        // silEdgeMeshescbo.itemSize = 3;
        //console.log("edgecolor length: " + edgecolor.length);
        // silEdgeMeshescbo.numItems = edgecolor.length/3;

        silEdgeMeshesibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,silEdgeMeshesibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(edgeindices),gl.STATIC_DRAW);
        silEdgeMeshesibo.itemSize = 1;
        //console.log("edgeindices length: " + edgeindices.length);
        silEdgeMeshesibo.numItems = edgeindices.length;
        //console.log(edgeindices);
        console.log("edge indices len: " + edgeindices.length);
    }

    function drawSilhouette()
    {
        if(silEdgeMeshesvbo != undefined){
            gl.useProgram(siledge_prog);
            gl.enable(gl.DEPTH_TEST);

            gl.viewport(0,0,gl.canvas.width,canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            //mat4.perspective(45.0,canvas.width/canvas.height,near,far.0,persp);

            var idx = 0;

            var mv = mat4.create();
            mat4.multiply(view, models[idx], mv);


            inverse = mat4.create();
            mat4.identity(inverse);
            mat4.inverse(mv, inverse);
            mat4.transpose(inverse);

            //gl.uniform1i(shaderProgram[2].drawmode,drawmode);

            // var colors = vec3.create([0.0,0.0,0.0]);
            // gl.uniform3fv(shaderProgram[2].colorUniform,colors);
            gl.enableVertexAttribArray(siledge_prog.positionLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER,silEdgeMeshesvbo);             
            gl.vertexAttribPointer(siledge_prog.positionLocation, silEdgeMeshesvbo.itemSize,gl.FLOAT, false,0,0);

            // gl.bindBuffer(gl.ARRAY_BUFFER,silEdgeMeshescbo);
            // gl.vertexAttribPointer(shaderProgram[2].vertexColorAttribute,silEdgeMeshescbo.itemSize,gl.FLOAT,false,0,0);

                  

            gl.uniformMatrix4fv(siledge_prog.u_ModelLocation,false,models[idx]);
            gl.uniformMatrix4fv(siledge_prog.u_ViewLocation,false, view);
            gl.uniformMatrix4fv(siledge_prog.u_PerspLocation,false,persp);
            gl.uniformMatrix4fv(siledge_prog.u_InvTransLocation,false,inverse);       

            // gl.activeTexture(gl.TEXTURE0);
            // gl.bindTexture(gl.TEXTURE_2D, rttTextures[0]);
            // gl.uniform1i(shaderProgram[2].depthsampler,0);

            // var reso = vec2.create(gl.viewportWidth,gl.viewportHeight);
            // gl.uniform2fv(shaderProgram[2].resolution,reso);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, silEdgeMeshesibo);
            gl.drawElements(gl.LINES, silEdgeMeshesibo.numItems, gl.UNSIGNED_SHORT,0);
            //gl.bindTexture(gl.TEXTURE_2D,null);
        }

        //gl.bindTexture(gl.TEXTURE_2D,rttTextures[drawmode+4]);
        //gl.bindTexture(gl.TEXTURE_2D,null);
    }


 function updateFaceInfo(facenormals,model,isfrontfaces,meshedgefaces,meshedges,meshVertices)
    {
        // Converting viewVector to object space
        console.log("updateFaceInfo ...");

        var modelV = mat4.create(model);
        modelV[12] = 0;
        modelV[13] = 0;
        modelV[14] = 0;
        //console.log(modelV);
        var viewVector_objecspace = vec4.create();
        var inverseModelV = mat4.create();
        mat4.inverse(modelV,inverseModelV);
        var viewVectorve4 = vec4.create([viewVector[0],viewVector[1],viewVector[2],1.0]);
        mat4.multiplyVec4(inverseModelV,viewVectorve4,viewVector_objecspace);
        //console.log(viewVector_objecspace);
        //console.log(" front face:" + facenormals.length/3);
        for(var i = 0; i<facenormals.length/3; ++i)
        {           

            //object face normal in object space   
            var norm = vec3.create([facenormals[i*3],facenormals[i*3+1],facenormals[i*3+2]]);

            var dots = vec3.dot(vec3.create(viewVector_objecspace),norm);
            //console.log(dots);
            if(dots <= 0)
            {
                isfrontfaces[i] = 1;
                //console.log("front")
            }
            else
            {
                isfrontfaces[i] = 0;
                //console.log("back");
            }
        }
        getSilEdges(meshedgefaces,meshedges,meshVertices);
    }

 function initMeshBuffers()
    {
        setmodelMatrix();

        var loader = new THREE.OBJLoader();
        //var loader = new THREE.OBJMTLLoader();

        //ADD
        hashedges = {};
        var edgeidx = 0;

        //address for obj
        //loader.load( 'http://127.0.0.1:8089/OBJ/sibenik/sibenik.obj', 'http://127.0.0.1:8089/OBJ/sibenik/sibenik.mtl', function ( event ) {
        loader.load( 'http://127.0.0.1:8089/OBJ/sibenik.obj', function ( event ) {
            var object = event;

            console.log("children " + object.children.length);


            object.traverse( function ( child ) {
              if ( child instanceof THREE.Mesh ) {

                var lenVertices = child.geometry.vertices.length;
                var lenFaces = child.geometry.faces.length;
                var lenNor = child.geometry.skinIndices.length;  

                console.log ("Len Vertices " + lenVertices);
                console.log ("Len Faces " + lenFaces);
                console.log ("Len Nor " + lenNor);

                for(var i = 0; i < lenVertices; i++)
                {
                    meshVertices[i*3] = (child.geometry.vertices[i].x);
                    meshVertices[i*3+1] = (child.geometry.vertices[i].y);
                    meshVertices[i*3+2] = (child.geometry.vertices[i].z);
                }

                 //console.log("Face normal " + child.geometry.faces[0].vertexNormals);                
                 var point = 0;
                for(var i = 0; i < lenFaces; i++)
                {
                    var indexa = child.geometry.faces[i].a;
                    var indexb = child.geometry.faces[i].b;
                    var indexc = child.geometry.faces[i].c;                 

                    bufferVertices.push(meshVertices[indexa*3]);
                    bufferVertices.push(meshVertices[indexa*3+1]);
                    bufferVertices.push(meshVertices[indexa*3+2]);

                    bufferVertices.push(meshVertices[indexb*3]);
                    bufferVertices.push(meshVertices[indexb*3+1]);
                    bufferVertices.push(meshVertices[indexb*3+2]);

                    bufferVertices.push(meshVertices[indexc*3]);
                    bufferVertices.push(meshVertices[indexc*3+1]);
                    bufferVertices.push(meshVertices[indexc*3+2]);        
                    
                    meshfacenormals.push(child.geometry.faces[i].normal.x);
                    meshfacenormals.push(child.geometry.faces[i].normal.y);
                    meshfacenormals.push(child.geometry.faces[i].normal.z);

                    for(var j = 0; j < 3; j++){                       
                        meshNormals.push(child.geometry.faces[i].normal.x);
                        meshNormals.push(child.geometry.faces[i].normal.y);
                        meshNormals.push(child.geometry.faces[i].normal.z);
                    }

                    //ADD initialize front face buffer
                    meshisFrontFace.push(0);
                    // add to edge list
                    var es = [];
                    es.push([indexa,indexb]);
                    es.push([indexb,indexc]);
                    es.push([indexc,indexa]);


                    for(var idx = 0; idx <3; idx ++)
                    {
                      var inverses = [es[idx][1],es[idx][0]];
                      if(es[idx] in hashedges || inverses in hashedges)
                      {
                        //console.log(es[idx] + "  " + inverses);
                        if(es[idx] in hashedges)
                        {
                          //console.log("exist " + packed.edgefaces[packed.hashedges[es[idx]]]);
                          meshedgefaces[hashedges[es[idx]]].push(i);
                        }
                        else
                        {
                          //console.log("exist " + packed.edgefaces[packed.hashedges[inverses]]);
                          meshedgefaces[hashedges[inverses]].push(i);
                          //console.log(packed.hashedges[inverses] + " : "+ packed.edgefaces[packed.hashedges[inverses]]);
                        }
                        continue;
                      }
                      else
                      {
                        hashedges[es[idx]] = edgeidx;

                        //console.log(packed.hashedges);
                        meshedges.push(es[idx]);
                        //console.log("edge : " + es[idx] + " edge idx: " + packed.hashedges[es[idx]]);                        
                        meshedgefaces[edgeidx] = [];
                        meshedgefaces[edgeidx].push(i);
                        
                        edgeidx ++;
                      }
                      //console.log(packed.edgefaces[1]);
                    }



                    meshIndex.push(point++);
                    meshIndex.push(point++);
                    meshIndex.push(point++);


                    //I hate Javascript
                    if(meshIndex.length > 64000)
                    {
                        //console.log("meshIndex > 64000");
                        vertexBuffer = gl.createBuffer();
                        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferVertices), gl.STATIC_DRAW);
                        // gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);  
                        // gl.enableVertexAttribArray(positionLocation);
                        vertexBuffer.numItems = bufferVertices.length / 3;
                        vBuffers.push(vertexBuffer);
                    

                        normalBuffer = gl.createBuffer();
                        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshNormals), gl.STATIC_DRAW);
                        // gl.vertexAttribPointer(normalLocation,  3, gl.FLOAT, false, 0, 0);
                        // gl.enableVertexAttribArray(normalLocation);
                        meshNormals.numItems = meshNormals.length / 3;
                        nBuffers.push(normalBuffer);


                        indexBuffer = gl.createBuffer();
                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);      
                        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshIndex), gl.STATIC_DRAW);  
                        indexBuffer.numItems = meshIndex.length;
                        iBuffers.push(indexBuffer);

                        //console.log("Index len " + meshIndex.length);
                        iLens.push(meshIndex.length);

                        point = 0;
                        bufferVertices = [];
                        meshNormals = [];
                        meshIndex = [];
                    }                       

                    

                } // end for face loop            
                // for(var mm = 0; mm<meshedges.length; mm++)
                // {
                //     console.log(meshedges[mm] + "   " + meshedgefaces[mm]);
                // }
                //console.log("edge nums: " + meshedges);
                //console.log("edge norms: " + meshedgefaces.length);
                //console.log("isfront face len: " + meshisFrontFace.length);

                vertexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferVertices), gl.STATIC_DRAW);
                vertexBuffer.numItems = bufferVertices.length / 3;
                vBuffers.push(vertexBuffer);
            

                normalBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshNormals), gl.STATIC_DRAW);
                meshNormals.numItems = meshNormals.length / 3;
                nBuffers.push(normalBuffer);   


                indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);      
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshIndex), gl.STATIC_DRAW);  
                indexBuffer.numItems = meshIndex.length;
                iBuffers.push(indexBuffer);

                //console.log("Index len " + meshIndex.length);
                iLens.push(meshIndex.length);

                // meshNum ++;   
                console.log("mehsnormals len " + meshNormals.length / 3);
                updateFaceInfo(meshfacenormals,models[0],meshisFrontFace,meshedgefaces,meshedges,meshVertices);       
              }
            } );
        });
        
      
    } // end for initmesh function


	var numberOfIndices;
	var positionsName;
	var normalsName;
	var texCoordsName;
	var indicesName;

    var device_quad = {num_indices:0};

    var vbo_vertices;    var vbo_indices;
    var vbo_textures;

    function initializeQuad() {
    	var positions = new Float32Array([
            -1.0, 1.0, 0.0,
            -1.0,-1.0,0.0,
            1.0,-1.0,0.0,
            1.0,1.0,0.0
        ]);
        // var textures = new Float32Array([
        //     0.0,1.0,
        //     0.0,0.0,
        //     1.0,0.0,
        //     1.0,1.0
        // ]);         

        var textures = new Float32Array([
            -1.0,1.0,
            -1.0,-1.0,
            1.0,-1.0,
            1.0,1.0
        ]);         
         
         var indices = [0,1,2,0,2,3];
         device_quad.num_indices = 6;

         vbo_vertices = gl.createBuffer();
         gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vertices);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        
         vbo_textures = gl.createBuffer();
         gl.bindBuffer(gl.ARRAY_BUFFER, vbo_textures);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STATIC_DRAW);
        
         vbo_indices = gl.createBuffer();
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_indices);
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);       
    }


    var time = 0;

    function setMatrixUniforms(models){
        gl.uniformMatrix4fv(u_ModelLocation,false,models);
        gl.uniformMatrix4fv(u_ViewLocation,false,view);
        gl.uniformMatrix4fv(u_PerspLocation,false,persp);
        gl.uniformMatrix4fv(u_InvTransLocation,false,invTrans);    
    }


	function drawmesh()
    {
    	gl.useProgram(pass_prog);	

        var idx = 0;
       
        for(var i = 0; i < vBuffers.length; i++){
            var mv = mat4.create();
            mat4.multiply(view, models[idx], mv);

            invTrans = mat4.create();
            mat4.identity(invTrans);
            mat4.inverse(mv, invTrans);
            mat4.transpose(invTrans);

            gl.enableVertexAttribArray(positionLocation);
            gl.enableVertexAttribArray(normalLocation);
            //gl.enableVertexAttribArray(texCoordLocation);


            var colors = vec3.create([1.0,1.0,1.0]);
            gl.uniform3fv(gl.getUniformLocation(pass_prog,"u_Color"),colors);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffers[i]);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);            

            
            gl.bindBuffer(gl.ARRAY_BUFFER, nBuffers[i]);
            gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

            // gl.bindBuffer(gl.ARRAY_BUFFER, meshes[mesh].textureBuffer);
            // gl.vertexAttribPointer(texCoordLocation,  meshes[mesh].textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffers[i]);

            setMatrixUniforms(models[idx]);
            gl.drawElements(gl.TRIANGLES, iBuffers[i].numItems, gl.UNSIGNED_SHORT, 0);

            //idx ++;
        }

        gl.disableVertexAttribArray(positionLocation);
        gl.disableVertexAttribArray(normalLocation);
        //gl.disableVertexAttribArray(texCoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }


    var display_type = 5;

    var lightGridTex = gl.createTexture();
    var lightIndexTex = gl.createTexture();
    var lightPositionTex = gl.createTexture();
    var lightColorRadiusTex = gl.createTexture();

    var lightIndexWidth, lightIndexHeight;

    function lightQuad(program)
    {
        gl.uniform1i(gl.getUniformLocation(program, "u_TileSize"), tileSize);
        gl.uniform1i(gl.getUniformLocation(program, "u_LightNum"), lightNum);
        gl.uniform1f(gl.getUniformLocation(program, "u_WidthTile"), tileWidth);
        gl.uniform1f(gl.getUniformLocation(program, "u_HeightTile"), tileHeight);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, lightGridTex); 
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tileWidth, tileHeight, 0, gl.RGB, gl.FLOAT, new Float32Array(lightGrid));       
        gl.uniform1i(gl.getUniformLocation(program, "u_LightGridtex"),4);    


        var lightIndexWidth = Math.ceil(Math.sqrt(lightIndex.length));
        
        for(var i = lightIndex.length; i < lightIndexWidth*lightIndexWidth; i++)
        {
            lightIndex.push(-1);
        }       

        gl.uniform1i(gl.getUniformLocation(program, "u_LightIndexImageSize"), lightIndexWidth);      
        gl.uniform1f(gl.getUniformLocation(program, "u_FloatLightIndexSize"), lightIndexWidth);    

        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, lightIndexTex);   
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, lightIndexWidth, lightIndexWidth, 0, gl.LUMINANCE, gl.FLOAT, new Float32Array(lightIndex));       
        gl.uniform1i(gl.getUniformLocation(program, "u_LightIndextex"),5);


        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, lightPositionTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, lightPosition.length/3, 1.0, 0, gl.RGB, gl.FLOAT, new Float32Array(lightPosition));       
        gl.uniform1i(gl.getUniformLocation(program, "u_LightPositiontex"),6);


        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, lightColorRadiusTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, lightColorRadius.length/4, 1.0, 0, gl.RGBA, gl.FLOAT, new Float32Array(lightColorRadius));
        gl.uniform1i(gl.getUniformLocation(program, "u_LightColorRadiustex"),7);
    }


  

    function setupQuad(program)
    {
    	gl.useProgram(program);
        //gl.enable(gl.BLEND);

        gl.uniform1i(gl.getUniformLocation(program, "u_DisplayType"), display_type);

        gl.uniform1f(gl.getUniformLocation(program, "u_Near"), near);
        gl.uniform1f(gl.getUniformLocation(program, "u_Far"), far);
        

        gl.uniform1f(gl.getUniformLocation(program, "u_Width"), canvas.width);
        gl.uniform1f(gl.getUniformLocation(program, "u_Height"), canvas.height); 


        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.uniform1i(gl.getUniformLocation(program, "u_Depthtex"),0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, normalTexture);
        gl.uniform1i(gl.getUniformLocation(program, "u_Normaltex"),1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, positionTexture);
        gl.uniform1i(gl.getUniformLocation(program, "u_Positiontex"),2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.uniform1i(gl.getUniformLocation(program, "u_Colortex"),3);

    }

    function setupInk(program)
    {
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, normalTexture);
        gl.uniform1i(gl.getUniformLocation(program, "u_Normaltex"),1);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, positionTexture);
        gl.uniform1i(gl.getUniformLocation(program, "u_Positiontex"),2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, inkTexture);
        gl.uniform1i(gl.getUniformLocation(program, "u_InkColortex"),3);
    }


    function drawQuad()
    {
    	gl.enableVertexAttribArray(quad_positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vertices);
        gl.vertexAttribPointer(quad_positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(quad_texCoordLocation);  
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_textures);  
        gl.vertexAttribPointer(quad_texCoordLocation, 2, gl.FLOAT, false, 0, 0); 

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_indices);   

        gl.drawElements(gl.TRIANGLES, device_quad.num_indices, gl.UNSIGNED_SHORT, 0);          

        gl.disableVertexAttribArray(quad_positionLocation);
        gl.disableVertexAttribArray(quad_texCoordLocation);
    }


     function bindFBO(buf){
        //gl.disable(gl.BLEND);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[buf]);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
    }


    function setTextures() {
        //gl.enable(gl.BLEND);
        gl.bindTexture(gl.TEXTURE_2D,null); 
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.disable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    //Light bounding box
    function getLightBoundingBox(light_pos, radius, pv, viewport, boundary)
    {
        var lx = light_pos[0];
        var ly = light_pos[1];
        var lz = light_pos[2];              
        //var dir = vec3.create([1.0,0.0,0.0]);
        
        cam_dir = vec3.normalize(vec3.create([center[0]-eye[0], center[1]-eye[1], center[2]-eye[2]]));
        var dir = cam_dir;
        var camUp = vec3.normalize(vec3.create([view[4],view[5],view[6]]));
        var camLeft = vec3.normalize(vec3.cross(camUp, cam_dir));
      
       
       
        var leftLight = vec4.create();
        var upLight = vec4.create();
        var centerLight = vec4.create();

        leftLight = mat4.multiplyVec4(pv, vec4.create([lx + radius*camLeft[0], ly + radius*camLeft[1], lz + radius*camLeft[2], 1.0]));
        upLight = mat4.multiplyVec4(pv, vec4.create([lx + radius*camUp[0], ly + radius*camUp[1], lz + radius*camUp[2], 1.0]));
        centerLight = mat4.multiplyVec4(pv, vec4.create([lx, ly, lz, 1.0]));

        leftLight = vec4.divide(leftLight,vec4.create([leftLight[3],leftLight[3],leftLight[3],leftLight[3]]));
        upLight = vec4.divide(upLight,vec4.create([upLight[3],upLight[3],upLight[3],upLight[3]]));
        centerLight = vec4.divide(centerLight,vec4.create([centerLight[3],centerLight[3],centerLight[3],centerLight[3]]));


        //console.log("Left light " + leftLight[0] + ", " + leftLight[1] + ", " + leftLight[2]);

        leftLight = mat4.multiplyVec4(viewport, leftLight);
        upLight = mat4.multiplyVec4(viewport, upLight);
        centerLight = mat4.multiplyVec4(viewport, centerLight);


        var dw = vec4.create();
        dw = vec4.length(vec4.subtract(leftLight, centerLight, dw));
        var dh = vec4.create();
        dh = vec4.length(vec4.subtract(upLight, centerLight, dh));        

        var leftx = centerLight[0] - dw;
        var bottomy = centerLight[1] - dh;
        var rightx = centerLight[0] + dw;
        var topy = centerLight[1] + dh;

        boundary.left = leftx;
        boundary.right = rightx;
        boundary.bottom = bottomy;
        boundary.top = topy;
    }

    function setNonTileLight(boundary, light_pos, radius, color)
    {        
        gl.enable(gl.SCISSOR_TEST)
        var nontilelight = vec4.create([light_pos[0], light_pos[1], light_pos[2], radius]);

        //console.log("Color is " + color[0] + color[1] + color[2]);
        gl.uniform4fv(gl.getUniformLocation(nontilelight_prog, "u_Light"), nontilelight);
        gl.uniform3fv(gl.getUniformLocation(nontilelight_prog, "u_LightColor"), color);

        var lwidth = boundary.right - boundary.left;
        var lheight = boundary.top - boundary.bottom;        

        gl.scissor(boundary.left, boundary.bottom, lwidth, lheight);
        drawQuad();
    }


    var tileLightId = new Array(numTile);

    function setLightOnTile(boundary, lightNum)
    {
        var leftTile = Math.max(Math.floor(boundary.left / tileSize), 0);
        var topTile = Math.min(Math.ceil(boundary.top / tileSize), canvas.height/tileSize);
        var rightTile = Math.min(Math.ceil(boundary.right / tileSize), canvas.width/tileSize);
        var bottomTile = Math.max(Math.floor(boundary.bottom / tileSize),0);

        for(var i = leftTile; i <= rightTile; i++)
        {
            for(var j = bottomTile; j <= topTile; j++)
            {    
                var indexId = i + j * tileWidth;
                if(indexId < numTile && indexId >= 0){
                    tileLightId[indexId].push(lightNum);                   
                }
            }
        }
    }

    function resetLights()
    {
        lightGrid.length = 0;
        lightIndex.length = 0;
    }


    var lightMove = 0.2;
    var moveTime = 0.0;
    function setUpLights(){

        resetLights();   

        //For tile base light setting
        var pv = mat4.create();
        mat4.multiply(persp, view, pv);

        var v1 = mat4.createFrom(
            canvas.width, 0, 0, 0,
            0, canvas.height, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
            );

        var v2 = mat4.createFrom(
            0.5, 0, 0, 0,
            0, 0.5, 0, 0,
            0, 0, 1, 0,
            0.5, 0.5, 0, 1
            );

        //var viewport = mat4.multiply(v1, v2);

        var viewport = mat4.createFrom(
            canvas.width/2.0,0.0,0.0,0.0,
            0.0,canvas.height/2.0,0.0,0.0,
            0.0,0.0,1.0/2.0,0.0,
            canvas.width/2.0, canvas.height/2.0, 1.0/2.0, 1.0
            );             

        
        for(var i = 0; i<numTile; i++)
            tileLightId[i] = [];

        moveTime ++;
        if(moveTime >= 20)
        {
            moveTime = 0.0;
            lightMove = -lightMove;
        }

        for(var i = 0; i < lightNum; i++){
            var boundary = {left:0, right:0, top:0, bottom:0};

            if(i%2 == 0 ){
                lights[i].position[0] += lightMove;
                lights[i].position[1] += lightMove;
                lights[i].position[2] += lightMove;
            }
            else
            {
                lights[i].position[0] -= lightMove;
                lights[i].position[1] -= lightMove;
                lights[i].position[2] -= lightMove;
            }

            var lightViewPos = vec4.create([lights[i].position[0], lights[i].position[1], lights[i].position[2], 1.0]);
            lightViewPos = mat4.multiplyVec4(view, lightViewPos);    
           
            lightPosition[i*3] = lightViewPos[0];
            lightPosition[i*3+1] = lightViewPos[1];
            lightPosition[i*3+2] = lightViewPos[2];

            getLightBoundingBox(lights[i].position, lights[i].radius, pv, viewport, boundary);


            //console.log(boundary.left + " " + boundary.right + " " + boundary.bottom + " " + boundary.top);

            // boundary.left = 0.0
            // boundary.right = 800;
            // boundary.bottom = 0;
            // boundary.top = 600;
          
            if(display_type == display_light || display_type == 0 || display_type == display_ink || display_type == display_debugtile) 
                setLightOnTile(boundary, i);
            else if(display_type == display_nontilelight){
                setNonTileLight(boundary, lightViewPos, lights[i].radius, lights[i].color);                
            }
        }
        
        if(display_type == display_light || display_type == 0 || display_type == display_ink || display_type == display_debugtile){
            var offset = 0;           

            for(var index = 0; index < numTile; index++)
            {             
                var size = tileLightId[index].length;                     

                for(var k = 0; k < size; k++)
                {
                    lightIndex.push(tileLightId[index][k]); 
                }
              
                lightGrid.push(offset);           
                lightGrid.push(size);
                lightGrid.push(0);
                
                offset += size;
            }
        }
    }


    function initLights(){

        for(var i = 0; i < lightNum; i++){
            var boundary = {left:0, right:0, top:0, bottom:0};

            var radius = 5.0;

            lights.push({position:vec3.create([20 + -40 * Math.random(), -25 + 30 * Math.random(), -5+15*Math.random()]),
                color:vec3.create([Math.random(),Math.random(),Math.random()]),radius:radius});

            //light position x y z
            lightPosition.push(lights[i].position[0]);
            lightPosition.push(lights[i].position[1]);
            lightPosition.push(lights[i].position[2]);

            lightColorRadius.push(Math.random());
            lightColorRadius.push(Math.random());
            lightColorRadius.push(Math.random());

            lightColorRadius.push(radius);
        }

    }


    function initLightsFBO()
    {
        
        //gl.useProgram(light_prog);
         var lightIndexWidth = Math.ceil(Math.sqrt(lightIndex.length));
         for(var i = lightIndex.length; i < lightIndexWidth*lightIndexWidth; i++)
        {
            lightIndex.push(-1);
        }   

        //gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, lightGridTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tileWidth, tileHeight, 0, gl.RGB, gl.FLOAT, new Float32Array(lightGrid));       
       // gl.uniform1i(gl.getUniformLocation(program, "u_LightGridtex"),4);  

        //gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, lightIndexTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, lightIndexWidth, lightIndexWidth, 0, gl.LUMINANCE, gl.FLOAT, new Float32Array(lightIndex));       
        //gl.uniform1i(gl.getUniformLocation(program, "u_LightIndextex"),5);  


        //gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, lightPositionTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, lightPosition.length/3, 1.0, 0, gl.RGB, gl.FLOAT, new Float32Array(lightPosition));       
       //gl.uniform1i(gl.getUniformLocation(program, "u_LightPositiontex"),6);


        //gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, lightColorRadiusTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, lightColorRadius.length/4, 1.0, 0, gl.RGBA, gl.FLOAT, new Float32Array(lightColorRadius));
        //gl.uniform1i(gl.getUniformLocation(program, "u_LightColorRadiustex"),7);
    }


    function keyMove(type)
    {
        var dir = vec3.normalize(vec3.create([center[0]-eye[0], center[1]-eye[1], center[2]-eye[2]]));
        var up = vec3.create([0,1,0]);
        var right = vec3.create();
        vec3.normalize(vec3.cross(dir,up, right));
        vec3.normalize(vec3.cross(right,dir, up));     

        var scale = 0.1;

        if(type == 1){
            center[0] +=  dir[0] * scale;
            center[1] +=  dir[1] * scale;
            center[2] +=  dir[2] * scale;
        }
        else if(type == 2)
        {
            center[0] -=  dir[0] * scale;
            center[1] -=  dir[1] * scale;
            center[2] -=  dir[2] * scale;
        }
        else if(type == 3)
        {
            center[0] -=  right[0] * scale;
            center[1] -=  right[1] * scale;
            center[2] -=  right[2] * scale;
        }
        else if(type == 4)
        {
            center[0] +=  right[0] * scale;
            center[1] +=  right[1] * scale;
            center[2] +=  right[2] * scale;
        }
        else if(type == 5)
        {
            center[0] +=  0 * scale;
            center[1] +=  1 * scale;
            center[2] +=  0 * scale;
        }
        else if(type == 6)
        {
            center[0] -=  0 * scale;
            center[1] -=  1 * scale;
            center[2] -=  0 * scale;
        }


    }



    function keyPress(e){
        var keynum;
        
        if(window.event){ // IE                 
            keynum = e.keyCode;
        }else
            if(e.which){ // Netscape/Firefox/Opera                  
                keynum = e.which;
        }
     
     
        if(keynum == 119)//w
        {
           keyMove(1);
        }
        else if(keynum == 115)//s
        {
           keyMove(2);          
        }
        else if(keynum == 97)//a
        {
            keyMove(3);
        }
        else if(keynum == 100)//d
        {
            keyMove(4);
        }
        else if(keynum == 113){
            keyMove(5);
        }
        else if(keynum == 101){
            keyMove(6);
        }


        if(keynum-49>=0 && keynum-49 < 10)
            display_type = keynum - 49;
    }
   
   document.onkeypress = keyPress;


   var mouseLeftDown = false;
   var mouseRightDown = false;
   var mouseMiddleDown = false;
   var lastMouseX = null;
   var lastMouseY = null;

    function handleMouseDown(event) {
        if( event.button == 2 ) {
            mouseLeftDown = false;
            mouseMiddleDown = false;
            mouseRightDown = true;
        }
        else if(event.button == 0){
            mouseLeftDown = true;
            mouseRightDown = false;
            mouseMiddleDown = false;
        }
        else if(event.button == 1){
            mouseLeftDown = false;
            mouseRightDown = false;
            mouseMiddleDown = true;
        }

        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }

    function handleMouseUp(event) {
        mouseLeftDown = false;
        mouseRightDown = false;
        mouseMiddleDown = false;
    }

    var MouseDowndeltaX = 0;
    var MouseDowndeltaY = 0;
    function handleMouseMove(event) {


        if (!(mouseLeftDown || mouseRightDown || mouseMiddleDown)) {
            return;
        }
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;

        
        if(mouseLeftDown)
        {
            azimuth += 0.01 * deltaX;
            elevation += 0.01 * deltaY; 
        }
        else if( mouseMiddleDown )
        {           
            MouseDowndeltaY = deltaY;
            MouseDowndeltaX = deltaX;
           
            var dir = vec3.normalize(vec3.create([center[0]-eye[0], center[1]-eye[1], center[2]-eye[2]]));
            var up = vec3.create([0,1,0]);
            var right = vec3.create();
            vec3.normalize(vec3.cross(dir,up, right));
            vec3.normalize(vec3.cross(right,dir, up));         

            center[0] += 0.01 * (MouseDowndeltaY * up[0] - MouseDowndeltaX * right[0]);
            center[1] += 0.01 * (MouseDowndeltaY * up[1] - MouseDowndeltaX * right[1]);
            center[2] += 0.01 * (MouseDowndeltaY * up[2] - MouseDowndeltaX * right[2]);      
        }
        else
        {
            radius -= 0.01 * deltaY;
            radius = Math.min(Math.max(radius, 2.0), 15.0);
        }

        // if(display_type == display_stroke){
        //     cam_dir = vec3.normalize(vec3.create([center[0]-eye[0], center[1]-eye[1], center[2]-eye[2]])); 
        //     viewVector = cam_dir;
        //     updateFaceInfo(meshfacenormals,models[0],meshisFrontFace,meshedgefaces,meshedges,meshVertices);       
        // }

        lastMouseX = newX;
        lastMouseY = newY;
    }

    canvas.onmousedown = handleMouseDown;
    //canvas.oncontextmenu = function(ev) {return false;};
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;  


    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild( stats.domElement );


    // model = mat4.create();
    // mat4.identity(model);
   
    // mv = mat4.create();
    // mat4.multiply(view, model, mv);

    // invTrans = mat4.create();
    // mat4.inverse(mv, invTrans);
    // mat4.transpose(invTrans);


   
    //vec3.normalize(lightdir);   

    function camera()
    {
        eye[0] = center[0] + eyedis * Math.cos(azimuth) * Math.cos(elevation);
        eye[1] = center[1] + eyedis * Math.sin(elevation);
        eye[2] = center[2] + eyedis * Math.cos(elevation) * Math.sin(azimuth);

        mat4.lookAt(eye, center, up, view);
    }

    //dead method
    var pixels;
    function readDepthBuffer()
    {
        //var fbDepth = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[0]);
        gl.bindTexture(gl.TEXTURE_2D, depthRGBTexture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depthRGBTexture, 0);
       
        var canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);
        //canRead = true;
        if(canRead)
        {
            pixels = new Uint8Array(canvas.width * canvas.height * 4);
            gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }



    function animate() { 
        camera();

        var lightPos = vec4.create([0.0, 1.0, 0.0, 0.3]);
        var lightdest = vec4.create();
        mat4.multiplyVec4(view, [lightPos[0], lightPos[1], lightPos[2], 0.0], lightdest);
        lightdest[3] = 0.6;

        bindFBO(0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawmesh();       


     	//2
     	setTextures();
        if(display_type == display_ink)
     	  bindFBO(1);
     	gl.enable(gl.BLEND);
     	gl.disable(gl.DEPTH_TEST);
     	gl.blendFunc(gl.ONE, gl.ONE);
     	gl.clear(gl.COLOR_BUFFER_BIT);

      

        if(display_type != display_depth && display_type != display_position && display_type != display_color){
            setupQuad(ambient_prog);
            gl.uniform4fv(gl.getUniformLocation(ambient_prog,"u_Light"), lightdest);
            drawQuad();
        }
        
        if(display_type == display_light || display_type == display_ink || display_type == display_debugtile){
            setUpLights();
            setupQuad(light_prog);
            lightQuad(light_prog);
            drawQuad();
        }  
        else if(display_type == display_nontilelight){
            setupQuad(nontilelight_prog);
            setUpLights();
            gl.disable(gl.SCISSOR_TEST);
        }
        else
        {
            setupQuad(diagnostic_prog);
            gl.uniform4fv(gl.getUniformLocation(diagnostic_prog,"u_Light"), lightdest);            
            drawQuad();       
        }
        gl.disable(gl.BLEND);


         if(display_type == display_ink){// for stroke

            setTextures();
            bindFBO(7);
            setupQuad(edge_prog);
            gl.uniform4fv(gl.getUniformLocation(ambient_prog,"u_Light"), lightdest);
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, spatterTexture);
            gl.uniform1i(gl.getUniformLocation(edge_prog, "u_QuatColorSampler"),4);
            drawQuad();

            setTextures();
            bindFBO(5);
            gl.useProgram(stroke_prog);
          
            gl.uniform1i(gl.getUniformLocation(stroke_prog, "u_viewportWidth"), canvas.width);
            gl.uniform1i(gl.getUniformLocation(stroke_prog, "u_viewportHeight"), canvas.height);

            // gl.activeTexture(gl.TEXTURE0);
            // gl.bindTexture(gl.TEXTURE_2D, silCullTexture);
            // gl.uniform1i(gl.getUniformLocation(stroke_prog, "u_SilColorSampler"),0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, edgeTexture);
            gl.uniform1i(gl.getUniformLocation(stroke_prog, "u_SilColorSampler"),0);

            drawQuad();


            setTextures();
            bindFBO(6);
            gl.useProgram(strokeblur_prog);
                 
            gl.uniform1i(gl.getUniformLocation(strokeblur_prog, "u_viewportWidth"), canvas.width);
            gl.uniform1i(gl.getUniformLocation(strokeblur_prog, "u_viewportHeight"), canvas.height);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, strokeTexture);
            gl.uniform1i(gl.getUniformLocation(strokeblur_prog, "u_StrokeSampler"),0);

            drawQuad();

            //3
         	setTextures();
            bindFBO(2);
            gl.enable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.clear(gl.COLOR_BUFFER_BIT);   

            gl.useProgram(spatter_prog);

            gl.uniform1i(gl.getUniformLocation(spatter_prog, "u_DisplayType"), display_type);

            gl.uniform1f(gl.getUniformLocation(spatter_prog, "u_Width"), canvas.width);
            gl.uniform1f(gl.getUniformLocation(spatter_prog, "u_Height"), canvas.height);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, spatterTexture);
            gl.uniform1i(gl.getUniformLocation(spatter_prog, "u_QuatColorSampler"),0);

        	drawQuad();
            gl.disable(gl.BLEND);

            //4
            setTextures();

            gl.useProgram(post_prog);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.uniform1i(gl.getUniformLocation(post_prog, "u_DisplayType"), display_type);

            gl.uniform1f(gl.getUniformLocation(post_prog, "u_Width"), canvas.width);
            gl.uniform1f(gl.getUniformLocation(post_prog, "u_Height"), canvas.height); 

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, postTexture);
            gl.uniform1i(gl.getUniformLocation(post_prog, "u_Posttex"),0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, strokeblurTexture);
            gl.uniform1i(gl.getUniformLocation(post_prog, "u_StrokeBlurtex"),1);

            drawQuad();
        }

    	
        //reset
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D,null);
        
        window.requestAnimFrame(animate); 
        stats.update();
     }


     
     (function loadWebGL(){    
        
        initializeShader();
        initializeFBO();      
        
        initMeshBuffers();        
        //initializeSphere();

        initializeQuad();

        initLights();
        setUpLights();
        initLightsFBO();      

        animate();
     })();    
 }());