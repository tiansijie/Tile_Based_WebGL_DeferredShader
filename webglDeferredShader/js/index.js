var camera, scene, renderer;
var geometry, material, mesh;
var vertShader, fragShader;
init();
animate();

function init(){
	(function initShader(){
		vertShader = document.getElementById('vs').innerHTML;
		fragShader = document.getElementById('fs').innerHTML;
		var model = mat4.create();
        mat4.identity(model);
       // mat4.rotate(model, 23.4/180*Math.PI, [0.0, 0.0, 1.0]);
        //mat4.rotate(model, Math.PI, [1.0, 0.0, 0.0]);
        //mat4.rotate(model, -time, [0.0, 1.0, 0.0]);		
        var mv = mat4.create();
        mat4.multiply(view, model, mv);
        var invTrans = mat4.create();
        mat4.inverse(mv, invTrans);
        mat4.transpose(invTrans);
		
		 vec3 tilt(1.0f,0.0f,0.0f);
    //mat4 translate_mat = glm::translate(glm::vec3(0.0f,.5f,0.0f));
    mat4 tilt_mat = glm::rotate(mat4(), 90.0f, tilt);
    mat4 scale_mat = glm::scale(mat4(), vec3(0.01));
    return tilt_mat * scale_mat; //translate_mat;
		
		function getmesh
	})();
	//Camera initialization and control
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 1000;
	controls = new THREE.TrackballControls( camera );
	controls.rotateSpeed = 5.0;
	controls.zoomSpeed = 5;
	controls.panSpeed = 2;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	
	scene = new THREE.Scene();

	//light init
	var ambient = new THREE.AmbientLight( 0xffffff );	
	ambient.position.set(10,100,50);	
	scene.add(ambient);
	
	//model initialization
	//obj loader
	var manager = new THREE.LoadingManager();
	manager.onProgress = function(item, loaded,total){
		console.log(item,loaded,total);
	}
	var material = new THREE.MeshPhongMaterial({color:0xff0000});
	var loader = new THREE.OBJLoader(manager);
	loader.load('obj/cube.obj',function(event){
		console.log("abc");
		var object = event;	
		object.traverse(function(child){
			if ( child instanceof THREE.Mesh ) 
			{
				child.material= material;
			}
		});
		
		object.scale.set(114,114,114);
		scene.add(object);					
	});

	//renderer setup
	//append a canvas to html page
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	
}

function animate() {

	// note: three.js includes requestAnimationFrame shim
	requestAnimationFrame( animate );
	controls.update();
	camera.lookAt(scene.position);
	renderer.render( scene, camera );

}