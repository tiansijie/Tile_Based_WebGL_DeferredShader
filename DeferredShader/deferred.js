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
    var far = 100.0;

    var persp = mat4.create();
    mat4.perspective(45.0, canvas.width/canvas.height, near, far, persp);

    var model;
    var mv;
    var invTrans;

    var radius = 5.0;
    var azimuth = Math.PI;
    var elevation = 0.0001;

    var eye = sphericalToCartesian(radius, azimuth, elevation);
    var center = [0.0, 0.0, 0.0];
    var cam_dir = vec3.normalize(vec3.create([center[0]-eye[0], center[1]-eye[1], center[2]-eye[2]]));
    var up = [0.0, 1.0, 0.0];
    var view = mat4.create();
    mat4.lookAt(eye, center, up, view);


    //For tile base lighting
    var tileSize = 16;
    var tileWidth = Math.floor(canvas.width / tileSize);
    var tileHeight = Math.floor(canvas.height/tileSize);
    var numTile = tileWidth * tileHeight;


    var lights = [];
    var lightPosition = [];
    var lightColorRadius = [];
    var lightGrid = [];
    var lightIndex = [];
    var lightNum = 3;   


    var positionLocation = 0;
    var normalLocation = 1;
    var texCoordLocation = 2;
    var u_InvTransLocation;
    var u_ModelLocation;
    var u_ViewLocation;
    var u_PerspLocation;
    var u_CameraSpaceDirLightLocation;

    var u_DisplayTypeLocation;
    var u_NearLocation;
    var u_FarLocation;
    var u_DepthtexLocation;
    var u_NormaltexLocation;
    var u_PositiontexLocation;
    var u_ColortexLocation;

    var quad_positionLocation = 0;
    var quad_texCoordLocation = 1;

    var pass_prog;
    var diagnostic_prog;
    var light_prog;
    var ambient_prog;
    var post_prog;

    var ext = null;

    (function initializeShader() {
    	ext = gl.getExtension("WEBGL_draw_buffers");
        if (!ext) {
            console.log("No WEBGL_draw_buffers support -- this is legal");
        } else {
            console.log("Successfully enabled WEBGL_draw_buffers extension");
        }

        //First shader
        var vs = getShaderSource(document.getElementById("pass_vs"));
        var fs = getShaderSource(document.getElementById("pass_fs"));

        pass_prog = createProgram(gl, vs, fs, message);    
    	gl.bindAttribLocation(pass_prog, positionLocation, "Position");
    	gl.bindAttribLocation(pass_prog, normalLocation, "Normal");
    	gl.bindAttribLocation(pass_prog, texCoordLocation, "Texcoord");

    	if (!gl.getProgramParameter(pass_prog, gl.LINK_STATUS)) {
            alert("Could not initialise pass_fs");
        }

        u_ModelLocation = gl.getUniformLocation(pass_prog,"u_Model");
        u_ViewLocation = gl.getUniformLocation(pass_prog,"u_View");
        u_PerspLocation = gl.getUniformLocation(pass_prog,"u_Persp");
        u_InvTransLocation = gl.getUniformLocation(pass_prog,"u_InvTrans");
    	
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
        fs = getShaderSource(document.getElementById("light_fs"));
        
        light_prog = createProgram(gl, vs, fs, message);
        gl.bindAttribLocation(diagnostic_prog, quad_positionLocation, "Position");
        gl.bindAttribLocation(diagnostic_prog, quad_texCoordLocation, "Texcoord");
        
        if (!gl.getProgramParameter(diagnostic_prog, gl.LINK_STATUS)) {
            alert("Could not initialise light_fs");
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
    	//gl.useProgram(program);	
	})();




	var depthTexture = gl.createTexture();
	var normalTexture = gl.createTexture();
	var positionTexture = gl.createTexture();
	var colorTexture = gl.createTexture();
	var postTexture = gl.createTexture();

	var FBO = [0,0];


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

	(function initializeFBO() {

		console.log("initFBO");

		gl.getExtension("OES_texture_float");
        gl.getExtension("OES_texture_float_linear");
        var extDepth = gl.getExtension("WEBGL_depth_texture");

        if(!extDepth)
        	console.log("Extension Depth buffer is not working");

		gl.activeTexture(gl.TEXTURE0);

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


        FBO[0] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[0]);
        var maxDrawingBuffers = gl.getParameter(ext.MAX_DRAW_BUFFERS_WEBGL);
  		var maxColorAttachments = gl.getParameter(ext.MAX_COLOR_ATTACHMENTS_WEBGL);
  		var bufs = makeColorAttachmentArray(maxDrawingBuffers);
  		bufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
    	bufs[1] = ext.COLOR_ATTACHMENT1_WEBGL;
    	bufs[2] = ext.COLOR_ATTACHMENT2_WEBGL;
    	ext.drawBuffersWEBGL(bufs);
        //var bufs = gl.COLOR_ATTACHMENT0;

		gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    	gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[0], gl.TEXTURE_2D, normalTexture, 0);
    	gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[1], gl.TEXTURE_2D, positionTexture, 0);    
    	gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[2], gl.TEXTURE_2D, colorTexture, 0);

    	var FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    	if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
        	console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[0]\n");        	
    	}

    	gl.activeTexture(gl.TEXTURE9);
    	gl.bindTexture(gl.TEXTURE_2D, postTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

        FBO[1] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[1]);
        var postbufs = makeColorAttachmentArray(maxDrawingBuffers);
  		postbufs[0] = ext.COLOR_ATTACHMENT0_WEBGL;
  		ext.drawBuffersWEBGL(postbufs);

  		gl.bindTexture(gl.TEXTURE_2D, postTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, postbufs[0], gl.TEXTURE_2D, postTexture, 0);

    	FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    	if(FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
        	console.log("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO[1]\n");        	
    	}

    	gl.clear(gl.DEPTH_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	})();



	var numberOfIndices;
	var positionsName;
	var normalsName;
	var texCoordsName;
	var indicesName;

	(function initializeSphere() {
        function uploadMesh(positions, texCoords, indices) {
            // Positions
            positionsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionLocation);
            
            // Normals
            normalsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalsName);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normalLocation);
            
            // TextureCoords
            texCoordsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsName);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
            gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(texCoordLocation);

            // Indices
            indicesName = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        }

        var WIDTH_DIVISIONS = NUM_WIDTH_PTS - 1;
        var HEIGHT_DIVISIONS = NUM_HEIGHT_PTS - 1;

        var numberOfPositions = NUM_WIDTH_PTS * NUM_HEIGHT_PTS;

        var positions = new Float32Array(3 * numberOfPositions);
        var texCoords = new Float32Array(2 * numberOfPositions);
        var indices = new Uint16Array(6 * (WIDTH_DIVISIONS * HEIGHT_DIVISIONS));

        var positionsIndex = 0;
        var texCoordsIndex = 0;
        var indicesIndex = 0;
        var length;

        for( var j = 0; j < NUM_HEIGHT_PTS; ++j )
        {
            var inclination = Math.PI * (j / HEIGHT_DIVISIONS);
            for( var i = 0; i < NUM_WIDTH_PTS; ++i )
            {
                var azimuth = 2 * Math.PI * (i / WIDTH_DIVISIONS);
                positions[positionsIndex++] = Math.sin(inclination)*Math.cos(azimuth);
                positions[positionsIndex++] = Math.cos(inclination);
                positions[positionsIndex++] = Math.sin(inclination)*Math.sin(azimuth);
                texCoords[texCoordsIndex++] = i / WIDTH_DIVISIONS;
                texCoords[texCoordsIndex++] = j / HEIGHT_DIVISIONS;
            } 
        }

        for( var j = 0; j < HEIGHT_DIVISIONS; ++j )
        {
            var index = j*NUM_WIDTH_PTS;
            for( var i = 0; i < WIDTH_DIVISIONS; ++i )
            {
                    indices[indicesIndex++] = index + i;
                    indices[indicesIndex++] = index + i+1;
                    indices[indicesIndex++] = index + i+NUM_WIDTH_PTS;
                    indices[indicesIndex++] = index + i+NUM_WIDTH_PTS;
                    indices[indicesIndex++] = index + i+1;
                    indices[indicesIndex++] = index + i+NUM_WIDTH_PTS+1;
            }
        }

        uploadMesh(positions, texCoords, indices);
        numberOfIndices = indicesIndex;
    })();


    var device_quad = {num_indices:0};

    var vbo_vertices;
    var vbo_indices;
    var vbo_textures;

    (function initializeQuad() {
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
    })();


    var time = 0;

	function drawmesh()
    {
    	gl.useProgram(pass_prog);    	

        gl.uniformMatrix4fv(u_ModelLocation,false,model);
    	gl.uniformMatrix4fv(u_ViewLocation,false,view);
    	gl.uniformMatrix4fv(u_PerspLocation,false,persp);
    	gl.uniformMatrix4fv(u_InvTransLocation,false,invTrans);

        var colors = vec3.create([0.2,1.0,1.0]);
        gl.uniform3fv(gl.getUniformLocation(pass_prog,"u_Color"),colors);

    	gl.enableVertexAttribArray(positionLocation);
        gl.enableVertexAttribArray(normalLocation);
        gl.enableVertexAttribArray(texCoordLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalsName);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);        

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsName);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);        

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName); 
        
        gl.drawElements(gl.TRIANGLES, numberOfIndices, gl.UNSIGNED_SHORT,0);

        gl.disableVertexAttribArray(positionLocation);
        gl.disableVertexAttribArray(normalLocation);
        gl.disableVertexAttribArray(texCoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    var display_type = 0;

    var lightGridTex = gl.createTexture();
    var lightIndexTex = gl.createTexture();
    var lightPositionTex = gl.createTexture();
    var lightColorRadiusTex = gl.createTexture();

    var lightIndexWidth, lightIndexHeight;

    function lightQuad(program)
    {
        for(var i = 0; i < lightNum; i++)
        {
            var radiusLoc = gl.getUniformLocation(program, "u_Lights["+i+"].radius");
            gl.uniform1f(radiusLoc, lights[i].radius);
            var posLoc = gl.getUniformLocation(program, "u_Lights["+i+"].position");
            gl.uniform3fv(posLoc, lights[i].position);
            var colLoc = gl.getUniformLocation(program, "u_Lights["+i+"].color");
            gl.uniform3fv(colLoc, lights[i].color);
        }


        gl.uniform1i(gl.getUniformLocation(program, "u_LightNum"), lightNum);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, lightGridTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tileWidth, tileHeight, 0, gl.RGB, gl.FLOAT, new Float32Array(lightGrid));       
        gl.uniform1i(gl.getUniformLocation(program, "u_LightGridtex"),4);    


        var lightIndexWidth = Math.ceil(Math.sqrt(lightIndex.length));


        console.log("light Index len " + lightIndexWidth);
        
        for(var i = lightIndex.length; i < lightIndexWidth*lightIndexWidth; i++)
        {
            lightIndex.push(-1);
        }

       

       

        gl.uniform1i(gl.getUniformLocation(program, "u_LightIndexImageSize"), lightIndexWidth);      

        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, lightIndexTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, lightIndexWidth, lightIndexWidth, 0, gl.LUMINANCE, gl.FLOAT, new Float32Array(lightIndex));       
        gl.uniform1i(gl.getUniformLocation(program, "u_LightIndextex"),5);  


        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, lightPositionTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, lightPosition.length/3, 1.0, 0, gl.RGB, gl.FLOAT, new Float32Array(lightPosition));       
        gl.uniform1i(gl.getUniformLocation(program, "u_LightPositiontex"),6);


        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, lightColorRadiusTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
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

        gl.uniform1i(gl.getUniformLocation(program, "u_TileSize"), tileSize);

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
    // function getLightBoundingBox(light_pos, radius, pv, viewport, left, right, top, bottom)
    // {
    //     var lx = light_pos[0];
    //     var ly = light_pos[1];
    //     var lz = light_pos[2];
    //     var lx2 = lx*lx;
    //     var ly2 = ly*ly;
    //     var lz2 = lz*lz;
    //     var r = radius;
    //     var r2 = r*r;

    //     //X direction
    //     var dz = 4 * (r2*lz2 - (lx2 + lz2)*(r2-lx2));

    //     console.log(dz);

    //     if(dz <= 0)
    //         return false;

    //     var nz1 = (r*lz + Math.sqrt(dz/4.0)) / (lx2 + lz2);
    //     var nz2 = (r*lz - Math.sqrt(dz/4.0)) / (lx2 + lz2);

    //     var nx1 = (r-nz1*lz)/lx;
    //     var nx2 = (r-nz2*lz)/lx;

    //     var pzx1 = (lx2+lz2-r2) / lx-(nx1/nz1)*lz;
    //     var pzx2 = (lx2+lz2-r2) / lx-(nx2/nz2)*lz;

    //     if(pzx1 > lx || pzx2 > lx)
    //         return false;

    //     //for the left and right position
    //     var pz1 = -pzx1*nx1/nz1;
    //     var pz2 = -pzx2*nx2/nz2;


    //     //Y direction
    //     var dy = r2*ly2 - (ly2+lx2)*(r2-lx2);
    //     console.log(dy);
    //     if(dy <= 0)
    //         return false;

    //     var ny1 = (r*ly + Math.sqrt(dy)) / (ly2 + lx2);
    //     var ny2 = (r*ly - Math.sqrt(dy)) / (ly2 + lx2);

    //     var nx11 = (r-ny1*ly)/lx;
    //     var nx22 = (r-ny2*ly)/lx;

    //     var pxy1 = (ly2+lx2-r2)/(lx-(nx1/ny1)*ly);
    //     var pxy2 = (ly2+lx2-r2)/(lx-(nx2/ny2)*ly);

    //     if(pxy1 < lx || pxy2 < lx)
    //         return false;

    //     //for the bottom and up position
    //     var py1 = -pxy1*nx1/ny1;
    //     var py2 = -pxy2*nx2/ny2;


    //     var l = pz1<lz?pz1:pz2;
    //     var r = pz1>lz?pz1:pz2;
    //     var t = py1>ly?py1:py2;
    //     var b = py1<ly?py1:py2;


    //     l = (nx1*near/nz1 + 1) / 2.0 * canvas.width;
    //     r = (nx2*near/nz2 + 1) / 2.0 * canvas.width;

    //     t = (nx11*near/ny1 + 1) / (2.0*canvas.width/canvas.height) * canvas.height;
    //     b = (nx22*near/ny2 + 1) / (2.0*canvas.width/canvas.height) * canvas.height;





    //     // console.log("left "+l);
    //     // console.log("right "+r);
    //     // console.log("top "+t);
    //     // console.log("bottom "+b);

    //     // left = vec4.create([l,0.0,pzx1,1.0]);
    //     // right = vec4.create([r,0.0,pzx2,1.0]);
    //     // top = vec4.create([0.0,t,pzy1,1.0]);
    //     // bottom = vec4.create([0.0,b,pzy2,1.0]);   

        
    //     // // console.log("right "+right);
    //     // // console.log("top "+top);
    //     // // console.log("bottom "+bottom);     

    //     // left = mat4.multiplyVec4(pv,left);
    //     // right = mat4.multiplyVec4(pv,right);
    //     // top = mat4.multiplyVec4(pv,top);
    //     // bottom = mat4.multiplyVec4(pv,bottom);
        
    //     // left = vec4.divide(left,vec4.create([left[3],left[3],left[3],left[3]]));
    //     // right = vec4.divide(right,vec4.create([right[3],right[3],right[3],right[3]]));
    //     // top = vec4.divide(top,vec4.create([top[3],top[3],top[3],top[3]]));
    //     // bottom = vec4.divide(bottom,vec4.create([bottom[3],bottom[3],bottom[3],bottom[3]]));
        

            

    //     // left = mat4.multiplyVec4(viewport, left);
    //     // right = mat4.multiplyVec4(viewport, right);
    //     // top = mat4.multiplyVec4(viewport, top);
    //     // bottom = mat4.multiplyVec4(viewport, bottom);

    //     // console.log("left "+left[0] + " " + left[1] + " " + left[2] + " " + left[3]);   
    //     //console.log("veiwport" + viewport[0]);
        

       

    //     return true;
    // }


    function getLightBoundingBox(light_pos, radius, pv, viewport, boundary)
    {
        var lx = light_pos[0];
        var ly = light_pos[1];
        var lz = light_pos[2];      

        var dir = vec3.create([1.0,0.0,0.0]);
        var camUp = vec3.create([0.0,1.0,0.0]);
        var camLeft = vec3.cross(dir, camUp);
       
       
        var leftLight = vec4.create();
        var upLight = vec4.create();
        var centerLight = vec4.create();

        leftLight = mat4.multiplyVec4(pv, vec4.create([lx + radius*camLeft[0], ly + radius*camLeft[1], lz + radius*camLeft[2], 1.0]));
        upLight = mat4.multiplyVec4(pv, vec4.create([lx + radius*camUp[0], ly + radius*camUp[1], lz + radius*camUp[2], 1.0]));
        centerLight = mat4.multiplyVec4(pv, vec4.create([lx, ly, lz, 1.0]));

        leftLight = vec4.divide(leftLight,vec4.create([leftLight[3],leftLight[3],leftLight[3],leftLight[3]]));
        upLight = vec4.divide(upLight,vec4.create([upLight[3],upLight[3],upLight[3],upLight[3]]));
        centerLight = vec4.divide(centerLight,vec4.create([centerLight[3],centerLight[3],centerLight[3],centerLight[3]]));

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

        //console.log("cx is " + leftx);
        //console.log("cy is " + bottomy);
        //console.log("r is " + r);
    }


    function setLightOnTile(boundary, lightNum, tileLightId)
    {
        var leftTile = Math.floor(boundary.left / tileSize);
        var topTile = Math.min(Math.floor(boundary.top / tileSize), canvas.height/tileSize);
        var rightTile = Math.min(Math.floor(boundary.right / tileSize), canvas.width/tileSize);
        var bottomTile = Math.floor(boundary.bottom / tileSize);

        for(var i = leftTile; i < rightTile; i++)
        {
            for(var j = bottomTile; j < topTile; j++)
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
        lights.length = 0;
        lightPosition.length = 0;
        lightColorRadius.length = 0;
        lightGrid.length = 0;
        lightIndex.length = 0;
    }


    function setUpLights(){

        resetLights();
        //console.log("set up lights");

         //For tile base light setting
        var pv = mat4.create();
        mat4.multiply(persp, view, pv);

        var viewport = mat4.createFrom(
            canvas.width/2.0,0.0,0.0,0.0,
            0.0,canvas.height/2.0,0.0,0.0,
            0.0,0.0,1.0/2.0,0.0,
            canvas.width/2.0, canvas.height/2.0, 1.0/2.0, 1.0
            );             

        var tileLightId = new Array(numTile);
        for(var i = 0; i<numTile; i++)
            tileLightId[i] = [];

      

        for(var i = 0; i < lightNum; i++){
            var boundary = {left:0, right:0, top:0, bottom:0};
            lights.push({position:vec3.create([i,i,i]),color:vec3.create([Math.random(),Math.random(),Math.random()]),radius:1.0});
            
            //light position x y z
            lightPosition.push(i);
            lightPosition.push(i);
            lightPosition.push(i);

            //color r g b and radius
            lightColorRadius.push(Math.random());
            lightColorRadius.push(Math.random());
            lightColorRadius.push(Math.random());

            lightColorRadius.push(10.0);


            //getLightBoundingBox(vec4.create([lights[i].position[0], lights[i].position[1], lights[i].position[2], 1.0]), lights[i].radius, pv, viewport, boundary);
            var lposLen = lightPosition.length;
            var lcolRLen = lightColorRadius.length;
            //console.log(lightPosition[lposLen-3] + " " + lightPosition[lposLen-2] + " " +lightPosition[lposLen-1]);
            //getLightBoundingBox(vec4.create(lightPosition[lposLen-3], lightPosition[lposLen-2], lightPosition[lposLen-1], 1.0), lightColorRadius[lcolRLen-1], pv, viewport, boundary);
            getLightBoundingBox(vec4.create([i,i,i, 1.0]), lightColorRadius[lcolRLen-1], pv, viewport, boundary);
            //console.log(boundary.left + " " + boundary.right + " " + boundary.bottom + " " + boundary.top);
            setLightOnTile(boundary, i, tileLightId);
        }
        
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


    function keyPress(e){
        var keynum;
        
        if(window.event){ // IE                 
            keynum = e.keyCode;
        }else
            if(e.which){ // Netscape/Firefox/Opera                  
                keynum = e.which;
        }
        //console.log(String.fromCharCode(keynum));
        display_type = keynum - 49;
    }
   
   document.onkeypress = keyPress



   var mouseLeftDown = false;
   var mouseRightDown = false;
   var lastMouseX = null;
   var lastMouseY = null;

    function handleMouseDown(event) {
        if( event.button == 2 ) {
            mouseLeftDown = false;
            mouseRightDown = true;
        }
        else {
            mouseLeftDown = true;
            mouseRightDown = false;
        }
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }

    function handleMouseUp(event) {
        mouseLeftDown = false;
        mouseRightDown = false;
    }

    function handleMouseMove(event) {
        if (!(mouseLeftDown || mouseRightDown)) {
            return;
        }
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;
        
        if( mouseLeftDown )
        {
            azimuth += 0.01 * deltaX;
            elevation += 0.01 * deltaY;
            elevation = Math.min(Math.max(elevation, -Math.PI/2+0.001), Math.PI/2-0.001);
        }
        else
        {
            radius += 0.01 * deltaY;
            radius = Math.min(Math.max(radius, 2.0), 10.0);
        }
        eye = sphericalToCartesian(radius, azimuth, elevation);
        view = mat4.create();
        mat4.lookAt(eye, center, up, view);

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


    model = mat4.create();
    mat4.identity(model);
   
    mv = mat4.create();
    mat4.multiply(view, model, mv);

    invTrans = mat4.create();
    mat4.inverse(mv, invTrans);
    mat4.transpose(invTrans);


    var lightdir = vec3.create([1.0, 0.0, 1.0]);
    var lightdest = vec4.create();
    vec3.normalize(lightdir);
    mat4.multiplyVec4(view, [lightdir[0], lightdir[1], lightdir[2], 0.0], lightdest);
    lightdir = vec3.createFrom(lightdest[0],lightdest[1],lightdest[2]);
    vec3.normalize(lightdir);   



    function animate() {   
     	//1
     	bindFBO(0);
     	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
     	drawmesh();     	

     	//2
     	setTextures();
     	bindFBO(1);
     	gl.enable(gl.BLEND);
     	gl.disable(gl.DEPTH_TEST);
     	gl.blendFunc(gl.ONE, gl.ONE);
     	gl.clear(gl.COLOR_BUFFER_BIT);       
       

        setupQuad(diagnostic_prog);
        
        var lightPos = vec4.create([0.0, 4.0, 0.0, 1.0]);
        lightPos = mat4.multiplyVec4(view, lightPos);        
        gl.uniform4fv(gl.getUniformLocation(diagnostic_prog,"u_Light"), lightPos);
        
        drawQuad();

        setUpLights();
        setupQuad(light_prog);
        lightQuad(light_prog);
        drawQuad();

     	setupQuad(ambient_prog);
     	drawQuad();
        gl.disable(gl.BLEND);


     	//3
     	setTextures();
     	gl.useProgram(post_prog);
     	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
     	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

     	gl.activeTexture(gl.TEXTURE0);
    	gl.bindTexture(gl.TEXTURE_2D, postTexture);
    	gl.uniform1i(gl.getUniformLocation(post_prog, "u_Posttex"),0);

    	drawQuad();
    	
        //reset
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D,null);

    	//time += 0.001;
        
        window.requestAnimFrame(animate); 
        stats.update();
     	//window.requestAnimFrame(animate);
     }
     animate();
    
 }());