

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

var isExt;

function initializeShader() {

    //for extension 
    ext = gl.getExtension("WEBGL_draw_buffers");

    if (!ext) {
        //alert("You need WebGL Draw Buffer Extension by turning on 'Enable WebGL Draft Extensions' on your web browser. Chrome keys in chrome://flags. Firefox keys in about:config.");

        //return window.location.href = "http://sijietian.com/WebGL/noMRTdeferredshading/index.html";
        document.write("<p class = \"extension\" style = \"padding-left : 100px\"> Your browser is NOT using <a href = \"http://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/\" >WEBGL_draw_buffers</a> extension.</p>");
        console.log("No WEBGL_draw_buffers support -- this is legal");
        isExt = false;
    } else {
        document.write("<p class = \"extension\" style = \"padding-left : 100px\"> Your browser is using <a href = \"http://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/\" >WEBGL_draw_buffers</a> extension.</p>");
        console.log("Successfully enabled WEBGL_draw_buffers extension");
        isExt = true;
    }

    if (ext){
        //First shader
        var vs = getShaderSource(document.getElementById("pass_vs"));
        var fs = getShaderSource(document.getElementById("pass_fs"));

        pass_prog = createProgram(gl, vs, fs, message);    

        if (!gl.getProgramParameter(pass_prog, gl.LINK_STATUS)) {
            alert("Could not initialise pass_fs");
        }

        positionLocation = gl.getAttribLocation(pass_prog, "Position");
        normalLocation = gl.getAttribLocation(pass_prog, "Normal");
        texCoordLocation = gl.getAttribLocation(pass_prog, "Texcoord");
        console.log("TextCor " , texCoordLocation);


        textureLocation = gl.getUniformLocation(pass_prog, "u_Texutre");

        u_ModelLocation = gl.getUniformLocation(pass_prog,"u_Model");
        u_ViewLocation = gl.getUniformLocation(pass_prog,"u_View");
        u_PerspLocation = gl.getUniformLocation(pass_prog,"u_Persp");
        u_InvTransLocation = gl.getUniformLocation(pass_prog,"u_InvTrans");
        u_ColorSamplerLocation = gl.getUniformLocation(pass_prog,"u_ColorSampler");
    }
    else
    {
        var vs = getShaderSource(document.getElementById("pass_vs"));
        var fs = getShaderSource(document.getElementById("withoutdrawbufferfs"));

        pass_prog = createProgram(gl, vs, fs, message);    

        if (!gl.getProgramParameter(pass_prog, gl.LINK_STATUS)) {
            alert("Could not initialise pass_fs");
        }

        positionLocation = gl.getAttribLocation(pass_prog, "Position");
        normalLocation = gl.getAttribLocation(pass_prog, "Normal");
        texCoordLocation = gl.getAttribLocation(pass_prog, "Texcoord");
        console.log("TextCor " , texCoordLocation);

        textureLocation = gl.getUniformLocation(pass_prog, "u_Texutre");
        u_ModelLocation = gl.getUniformLocation(pass_prog,"u_Model");
        u_ViewLocation = gl.getUniformLocation(pass_prog,"u_View");
        u_PerspLocation = gl.getUniformLocation(pass_prog,"u_Persp");
        u_InvTransLocation = gl.getUniformLocation(pass_prog,"u_InvTrans");
        u_ColorSamplerLocation = gl.getUniformLocation(pass_prog,"u_ColorSampler");
        u_Drawmode = gl.getUniformLocation(pass_prog,"u_DrawMode");
    }

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

    u_TileSizeLocation = gl.getUniformLocation(light_prog, "u_TileSize");
    u_LightNumLocation = gl.getUniformLocation(light_prog, "u_LightNum");
    u_WidthTileLocation = gl.getUniformLocation(light_prog, "u_WidthTile");
    u_HeightTileLocation = gl.getUniformLocation(light_prog, "u_HeightTile");
    u_MaxTileLightNumLocation = gl.getUniformLocation(light_prog, "u_MaxTileLightNum");
    u_LightGridtexLocation = gl.getUniformLocation(light_prog, "u_LightGridtex");
    u_LightIndexImageSizeLocation = gl.getUniformLocation(light_prog, "u_LightIndexImageSize");
    u_FloatLightIndexSizeLocation = gl.getUniformLocation(light_prog, "u_FloatLightIndexSize");
    u_LightIndextexLocation = gl.getUniformLocation(light_prog, "u_LightIndextex");
    u_LightPositiontexLocation = gl.getUniformLocation(light_prog, "u_LightPositiontex");
    u_LightColorRadiustexLocation = gl.getUniformLocation(light_prog, "u_LightColorRadiustex");


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

var rttFramebuffers = [];

function initializeFBO() {

    console.log("initFBO");
    gl.getExtension("OES_texture_float");
    gl.getExtension("OES_texture_float_linear");
    var extDepth = gl.getExtension("WEBGL_depth_texture");

    if(!extDepth){
        console.log("Extension Depth texture is not working");
        alert(":( Sorry, Your browser doesn't support depth texture extension. Please browse to webglreport.com to see more information.");
        return;
    }


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

    if(ext)//Draw buffer is supported
    {
        FBO[0] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[0]);
        var bufs = [];
        bufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
        bufs[1] = ext.COLOR_ATTACHMENT1_WEBGL;
        bufs[2] = ext.COLOR_ATTACHMENT2_WEBGL;
        bufs[3] = ext.COLOR_ATTACHMENT3_WEBGL;
        ext.drawBuffersWEBGL(bufs);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[0], gl.TEXTURE_2D, depthRGBTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[1], gl.TEXTURE_2D, normalTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[2], gl.TEXTURE_2D, positionTexture, 0);    
        gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[3], gl.TEXTURE_2D, colorTexture, 0);    


        var FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
    	    console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[0]\n");        	
        }    	
    }
    else//Draw buffer is NOT supported
    {
        for(var i = 0; i<4; ++i)
        {
    	    var fbo = gl.createFramebuffer();
    	    rttFramebuffers.push(fbo);
    	    gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
    	    fbo.width = canvas.width;
    	    fbo.height = canvas.height;

    	    var texture;
    	    if(i == 0)
    		    texture = normalTexture;
    	    else if(i == 1)
    		    texture = colorTexture;
    	    else if(i == 2)
    		    texture = positionTexture;
    	    else if(i == 3)
    		    texture = depthTexture;


    	    if(i == 3)
    	    {
    		    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depthRGBTexture, 0);
    		    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
    	    }
    	    else
    	    {
    		    var renderbuffer = gl.createRenderbuffer();
    		    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    		    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fbo.width, fbo.height);
    		    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    		    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    	    }


    	    var FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    	    if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
    		    console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO " + i);         
    	    }       

    	    //set texture, renderbuffer, and framebuffer back to their defaults
    	    gl.bindTexture(gl.TEXTURE_2D, null);
    	    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    	    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
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
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, spatterTexture, 0);

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
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, postTexture, 0);

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
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, silcolorTexture, 0);


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
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, silCullTexture, 0);


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
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, strokeTexture, 0);


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
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, strokeblurTexture, 0);


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
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, edgeTexture, 0);


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
    for(var i = 0; i < 1; ++i){
    	for(var j = 0; j < 1; ++j){
            for(var k = 0; k < 1; ++k){
        		var matrix = mat4.create();
        		mat4.identity(matrix);
        		//mat4.scale(matrix,[1,1,1]);
        		mat4.translate(matrix,[i*2,j*2,k*2]);       
        		models.push(matrix);
            }
    	}
    }
}


var meshVertices = [];//new Float32Array();
var meshNormals = [];//new Float32Array();
var meshIndex = [];//new Uint16Array();
var meshUV = [];

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
var silEdgeMeshesvbo;
var silEdgeMeshesibo;
var silEdgeMeshescbo = [];



var bufferVertices = [];
var bufferIndex = [];
var bufferTexutre = [];

var vertexBuffer;
var normalBuffer;
var textureBuffer;
var indexBuffer;

var vBuffers = [];
var nBuffers = [];
var iBuffers = [];
var uBuffers = [];
var tBuffers = [];

var iLens = [];

var meshNum = 0;

var meshTextures = [];

var isLoadingComplete = false;

for(var i = 0; i < 38; i++){
    var meshTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, meshTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); 
    meshTextures.push(meshTex);
}


//texture loading code from http://learningwebgl.com/blog/?p=507
function initTexture(url, index) {
    // var meshTex = gl.createTexture();
    meshTextures[index].image = new Image();
    meshTextures[index].image.onload = function() {
        handleLoadedTexture(meshTextures[index]);
    }

    meshTextures[index].image.src = url;

    //meshTextures.push(meshTex);
}


function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);//gl.REPEAT
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


function initMeshBuffers()
{
    setmodelMatrix();

    //var loader = new THREE.OBJLoader();
    var loader = new THREE.OBJMTLLoader();

    //ADD
    hashedges = {};
    var edgeidx = 0;
    

    //address for obj
    loader.load( 'http://127.0.0.1:8089/OBJ/sponza/sponza.obj', 'http://127.0.0.1:8089/OBJ/sponza/sponza.mtl', function ( event ) {
    //loader.load( 'http://sijietian.com/WebGL/OBJ/sponza/sponza.obj', 'http://sijietian.com/WebGL/OBJ/sponza/sponza.mtl', function ( event ) {

    //loader.load( 'http://127.0.0.1:8089/OBJ/crytek-sponza/sponza.obj', 'http://127.0.0.1:8089/OBJ/crytek-sponza/sponza.mtl', function ( event ) {

    //loader.load( 'http://127.0.0.1:8089/OBJ/sibenik.obj', function ( event ) {
    //loader.load( 'http://127.0.0.1:8089/OBJ/sponza/sponza.obj', function ( event ) {
    //loader.load( 'http://127.0.0.1:8089/OBJ/dragon.obj', function ( event ) {
    //loader.load( 'http://sijietian.com/WebGL/OBJ/sibenik.obj', function ( event ) {
        var object = event;

        console.log("children " + object.children.length);

        var oldIndexNum = 0;
        var totalFace = 0;
        var totalVertices = 0;
        var point = 0;
        var url;
        object.traverse( function ( child ) {
        	if ( child instanceof THREE.Mesh ) {

        		var lenVertices = child.geometry.vertices.length;
        		var lenFaces = child.geometry.faces.length;
                var lenUV = child.geometry.faceVertexUvs[0].length;

                if(lenFaces != 0){       

                    // console.log ("Len Vertices " + lenVertices);
                    // console.log ("Len Faces " + lenFaces);
                    // console.log ("Len UV " + lenUV);
                   
                    if(child.material.map!=null)
                    {                                        
                        url = child.material.map.image.toDataURL("image/jpeg", 1.0);
                        //console.log("hell "+child.material.map.image);
                        //var url = child.material.map.image.src;
                        //var url =  "http://127.0.0.1:8089/OBJ/sponza/KAMEN.JPG";                        
                        initTexture(url, tBuffers.length);
                    }
                    else
                    {                             
                        initTexture(url, tBuffers.length);
                    }
                    

                    totalFace += lenFaces;
                    totalVertices += lenVertices;                

                    meshVertices = [];                    

            		for(var i = 0; i < lenVertices; i++)
                    {                    	
                        meshVertices.push(child.geometry.vertices[i].x);
                        meshVertices.push(child.geometry.vertices[i].y);
                        meshVertices.push(child.geometry.vertices[i].z);
                    }                              
                    
                    var UVs = child.geometry.faceVertexUvs[0];
                   
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

                        
                        var uv = UVs[i];
                        for(var j = 0; j < uv.length; j++)
                        {
                            meshUV.push(uv[j].x);
                            meshUV.push(1.0-uv[j].y);
                        }
                       

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

                    	// if(meshIndex.length > 65000)
                    	// {
                    	// 	//console.log("meshIndex > 64000");
                    	// 	vertexBuffer = gl.createBuffer();
                    	// 	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                    	// 	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferVertices), gl.STATIC_DRAW);
                    	// 	vertexBuffer.numItems = bufferVertices.length / 3;
                    	// 	vBuffers.push(vertexBuffer);

                    	// 	normalBuffer = gl.createBuffer();
                    	// 	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                    	// 	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshNormals), gl.STATIC_DRAW);
                    	// 	meshNormals.numItems = meshNormals.length / 3;
                    	// 	nBuffers.push(normalBuffer);

                        // textureBuffer = gl.createBuffer();
                        // gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
                        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshUV), gl.STATIC_DRAW);
                        // meshUV.numItems = meshUV.length / 2;
                        // tBuffers.push(textureBuffer);

                    	// 	indexBuffer = gl.createBuffer();
                    	// 	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);      
                    	// 	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshIndex), gl.STATIC_DRAW);  
                    	// 	indexBuffer.numItems = meshIndex.length;
                    	// 	iBuffers.push(indexBuffer);

                    	// 	//console.log("Index len " + meshIndex.length/3);
                    	// 	iLens.push(meshIndex.length);

                    	// 	point = 0;
                    	// 	bufferVertices = [];
                    	// 	meshNormals = [];
                    	// 	meshIndex = [];                     
                    	// }                        
                    } // end for face loop     

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

                    textureBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshUV), gl.STATIC_DRAW);
                    meshUV.numItems = meshUV.length / 2;
                    tBuffers.push(textureBuffer);

                    // console.log("vertex len is " + vertexBuffer.numItems);
                    // console.log("UV len is " + meshUV.numItems);

                    indexBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);      
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshIndex), gl.STATIC_DRAW);  
                    indexBuffer.numItems = meshIndex.length;
                    iBuffers.push(indexBuffer);

                    point = 0;
                    bufferVertices = [];
                    meshNormals = [];
                    meshIndex = []; 
                    meshUV = [];

                }//end of if(lenFaces != 0)  
            }          

           
        } );
        
        // vertexBuffer = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferVertices), gl.STATIC_DRAW);
        // vertexBuffer.numItems = bufferVertices.length / 3;
        // vBuffers.push(vertexBuffer);


        // normalBuffer = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshNormals), gl.STATIC_DRAW);
        // meshNormals.numItems = meshNormals.length / 3;
        // nBuffers.push(normalBuffer);   

        // textureBuffer = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshUV), gl.STATIC_DRAW);
        // meshUV.numItems = meshUV.length / 2;
        // tBuffers.push(textureBuffer);


        // indexBuffer = gl.createBuffer();
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);      
        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshIndex), gl.STATIC_DRAW);  
        // indexBuffer.numItems = meshIndex.length;
        // iBuffers.push(indexBuffer);

        //console.log("Index len " + meshIndex.length);
        iLens.push(meshIndex.length);

        console.log("number of draw calls " + vBuffers.length);

        console.log("total Faces " + totalFace);
        console.log("total Vertices " + totalVertices);

        //console.log("Index len " + meshIndex.length/3);
        // meshNum ++;   
        console.log("mehsnormals len " + meshNormals.length / 3);
        //updateFaceInfo(meshfacenormals,models[0],meshisFrontFace,meshedgefaces,meshedges,meshVertices);
        isLoadingComplete = true;

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
    if(isLoadingComplete){
    	gl.useProgram(pass_prog);	

    	for(var idx = 0; idx < models.length; idx++){
    		for(var i = 0; i < vBuffers.length; i++){
    			var mv = mat4.create();
    			mat4.multiply(view, models[idx], mv);

    			invTrans = mat4.create();
    			mat4.identity(invTrans);
    			mat4.inverse(mv, invTrans);
    			mat4.transpose(invTrans);

    			gl.enableVertexAttribArray(positionLocation);
    			gl.enableVertexAttribArray(normalLocation);
    			gl.enableVertexAttribArray(texCoordLocation);


    			// var colors = vec3.create([0.2,0.3,0.4]);            
    			// gl.uniform3fv(gl.getUniformLocation(pass_prog,"u_Color"),colors);

            	gl.activeTexture(gl.TEXTURE0);
           	 	gl.bindTexture(gl.TEXTURE_2D, meshTextures[i]);
            	gl.uniform1i(textureLocation,0);


    			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffers[i]);
    			gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);            


    			gl.bindBuffer(gl.ARRAY_BUFFER, nBuffers[i]);
    			gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);


            	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffers[i]);
            	gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    			// gl.bindBuffer(gl.ARRAY_BUFFER, meshes[mesh].textureBuffer);
    			// gl.vertexAttribPointer(texCoordLocation,  meshes[mesh].textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

    			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffers[i]);

    			setMatrixUniforms(models[idx]);
    			gl.drawElements(gl.TRIANGLES, iBuffers[i].numItems, gl.UNSIGNED_SHORT, 0);

    			//idx ++;
    		}
    	}

    	gl.disableVertexAttribArray(positionLocation);
    	gl.disableVertexAttribArray(normalLocation);
    	gl.disableVertexAttribArray(texCoordLocation);
    	gl.bindBuffer(gl.ARRAY_BUFFER, null);
    	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}

var timetest = 0;
//draw buffer extension is NOT supported
function drawmeshNoExt(drawmode)
{
    if(isLoadingComplete){
    	gl.useProgram(pass_prog);

    	gl.uniform1i(u_Drawmode,drawmode);

    	for(var idx = 0; idx < models.length; idx++){
    		for(var i = 0; i < vBuffers.length; i++){
    			var mv = mat4.create();
    			mat4.multiply(view, models[idx], mv);

    			invTrans = mat4.create();
    			mat4.identity(invTrans);
    			mat4.inverse(mv, invTrans);
    			mat4.transpose(invTrans);

    			gl.enableVertexAttribArray(positionLocation);
    			gl.enableVertexAttribArray(normalLocation);
                gl.enableVertexAttribArray(texCoordLocation);

    			// var colors = vec3.create([0.2,0.9,0.4]);
    			// gl.uniform3fv(gl.getUniformLocation(pass_prog,"u_Color"),colors);

               
           		if(drawmode == 1){       
                    if(meshTextures[i].image.complete){         
                    //if(meshTextures[i].powerOf2){
                        if(meshTextures[i].image.height & (meshTextures[i].image.height-1) != 0){
                            console.log("not power of 2")
                        }
                		gl.activeTexture(gl.TEXTURE0);
                		gl.bindTexture(gl.TEXTURE_2D, meshTextures[i]);
                		gl.uniform1i(textureLocation,0);                
                    }
            	}
               

    			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffers[i]);
    			gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);            


    			gl.bindBuffer(gl.ARRAY_BUFFER, nBuffers[i]);
    			gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, tBuffers[i]);
                gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);


    			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffers[i]);
    			setMatrixUniforms(models[idx]);

    			gl.drawElements(gl.TRIANGLES, iBuffers[i].numItems, gl.UNSIGNED_SHORT, 0);
    		}
    	}

    	gl.disableVertexAttribArray(positionLocation);
    	gl.disableVertexAttribArray(normalLocation);
        gl.disableVertexAttribArray(texCoordLocation);

    	gl.bindBuffer(gl.ARRAY_BUFFER, null);
    	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}


var display_type = 5;

var lightGridTex = gl.createTexture();
var lightIndexTex = gl.createTexture();
var lightPositionTex = gl.createTexture();
var lightColorRadiusTex = gl.createTexture();

var lightIndexWidth, lightIndexHeight;

function lightQuad(program)
{
	gl.uniform1i(u_TileSizeLocation, tileSize);
	gl.uniform1i(u_LightNumLocation, lightNum);
	gl.uniform1f(u_WidthTileLocation, tileWidth);
	gl.uniform1f(u_HeightTileLocation, tileHeight);
    gl.uniform1i(u_MaxTileLightNumLocation, maxTileLightNum);
    

	gl.activeTexture(gl.TEXTURE4);
	gl.bindTexture(gl.TEXTURE_2D, lightGridTex); 
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tileWidth, tileHeight, 0, gl.RGB, gl.FLOAT, new Float32Array(lightGrid));       
	gl.uniform1i(u_LightGridtexLocation,4);    


	var lightIndexWidth = Math.ceil(Math.sqrt(lightIndex.length));

	for(var i = lightIndex.length; i < lightIndexWidth*lightIndexWidth; i++)
	{
		lightIndex.push(-1);
	}       

	gl.uniform1i(u_LightIndexImageSizeLocation, lightIndexWidth);      
	gl.uniform1f(u_FloatLightIndexSizeLocation, lightIndexWidth);    

	gl.activeTexture(gl.TEXTURE5);
	gl.bindTexture(gl.TEXTURE_2D, lightIndexTex);   
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, lightIndexWidth, lightIndexWidth, 0, gl.LUMINANCE, gl.FLOAT, new Float32Array(lightIndex));       
	gl.uniform1i(u_LightIndextexLocation,5);


	gl.activeTexture(gl.TEXTURE6);
	gl.bindTexture(gl.TEXTURE_2D, lightPositionTex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, lightPosition.length/3, 1.0, 0, gl.RGB, gl.FLOAT, new Float32Array(lightPosition));       
	gl.uniform1i(u_LightPositiontexLocation,6);


	gl.activeTexture(gl.TEXTURE7);
	gl.bindTexture(gl.TEXTURE_2D, lightColorRadiusTex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, lightColorRadius.length/4, 1.0, 0, gl.RGBA, gl.FLOAT, new Float32Array(lightColorRadius));
	gl.uniform1i(u_LightColorRadiustexLocation,7);
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

function camera()
{
	eye[0] = center[0] + eyedis * Math.cos(azimuth) * Math.cos(elevation);
	eye[1] = center[1] + eyedis * Math.sin(elevation);
	eye[2] = center[2] + eyedis * Math.cos(elevation) * Math.sin(azimuth);

	mat4.lookAt(eye, center, up, view);
}


var lightPos = vec4.create([0.0, 1.0, 0.0, 0.3]);
var lightdest = vec4.create();

function animate() { 
	camera();
	
	mat4.multiplyVec4(view, [lightPos[0], lightPos[1], lightPos[2], 0.0], lightdest);
	lightdest[3] = 0.3;

	if(ext)//draw buffer extension is supported
	{
		bindFBO(0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		drawmesh();       
	}
	else
	{
		for(var i = 0; i<4; ++i)
		{
			setTextures();
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffers[i]);
			gl.enable(gl.DEPTH_TEST);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);       
			drawmeshNoExt(i);
		}    
	}


	//2
	setTextures();
	if(display_type == display_ink)
		bindFBO(1);
	gl.enable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	gl.blendFunc(gl.ONE, gl.ONE);
	gl.clear(gl.COLOR_BUFFER_BIT);



	if(display_type != display_depth && display_type != display_position && display_type != display_color && display_type != display_debugtile && display_type != display_normal){
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
		gl.uniform4fv(gl.getUniformLocation(edge_prog,"u_Light"), vec4.create([0.0, 0.0, 0.0, 0.3]));
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

function testt()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawmesh(); 
    window.requestAnimFrame(testt); 
    stats.update();
}

(function loadWebGL(){    

	initializeShader();
	initializeFBO();      

	initMeshBuffers();

	initializeQuad();

	initLights();
	setUpLights();
	initLightsFBO();      

    //testt();
	animate();
})();
