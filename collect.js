var canvas = document.getElementById("Id name");
gl = canvas.getContext("webgl");
gl.viewportWidth = canvas.width;
gl.viewportHeight = canvas.height;

///
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
}

//initial buffers
var vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,vbo); // tell webgl the following operation act on buffers should be this buffer vbo.
var vertices = [] // data
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),gl.STATIC_DRAW);
vbo.itemSize = 3;
vbo.numItems = 3;
//give properties to vbo. javascript is good. You can set properties for object by simply added them to it in above way


// draw
gl.viewport(0,0,gl.viewportWidth, gl.viewportHeight); // must call this before draw anything
gl.clear(gl.COLOR_BUFFER_BIG | gl.DEPTH_BUFFER_BIT);
mat4.perspective(45,gl.viewportWidth/gl.viewportHeight, 0.1,100);//fov,resolution,near, far
//set up marix
var mvMatrix = mat4.create();
mat4.ranslate(mvMatrix, [0,1,0]);
//need to specify current buffer used for draw function
gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,vbo.itemSize,gl.FLOAT,false,0,0); // actually use vbo array to provide the attribute data.
//set up matrix uniforms
gl.uniformMatrix4fv(shaderProgram,pMatrixUniform,false,pMatrix);
//pMatrixUniform is the location of the unform parameter
gl.drawArrays(); gl.drawElements(..); // call gl draw functions


gl_position = u_Persp * (u_View * (u_Model * position));
u_Model * position // obj coord transforms to the eye coord;
u_View * (eyecoord) // eye coords transformed by projection matrix to clip coords
u_Persp * (clip coords)// clip coords transformed by viewport to windows coords


u_Model: model transformation matrix // model = mat4.create(); mat4.rotate(model,90,[0,1,0]); mat4.scale(model,[2,2,2]); mat4.translate();
u_View: projection matrix // view = mat4.create(); mat4.lookAt(eye, center, up, view);
u_Persp: viewport, mat4.perspective(30,width/height,0.1,100,u_Persp);

//calculate normal:
fs_normal = transpose(inverse(view * model)) * vec4(normal,1.0);
//http://www.cs.uaf.edu/2007/spring/cs481/lecture/01_23_matrices.html

//initShader

function getShader(gl,id){
	var shaderScript = document.getElementById(id);
	if(!shaderScript){
		console.Log("didn't get shader");
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
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}
var shaderProgram = new Array();
function initShader(){
	var frags = getShader(gl,"fs");
	var verts = getShader(gl,"vs");
	
	shaderProgram[0] = gl.createProgram();
	gl.attachShader(shaderProgram[0],verts);
	gl.attachShader(shaderProgram[0],frags);
	gl.linkProgram(shaderProgram[0]);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
	}

	gl.useProgram(shaderProgram[0]);
	
	shaderProgram[0].vertexPositionAttribute = gl.getAttributeLocation(shaderProgram[0],"Position");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	// TELL webgl here that we'll use some array to provide the attribute data.
	shaderProgram[0].modelMatrixUniform = gl.getUniformLocation(shaderProgram[0],"u_Mode");
	shaderProgram[0].viewMatrixUniform = gl.getUniformLocation(shaderProgram[0],"u_View");
	// get location of uniforms and set them as properties of shaderprogram...
	
	
}