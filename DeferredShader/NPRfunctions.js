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