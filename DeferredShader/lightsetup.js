//Light bounding box
function getLightBoundingBox(light_pos, radius, pv, viewport, boundary)
{
    var lx = light_pos[0];
    var ly = light_pos[1];
    var lz = light_pos[2];              
    
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

        //var r = vec3.length(lights[i].position) + 0.000001;
        //var s = Math.sqrt() 

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

    gl.bindTexture(gl.TEXTURE_2D, lightGridTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tileWidth, tileHeight, 0, gl.RGB, gl.FLOAT, new Float32Array(lightGrid));       

    gl.bindTexture(gl.TEXTURE_2D, lightIndexTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, lightIndexWidth, lightIndexWidth, 0, gl.LUMINANCE, gl.FLOAT, new Float32Array(lightIndex));       
   
    gl.bindTexture(gl.TEXTURE_2D, lightPositionTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, lightPosition.length/3, 1.0, 0, gl.RGB, gl.FLOAT, new Float32Array(lightPosition));       
  
    gl.bindTexture(gl.TEXTURE_2D, lightColorRadiusTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);        
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, lightColorRadius.length/4, 1.0, 0, gl.RGBA, gl.FLOAT, new Float32Array(lightColorRadius));
}