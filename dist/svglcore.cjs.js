'use strict';

var glmatrix = require('gl-matrix');

/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
class Tools {
  static uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16)
    });
  }
}

var RENDER_MODES = {
  POINT_CLOUD: 0,
  POLYLINE: 1,
  TRIANGLE_WIREFRAME: 2,
};

var CONSTANTS = {
  SVG_NAMESPACE: 'http://www.w3.org/2000/svg',
};

/**
 * A MeshView is a rendered SVG version of a given Mesh.
 * Each Mesh is associated to a MeshView
 */
class MeshView {
  constructor(mesh) {
    this._mesh = mesh;

    this._view = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'g');
    this._view.setAttributeNS(null, 'id', mesh.id);
  }


  get mesh() {
    return this._mesh
  }


  get view() {
    return this._view
  }


  reset() {
    // TODO: compare which is best
    // this._view.innerHTML = ''
    while (this._view.firstChild) {
      this._view.removeChild(this._view.firstChild);
    }
  }


  addCircle(x, y, radius) {
    const circle = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'circle');
    circle.setAttributeNS(null, 'cx', x);
    circle.setAttributeNS(null, 'cy', y);
    circle.setAttributeNS(null, 'r', radius);
    circle.setAttributeNS(null, 'id', this._mesh.id);
    circle.setAttributeNS(null, 'style', `fill: ${this._mesh.color}; opacity: ${this._mesh.opacity}; stroke-width: 0px;`);
    this._view.appendChild(circle);
  }
}

class Mesh {
  constructor() {
    this._id = Tools.uuidv4();
    this._meshView = new MeshView(this);

    // if visible is false, this mesh will not be rendered
    this._visible = true;

    // geometry data
    this._vertices = null;
    this._faces = null;
    this._verticesPerFace = 3;
    this._boundingBox = {
      min: glmatrix.vec3.fromValues(0, 0, 0),
      max: glmatrix.vec3.fromValues(0, 0, 0),
    };

    this._scale = glmatrix.vec3.fromValues(1, 1, 1);
    this._quaternion = glmatrix.quat.create();
    this._position = glmatrix.vec3.create();

    // material data
    this._renderMode = RENDER_MODES.POINT_CLOUD;
    this._color = '#000';
    this._opacity = 1;
    this._lineThickness = 1;
    this._radius = 1;
  }


  get id() {
    return this._id
  }


  set renderMode(rm) {
    if (Object.values(RENDER_MODES).includes(rm)) {
      this._renderMode = rm;
    } else {
      throw new Error('The render mode is incorrect.')
    }
  }


  get renderMode() {
    return this._renderMode
  }


  set lineThickness(t) {
    this._lineThickness = t;
  }


  get lineThickness() {
    return this._lineThickness
  }


  set radius(r) {
    this._radius = r;
  }


  get radius() {
    return this._radius
  }


  set vertices(v) {
    if (v.length % 3 !== 0) {
      throw new Error('The vertice array length must be multiple of 3.')
    }

    this._vertices = v;
    return this
  }


  get vertices() {
    return this._vertices
  }


  set faces(f) {
    this._faces = f;
  }


  get faces() {
    return this._faces
  }


  set color(c) {
    this._color = c;
  }


  get color() {
    return this._color
  }


  set opacity(o) {
    this._opacity = o;
  }


  get opacity() {
    return this._opacity
  }


  set verticesPerFace(vpf) {
    this._verticesPerFace = vpf;
  }


  get verticesPerFace() {
    return this._verticesPerFace
  }

  get visible() {
    return this._visible
  }


  set visible(v) {
    this._visible = v;
  }


  /**
   * Note: the bounding box is in world coordinates
   */
  computeBoundingBox() {
    if (this._vertices === null) {
      throw new Error('This mesh does not have any vertex.')
    }

    let minx = +Infinity;
    let miny = +Infinity;
    let minz = +Infinity;
    let maxx = -Infinity;
    let maxy = -Infinity;
    let maxz = -Infinity;

    for (let i = 0; i < this._vertices.length; i += 3) {
      minx = Math.min(minx, this._vertices[i]);
      miny = Math.min(miny, this._vertices[i + 1]);
      minz = Math.min(minz, this._vertices[i + 2]);
      maxx = Math.max(maxx, this._vertices[i]);
      maxy = Math.max(maxy, this._vertices[i + 1]);
      maxz = Math.max(maxz, this._vertices[i + 2]);
    }

    const modelMat = this.modelMatrix;
    const minInWorld = glmatrix.vec3.create();
    const maxInWorld = glmatrix.vec3.create();
    glmatrix.vec3.transformMat4(minInWorld, [minx, miny, minz], modelMat);
    glmatrix.vec3.transformMat4(maxInWorld, [maxx, maxy, maxz], modelMat);

    // if the model matrix encodes a rotation, min and max could be swapped on some dimensions
    this._boundingBox.min[0] = Math.min(minInWorld[0], maxInWorld[0]);
    this._boundingBox.min[1] = Math.min(minInWorld[1], maxInWorld[1]);
    this._boundingBox.min[2] = Math.min(minInWorld[2], maxInWorld[2]);
    this._boundingBox.max[0] = Math.max(minInWorld[0], maxInWorld[0]);
    this._boundingBox.max[1] = Math.max(minInWorld[1], maxInWorld[1]);
    this._boundingBox.max[2] = Math.max(minInWorld[2], maxInWorld[2]);

    return this
  }


  get boundingBox() {
    return this._boundingBox
  }


  get modelMatrix() {
    const mat = glmatrix.mat4.create();
    glmatrix.mat4.fromRotationTranslationScale(mat, this._quaternion, this._position, this._scale);
    return mat
  }


  get meshView() {
    return this._meshView
  }
}

class Scene {
  constructor() {
    this._objects = [];
  }


  add(mesh) {
    if (mesh instanceof Mesh) {
      this._objects.push(mesh);
    } else {
      throw new Error('The provided object is not a Mesh.')
    }

    return this
  }


  remove(meshId) {
    for (let i = this._objects.length - 1; i >= 0; i -= 1) {
      if (this._objects[i].id === meshId) {
        this._objects.splice(i, 1);
      }
    }
    return this
  }


  get(meshId) {
    return this._objects.filter(m => m.id === meshId)
  }

  
  getAll() {
    return this._objects
  }
}

// inspired by:
// https://github.com/mikolalysenko/orbit-camera/blob/master/orbit.js

function quatFromVec(out, da) {
  const x = da[0];
  const y = da[1];
  const z = da[2];
  let s = x * x + y * y;

  if (s > 1.0) {
    s = 1.0;
  }
  out[0] = -da[0];
  out[1] = da[1];
  out[2] = da[2] || Math.sqrt(1.0 - s);
  out[3] = 0.0;
}


let scratch0 = new Float32Array(16);
let scratch1 = new Float32Array(16);


class PerspectiveCamera {
  constructor(options = {}) {
    this._rotation = glmatrix.quat.create();
    this._center = glmatrix.vec3.create();
    this._distance = 10;

    // necessary for the projection matrix
    this._fovy = Math.PI / 4;
    this._aspectRatio = 16 / 9; // typically width / height
    this._near = 0.01;
    this._far = Infinity;

    if ('eye' in options && 'center' in options && 'up' in options) {
      this.lookAt(options.eye, options.center, options.up);
    }
  }

  lookAt(eye, center, up) {
    glmatrix.mat4.lookAt(scratch0, eye, center, up);
    glmatrix.mat3.fromMat4(scratch0, scratch0);
    glmatrix.quat.fromMat3(this._rotation, scratch0);
    glmatrix.vec3.copy(this._center, center);
    this._distance = glmatrix.vec3.distance(eye, center);
  }

  get matrix() {
    let m = glmatrix.mat4.create();
    glmatrix.mat4.invert(m, this.viewMatrix);
    return m
  }

  get position() {
    const m = this.matrix;
    return glmatrix.vec3.fromValues(m[12], m[13], m[14])
  }

  get viewMatrix() {
    const out = glmatrix.mat4.create();
    scratch1[0] = 0;
    scratch1[1] = 0;
    scratch1[2] = -this._distance;
    glmatrix.mat4.fromRotationTranslation(
      out,
      glmatrix.quat.conjugate(scratch0, this._rotation),
      scratch1,
    );
    glmatrix.mat4.translate(out, out, glmatrix.vec3.negate(scratch0, this._center));
    return out
  }


  translate(vec) {
    const d = this._distance;
    scratch0[0] = -d * (vec[0] || 0);
    scratch0[1] = d * (vec[1] || 0);
    scratch0[2] = d * (vec[2] || 0);
    glmatrix.vec3.transformQuat(scratch0, scratch0, this._rotation);
    glmatrix.vec3.add(this._center, this._center, scratch0);
  }


  dolly(d) {
    this._distance += d;
    if (this._distance < 0.0) {
      this._distance = 0.0;
    }
  }


  rotate(db) { // TODO: simplify this
    quatFromVec(scratch0, [0, 0]);
    quatFromVec(scratch1, db);
    glmatrix.quat.invert(scratch1, scratch1);
    glmatrix.quat.multiply(scratch0, scratch0, scratch1);
    if (glmatrix.quat.length(scratch0) < 1e-6) {
      return
    }
    glmatrix.quat.multiply(this._rotation, this._rotation, scratch0);
    glmatrix.quat.normalize(this._rotation, this._rotation);
  }


  get projMatrix() {
    const pm = glmatrix.mat4.create();
    glmatrix.mat4.perspective(pm, this._fovy, this._aspectRatio, this._near, this._far);
    return pm
  }


  set aspectRatio(ar) {
    this._aspectRatio = ar;
  }


  get apectRatio() {
    return this._aspectRatio
  }


  /**
   * Vertical field of view in radian
   */
  set fieldOfView(fov) {
    this._fovy = fov;
  }

  get fieldOfView() {
    return this._fovy
  }


  set near(n) {
    this._near = n;
  }


  get near() {
    return this._near
  }


  set far(f) {
    this._far = f;
  }


  get far() {
    return this._far
  }

}

/* eslint-disable no-continue */

class Renderer {
  constructor(parentDiv, options) {
    this._width = 'width' in options ? options.width : window.innerWidth;
    this._height = 'height' in options ? options.height : window.innerHeight;
    this._parentDiv = parentDiv;

    this._canvas = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'svg');
    this._canvas.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this._canvas.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    this._canvas.setAttribute('height', `${this._height}`);
    this._canvas.setAttribute('width', `${this._width}`);
    this._canvas.setAttribute('viewBox', `0 0 ${this._width} ${this._height}`);
    this._parentDiv.appendChild(this._canvas);

    this._scene = null;
    this._camera = null;

    if ('scene' in options) {
      this.scene = options.scene;
    }

    if ('camera' in options) {
      this.camera = options.camera;
    }

  }


  set scene(s) {
    if (s instanceof Scene) {
      this._scene = s;
    } else {
      throw new Error('Invalid Scene object.')
    }
  }


  set camera(c) {
    if (c instanceof PerspectiveCamera) {
      this._camera = c;
    } else {
      throw new Error('Invalid Camera Object.')
    }
  }


  resetCanvas() {
    while (this._canvas.firstChild) {
      this._canvas.removeChild(this._canvas.firstChild);
    }
  }


  render() {
    if (this._camera === null) {
      throw new Error('A Camera must be set.')
    }

    if (this._scene === null) {
      throw new Error('A Scene must be set.')
    }

    this.resetCanvas();

    const meshes = this._scene.getAll();
    const viewMat = this._camera.viewMatrix;
    const projMat = this._camera.projMatrix;

    meshes.forEach((mesh) => {
      if (!mesh.visible) {
        return
      }

      // dealing with matrices
      const modelMat = mesh.modelMatrix;
      const modelViewMat = glmatrix.mat4.create();
      const modelViewProjMat = glmatrix.mat4.create();
      // glmatrix.mat4.multiply(modelViewMat, modelMat, viewMat)
      // glmatrix.mat4.multiply(modelViewProjMat, modelViewMat, projMat)

      glmatrix.mat4.multiply(modelViewMat, viewMat, modelMat);
      glmatrix.mat4.multiply(modelViewProjMat, projMat, modelViewMat);

      switch (mesh.renderMode) {
        case RENDER_MODES.POINT_CLOUD:
          this._renderPointCloud(mesh, modelViewProjMat);
          break
        default: throw new Error('Only point cloud rendering is implemented for the moment.')
      }
    });
  }


  /**
   * transform a 2D unit position [-1, 1] into an actual canvas position
   * that has origin on top left.
   */
  _unit2DPositionToCanvasPosition(unitPos) {
    return [
      (unitPos[0] * this._width + this._width) * 0.5,
      this._height - (unitPos[1] * this._height + this._height) * 0.5,
    ]
  }


  _renderPointCloud(mesh, mvpMat) {
    const meshView = mesh.meshView;
    const vertices = mesh.vertices;
    const camPosition = this._camera.position;

    meshView.reset();
    const tmpVector = glmatrix.vec3.create();

    for (let i = 0; i < vertices.length; i += 3) {
      // computing the position of the center of the circle to add
      glmatrix.vec3.transformMat4(tmpVector, [vertices[i], vertices[i + 1], vertices[i + 2]], mvpMat);

      // No rendering if outside of projection  canonical/frustrum box
      if (tmpVector[0] >= 1
      || tmpVector[0] <= -1
      || tmpVector[1] >= 1
      || tmpVector[1] <= -1
      || tmpVector[2] >= 1
      || tmpVector[2] <= -1) {
        continue
      }

      const canvasPos = this._unit2DPositionToCanvasPosition(tmpVector);

      // computing the cirlce radius
      const mesh2camDistance = ((vertices[i] - camPosition[0]) ** 2 + (vertices[i + 1] - camPosition[1]) ** 2 + (vertices[i + 2] - camPosition[2]) ** 2) ** 0.5;
      const radius = (mesh.radius / (Math.tan(this._camera.fieldOfView / 2) * mesh2camDistance)) * (this._height / 2);
      meshView.addCircle(canvasPos[0], canvasPos[1], radius);
    }

    this._canvas.appendChild(meshView.view);
  }
}

var wavefrontObjParser = ParseWavefrontObj;

// Map .obj vertex info line names to our returned property names
var vertexInfoNameMap = {v: 'vertexPositions', vt: 'vertexUVs', vn: 'vertexNormals'};

function ParseWavefrontObj (wavefrontString) {

  var parsedJSON = {vertexNormals: [], vertexUVs: [], vertexPositions: [], vertexNormalIndices: [], vertexUVIndices: [], vertexPositionIndices: []};

  var linesInWavefrontObj = wavefrontString.split('\n');

  var currentLine, currentLineTokens, vertexInfoType, i, k;

  // Loop through and parse every line in our .obj file
  for (i = 0; i < linesInWavefrontObj.length; i++) {
    currentLine = linesInWavefrontObj[i];
    // Tokenize our current line
    currentLineTokens = currentLine.trim().split(/\s+/);
    // vertex position, vertex texture, or vertex normal
    vertexInfoType = vertexInfoNameMap[currentLineTokens[0]];

    if (vertexInfoType) {
      for (k = 1; k < currentLineTokens.length; k++) {
        parsedJSON[vertexInfoType].push(parseFloat(currentLineTokens[k]));
      }
      continue
    }

    if (currentLineTokens[0] === 'f') {
      // Get our 4 sets of vertex, uv, and normal indices for this face
      for (k = 1; k < 5; k++) {
        // If there is no fourth face entry then this is specifying a triangle
        // in this case we push `-1`
        // Consumers of this module should check for `-1` before expanding face data
        if (k === 4 && !currentLineTokens[4]) {
          parsedJSON.vertexPositionIndices.push(-1);
          parsedJSON.vertexUVIndices.push(-1);
          parsedJSON.vertexNormalIndices.push(-1);
        } else {
          var indices = currentLineTokens[k].split('/');
          parsedJSON.vertexPositionIndices.push(parseInt(indices[0], 10) - 1); // We zero index
          parsedJSON.vertexUVIndices.push(parseInt(indices[1], 10) - 1); // our face indices
          parsedJSON.vertexNormalIndices.push(parseInt(indices[2], 10) - 1); // by subtracting 1
        }
      }
    }
  }

  return parsedJSON
}

class ObjParser {
  static parse(objStr) {
    const meshData = wavefrontObjParser(objStr);
    const faces = new Uint32Array(meshData.vertexPositionIndices.filter((v) => v >= 0)); // the lib leaves room for 4-vertices faces by adding -1
    const vertices = new Float32Array(meshData.vertexPositions);
    const normals = new Float32Array(meshData.vertexNormals);

    return {
      vertices,
      faces,
      normals,
    }
  }
}

var index = ({
  Scene,
  PerspectiveCamera,
  Mesh,
  Renderer,
  ObjParser,
  RENDER_MODES,
});

module.exports = index;
//# sourceMappingURL=svglcore.cjs.js.map
