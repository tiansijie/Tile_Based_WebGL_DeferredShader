// webgl-obj-loader.js

// Thanks to CMS for the startsWith function
// http://stackoverflow.com/questions/646628/javascript-startswith/646643#646643
if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) === str;
  };
}
var obj_loader = {};

obj_loader.Mesh = function( objectData ){
    /*
        With the given elementID or string of the OBJ, this parses the
        OBJ and creates the mesh.
    */

    var verts = [];
    var vertNormals = [];
    var textures = [];

    // unpacking stuff
    var packed = {};
    packed.verts = [];
    packed.norms = [];
    packed.textures = [];
    packed.hashindices = {};
    packed.indices = [];
    packed.index = 0;
    //packed.facenorms = [];
    // packed.faces = [];
    // var faceobj = {};
    // faceobj.facenorms = [];
    // faceobj.isFrontFace = 0;
    
    packed.facenorms = [];
    packed.isFrantFaces = [];
    packed.edges = [];
  
    packed.hashedges = {};
    packed.edgefaces = [];
    // faces that belongs to the edge
    // NOTE: is it possible that a edge only belongs to one face
    packed.edgeIdx = 0;
    packed.faceNum = 0;
    // array of lines separated by the newline
    var lines = objectData.split( '\n' );
    //console.log("lines " + lines);
    for( var i=0; i<lines.length; i++ ){
      // if this is a vertex
     // console.log("lines : " + lines[i]);
      if( lines[ i ].startsWith( 'v ' ) ){
        line = lines[ i ].slice( 2 ).split( " " )
        verts.push( line[ 0 ] );
        verts.push( line[ 1 ] );
        verts.push( line[ 2 ] );
        
      }
      // if this is a vertex normal
      else if( lines[ i ].startsWith( 'vn' ) ){
        //console.log(line);
        line = lines[ i ].slice( 3 ).split( " " )
        vertNormals.push( line[ 0 ] );
        vertNormals.push( line[ 1 ] );
        vertNormals.push( line[ 2 ] );
      }
      // if this is a texture
      else if( lines[ i ].startsWith( 'vt' ) ){
        line = lines[ i ].slice( 3 ).split( " " )
        textures.push( line[ 0 ] );
        textures.push( line[ 1 ] );
      }
      // if this is a face
      else if( lines[ i ].startsWith( 'f ' ) ){
        line = lines[ i ].slice( 2 ).split( " " );
        //console.log(line);
        var quad = false;
        var faceIdx = [];        
        for(var j=0; j<line.length; j++){
            // Triangulating quads
            // quad: 'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2 v3/t3/vn3/'
            // corresponding triangles:
            //      'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2'
            //      'f v2/t2/vn2 v3/t3/vn3 v0/t0/vn0'           
            if(j == 3 && !quad) {
                // add v2/t2/vn2 in again before continuing to 3
                j = 2;
                quad = true;
            }

            //edges
            face = line[j].split('/');
            faceIdx.push(face[0]-1);

            //console.log(line[j]);
            if( line[ j ] in packed.hashindices ){
               
                packed.indices.push( packed.hashindices[ line[ j ] ] );
            }
            else{

                face = line[ j ].split( '/' );

                // vertex position
                packed.verts.push( verts[ (face[ 0 ] - 1) * 3 + 0 ] );
                packed.verts.push( verts[ (face[ 0 ] - 1) * 3 + 1 ] );
                packed.verts.push( verts[ (face[ 0 ] - 1) * 3 + 2 ] );
                // vertex textures
                packed.textures.push( textures[ (face[ 1 ] - 1) * 2 + 0 ] );
                packed.textures.push( textures[ (face[ 1 ] - 1) * 2 + 1 ] );
                // vertex normals
                
                if(vertNormals.length > 0)
                {
                  packed.norms.push( vertNormals[ (face[ 2 ] - 1) * 3 + 0 ] );
                  packed.norms.push( vertNormals[ (face[ 2 ] - 1) * 3 + 1 ] );
                  packed.norms.push( vertNormals[ (face[ 2 ] - 1) * 3 + 2 ] );
                }

              
                // add the newly created vertex to the list of indices
                packed.hashindices[ line[ j ] ] = packed.index;
                packed.indices.push( packed.index );

                // increment the counter
                packed.index += 1;
            }
           // console.log(packed.indices);
            if(j == 3 && quad) {
                // add v0/t0/vn0 onto the second triangle
                packed.indices.push( packed.hashindices[ line[ 0 ] ] );
            }
        }
        // add to edge list
        var es = [];
        es.push([faceIdx[0],faceIdx[1]]);
        es.push([faceIdx[1],faceIdx[2]]);
        es.push([faceIdx[2],faceIdx[0]]);

        for(var idx = 0; idx <3; idx ++)
        {
          var inverses = [es[idx][1],es[idx][0]];
          if(es[idx] in packed.hashedges || inverses in packed.hashedges)
          {
            //console.log(es[idx] + "  " + inverses);
            if(es[idx] in packed.hashedges)
            {
              //console.log("exist " + packed.edgefaces[packed.hashedges[es[idx]]]);
              packed.edgefaces[packed.hashedges[es[idx]]].push(packed.faceNum);
            }
            else
            {
              //console.log("exist " + packed.edgefaces[packed.hashedges[inverses]]);
              packed.edgefaces[packed.hashedges[inverses]].push(packed.faceNum);
              //console.log(packed.hashedges[inverses] + " : "+ packed.edgefaces[packed.hashedges[inverses]]);
            }
            continue;
          }
          else
          {
            packed.hashedges[es[idx]] = packed.edgeIdx;
            //console.log(packed.hashedges);
            packed.edges.push(es[idx]);
            //console.log("edge : " + es[idx] + " edge idx: " + packed.hashedges[es[idx]]);
            packed.edgefaces[packed.edgeIdx] = [];
            packed.edgefaces[packed.edgeIdx].push(packed.faceNum); 
            //console.log(packed.edgefaces[packed.edgeIdx]);         
            //packed.edgeFaces.push(packed.faceNum);
            //console.log("edges: " + packed.edgeIdx + " :" + es[idx] + " " + packed.faceNum);
            packed.edgeIdx ++;
          }
          //console.log(packed.edgefaces[1]);
        }
        packed.faceNum ++;
      }
    }

    for(var ii = 0;ii<packed.edgefaces.length; ++ii)
    {
      if(packed.edgefaces[ii].length!=2)
      {
        // alert("edge doesn't connect two faces");
        console.log("edge doesn't connect two faces");
        break;
      }   

    }

    //console.log(packed.edgefaces);
    this.vertices = packed.verts;  
    this.textures = packed.textures;
    this.indices = packed.indices;

    norm_hashIndices = {};
    packed.norms.index = 0;


    for(var i = 0; i< this.indices.length/3; ++i)
    {
     // console.log(this.indices.length / 3 + "  " + this.vertices.length);
      var index = [this.indices[i*3],this.indices[i*3+1],this.indices[i*3+2]];
      //console.log(index);
      var ver1 = [this.vertices[index[0] * 3], this.vertices[index[0]*3 +1],this.vertices[index[0]*3+2]];
      var ver2 = [this.vertices[index[1] * 3], this.vertices[index[1]*3 +1],this.vertices[index[1]*3+2]];
      var ver3 = [this.vertices[index[2] * 3], this.vertices[index[2]*3 +1],this.vertices[index[2]*3+2]];
      

      var edge1 = [ver2[0]-ver1[0], ver2[1] - ver1[1], ver2[2] - ver1[2]];       
      var edge2 = [ver3[0]-ver1[0], ver3[1] - ver1[1], ver3[2] - ver1[2]];
      // console.log(edge2);
      var norm = [edge1[1] * edge2[2] - edge1[2] * edge2[1],
                  edge1[2] * edge2[0] - edge1[0] * edge2[2],
                  edge1[0] * edge2[1] - edge1[1] * edge2[0]];
      var normlength = norm[0] * norm[0] + norm[1] * norm[1] + norm[2] * norm[2];
      normlength = Math.sqrt(normlength);
      norm = [norm[0] / normlength, norm[1] / normlength, norm[2] / normlength]; 

      //face normal
      packed.facenorms.push(norm[0])
      packed.facenorms.push(norm[1]);
      packed.facenorms.push(norm[2]);

      packed.isFrantFaces.push(0);
      if(packed.norms.length <= 0)
      {
         for(var j = 0; j<3; ++j)
        {
          if(index[j] in norm_hashIndices)
          {
            continue;
          }
          else
          {
              norm_hashIndices[index[j]] = packed.norms.index;            
              packed.facenorms.push(norm[0])
              packed.facenorms.push(norm[1]);
              packed.facenorms.push(norm[2]);
          }
          packed.norms.index += 1;
        }
      }              
    }

    //console.log(packed.edges.length + " edges");
    //console.log(packed.edges);
    this.vertexNormals = packed.norms;
    this.facenorms = packed.facenorms;  
    this.isFrantFaces = packed.isFrantFaces;   
    
    //
    this.oriverts = verts; 
    this.edges = packed.edges;  // endpoings index
    console.log(this.edges.length + " edges");
    this.edgeFaces = packed.edgefaces; // face index
}


/* UTIL FUNCTIONS */
obj_utils = {};

/*
  nameAndURLs should contain an object array with a unique object name as
  the key and a URL as the value
  
  completionCallback should contain a function that will take one parameter:
  an object array where the keys will be the unique object name and the value
  will be a Mesh object
*/
obj_utils.downloadMeshes = function( nameAndURLs, completionCallback){
    var ajaxes = new Array();
    var meshes = new Object();

    $.each( nameAndURLs, function( name, URL){
        ajaxes.push($.ajax({
                url: URL,
                dataType: 'text',
                success: function( data ){                  
                    meshes[name] = new obj_loader.Mesh( data );              
                }
            })
        );
    });

    $.when.apply( $, ajaxes ).done(function(){
        completionCallback( meshes );
    });
}

obj_utils.initMeshBuffers = function( gl, mesh ){
  /*
    Takes in the WebGL context and a Mesh, then creates and appends the buffers
    to the mesh object.

    The new mesh attributes are:
      mesh.normalBuffer   contains the model's Vertex Normals
        mesh.normalBuffer.itemSize  set to 3 items
        mesh.normalBuffer.numItems  the total number of vertex normals

      mesh.textureBuffer  contains the model's Texture Coordinates
        mesh.textureBuffer.itemSize set to 2 items
        mesh.textureBuffer.numItems the number of texture coordinates

      mesh.vertexBuffer   contains the model's Vertex Position Coordinates (does not include w)
        mesh.vertexBuffer.itemSize  set to 3 items
        mesh.vertexBuffer.numItems  the total number of vertices

      mesh.indexBuffer    contains the indices of the for the faces
                          These are to be used with gl.drawElements()
                          and gl.TRIANGLES
        mesh.indexBuffer.itemSize   is set to 1
        mesh.indexBuffer.numItems   the total number of indices
  */
  mesh.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexNormals), gl.STATIC_DRAW);
  mesh.normalBuffer.itemSize = 3;
  mesh.normalBuffer.numItems = mesh.vertexNormals.length / 3;
  //console.log(mesh.vertexNormals.length);

  mesh.textureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textures), gl.STATIC_DRAW);
  mesh.textureBuffer.itemSize = 2;
  mesh.textureBuffer.numItems = mesh.textures.length / 2;

  mesh.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
  mesh.vertexBuffer.itemSize = 3;
  mesh.vertexBuffer.numItems = mesh.vertices.length / 3;

  mesh.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
  mesh.indexBuffer.itemSize = 1;
  mesh.indexBuffer.numItems = mesh.indices.length;

  // mesh.facenormbuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.facenormbuffer);
  // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Float32Array(mesh.facenorms),gl.STATIC_DRAW);
  // mesh.facenormbuffer.itemSize = 3;
  // mesh.facenormbuffer.numItems = mesh.facenorms.length / 3;
  
  mesh.verticesArray = mesh.oriverts;
  mesh.facenormArray = mesh.facenorms;
  mesh.isfrontfacesArray = mesh.isFrantFaces;
  mesh.edgeArray = mesh.edges;
  mesh.edgefacesArray = mesh.edgeFaces;
  // mesh.isfrontfacebuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.isfrontfacebuffer);
  // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.isFrantFaces), gl.STATIC_DRAW);
  // mesh.isfrontfacebuffer.itemSize = 1;
  // mesh.isfrontfacebuffer.numItems = mesh.isFrantFaces.length;

  //debug log
  // if(mesh.faces.length < 50)
  // {
  //   for(var i = 0 ; i<mesh.faces.length; ++i)
  //   {
  //     console.log("index : " + i + " " + mesh.faces[i].facenorms + " isfrontFace: " + mesh.faces[i].isFrontFace + "\n");  
  //   }
  
  // }

  // console.log("face normal number : " + mesh.facenormbuffer.numItems);
  // console.log("indice itemSize : " + mesh.indexBuffer.numItems / 3);
}
