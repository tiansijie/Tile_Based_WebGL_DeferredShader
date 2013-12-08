(function(){
	
    var stats = new Stats();
   

	var gl;
	var view,persp,model,inverse;
    var checkboxs =[]; // 0:normal,1:color,2:position,3: depth, 4,diffuse
    var needupdate = true; // control the update face info times
    var depthvalues = [];// = new Uint8Array(gl.viewportWidth * gl.viewportHeight * 4);
    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
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

        // gl.ClampColor(gl.CLAMP_READ_COLOR, gl.FALSE);
        // gl.ClampColor(gl.CLAMP_VERTEX_COLOR, gl.FALSE);
        // gl.ClampColor(gl.CLAMP_FRAGMENT_COLOR, gl.FALSE);
       // var context = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
    }
	
     function sphericalToCartesian( r, a, e ) {
        var x = r * Math.cos(e) * Math.cos(a);
        var y = r * Math.sin(e);
        var z = r * Math.cos(e) * Math.sin(a);

        return [x,y,z];
    }

    var radius = 20.0;
    var azimuth = Math.PI;
    var elevation = 0.0001;

    var eye = sphericalToCartesian(radius, azimuth, elevation);
    //console.log("eye initial " + eye);
    var center = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    var viewVector = [center[0] - eye[0],center[1] - eye[1],center[2]-eye[2]];
    
    viewVector = vec3.normalize(viewVector);
   // console.log("view Vector: " + viewVector);

    view = mat4.create();
    mat4.lookAt(eye, center, up, view);

    function normalize(vec){
        var vec2;
        var length = vec[0]*vec[0] + vec[1] * vec[1] + vec[2] * vec[2];
        length = Math.sqrt(length);       
        vec2 = [vec[0] / length, vec[1]/length,vec[2]/length];
        return vec2;
    }
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
		//console.log("position " + shaderProgram[0].vertexPositionAttribute);
		gl.enableVertexAttribArray(shaderProgram[0].vertexPositionAttribute);
		

		shaderProgram[0].vertexTexcoordAttribute = gl.getAttribLocation(shaderProgram[0],"Texcood");
		//console.log("texcoord " + shaderProgram[0].vertexTexcoordAttribute);
		gl.enableVertexAttribArray(shaderProgram[0].vertexTexcoordAttribute);

		shaderProgram[0].vertexNormalAttribute = gl.getAttribLocation(shaderProgram[0],"Normal");
		//console.log("normal " + shaderProgram[0].vertexNormalAttribute);
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
       // console.log("quad shader position: " + shaderProgram[1].vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgram[1].vertexPositionAttribute);

        shaderProgram[1].vertexTexcoordAttribute = gl.getAttribLocation(shaderProgram[1],"Texcoord");
       // console.log("quad shader texcoord: " + shaderProgram[1].vertexTexcoordAttribute);
        gl.enableVertexAttribArray(shaderProgram[1].vertexTexcoordAttribute);
		
        shaderProgram[1].normalsampler = gl.getUniformLocation(shaderProgram[1],"u_NormalSampler");
        shaderProgram[1].colorsampler = gl.getUniformLocation(shaderProgram[1],"u_ColorSampler");
        shaderProgram[1].positionsampler = gl.getUniformLocation(shaderProgram[1],"u_PositionSampler");
        shaderProgram[1].depthsampler = gl.getUniformLocation(shaderProgram[1],"u_DepthSampler");
        shaderProgram[1].depthsamplerfake = gl.getUniformLocation(shaderProgram[1],"u_DepthSamplerFake");
        shaderProgram[1].silcolorsampler = gl.getUniformLocation(shaderProgram[1],"u_SilColorSampler");
        shaderProgram[1].sildepthsampler = gl.getUniformLocation(shaderProgram[1],"u_SilDepthSampler");
        shaderProgram[1].displaymode = gl.getUniformLocation(shaderProgram[1],"u_Displaymode");

        // if(shaderProgram[1].normalsampler == null || shaderProgram[1].colorsampler == null
        //      || shaderProgram[1].displaymode == null || shaderProgram[1].positionsampler == null || shaderProgram[1].depthsampler == null)
        // {
        //     // console.log(shaderProgram[1].normalsampler + 
        //     //     " , "+ shaderProgram[1].colorsampler + " , " + shaderProgram[1].displaymode
        //     //     + ", "+shaderProgram[1].positionsampler + ", "+ shaderProgram[1].depthsampler);
            
        // }

        var frags3 = getShader(gl,"siledgefs");
        var verts3 = getShader(gl,"siledgevs");
        if(frags3 == null || verts3 == null)
        {
            alert("didn't get silhouette shader");
        } 

        shaderProgram[2] = gl.createProgram();
        gl.attachShader(shaderProgram[2],verts3);
        gl.attachShader(shaderProgram[2],frags3);
        gl.linkProgram(shaderProgram[2]);
        if (!gl.getProgramParameter(shaderProgram[2], gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }
        gl.useProgram(shaderProgram[2]);
        shaderProgram[2].vertexPositionAttribute = gl.getAttribLocation(shaderProgram[2],"Position");
        gl.enableVertexAttribArray(shaderProgram[2].vertexPositionAttribute);
        shaderProgram[2].vertexColorAttribute = gl.getAttribLocation(shaderProgram[2],"Color");
        gl.enableVertexAttribArray(shaderProgram[2].vertexColorAttribute);

        shaderProgram[2].modelMatrixUniform = gl.getUniformLocation(shaderProgram[2],"u_Model");
        shaderProgram[2].viewMatrixUniform = gl.getUniformLocation(shaderProgram[2],"u_View");  
        shaderProgram[2].perspMatrixUniform = gl.getUniformLocation(shaderProgram[2],"u_Persp");
        shaderProgram[2].inverseMatrixUniform = gl.getUniformLocation(shaderProgram[2],"u_Inverse");

        shaderProgram[2].depthsampler = gl.getUniformLocation(shaderProgram[2],"u_DepthSampler");
        shaderProgram[2].drawmode = gl.getUniformLocation(shaderProgram[2],"u_DrawMode");
        
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
        //use programshader[0]  0:normal, 1: color, 2: screen space position, 3: depth pass, 4: manually cal depth , 
        //use programshader[2]  5: silhouette mesh depth buffer 6: silhouette 
        for(var i = 0; i<7; ++i)
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
           
            if(i == 3)
            {
                 gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
            }
            else
            {
                var renderbuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                    fbo.width, fbo.height);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
            }
           
            //set texture, renderbuffer, and framebuffer back to their defaults
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }	
       // console.log("framebuffer length: " + rttFramebuffers.length);
        //console.log("texture buffer length: " + rttTextures.length);
	}

	//var colorTexture;

    var colorTexture;
	function initTexture(){
		// colorTexture = gl.createTexture();
		// colorTexture.image = new Image();
		// colorTexture.image.onload = function(){
		// 	handleLoadedTexture(colorTexture);
		// }
		// colorTexture.image.src = "arroway.de_metal+structure+06_d100_flat.jpg";   
        colorTexture = gl.createTexture();
        colorTexture.image = new Image();
        colorTexture.image.onload = function () {
            handleLoadedTexture(colorTexture)
        }
        //colorTexture.image.src = "moon.gif";
        colorTexture.image.src = "Cow.bmp";
        //colorTexture.image.src = "test.gif";

        // colorTexture = gl.createTexture();
        // colorTexture.image = new Image();
        // colorTexture.image.onload = function () {
        //     handleLoadedTexture(colorTexture)
        // }
        // colorTexture.image.src = "arroway.de_metal+structure+06_d100_flat.jpg";     
	}


	
	persp = mat4.create();
	model = mat4.create();
	inverse = mat4.create();

	function setMatrixUniforms(models){
		gl.uniformMatrix4fv(shaderProgram[0].modelMatrixUniform,false,models);
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
        gl.bindBuffer(gl.ARRAY_BUFFER,quadvbo);
        var vertices = [
             1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        quadvbo.itemSize = 3;
        quadvbo.numItems = 4;
        
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

    // var meshvbo = [];
    // var meshnbo = [];
    // var meshibo = [];
    // var meshtbo = [];
    var meshes = [];    
    var models = [];
    var silEdgeMeshes;
    var silEdgeMeshesvbo = [];
    var silEdgeMeshesibo = [];
    var silEdgeMeshescbo = [];
    function downloadMesh()
    {
        obj_utils.downloadMeshes(
            {
                 //'bottom' : 'http://localhost:288/webglDeferredShader/cube.obj',
                // 'back' : 'http://localhost:288/webglDeferredShader/cube.obj',
                // 'top' : 'http://localhost:288/webglDeferredShader/cube.obj',
                // 'left' : 'http://localhost:288/webglDeferredShader/cube.obj',
                // 'right' : 'http://localhost:288/webglDeferredShader/cube.obj',
                'cow' : 'http://localhost:288/webglDeferredShader/cow.obj',


                //'bunny' : 'http://localhost:288/webglDeferredShader/bunny.obj',
                //'cube' : 'http://localhost:288/webglDeferredShader/cube5.obj'
            },
            initObj
        );
    }

    function initObj(meshobjs)
    {
        meshes = meshobjs;
        var idx = 0;
        for(mesh in meshes){                     
            obj_utils.initMeshBuffers(gl, meshes[mesh]);
            // updateDepthbuffer(); 
            updateFaceInfo(meshes[mesh],models[idx]);
            idx ++;
            
        }        
        
    }
    function setmodelMatrix()
    {
       
        // //cube2 for test
        // var matrix  = mat4.create();
        // mat4.identity(matrix);
        // mat4.scale(matrix,[2,2,2]);
        // models.push(matrix);


        //bottom
        // var matrix = mat4.create();
        // mat4.identity(matrix);
        // mat4.scale(matrix,[4,.01,4]); 
        // mat4.translate(matrix,[0,-400,0]);       
        // models.push(matrix);     

        // //back
        // var matrix2 = mat4.create();
        // mat4.identity(matrix2);
        // mat4.scale(matrix2,[.01,4,4]);
        // mat4.translate(matrix2,[400,0,0]);
        // models.push(matrix2);

        // //top
        // var matrix3 = mat4.create();
        // mat4.identity(matrix3);
        // mat4.scale(matrix3,[4,.01,4]);
        // mat4.translate(matrix3,[0,400,0]);
        // models.push(matrix3);
        
        // //left
        // var matrix4 = mat4.create();
        // mat4.identity(matrix4);
        // mat4.scale(matrix4,[4,4,.01]);
        // mat4.translate(matrix4,[0,0,-400]);
        // models.push(matrix4);

        // //right
        // var matrix5 = mat4.create();
        // mat4.identity(matrix5);
        // mat4.scale(matrix5,[4,4,.01]);
        // mat4.translate(matrix5,[0,0,400]);
        // models.push(matrix5);

        //cow
        var cowMatrix = mat4.create();
        mat4.identity(cowMatrix);
        mat4.scale(cowMatrix,[8,8,8]);
        mat4.rotate(cowMatrix,90,[0,1,0]);
        mat4.translate(cowMatrix,[0,-.1,0]);
        models.push(cowMatrix);

        // //bunny
        // var bunnyMatrix = mat4.create();
        // mat4.identity(bunnyMatrix);
        // mat4.scale(bunnyMatrix,[50,50,50]);
        // mat4.rotate(bunnyMatrix,90,[0,1,0]);
        // mat4.translate(bunnyMatrix,[0,-.1,0]);
        // models.push(bunnyMatrix);

    }

	function initMeshBuffers()
	{
        
        //initsphere();
		downloadMesh();
        setmodelMatrix();       
        
	}

    // function linearizeDepth(exp_depth, near, far) {
    //     return  (2.0* near) / (far + near -  exp_depth * (far - near)); 
    // }

    //function getSilEdges(mesh,mvp,mv)//silhouette culling version
    function getSilEdges(mesh)
    {
        //console.log("getsil edge");
        var edgeVerts = [];
        var edgeindices = [];
        var edgecolor = [];
        var verNum = 0;
        var edgeVerts2D = [];  

        //console.log(mvp);

        for(var idx = 0; idx < mesh.edgeArray.length;++idx){
            //console.log(mesh.edgeArray[idx]);           
            var edgefaces = mesh.edgefacesArray[idx];
           // console.log(edgefaces);
            if((mesh.isfrontfacesArray[edgefaces[0]] == 0 && mesh.isfrontfacesArray[edgefaces[1]] == 1)
                ||(mesh.isfrontfacesArray[edgefaces[0]] == 1 && mesh.isfrontfacesArray[edgefaces[1]] == 0))
            {
                //console.log("sil edge " + mesh.edgeArray[idx]);
                var veridx = [mesh.edgeArray[idx][0],mesh.edgeArray[idx][1]];
                var ver1 = vec4.create(
                                    [mesh.verticesArray[veridx[0]*3],
                                    mesh.verticesArray[veridx[0]*3+1],
                                    mesh.verticesArray[veridx[0]*3+2],
                                    1.0]
                                    );
              
                var ver2 = vec4.create(
                                    [mesh.verticesArray[veridx[1]*3],
                                    mesh.verticesArray[veridx[1]*3+1],
                                    mesh.verticesArray[veridx[1]*3+2],
                                    1.0 ]                               
                                    );                
                /////////////////////////FOR SILHOUETTE CULLING //////////////////////////////////////////
                // var ver1Clip = vec4.create();
                // mat4.multiply(mvp,ver1,ver1Clip);
                // var ver2Clip = vec4.create();
                // mat4.multiplyVec4(mvp,ver2,ver2Clip);

                // var ver1World = vec4.create();
                // mat4.multiply(mv,ver1,ver1World);
                // var ver2World = vec4.create();
                // mat4.multiply(mv,ver2,ver2World);

                // ver1Clip.set([ver1Clip[0]/ver1Clip[3],ver1Clip[1]/ver1Clip[3],ver1Clip[2]/ver1Clip[3],ver1Clip[3]/ver1Clip[3]]);
                // ver2Clip.set([ver2Clip[0]/ver2Clip[3],ver2Clip[1]/ver2Clip[3],ver2Clip[2]/ver2Clip[3],ver2Clip[3]/ver2Clip[3]]);
                // //console.log(ver1Clip[0] + " " + ver1Clip[1]);
                // var pixel1 = [];
                // pixel1.push(Math.round(((ver1Clip[0] + 1.0)/2.0) * gl.viewportWidth));
                // pixel1.push(Math.round(((1.0 - ver1Clip[1])/2.0) * gl.viewportHeight));
                
                // var pixel2 = [];
                // pixel2.push(Math.round(((ver2Clip[0] + 1.0)/2.0) * gl.viewportWidth));
                // pixel2.push(Math.round(((1.0 - ver2Clip[1])/2.0) * gl.viewportHeight));
                
                // var ver1depth = linearizeDepth(ver1Clip[2], 0.1, 10)*255;
                // var ver2depth = linearizeDepth(ver2Clip[2], 0.1, 10)*255;

                // var pixelIndex = pixel1[1] * gl.viewportWidth + pixel1[0];
                // var depth1 = depthvalues[pixelIndex*4];
                // //console.log(ver1depth + " " + depth1);
                // var pixelIndex2 = pixel2[1] * gl.viewportWidth + pixel2[0];
                // var depth2 = depthvalues[pixelIndex2 * 4];
                //console.log(depthvalues[pixelIndex*4]);

                // if((depth1 != 0 && ver1depth > depth1) || (depth2!=0  && ver2depth > depth2))
                // {
                //     console.log("dd")
                //     continue;
                // }
                // else
                // {
                //     //console.log("PASS");
                // }

                //console.log("z: " + Math.floor(linearizeDepth(ver1Clip[2], 0.1, 10)*255));
                
                /////////////////////////FOR SILHOUETTE CULLING //////////////////////////////////////////

                edgeVerts.push(mesh.verticesArray[veridx[0]*3]); 
                edgeVerts.push(mesh.verticesArray[veridx[0]*3+1]); 
                edgeVerts.push(mesh.verticesArray[veridx[0]*3+2]);
                edgecolor.push(1.0); edgecolor.push(1.0); edgecolor.push(0.0);
                edgeindices.push(verNum);
                verNum ++;
           
                edgeVerts.push(mesh.verticesArray[veridx[1]*3]); 
                edgeVerts.push(mesh.verticesArray[veridx[1]*3+1]); 
                edgeVerts.push(mesh.verticesArray[veridx[1]*3+2]);
                edgeindices.push(verNum);
                verNum ++;              
                edgecolor.push(1.0); edgecolor.push(1.0); edgecolor.push(0.0);
            }
        }
        silEdgeMeshesvbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,silEdgeMeshesvbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edgeVerts), gl.STATIC_DRAW);
        silEdgeMeshesvbo.itemSize = 3;
        silEdgeMeshesvbo.numItems = edgeVerts.length/3;
       
        silEdgeMeshescbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,silEdgeMeshescbo);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(edgecolor),gl.STATIC_DRAW);
        silEdgeMeshescbo.itemSize = 3;
        //console.log("edgecolor length: " + edgecolor.length);
        silEdgeMeshescbo.numItems = edgecolor.length/3;

        silEdgeMeshesibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,silEdgeMeshesibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(edgeindices),gl.STATIC_DRAW);
        silEdgeMeshesibo.itemSize = 1;
        //console.log("edgeindices length: " + edgeindices.length);
        silEdgeMeshesibo.numItems = edgeindices.length;
        //console.log(edgeindices);

    }
   
    function updateDepthbuffer()
    {
        //console.log("abc");

        gl.useProgram(shaderProgram[1]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffers[5]);
        setupQuad(shaderProgram[1]);
        drawQuad(4);

        depthvalues = new Uint8Array(gl.viewportWidth * gl.viewportHeight * 4);
        gl.readPixels(0,0,gl.viewportWidth,gl.viewportHeight,gl.RGBA, gl.UNSIGNED_BYTE,depthvalues);        

        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        gl.disable(gl.DEPTH_TEST);

        //console.log("abc: " + depthvalues.length);
        // console.log(depthvalues.length);
        // for(var i = 0; i < depthvalues.length/4; ++i)
        // {
        //     console.log(depthvalues[i*4+3]);
        //     // if(depthvalues[i] != 0 && depthvalues[i] != 255)
        //     // {
        //     //     console.log(i);
        //     // }
        // }
        // console.log("update depth buffer");
    }

    function updateFaceInfo(mesh,model)
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
        //console.log(" front face:" + mesh.isfrontfacesArray.length);
        for(var i = 0; i<mesh.facenormArray.length/3; ++i)
        {           

            //object face normal in object space   
            var norm = vec3.create([mesh.facenormArray[i*3],mesh.facenormArray[i*3+1],mesh.facenormArray[i*3+2]]);

            var dots = vec3.dot(vec3.create(viewVector_objecspace),norm);
            //console.log(dots);
            if(dots <= 0)
            {
                mesh.isfrontfacesArray[i] = 1;
                //console.log("front")
            }
            else
            {
                mesh.isfrontfacesArray[i] = 0;
                //console.log("back");
            }
        }

        ///////////////////////////////////for back silhouette culling///////////////////////////////
        // var mv = mat4.create();
        // mat4.multiply(view, model, mv);
        // var mvp = mat4.create();
        // var persps = mat4.create();        
        // mat4.perspective(45.0, gl.viewportWidth/gl.viewportHeight,0.1,100.0,persps);
        // mat4.multiply(persps,mv,mvp);
        //getSilEdges(mesh,mvp,mv); //SILHOUETTE CULLING 
        ///////////////////////////////////for back silhouette culling///////////////////////////////
        getSilEdges(mesh);
    }


    function setupQuad(program){
        gl.useProgram(program);
        var persp  = mat4.create;
        mat4.perspective(45.0, gl.viewportWidth/gl.viewportHeight,0.1,100.0,persp);

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

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D,rttTextures[4]);
        gl.uniform1i(shaderProgram[1].depthsamplerfake,4);

        gl.activeTexture(gl.TEXTURE5); //SILCOLOR
        gl.bindTexture(gl.TEXTURE_2D,rttTextures[5]);
        gl.uniform1i(shaderProgram[1].silcolorsampler,5);

        gl.activeTexture(gl.TEXTURE6); //DEPTH
        gl.bindTexture(gl.TEXTURE_2D,rttTextures[6]);
        gl.uniform1i(shaderProgram[1].sildepthsampler,6);



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


		gl.uniform1i(shaderProgram[0].drawmode,drawmode);

        var idx = 0;                
        for(mesh in meshes){
            //console.log("idx " + idx);
            var mv = mat4.create();
            mat4.multiply(view, models[idx], mv);

            inverse = mat4.create();
            mat4.identity(inverse);
            mat4.inverse(mv, inverse);
            mat4.transpose(inverse);

           // console.log(meshes[mesh].vertexBuffer);
            gl.bindBuffer(gl.ARRAY_BUFFER, meshes[mesh].vertexBuffer);
            gl.vertexAttribPointer(shaderProgram[0].vertexPositionAttribute, meshes[mesh].vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);


            gl.bindBuffer(gl.ARRAY_BUFFER, meshes[mesh].textureBuffer);
            gl.vertexAttribPointer(shaderProgram[0].vertexTexcoordAttribute,  meshes[mesh].textureBuffer.itemSize, gl.FLOAT, false, 0, 0);


            gl.bindBuffer(gl.ARRAY_BUFFER, meshes[mesh].normalBuffer);
            gl.vertexAttribPointer(shaderProgram[0].vertexNormalAttribute,  meshes[mesh].normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, colorTexture);
            gl.uniform1i(shaderProgram[0].colorsampler,0); // 0 represents the index of texture

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,  meshes[mesh].indexBuffer);  
            setMatrixUniforms(models[idx]);
            gl.drawElements(gl.TRIANGLES, meshes[mesh].indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

            idx ++;
        }

        gl.bindTexture(gl.TEXTURE_2D,rttTextures[drawmode]);
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D,null);
	}


   
    function drawSilhouette(drawmode)
    {
        
        gl.useProgram(shaderProgram[2]);
        gl.enable(gl.DEPTH_TEST);

        gl.viewport(0,0,gl.viewportWidth,gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mat4.perspective(45.0,gl.viewportWidth/gl.viewportHeight,0.1,100.0,persp);

        idx = 0;

        var mv = mat4.create();
        mat4.multiply(view, models[idx], mv);


        inverse = mat4.create();
        mat4.identity(inverse);
        mat4.inverse(mv, inverse);
        mat4.transpose(inverse);

        gl.uniform1i(shaderProgram[2].drawmode,drawmode);

        gl.bindBuffer(gl.ARRAY_BUFFER,silEdgeMeshesvbo);             
        gl.vertexAttribPointer(shaderProgram[2].vertexPositionAttribute, silEdgeMeshesvbo.itemSize,gl.FLOAT, false,0,0);

        gl.bindBuffer(gl.ARRAY_BUFFER,silEdgeMeshescbo);
        gl.vertexAttribPointer(shaderProgram[2].vertexColorAttribute,silEdgeMeshescbo.itemSize,gl.FLOAT,false,0,0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, silEdgeMeshesibo);        

        gl.uniformMatrix4fv(shaderProgram[2].modelMatrixUniform,false,models[idx]);
        gl.uniformMatrix4fv(shaderProgram[2].viewMatrixUniform,false, view);
        gl.uniformMatrix4fv(shaderProgram[2].perspMatrixUniform,false,persp);
        gl.uniformMatrix4fv(shaderProgram[2].inverseMatrixUniform,false,inverse);       

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, rttTextures[0]);
        gl.uniform1i(shaderProgram[2].depthsampler,0);

        var reso = vec2.create(gl.viewportWidth,gl.viewportHeight);
        gl.uniform2fv(shaderProgram[2].resolution,reso);
        
        gl.drawElements(gl.LINES, silEdgeMeshesibo.numItems, gl.UNSIGNED_SHORT,0);

        gl.bindTexture(gl.TEXTURE_2D,rttTextures[drawmode+4]);
        gl.bindTexture(gl.TEXTURE_2D,null);
    }

    
	function drawScene(){
         
		gl.useProgram(shaderProgram[0]);


        for(var i = 0; i<5; ++i)
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffers[i]);
            drawMesh(i);
        }        
        
		gl.bindFramebuffer(gl.FRAMEBUFFER,null);

        for(var j = 0;j<2;++j)
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER,rttFramebuffers[j+5]);
            drawSilhouette(j);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER,null);


        gl.disable(gl.DEPTH_TEST);       

        // if(checkboxs[checkboxs.length-1].checked == true){
        //     if(needupdate == true)
        //     {
        //         //updateDepthbuffer();
        //         console.log("update once");
        //         var idx = 0;
        //         for(mesh in meshes)
        //         {
        //             updateFaceInfo(meshes[mesh],models[idx]);
        //             idx ++;
        //         }

                
        //         needupdate = false;
        //     }
           
        //     drawSilhouette();
        //     return;
        // }
        // else
        // {            
        //     needupdate = true;
        // }

        setupQuad(shaderProgram[1]);
     
        // todo: change the draw mode here
        //0: normal //1: color // 2: screen space position // 3: depth // 4: depth fake //
        //5: silhouette //6: diffuse

        for(var checkboxidx = 0; checkboxidx < checkboxs.length; ++checkboxidx)
        {
            if(checkboxs[checkboxidx].checked == true)
            {
                //console.log("checkboxid: " + checkboxidx);
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
            radius = Math.min(Math.max(radius, 2.0), 20.0);
        }
        eye = sphericalToCartesian(radius, azimuth, elevation);
        if(checkboxs[5].checked == true)
        {
            viewVector = [center[0] - eye[0],center[1]-eye[1],center[2]-eye[2]];
            viewVector = vec3.normalize(viewVector);;
            //console.log(viewVector);
            //update mesh face info
           // updateDepthbuffer();
            var idx = 0;
            for(mesh in meshes)
            {
                updateFaceInfo(meshes[mesh],models[idx]);
                idx ++;
            }

        }
       
       
        //console.log("eye updated " + eye);
        //view = mat4.create();
        mat4.lookAt(eye, center, up, view);

        lastMouseX = newX;
        lastMouseY = newY;
    }

    canvas.onmousedown = handleMouseDown;
    canvas.oncontextmenu = function(ev) {return false;};
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '100px';

    document.body.appendChild( stats.domElement );    

 	function tick() {
        requestAnimFrame(tick);
        drawScene();    
        
        stats.update();
        //time ++;
        
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
        checkbox = document.getElementById("depth2");
        checkboxs.push(checkbox);
        checkbox = document.getElementById("silhouette");
        checkboxs.push(checkbox);
        checkbox = document.getElementById("diffuse");
        checkboxs.push(checkbox);
       // console.log("checkbox length: "+checkboxs.length);

        //checkboxs[3].disabled = true;
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

        tick();	    
	})();
})();