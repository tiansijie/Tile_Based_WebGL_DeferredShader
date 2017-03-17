//Light bounding box
var dw = vec4.create();
var dh = vec4.create();

var leftLight = vec4.create();
var upLight = vec4.create();
var centerLight = vec4.create();

var vecTemp3 = vec3.create();
var vecTemp4 = vec4.create();

var vec3Dir = vec3.create();
var vec3Up = vec3.create();

var vec4Left1 = vec4.create();
var vec4Up1 = vec4.create();
var vec4Center1 = vec4.create();

var vec4Null = vec4.create([ 0, 0, 0, 0 ]);

function getLightBoundingBox(light_pos, radius, pv, viewport, boundary) {
  var lx = light_pos[0];
  var ly = light_pos[1];
  var lz = light_pos[2];

  vec3Dir[0] = center[0] - eye[0];
  vec3Dir[1] = center[1] - eye[1];
  vec3Dir[2] = center[2] - eye[2];
  cam_dir = vec3.normalize(vec3Dir);

  vec3Up[0] = view[4];
  vec3Up[1] = view[5];
  vec3Up[2] = view[6];
  var camUp = vec3.normalize(vec3Up);
  var camLeft = vec3.normalize(vec3.cross(camUp, cam_dir));

  vec4Left1[0] = lx + radius * camLeft[0];
  vec4Left1[1] = ly + radius * camLeft[1];
  vec4Left1[2] = lz + radius * camLeft[2];
  vec4Left1[3] = 1;
  mat4.multiplyVec4(pv, vec4Left1, leftLight);

  vec4Up1[0] = lx + radius * camUp[0];
  vec4Up1[1] = ly + radius * camUp[1];
  vec4Up1[2] = lz + radius * camUp[2];
  vec4Up1[3] = 1;
  mat4.multiplyVec4(pv, vec4Up1, upLight);

  vec4Center1[0] = lx;
  vec4Center1[1] = ly;
  vec4Center1[2] = lz;
  vec4Center1[3] = 1;
  mat4.multiplyVec4(pv, vec4Center1, centerLight);

  leftLight[0] /= leftLight[3];
  leftLight[1] /= leftLight[3];
  leftLight[2] /= leftLight[3];
  leftLight[3] /= leftLight[3];
  upLight[0] /= upLight[3];
  upLight[1] /= upLight[3];
  upLight[2] /= upLight[3];
  upLight[3] /= upLight[3];
  centerLight[0] /= centerLight[3];
  centerLight[1] /= centerLight[3];
  centerLight[2] /= centerLight[3];
  centerLight[3] /= centerLight[3];
  leftLight = mat4.multiplyVec4(viewport, leftLight);
  upLight = mat4.multiplyVec4(viewport, upLight);
  centerLight = mat4.multiplyVec4(viewport, centerLight);

  dw = vec4.subtract(leftLight, centerLight, dw);
  var lenw = vec4.length(dw);

  dh = vec4.subtract(upLight, centerLight, dh);
  var lenh = vec4.length(dh);

  var leftx = centerLight[0] - lenw;
  var bottomy = centerLight[1] - lenh;
  var rightx = centerLight[0] + lenw;
  var topy = centerLight[1] + lenh;

  boundary.left = leftx;
  boundary.right = rightx;
  boundary.bottom = bottomy;
  boundary.top = topy;
}

var nontilelight = vec4.create();
function setNonTileLight(boundary, light_pos, radius, color) {
  gl.enable(gl.SCISSOR_TEST);
  //var nontilelight = vec4.create([light_pos[0], light_pos[1], light_pos[2], radius]);
  nontilelight[0] = light_pos[0];
  nontilelight[1] = light_pos[1];
  nontilelight[2] = light_pos[2];
  nontilelight[3] = radius;

  gl.uniform4fv(nonLightLoc_Light, nontilelight);
  gl.uniform3fv(nonLightLoc_LightColor, color);

  var lwidth = boundary.right - boundary.left;
  var lheight = boundary.top - boundary.bottom;

  gl.scissor(boundary.left, boundary.bottom, lwidth, lheight);
  drawQuad();
}

var tileLightId = new Array(numTile);

function setLightOnTile(boundary, lightNum) {
  var leftTile = Math.max(Math.floor(boundary.left / tileSize), 0);
  var topTile = Math.min(
    Math.ceil(boundary.top / tileSize),
    canvas.height / tileSize
  );
  var rightTile = Math.min(
    Math.ceil(boundary.right / tileSize),
    canvas.width / tileSize
  );
  var bottomTile = Math.max(Math.floor(boundary.bottom / tileSize), 0);

  for (var i = leftTile; i < rightTile; i++) {
    for (var j = bottomTile; j < topTile; j++) {
      var indexId = i + j * tileWidth;
      if (indexId < numTile && indexId >= 0) {
        tileLightId[indexId].push(lightNum);
      }
    }
  }
}

function resetLights() {
  lightGrid.length = 0;
  lightIndex.length = 0;
  maxTileLightNum = 0;
}

var lightMove = 0.2;
var moveTime = 0;
var maxTileLightNum = 0;

var pv = mat4.create();

var v1 = mat4.createFrom(
  canvas.width,
  0,
  0,
  0,
  0,
  canvas.height,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1
);

var v2 = mat4.createFrom(
  0.5,
  0,
  0,
  0,
  0,
  0.5,
  0,
  0,
  0,
  0,
  1,
  0,
  0.5,
  0.5,
  0,
  1
);

var viewport = mat4.createFrom(
  canvas.width / 2,
  0,
  0,
  0,
  0,
  canvas.height / 2,
  0,
  0,
  0,
  0,
  1 / 2,
  0,
  canvas.width / 2,
  canvas.height / 2,
  1 / 2,
  1
);

var boundary = { left: 0, right: 0, top: 0, bottom: 0 };
var lightViewPos = vec4.create();

function setUpLights() {
  resetLights();
  //For tile base light setting
  mat4.multiply(persp, view, pv);
  for (var i = 0; i < numTile; i++)
    tileLightId[i] = [];

  moveTime++;
  if (moveTime >= 25) {
    moveTime = 0;
    lightMove = -lightMove;
  }
  for (var i = 0; i < lightNum; i++) {
    if (i % 2 == 0) {
      lights[i].position[1] += lightMove * Math.random() * 2;
    } else {
      lights[i].position[1] -= lightMove * Math.random() * 2;
    }
    var xx = lights[i].position[0];
    var zz = lights[i].position[2];
    var rr = Math.sqrt(xx * xx + zz * zz);
    var deg = Math.atan2(zz, xx);
    lights[i].position[0] = rr * Math.cos(deg + 0.05);
    lights[i].position[2] = rr * Math.sin(deg + 0.05);

    lightViewPos[0] = lights[i].position[0];
    lightViewPos[1] = lights[i].position[1];
    lightViewPos[2] = lights[i].position[2];
    lightViewPos[3] = 1;

    lightViewPos = mat4.multiplyVec4(view, lightViewPos);

    lightPosition[i * 3] = lightViewPos[0];
    lightPosition[i * 3 + 1] = lightViewPos[1];
    lightPosition[i * 3 + 2] = lightViewPos[2];

    if (isDeferredshading) {
      getLightBoundingBox(
        lights[i].position,
        lights[i].radius,
        pv,
        viewport,
        boundary
      );

      if (
        display_type === display_light || display_type === display_ink ||
          display_type === display_debugtile
      )
        setLightOnTile(boundary, i);
      else if (
        display_type === display_nontilelight || display_type === display_scissor
      ) {
        setNonTileLight(
          boundary,
          lightViewPos,
          lights[i].radius,
          lights[i].color
        );
      }
    }
  }

  if (
    display_type === display_light || display_type === display_ink ||
      display_type === display_debugtile
  ) {
    var offset = 0;

    for (var index = 0; index < numTile; index++) {
      var size = tileLightId[index].length;
      if (size > maxTileLightNum)
        maxTileLightNum = size;

      for (var k = 0; k < size; k++) {
        lightIndex.push(tileLightId[index][k]);
      }

      lightGrid.push(offset);
      lightGrid.push(size);
      lightGrid.push(0);

      offset += size;
    }
  }
}

var minX = 1000;
var maxX = -1000;
var minY = 1000;
var maxY = -1000;
var minZ = 1000;
var maxZ = -1000;

function initLights() {
  lights = [];
  lightPosition = [];
  lightColorRadius = [];

  var deltaX = maxX - minX;
  var deltaY = maxY - minY;
  var deltaZ = maxZ - minZ;
  for (var i = 0; i < lightNum; i++) {
    var radius = 5;

    lights.push({
      position: vec3.create([
        minX + deltaX * Math.random(),
        minY + deltaY * Math.random(),
        minZ + deltaZ * Math.random()
      ]),
      color: vec3.create([ Math.random(), Math.random(), Math.random() ]),
      radius: radius
    });
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

function initLightsFBO() {
  var lightIndexWidth = Math.ceil(Math.sqrt(lightIndex.length));
  for (var i = lightIndex.length; i < lightIndexWidth * lightIndexWidth; i++) {
    lightIndex.push(-1);
  }

  gl.bindTexture(gl.TEXTURE_2D, lightGridTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB16F,
    tileWidth,
    tileHeight,
    0,
    gl.RGB,
    gl.FLOAT,
    new Float32Array(lightGrid)
  );

  var lightIndexThree = [];
  for(var i = 0; i < lightIndex.length; ++i) {
    lightIndexThree[i * 3] = lightIndex[i];
    lightIndexThree[i * 3 + 1] = 0;
    lightIndexThree[i * 3 + 2] = 0;
  }
  gl.bindTexture(gl.TEXTURE_2D, lightIndexTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB32F,
    lightIndexWidth,
    lightIndexWidth,
    0,
    gl.RGB,
    gl.FLOAT,
    new Float32Array(lightIndexThree)
  );

  gl.bindTexture(gl.TEXTURE_2D, lightPositionTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB16F,
    lightPosition.length / 3,
    1,
    0,
    gl.RGB,
    gl.FLOAT,
    new Float32Array(lightPosition)
  );

  gl.bindTexture(gl.TEXTURE_2D, lightColorRadiusTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16F,
    lightColorRadius.length / 4,
    1,
    0,
    gl.RGBA,
    gl.FLOAT,
    new Float32Array(lightColorRadius)
  );
}
