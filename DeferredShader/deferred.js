(function() {

	function sphericalToCartesian( r, a, e ) {
        var x = r * Math.cos(e) * Math.cos(a);
        var y = r * Math.sin(e);
        var z = r * Math.cos(e) * Math.sin(a);

        return [x,y,z];
    }


	var NUM_WIDTH_PTS = 64;
    var NUM_HEIGHT_PTS = 64;

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

    var persp = mat4.create();
    mat4.perspective(45.0, canvas.width/canvas.height, 0.1, 100.0, persp);

    var radius = 5.0;
    var azimuth = Math.PI;
    var elevation = 0.0001;

    var eye = sphericalToCartesian(radius, azimuth, elevation);
    var center = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    var view = mat4.create();
    mat4.lookAt(eye, center, up, view);



    var positionLocation = 0;
    var normalLocation = 1;
    var texCoordLocation = 2;
    var u_InvTransLocation;
    var u_ModelLocation;
    var u_ViewLocation;
    var u_PerspLocation;
    var u_CameraSpaceDirLightLocation;

    var quad_positionLocation = 0;
    var quad_texCoordLocation = 1;

    var pass_prog;
    var diagnostic_prog;
    var ambient_prog;
    var post_prog;

    var ext = null;

    var extensionConstants = [
	  { name: "MAX_COLOR_ATTACHMENTS_WEBGL", enum: 0x8CDF, expectedFn: function(v) { return v > 0; }, passMsg: " should be > 0"},
	  { name: "MAX_DRAW_BUFFERS_WEBGL",      enum: 0x8824, expectedFn: function(v) { return v > 0; }, passMsg: " should be > 0"},

	  { name: "COLOR_ATTACHMENT0_WEBGL",     enum: 0x8CE0, },
	  { name: "COLOR_ATTACHMENT1_WEBGL",     enum: 0x8CE1, },
	  { name: "COLOR_ATTACHMENT2_WEBGL",     enum: 0x8CE2, },
	  { name: "COLOR_ATTACHMENT3_WEBGL",     enum: 0x8CE3, },
	  { name: "COLOR_ATTACHMENT4_WEBGL",     enum: 0x8CE4, },
	  { name: "COLOR_ATTACHMENT5_WEBGL",     enum: 0x8CE5, },
	  { name: "COLOR_ATTACHMENT6_WEBGL",     enum: 0x8CE6, },
	  { name: "COLOR_ATTACHMENT7_WEBGL",     enum: 0x8CE7, },
	  { name: "COLOR_ATTACHMENT8_WEBGL",     enum: 0x8CE8, },
	  { name: "COLOR_ATTACHMENT9_WEBGL",     enum: 0x8CE9, },
	  { name: "COLOR_ATTACHMENT10_WEBGL",    enum: 0x8CEA, },
	  { name: "COLOR_ATTACHMENT11_WEBGL",    enum: 0x8CEB, },
	  { name: "COLOR_ATTACHMENT12_WEBGL",    enum: 0x8CEC, },
	  { name: "COLOR_ATTACHMENT13_WEBGL",    enum: 0x8CED, },
	  { name: "COLOR_ATTACHMENT14_WEBGL",    enum: 0x8CEE, },
	  { name: "COLOR_ATTACHMENT15_WEBGL",    enum: 0x8CEF, },

	  { name: "DRAW_BUFFER0_WEBGL",          enum: 0x8825, },
	  { name: "DRAW_BUFFER1_WEBGL",          enum: 0x8826, },
	  { name: "DRAW_BUFFER2_WEBGL",          enum: 0x8827, },
	  { name: "DRAW_BUFFER3_WEBGL",          enum: 0x8828, },
	  { name: "DRAW_BUFFER4_WEBGL",          enum: 0x8829, },
	  { name: "DRAW_BUFFER5_WEBGL",          enum: 0x882A, },
	  { name: "DRAW_BUFFER6_WEBGL",          enum: 0x882B, },
	  { name: "DRAW_BUFFER7_WEBGL",          enum: 0x882C, },
	  { name: "DRAW_BUFFER8_WEBGL",          enum: 0x882D, },
	  { name: "DRAW_BUFFER9_WEBGL",          enum: 0x882E, },
	  { name: "DRAW_BUFFER10_WEBGL",         enum: 0x882F, },
	  { name: "DRAW_BUFFER11_WEBGL",         enum: 0x8830, },
	  { name: "DRAW_BUFFER12_WEBGL",         enum: 0x8831, },
	  { name: "DRAW_BUFFER13_WEBGL",         enum: 0x8832, },
	  { name: "DRAW_BUFFER14_WEBGL",         enum: 0x8833, },
	  { name: "DRAW_BUFFER15_WEBGL",         enum: 0x8834, },
	];



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
            alert("Could not initialise shaders1");
        }
    	
        //Second shaders
    	vs = getShaderSource(document.getElementById("shade_vs"));
    	fs = getShaderSource(document.getElementById("diagnostic_fs"));
    	
    	diagnostic_prog = createProgram(gl, vs, fs, message);
    	gl.bindAttribLocation(diagnostic_prog, quad_positionLocation, "Position");
    	gl.bindAttribLocation(diagnostic_prog, quad_texCoordLocation, "Texcoord");
    	
    	if (!gl.getProgramParameter(diagnostic_prog, gl.LINK_STATUS)) {
            alert("Could not initialise shaders2");
        }

    	vs = getShaderSource(document.getElementById("shade_vs"));
    	fs = getShaderSource(document.getElementById("ambient_fs"));
    	
    	ambient_prog = createProgram(gl, vs, fs, message);
    	gl.bindAttribLocation(ambient_prog, quad_positionLocation, "Position");
    	gl.bindAttribLocation(ambient_prog, quad_texCoordLocation, "Texcoord");
    	
    	if (!gl.getProgramParameter(ambient_prog, gl.LINK_STATUS)) {
            alert("Could not initialise shaders3");
        }

        //Third shader
    	vs = getShaderSource(document.getElementById("post_vs"));
    	fs = getShaderSource(document.getElementById("post_fs"));
    
    	post_prog = createProgram(gl, vs, fs, message);
    	gl.bindAttribLocation(post_prog, quad_positionLocation, "Position");
    	gl.bindAttribLocation(post_prog, quad_texCoordLocation, "Texcoord");

    	if (!gl.getProgramParameter(post_prog, gl.LINK_STATUS)) {
            alert("Could not initialise shaders4");
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
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);

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
    	bufs[3] = ext.COLOR_ATTACHMENT3_WEBGL;
    	//ext.drawBuffersWEBGL(bufs);


		gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

        // gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        // gl.framebufferTexture2D(gl.FRAMEBUFFER, bufs[3], gl.TEXTURE_2D, depthTexture, 0);
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
            //gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
            //gl.enableVertexAttribArray(positionLocation);
            
            // Normals
            normalsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalsName);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            //gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
            //gl.enableVertexAttribArray(normalLocation);
            
            // TextureCoords
            texCoordsName = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsName);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
            //gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
            //gl.enableVertexAttribArray(texCoordLocation);

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

    	var model = mat4.create();
        mat4.identity(model);
        mat4.rotate(model, 23.4/180*Math.PI, [0.0, 0.0, 1.0]);
        mat4.rotate(model, Math.PI, [1.0, 0.0, 0.0]);
        mat4.rotate(model, -time, [0.0, 1.0, 0.0]);
        var mv = mat4.create();
        mat4.multiply(view, model, mv);

        var invTrans = mat4.create();
        mat4.inverse(mv, invTrans);
        mat4.transpose(invTrans);

        gl.uniformMatrix4fv(gl.getUniformLocation(pass_prog,"u_Model"),false,model);
    	gl.uniformMatrix4fv(gl.getUniformLocation(pass_prog,"u_View"),false,view);
    	gl.uniformMatrix4fv(gl.getUniformLocation(pass_prog,"u_Persp"),false,persp);
    	gl.uniformMatrix4fv(gl.getUniformLocation(pass_prog,"u_InvTrans"),false,invTrans);

    	gl.enableVertexAttribArray(positionLocation);
        gl.enableVertexAttribArray(normalLocation);
        gl.enableVertexAttribArray(texCoordLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionsName);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 12, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalsName);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 12, 0);        

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsName);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 8, 0);        

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName); 
        
        gl.drawElements(gl.TRIANGLES, numberOfIndices, gl.UNSIGNED_SHORT,0);

        gl.disableVertexAttribArray(positionLocation);
        gl.disableVertexAttribArray(normalLocation);
        gl.disableVertexAttribArray(texCoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }


    function setupQuad(program)
    {
    	gl.useProgram(program);
        //gl.enable(gl.BLEND);

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
        gl.vertexAttribPointer(quad_positionLocation, 3, gl.FLOAT, false, 12, 0);

        gl.enableVertexAttribArray(quad_texCoordLocation);  
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_textures);  
        gl.vertexAttribPointer(quad_texCoordLocation, 2, gl.FLOAT, false, 8, 0); 

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

     function animate() {

     	console.log("animating");
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
     	drawQuad();
     	setupQuad(ambient_prog);
     	drawQuad();

     	//3
     	setTextures();
     	gl.useProgram(post_prog);
     	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
     	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

     	gl.activeTexture(gl.TEXTURE0);
    	gl.bindTexture(gl.TEXTURE_2D, postTexture);
    	gl.uniform1i(gl.getUniformLocation(post_prog, "u_Posttex"),0);

    	drawQuad();

    	gl.enable(gl.DEPTH_TEST);

    	time += 0.001;
        //window.requestAnimFrame(animate); 
     	//window.requestAnimFrame(animate);
     }

     animate();
 }());