(function(){
	
	var gl;
	var view,presp,model,inverse;
    var checkboxs =[]; // 0:normal,1:color,2:position,3: depth, 4,diffuse


    function initGL(canvas) {
        try {
            gl = canvas.getContext("webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
        var depthTextureExtension = gl.getExtension("WEBGL_depth_texture");         
        //console.log("extension: "+depthTextureExtension);
        if (!depthTextureExtension) {
            alert("depth textures not supported");
        }
        gl.getExtension("OES_texture_float");
        gl.getExtension("OES_texture_float_linear");
    }
	
     function sphericalToCartesian( r, a, e ) {
        var x = r * Math.cos(e) * Math.cos(a);
        var y = r * Math.sin(e);
        var z = r * Math.cos(e) * Math.sin(a);

        return [x,y,z];
    }

    var radius = 5.0;
    var azimuth = Math.PI;
    var elevation = 0.0001;

    var eye = sphericalToCartesian(radius, azimuth, elevation);
    //console.log("eye initial " + eye);
    var center = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    view = mat4.create();
    mat4.lookAt(eye, center, up, view);


	function getShader(gl,id){
		
		var shaderScript = document.getElementById(id);
		if(!shaderScript){
			console.log("didn't get shader");
			return null;
		}
		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3) {
				str += k.textContent;
			}
			k = k.nextSibling;
		}
		var shader;
		if (shaderScript.type == "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
			//console.log("create fragment shader");
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
			//console.log("create vertex shader");
		} else {
			console.log("none");
			return null;
		}
	
		gl.shaderSource(shader, str);
		gl.compileShader(shader);
	
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.log("fail");
			alert(gl.getShaderInfoLog(shader));
			return null;
		}
	
		return shader;
	}
	
	var shaderProgram = new Array();    
	function initShader(){
		var frags = getShader(gl,"fs");
		var verts = getShader(gl,"vs");
		if(frags == null || verts == null)
		{
			console.log("didn't loaded");
			return;
		}
		shaderProgram[0] = gl.createProgram();
		gl.attachShader(shaderProgram[0],verts);
		gl.attachShader(shaderProgram[0],frags);
		gl.linkProgram(shaderProgram[0]);
		if (!gl.getProgramParameter(shaderProgram[0], gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}
	
		gl.useProgram(shaderProgram[0]);
		
		shaderProgram[0].vertexPositionAttribute = gl.getAttribLocation(shaderProgram[0],"Position");
		console.log("position " + shaderProgram[0].vertexPositionAttribute);
		gl.enableVertexAttribArray(shaderProgram[0].vertexPositionAttribute);
		

		shaderProgram[0].vertexTexcoordAttribute = gl.getAttribLocation(shaderProgram[0],"Texcood");
		console.log("texcoord " + shaderProgram[0].vertexTexcoordAttribute);
		gl.enableVertexAttribArray(shaderProgram[0].vertexTexcoordAttribute);

		shaderProgram[0].vertexNormalAttribute = gl.getAttribLocation(shaderProgram[0],"Normal");
		console.log("normal " + shaderProgram[0].vertexNormalAttribute);
		gl.enableVertexAttribArray(shaderProgram[0].vertexNormalAttribute);


		// get location of uniforms and set them as properties of shaderProgram[0]...
		shaderProgram[0].modelMatrixUniform = gl.getUniformLocation(shaderProgram[0],"u_Model");
		shaderProgram[0].viewMatrixUniform = gl.getUniformLocation(shaderProgram[0],"u_View");	
		shaderProgram[0].perspMatrixUniform = gl.getUniformLocation(shaderProgram[0],"u_Persp");
		shaderProgram[0].inverseMatrixUniform = gl.getUniformLocation(shaderProgram[0],"u_Inverse");
		shaderProgram[0].drawmode = gl.getUniformLocation(shaderProgram[0],"u_DrawMode");
		shaderProgram[0].colorsampler = gl.getUniformLocation(shaderProgram[0],"u_ColorSampler");
		

		if(shaderProgram[0].modelMatrixUniform == null || shaderProgram[0].viewMatrixUniform == null
		 || shaderProgram[0].perspMatrixUniform == null || shaderProgram[0].inverseMatrixUniform == null
		 || shaderProgram[0].drawmode == null )
		{
			console.log("fail to get uniforms " + shaderProgram[0].modelMatrixUniform + ", "+ 
				shaderProgram[0].viewMatrixUniform + ", " + shaderProgram[0].perspMatrixUniform
				+ " , " + shaderProgram[0].inverseMatrixUniform + " , " + shaderProgram[0].drawmode
				);		
		}

        //shader2
        var frags2 = getShader(gl,"quadfs");
        var verts2 = getShader(gl,"quadvs");
        if(frags2== null || verts2 == null)
        {
            console.log("didn't get quad shader");
            return;
        }
        shaderProgram[1] = gl.createProgram();
        gl.attachShader(shaderProgram[1],verts2);
        gl.attachShader(shaderProgram[1],frags2);
        gl.linkProgram(shaderProgram[1]);
        if (!gl.getProgramParameter(shaderProgram[1], gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }
        gl.useProgram(shaderProgram[1]);

        shaderProgram[1].vertexPositionAttribute = gl.getAttribLocation(shaderProgram[1],"Position");
        console.log("quad shader position: " + shaderProgram[1].vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgram[1].vertexAttribPointer);

        shaderProgram[1].vertexTexcoordAttribute = gl.getAttribLocation(shaderProgram[1],"Texcoord");
        console.log("quad shader texcoord: " + shaderProgram[1].vertexTexcoordAttribute);
        gl.enableVertexAttribArray(shaderProgram[1].vertexTexcoordAttribute);
		
        shaderProgram[1].normalsampler = gl.getUniformLocation(shaderProgram[1],"u_NormalSampler");
        shaderProgram[1].colorsampler = gl.getUniformLocation(shaderProgram[1],"u_ColorSampler");
        shaderProgram[1].positionsampler = gl.getUniformLocation(shaderProgram[1],"u_PositionSampler");
        shaderProgram[1].depthsampler = gl.getUniformLocation(shaderProgram[1],"u_DepthSampler");

        shaderProgram[1].displaymode = gl.getUniformLocation(shaderProgram[1],"u_Displaymode");

        if(shaderProgram[1].normalsampler == null || shaderProgram[1].colorsampler == null
             || shaderProgram[1].displaymode == null || shaderProgram[1].positionsampler == null || shaderProgram[1].depthsampler == null)
        {
            console.log(shaderProgram[1].normalsampler + 
                " , "+ shaderProgram[1].colorsampler + " , " + shaderProgram[1].displaymode
                + ", "+shaderProgram[1].positionsampler + ", "+ shaderProgram[1].depthsampler);
        }

	}

	function handleLoadedTexture(texture){
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.FLOAT, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);
	}

	var rttFramebuffers= [];
    var rttTextures = []; // 0: normal, 1: color, 2: position, 3: depth

    function createAndSetupTexture(gl,i){
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // if(i == 3)
        // {
        //     //depth componenet
        //     gl.texParameteri(gl.TEXTURE_2D,gl.DEPTH_TEXTURE_MODE,gl.INTENSITY);
        // }
        return texture;
    }

	function initTextureFramebuffer(){
		//setting up framebuffer
        //setting up normal texture
        for(var i = 0; i<4; ++i)
        {
            var fbo = gl.createFramebuffer();
            rttFramebuffers.push(fbo);
            gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
            fbo.width = gl.viewportWidth;
            fbo.height = gl.viewportHeight;

            var texture = createAndSetupTexture(gl,i);
            rttTextures.push(texture);
            if(i == 3)
            {
                //depth compoenent
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, fbo.width, fbo.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
            }
            else
            {
                 gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbo.width, fbo.height, 0, gl.RGBA, gl.FLOAT, null);
                 //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);
                 //just tell we don't have any image data and just like to allocate a particular amount of empty space on graphics card
            }
           

            var renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                fbo.width, fbo.height);

            if(i == 3)
            {
                 gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
            }
            else
            {
                 gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            }
           
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

            //set texture, renderbuffer, and framebuffer back to their defaults
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }	
        console.log("framebuffer length: " + rttFramebuffers.length);
        console.log("texture buffer length: " + rttTextures.length);
	}

	var colorTexture;
	function initTexture(){
		colorTexture = gl.createTexture();
		colorTexture.image = new Image();
		colorTexture.image.onload = function(){
			handleLoadedTexture(colorTexture);
		}
		colorTexture.image.src = "moon.gif";        
	}


	
	persp = mat4.create();
	model = mat4.create();
	inverse = mat4.create();

	function setMatrixUniforms(){
		gl.uniformMatrix4fv(shaderProgram[0].modelMatrixUniform,false,model);
		gl.uniformMatrix4fv(shaderProgram[0].viewMatrixUniform,false, view);
		gl.uniformMatrix4fv(shaderProgram[0].perspMatrixUniform,false,persp);
		gl.uniformMatrix4fv(shaderProgram[0].inverseMatrixUniform,false,inverse);		
	}
	
    var quadvbo;
    var quadibo;
    var quadtbo;
    function initQuadBuffers()
    {
        quadvbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,quadvbo);;
        var vertices = [
             1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        quadvbo.itemSize = 3;
        meshvbo.numItems = 4;
        
        quadtbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadtbo);
        var textureCoords = [
            1.0,1.0,
            0.0,1.0,
            0.0,0.0,
            1.0,0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords),gl.STATIC_DRAW);
        quadtbo.itemSize = 2;
        quadtbo.numItems = 4;

        quadibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadibo);
        var quadIndices = [0,1,2,0,2,3];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadIndices), gl.STATIC_DRAW);
        quadibo.itemSize = 1;
        quadibo.numItems = 6;


    }


	var meshvbo;
	var meshcbo;
	var meshnbo;
	var meshibo;
	var meshtbo;
	function initMeshBuffers()
	{
        //cube
        // meshvbo = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER,meshvbo);
        // vertices = [
        //     // Front face
        //     -1.0, -1.0,  1.0,
        //      1.0, -1.0,  1.0,
        //      1.0,  1.0,  1.0,
        //     -1.0,  1.0,  1.0,

        //     // Back face
        //     -1.0, -1.0, -1.0,
        //     -1.0,  1.0, -1.0,
        //      1.0,  1.0, -1.0,
        //      1.0, -1.0, -1.0,

        //     // Top face
        //     -1.0,  1.0, -1.0,
        //     -1.0,  1.0,  1.0,
        //      1.0,  1.0,  1.0,
        //      1.0,  1.0, -1.0,

        //     // Bottom face
        //     -1.0, -1.0, -1.0,
        //      1.0, -1.0, -1.0,
        //      1.0, -1.0,  1.0,
        //     -1.0, -1.0,  1.0,

        //     // Right face
        //      1.0, -1.0, -1.0,
        //      1.0,  1.0, -1.0,
        //      1.0,  1.0,  1.0,
        //      1.0, -1.0,  1.0,

        //     // Left face
        //     -1.0, -1.0, -1.0,
        //     -1.0, -1.0,  1.0,
        //     -1.0,  1.0,  1.0,
        //     -1.0,  1.0, -1.0,
        // ];
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        // meshvbo.itemSize = 3;
        // meshvbo.numItems = 24;

        // meshnbo = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, meshnbo);
        // var vertexNormals = [
        //     // Front face
        //      0.0,  0.0,  1.0,
        //      0.0,  0.0,  1.0,
        //      0.0,  0.0,  1.0,
        //      0.0,  0.0,  1.0,

        //     // Back face
        //      0.0,  0.0, -1.0,
        //      0.0,  0.0, -1.0,
        //      0.0,  0.0, -1.0,
        //      0.0,  0.0, -1.0,

        //     // Top face
        //      0.0,  1.0,  0.0,
        //      0.0,  1.0,  0.0,
        //      0.0,  1.0,  0.0,
        //      0.0,  1.0,  0.0,

        //     // Bottom face
        //      0.0, -1.0,  0.0,
        //      0.0, -1.0,  0.0,
        //      0.0, -1.0,  0.0,
        //      0.0, -1.0,  0.0,

        //     // Right face
        //      1.0,  0.0,  0.0,
        //      1.0,  0.0,  0.0,
        //      1.0,  0.0,  0.0,
        //      1.0,  0.0,  0.0,

        //     // Left face
        //     -1.0,  0.0,  0.0,
        //     -1.0,  0.0,  0.0,
        //     -1.0,  0.0,  0.0,
        //     -1.0,  0.0,  0.0,
        // ];
        //  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
        //  meshnbo.itemSize = 3;
        //  meshnbo.numItems = 24;

        //  meshtbo = gl.createBuffer();
        //  gl.bindBuffer(gl.ARRAY_BUFFER, meshtbo);
        //  var textureCoords = [
        //     // Front face
        //     0.0, 0.0,
        //     1.0, 0.0,
        //     1.0, 1.0,
        //     0.0, 1.0,

        //     // Back face
        //     1.0, 0.0,
        //     1.0, 1.0,
        //     0.0, 1.0,
        //     0.0, 0.0,

        //     // Top face
        //     0.0, 1.0,
        //     0.0, 0.0,
        //     1.0, 0.0,
        //     1.0, 1.0,

        //     // Bottom face
        //     1.0, 1.0,
        //     0.0, 1.0,
        //     0.0, 0.0,
        //     1.0, 0.0,

        //     // Right face
        //     1.0, 0.0,
        //     1.0, 1.0,
        //     0.0, 1.0,
        //     0.0, 0.0,

        //     // Left face
        //     0.0, 0.0,
        //     1.0, 0.0,
        //     1.0, 1.0,
        //     0.0, 1.0
        // ];
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        // meshtbo.itemSize = 2;
        // meshtbo.numItems = 24;

        // meshibo = gl.createBuffer();
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshibo);
        // var cubeVertexIndices = [
        //     0, 1, 2,      0, 2, 3,    // Front face
        //     4, 5, 6,      4, 6, 7,    // Back face
        //     8, 9, 10,     8, 10, 11,  // Top face
        //     12, 13, 14,   12, 14, 15, // Bottom face
        //     16, 17, 18,   16, 18, 19, // Right face
        //     20, 21, 22,   20, 22, 23  // Left face
        // ];
        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
        // meshibo.itemSize = 1;
        // meshibo.numItems = 36;

		var latitudeBands = 30;
        var longitudeBands = 30;
        var radius = 1.0;

        var vertexPositionData = [];
        var normalData = [];
        var textureCoordData = [];
        for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1 - (longNumber / longitudeBands);
                var v = 1 - (latNumber / latitudeBands);

                normalData.push(x);
                normalData.push(y);
                normalData.push(z);
                textureCoordData.push(u);
                textureCoordData.push(v);
                vertexPositionData.push(radius * x);
                vertexPositionData.push(radius * y);
                vertexPositionData.push(radius * z);
            }
        }

        var indexData = [];
        for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }

        meshnbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, meshnbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
        meshnbo.itemSize = 3;
        meshnbo.numItems = normalData.length / 3;

        meshtbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, meshtbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
        meshtbo.itemSize = 2;
        meshtbo.numItems = textureCoordData.length / 2;

        meshvbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, meshvbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
        meshvbo.itemSize = 3;
        meshvbo.numItems = vertexPositionData.length / 3;

        meshibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
        meshibo.itemSize = 1;
        meshibo.numItems = indexData.length;
	}
    var time = 0;

    function setupQuad(program){
        gl.useProgram(program);
        var qpersp  = mat4.create;
        mat4.perspective(45.0, gl.viewportWidth/gl.viewportHeight,0.1,100.0,qpersp);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, rttTextures[0]);
        gl.uniform1i(shaderProgram[1].normalsampler,0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D,rttTextures[1]);
        gl.uniform1i(shaderProgram[1].colorsampler,1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D,rttTextures[2]);
        gl.uniform1i(shaderProgram[1].positionsampler,2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D,rttTextures[3]);
        gl.uniform1i(shaderProgram[1].depthsampler,3);

    }

    function drawQuad(mode){
        
        gl.bindBuffer(gl.ARRAY_BUFFER,quadvbo);
        gl.vertexAttribPointer(shaderProgram[1].vertexPositionAttribute,quadvbo.itemSize,gl.FLOAT,false,0,0);

        gl.bindBuffer(gl.ARRAY_BUFFER,quadtbo);
        gl.vertexAttribPointer(shaderProgram[1].vertexTexcoordAttribute,quadtbo.itemSize,gl.FLOAT,false,0,0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadibo);

        gl.drawElements(gl.TRIANGLES, quadibo.numItems, gl.UNSIGNED_SHORT, 0);

        gl.uniform1i(shaderProgram[1].displaymode,mode);
    }   

	function drawMesh(drawmode){	
        //console.log("time: " + time);	
        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(shaderProgram[0]);
		gl.viewport(0,0,gl.viewportWidth,gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mat4.perspective(45.0,gl.viewportWidth/gl.viewportHeight,0.1,100.0,persp);

        mat4.identity(model);
        mat4.scale(model,[0.5,0.5,0.5]);

        var mv = mat4.create();
        mat4.multiply(view, model, mv);

        inverse = mat4.create();
        mat4.identity(inverse);
        mat4.inverse(mv, inverse);
        mat4.transpose(inverse);

		gl.uniform1i(shaderProgram[0].drawmode,drawmode);

		gl.bindBuffer(gl.ARRAY_BUFFER, meshvbo);
        gl.vertexAttribPointer(shaderProgram[0].vertexPositionAttribute, meshvbo.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, meshtbo);
        gl.vertexAttribPointer(shaderProgram[0].vertexTexcoordAttribute, meshtbo.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, meshnbo);
        gl.vertexAttribPointer(shaderProgram[0].vertexNormalAttribute, meshnbo.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.uniform1i(shaderProgram[0].colorsampler,0); // 0 represents the index of texture

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshibo);        	
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, meshibo.numItems, gl.UNSIGNED_SHORT, 0);

        gl.bindTexture(gl.TEXTURE_2D,rttTextures[drawmode]);
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D,null);
	}
	function drawScene(){
		gl.useProgram(shaderProgram[0]);		
		
        for(var i = 0; i<3; ++i)
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffers[i]);
            drawMesh(i);
        }
       
		gl.bindFramebuffer(gl.FRAMEBUFFER,null);

        gl.disable(gl.DEPTH_TEST);
        setupQuad(shaderProgram[1]);
        // todo: change the draw mode here
        //0: normal //1: color // 2: screen space position // 3: depth // 4: diffuse
        for(var checkboxidx = 0; checkboxidx < checkboxs.length; ++checkboxidx)
        {
            if(checkboxs[checkboxidx].checked == true)
            {
                drawQuad(checkboxidx);
            }
        }
        //drawQuad(4);
	}

	//Mouse events from project5
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
        time = 0;
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
       // console.log("eye updated " + eye);
        //view = mat4.create();
        mat4.lookAt(eye, center, up, view);

        lastMouseX = newX;
        lastMouseY = newY;
    }

    
 	function tick() {
        requestAnimFrame(tick);
        drawScene();
        time ++;
        //console.log(time);
    }

    function initCheckbox(){

        var checkbox = document.getElementById("normal");
        checkboxs.push(checkbox);        
        checkbox = document.getElementById("color");
        checkboxs.push(checkbox);
        checkbox = document.getElementById("position");
        checkboxs.push(checkbox);
        checkbox = document.getElementById("depth");
        checkboxs.push(checkbox);
        checkbox = document.getElementById("diffuse");
        checkboxs.push(checkbox);
        console.log("checkbox length: "+checkboxs.length);

        checkboxs[3].disabled = true;
        // for(var i = 0;i<checkboxs.length; ++i)
        // {
            
        //     if(i == 3)
        //     {
        //         checkboxs[i].checked = false;
        //         checkboxs[i].disabled = true;
        //         continue;
        //     }
        //     if(i == 4)
        //         checkboxs[i].checked = true;
        //     else
        //         checkboxs[i].checked = false;

        // }
    }

	(function loadWebGL(){        
		var canvas = document.getElementById("canvas");
		initGL(canvas);
		initShader();		
		initMeshBuffers();
        initQuadBuffers();
		initTexture();
        initCheckbox()

		initTextureFramebuffer();

		gl.clearColor(0.0,0.0,0,1.0);
		gl.enable(gl.DEPTH_TEST);
		
		canvas.onmousedown = handleMouseDown;
	    canvas.oncontextmenu = function(ev) {return false;};
	    document.onmouseup = handleMouseUp;
	    document.onmousemove = handleMouseMove;

	    tick();
	})();
})();