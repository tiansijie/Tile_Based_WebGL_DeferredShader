 function drawInkQuat()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //console.log("drawInkQuat...");
    gl.useProgram(shaderProgram[3]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rttTextures[0]);
    gl.uniform1i(shaderProgram[3].normalsampler,0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,rttTextures[1]);
    gl.uniform1i(shaderProgram[3].colorsampler,1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D,rttTextures[2]);
    gl.uniform1i(shaderProgram[3].positionsampler,2);        

    gl.bindBuffer(gl.ARRAY_BUFFER,quadvbo);
    gl.vertexAttribPointer(shaderProgram[3].vertexPositionAttribute,quadvbo.itemSize,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,quadtbo);
    gl.vertexAttribPointer(shaderProgram[3].vertexTexcoordAttribute,quadtbo.itemSize,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadibo);

    gl.drawElements(gl.TRIANGLES, quadibo.numItems, gl.UNSIGNED_SHORT, 0);

    gl.bindTexture(gl.TEXTURE_2D,rttTextures[7]);
    gl.bindTexture(gl.TEXTURE_2D,null);

}

function drawSpartter()
{
    //console.log("drawSpartter....");
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgram[4]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rttTextures[7]);
    gl.uniform1i(shaderProgram[4].quatcolorsampler,0);

    gl.uniform1i(shaderProgram[4].viewwidth,gl.viewportWidth);
    gl.uniform1i(shaderProgram[4].viewheight,gl.viewportHeight);

    gl.bindBuffer(gl.ARRAY_BUFFER,quadvbo);
    gl.vertexAttribPointer(shaderProgram[4].vertexPositionAttribute,quadvbo.itemSize,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,quadtbo);
    gl.vertexAttribPointer(shaderProgram[4].vertexTexcoordAttribute,quadtbo.itemSize,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadibo);

    gl.drawElements(gl.TRIANGLES, quadibo.numItems, gl.UNSIGNED_SHORT, 0);

    gl.bindTexture(gl.TEXTURE_2D,rttTextures[8]);
    gl.bindTexture(gl.TEXTURE_2D,null);

}