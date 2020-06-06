'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var glmatrix = require('gl-matrix');
var parseWFObj = _interopDefault(require('wavefront-obj-parser'));

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
  WIREFRAME: 2,
  WIREFRAME_RANDOM_SUB: 3,
  FACE_OPAQUE_PLAIN: 4,
  DEBUG_GEOMETRY: 5,
};

var CONSTANTS = {
  SVG_NAMESPACE: 'http://www.w3.org/2000/svg',
};

/* eslint-disable no-undef */

/**
 * A MeshView is a rendered SVG version of a given Mesh.
 * Each Mesh is associated to a MeshView
 */
class MeshView {
  constructor(mesh) {
    this._mesh = mesh;

    this._view = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'g');
    this._view.setAttributeNS(null, 'id', mesh.id);

    this._circlePool = [];
    this._circlePoolCounter = 0;

    this._linePool = [];
    this._linePoolCounter = 0;

    this._polygonPool = [];
    this._polygonPoolCounter = 0;
  }


  get mesh() {
    return this._mesh
  }


  get view() {
    return this._view
  }


  reset() {
    // TODO: compare which is best
    this._view.innerHTML = '';
    // while (this._view.firstChild) {
    //   this._view.removeChild(this._view.firstChild)
    // }
    this._circlePoolCounter = 0;
    this._linePoolCounter = 0;
    this._polygonPoolCounter = 0;
  }


  /**
   *
   * @param {*} x
   * @param {*} y
   * @param {*} radius
   */
  addCircle(x, y, radius) {
    let circle = null;

    // the pool is not large enough, we create a new circle
    if (this._circlePool.length < this._circlePoolCounter + 1) {
      circle = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'circle');
      this._circlePool.push(circle);
    } else {
    // The pool is large enough, we borrow a circle from the pool
      circle = this._circlePool[this._circlePoolCounter];
    }

    this._circlePoolCounter += 1;

    circle.setAttributeNS(null, 'cx', x);
    circle.setAttributeNS(null, 'cy', y);
    circle.setAttributeNS(null, 'r', radius);
    // circle.setAttributeNS(null, 'id', this._mesh.id)
    circle.setAttributeNS(null, 'style', `fill: ${this._mesh.edgeColor}; opacity: ${this._mesh.opacity}; stroke-width: 0;`);

    this._view.appendChild(circle);
  }


  addLine(xA, yA, xB, yB, thickness) {
    let line = null;

    // the pool is not large enough, we create a new line
    if (this._linePool.length < this._linePoolCounter + 1) {
      line = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'line');
      this._linePool.push(line);
    } else {
    // The pool is large enough, we borrow a line from the pool
      line = this._linePool[this._linePoolCounter];
    }

    this._linePoolCounter += 1;
    line.setAttributeNS(null, 'x1', xA);
    line.setAttributeNS(null, 'y1', yA);
    line.setAttributeNS(null, 'x2', xB);
    line.setAttributeNS(null, 'y2', yB);
    line.setAttributeNS(null, 'style', `fill: none; opacity: ${this._mesh.opacity}; stroke-width: ${thickness}; stroke: ${this._mesh.edgeColor}`);
    this._view.appendChild(line);
  }


  addFaceOpaquePlain(xyArr, thickness) {
    let polygon = null;
    const mesh = this._mesh;

    // the pool is not large enough, we create a new polygon
    if (this._polygonPool.length < this._polygonPoolCounter + 1) {
      polygon = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'polygon');
      this._polygonPool.push(polygon);
    } else {
    // The pool is large enough, we borrow a polygon from the pool
      polygon = this._polygonPool[this._polygonPoolCounter];
    }

    this._polygonPoolCounter += 1;

    let pointsStr = '';
    for (let i = 0; i < xyArr.length - 1; i += 2) {
      pointsStr += `${xyArr[i]},${xyArr[i + 1]} `;
    }

    polygon.setAttributeNS(null, 'points', pointsStr);
    polygon.setAttributeNS(null, 'style', `fill: ${mesh.faceColor}; opacity: ${mesh.opacity}; stroke: ${mesh.edgeColor}; stroke-width: ${thickness}`);
    this._view.appendChild(polygon);
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
    this._worldVertices = null;
    this._faces = null;
    this._uniqueEdges = null;
    this._verticesPerFace = 3;
    this._boundingBox = {
      min: glmatrix.vec3.fromValues(0, 0, 0),
      max: glmatrix.vec3.fromValues(0, 0, 0),
      center: glmatrix.vec3.fromValues(0, 0, 0),
    };
    this._boundingBoxNeedsUpdate = true;
    this._showBoundingBox = false;

    this._scale = glmatrix.vec3.fromValues(1, 1, 1);
    this._quaternion = glmatrix.quat.create();
    this._position = glmatrix.vec3.create();

    // material data
    this._renderMode = RENDER_MODES.POINT_CLOUD;
    this._edgeColor = '#000000';
    this._faceColor = '#EEEEEE';
    this._opacity = 1;
    this._lineThickness = 1;
    this._radius = 1;

    this._matrix = glmatrix.mat4.create();
    this._worldVerticesNeedUpdate = true;

    this._faceNormalsWorld = null;
    this._faceNormalsWorldNeedUpdate = true;

    this._faceCentersWorld = null;
    this._faceCentersWorldNeedUpdate = true;
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
    this._worldVertices = new v.constructor(v.length);
    this._boundingBoxNeedsUpdate = true;
    this._faceNormalsWorldNeedUpdate = true;
    this._faceCentersWorldNeedUpdate = true;
    this._worldVerticesNeedUpdate = true;
    return this
  }


  get vertices() {
    return this._vertices
  }


  get nbVertices() {
    if (this._vertices === null) {
      return 0
    } else {
      return this._vertices.length / 3
    }
  }


  get worldVertices() {
    if (this._worldVerticesNeedUpdate) {
      this._computeWorldVertices();
    }
    return this._worldVertices
  }


  _computeWorldVertices() {
    const mat = this.modelMatrix;
    const tmpVec3 = glmatrix.vec3.create();
    const vert = this._vertices;

    for (let i = 0; i < this._worldVertices.length; i += 3) {
      tmpVec3[0] = vert[i];
      tmpVec3[1] = vert[i + 1];
      tmpVec3[2] = vert[i + 2];

      glmatrix.vec3.transformMat4(tmpVec3, tmpVec3, mat);
      this._worldVertices[i] = tmpVec3[0];
      this._worldVertices[i + 1] = tmpVec3[1];
      this._worldVertices[i + 2] = tmpVec3[2];
    }

    this._worldVerticesNeedUpdate = false;
  }


  set faces(f) {
    this._faces = f;
    this._faceNormalsWorldNeedUpdate = true;
    this._faceCenterWorldNeedUpdate = true;
  }


  get faces() {
    return this._faces
  }


  set edgeColor(c) {
    this._edgeColor = c;
  }


  get edgeColor() {
    return this._edgeColor
  }

  set faceColor(c) {
    this._faceColor = c;
  }

  get faceColor() {
    return this._faceColor
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


  set showBoundingBox(s) {
    this._showBoundingBox = s;
  }


  get showBoundingBox() {
    return this._showBoundingBox
  }


  /**
   * Note: the bounding box is in world coordinates
   */
  _computeBoundingBox() {
    if (this._vertices === null) {
      throw new Error('This mesh does not have any vertex.')
    }

    if (this._worldVerticesNeedUpdate) {
      this._computeWorldVertices();
    }

    let minx = +Infinity;
    let miny = +Infinity;
    let minz = +Infinity;
    let maxx = -Infinity;
    let maxy = -Infinity;
    let maxz = -Infinity;

    for (let i = 0; i < this._worldVertices.length; i += 3) {
      minx = Math.min(minx, this._worldVertices[i]);
      miny = Math.min(miny, this._worldVertices[i + 1]);
      minz = Math.min(minz, this._worldVertices[i + 2]);
      maxx = Math.max(maxx, this._worldVertices[i]);
      maxy = Math.max(maxy, this._worldVertices[i + 1]);
      maxz = Math.max(maxz, this._worldVertices[i + 2]);
    }

    this._boundingBox.min[0] = minx;
    this._boundingBox.min[1] = miny;
    this._boundingBox.min[2] = minz;
    this._boundingBox.max[0] = maxx;
    this._boundingBox.max[1] = maxy;
    this._boundingBox.max[2] = maxz;

    this._boundingBox.center[0] = (this._boundingBox.min[0] + this._boundingBox.max[0]) / 2;
    this._boundingBox.center[1] = (this._boundingBox.min[1] + this._boundingBox.max[1]) / 2;
    this._boundingBox.center[2] = (this._boundingBox.min[2] + this._boundingBox.max[2]) / 2;

    this._boundingBoxNeedsUpdate = false;
  }


  get boundingBox() {
    if (this._boundingBoxNeedsUpdate) {
      this._computeBoundingBox();
    }
    return this._boundingBox
  }


  get modelMatrix() {
    return this._matrix
  }


  get meshView() {
    return this._meshView
  }


  set position(p) {
    this._position[0] = p[0];
    this._position[1] = p[1];
    this._position[2] = p[2];
    this.updateMatrix();
  }


  get position() {
    return this._position.slice()
  }


  set quaternion(q) {
    this._quaternion[0] = q[0];
    this._quaternion[1] = q[1];
    this._quaternion[2] = q[2];
    this._quaternion[3] = q[3];
    this.updateMatrix();
  }


  get quaternion() {
    return this._quaternion.slice()
  }


  set scale(s) {
    this._scale[0] = s[0];
    this._scale[1] = s[1];
    this._scale[2] = s[2];
    this.updateMatrix();
  }

  get scale() {
    return this._scale.slice()
  }

  get uniqueEdges() {
    if (!this._uniqueEdges) {
      this._computeUniqueEdges();
    }
    return this._uniqueEdges
  }


  updateMatrix() {
    glmatrix.mat4.fromRotationTranslationScale(this._matrix, this._quaternion, this._position, this._scale);
    this._worldVerticesNeedUpdate = true;
    this._boundingBoxNeedsUpdate = true;
    this._faceNormalsWorldNeedUpdate = true;
    this._faceCentersWorldNeedUpdate = true;
  }


  setRotationFromEulerDegree(x, y, z) {
    glmatrix.quat.fromEuler(this._quaternion, x, y, z);
    this.updateMatrix();
  }


  _computeUniqueEdges() {
    if (this._faces === null) {
      throw new Error('The faces must be set before computing unique edges.')
    }

    const f = this._faces;
    const vpf = this._verticesPerFace;

    const verticePairs = {};

    for (let i = 0; i < f.length; i += vpf) {
      for (let j = 1; j < vpf; j += 1) {
        const verticeA = f[i + j - 1];
        const verticeB = f[i + j];
        let verticeLowerIndex = null;
        let verticeHigherIndex = null;

        if (verticeA < verticeB) {
          verticeLowerIndex = verticeA;
          verticeHigherIndex = verticeB;
        } else {
          verticeLowerIndex = verticeB;
          verticeHigherIndex = verticeA;
        }

        if (!(verticeLowerIndex in verticePairs)) {
          verticePairs[verticeLowerIndex] = new Set();
        }

        verticePairs[verticeLowerIndex].add(verticeHigherIndex);
      }
    }

    const tmp = [];
    const allFirtVertices = Object.keys(verticePairs).map((index) => parseInt(index, 10));

    for (let i = 0; i < allFirtVertices.length; i += 1) {
      const firstVertex = allFirtVertices[i];
      const it = verticePairs[firstVertex].entries();
      // eslint-disable-next-line no-restricted-syntax
      for (let secondVertex of it) {
        tmp.push(firstVertex, secondVertex[0]);
      }
    }

    this._uniqueEdges = new Uint32Array(tmp);
  }


  /**
   * Create a clone of this mesh with no shared structure. Can downsample the number of vertices
   * @param {*} nbVertices
   */
  clone() {
    const cpMesh = new Mesh();
    cpMesh.renderMode = this.renderMode;
    cpMesh.position = this.position;
    cpMesh.quaternion = this.quaternion;
    cpMesh.scale = this.scale;
    cpMesh.verticesPerFace = this.verticesPerFace;
    cpMesh.edgeColor = this.edgeColor;
    cpMesh.faceColor = this.faceColor;
    cpMesh.opacity = this.opacity;
    cpMesh.radius = this.radius;
    cpMesh.lineThickness = this.lineThickness;

    cpMesh.vertices = this._vertices ? this._vertices.slice() : null;
    cpMesh.faces = this._faces ? this._faces.slice() : null;

    return cpMesh
  }


  _computeFaceCentersWorld() {
    // just to make sure they are built
    const wv = this.worldVertices;

    const faces = this._faces;
    const vpf = this._verticesPerFace;
    const nbFaces = this._faces.length / this._verticesPerFace;
    const faceCentersWorld = [];

    for (let f = 0; f < nbFaces; f += 1) {
      const v0Index = f * vpf;
      let x = 0;
      let y = 0;
      let z = 0;

      for (let v = 0; v < vpf; v += 1) {
        x += wv[faces[v0Index + v] * 3];
        y += wv[faces[v0Index + v] * 3 + 1];
        z += wv[faces[v0Index + v] * 3 + 2];
      }

      faceCentersWorld.push(
        x / vpf,
        y / vpf,
        z / vpf,
      );
    }

    this._faceCentersWorld = new Float32Array(faceCentersWorld);
    this._faceCentersWorldNeedUpdate = false;
  }


  get faceCentersWorld() {
    if (this._faces === null) {
      return null
    }

    if (this._faceCentersWorldNeedUpdate) {
      this._computeFaceCentersWorld();
    }

    return this._faceCentersWorld
  }


  _computeFaceNormalWorld() {
    // just to make sure they are built
    const wv = this.worldVertices;

    const faces = this._faces;
    const vpf = this._verticesPerFace;
    const faceNormalsWorld = [];

    const ab = glmatrix.vec3.create();
    const bc = glmatrix.vec3.create();
    const n = glmatrix.vec3.create();

    for (let f = 0; f < faces.length; f += vpf) {
      const indexA = faces[f] * 3;
      const indexB = faces[f + 1] * 3;
      const indexC = faces[f + 2] * 3;

      ab[0] = wv[indexB] - wv[indexA];
      ab[1] = wv[indexB + 1] - wv[indexA + 1];
      ab[2] = wv[indexB + 2] - wv[indexA + 2];
      glmatrix.vec3.normalize(ab, ab);

      bc[0] = wv[indexC] - wv[indexB];
      bc[1] = wv[indexC + 1] - wv[indexB + 1];
      bc[2] = wv[indexC + 2] - wv[indexB + 2];
      glmatrix.vec3.normalize(bc, bc);

      glmatrix.vec3.cross(n, ab, bc);
      glmatrix.vec3.normalize(n, n);
      faceNormalsWorld.push(n[0], n[1], n[2]);
    }

    this._faceNormalsWorld = new Float32Array(faceNormalsWorld);
    this._faceNormalsWorldNeedUpdate = false;
  }


  get faceNormalsWorld() {
    if (this._faces === null) {
      return null
    }

    if (this._faceNormalsWorldNeedUpdate) {
      this._computeFaceNormalWorld();
    }
    return this._faceNormalsWorld
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

/* eslint-disable no-bitwise */

class Renderer {
  constructor(parentDiv, options) {
    this._width = 'width' in options ? options.width : window.innerWidth;
    this._height = 'height' in options ? options.height : window.innerHeight;
    this._background = 'background' in options ? options.background : null;
    this._parentDiv = parentDiv;

    this._canvas = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'svg');
    this._canvas.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this._canvas.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    this._canvas.setAttribute('height', `${this._height}`);
    this._canvas.setAttribute('width', `${this._width}`);
    this._canvas.setAttribute('style', `background-color: ${this._background};`);
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


  set background(b) {
    this._background = b;
    this._canvas.setAttribute('style', `background-color: ${this._background};`);
  }

  get background() {
    return this._background
  }

  get svgText() {
    return this._canvas.outerHTML
  }


  resetCanvas() {
    this._canvas.innerHTML = '';
    // while (this._canvas.firstChild) {
    //   this._canvas.removeChild(this._canvas.firstChild)
    // }
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
        case RENDER_MODES.WIREFRAME:
          this._renderWireframe(mesh, modelViewProjMat);
          break
        case RENDER_MODES.WIREFRAME_RANDOM_SUB:
          this._renderWireframeRandomSub(mesh, modelViewProjMat);
          break
        case RENDER_MODES.FACE_OPAQUE_PLAIN:
          this._renderFaceOpaquePlain(mesh, modelViewProjMat);
          break
        case RENDER_MODES.DEBUG_GEOMETRY:
          this._renderDebug(mesh, modelViewProjMat);
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
    const vertices = mesh.worldVertices;
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

    if (mesh.showBoundingBox) {
      this._addBoundingBox(mesh, mvpMat);
    }

    this._canvas.appendChild(meshView.view);
  }

  /*

    The BOunding Box

                H +----------+ G (max)
                / |         /|
               /  |        / |                     y
            E +-----------+ F|                     Λ  . z
              |   |       |  |                     | /
              | D + - - - | -+ C                   |/
              |  /        | /                      +-------> x
              | /         |/
      (min) A +-----------+ B

  */

  _addBoundingBox(mesh, mvpMat, bbLineThickness = 0.33) {
    const tmpVector = glmatrix.vec3.create();
    const meshView = mesh.meshView;

    const bb = mesh.boundingBox;
    const a3D = [
      bb.min[0],
      bb.min[1],
      bb.min[2],
    ];
    glmatrix.vec3.transformMat4(tmpVector, a3D, mvpMat);
    const a2D = this._unit2DPositionToCanvasPosition(tmpVector);

    const b3D = [
      bb.max[0],
      bb.min[1],
      bb.min[2],
    ];
    glmatrix.vec3.transformMat4(tmpVector, b3D, mvpMat);
    const b2D = this._unit2DPositionToCanvasPosition(tmpVector);

    const c3D = [
      bb.max[0],
      bb.min[1],
      bb.max[2],
    ];
    glmatrix.vec3.transformMat4(tmpVector, c3D, mvpMat);
    const c2D = this._unit2DPositionToCanvasPosition(tmpVector);

    const d3D = [
      bb.min[0],
      bb.min[1],
      bb.max[2],
    ];
    glmatrix.vec3.transformMat4(tmpVector, d3D, mvpMat);
    const d2D = this._unit2DPositionToCanvasPosition(tmpVector);

    const e3D = [
      bb.min[0],
      bb.max[1],
      bb.min[2],
    ];
    glmatrix.vec3.transformMat4(tmpVector, e3D, mvpMat);
    const e2D = this._unit2DPositionToCanvasPosition(tmpVector);

    const f3D = [
      bb.max[0],
      bb.max[1],
      bb.min[2],
    ];
    glmatrix.vec3.transformMat4(tmpVector, f3D, mvpMat);
    const f2D = this._unit2DPositionToCanvasPosition(tmpVector);

    const g3D = [
      bb.max[0],
      bb.max[1],
      bb.max[2],
    ];
    glmatrix.vec3.transformMat4(tmpVector, g3D, mvpMat);
    const g2D = this._unit2DPositionToCanvasPosition(tmpVector);

    const h3D = [
      bb.min[0],
      bb.max[1],
      bb.max[2],
    ];
    glmatrix.vec3.transformMat4(tmpVector, h3D, mvpMat);
    const h2D = this._unit2DPositionToCanvasPosition(tmpVector);

    // AB line
    meshView.addLine(a2D[0], a2D[1], b2D[0], b2D[1], bbLineThickness);

    // BC line
    meshView.addLine(b2D[0], b2D[1], c2D[0], c2D[1], bbLineThickness);

    // CD line
    meshView.addLine(c2D[0], c2D[1], d2D[0], d2D[1], bbLineThickness);

    // DA line
    meshView.addLine(d2D[0], d2D[1], a2D[0], a2D[1], bbLineThickness);

    // AE line
    meshView.addLine(a2D[0], a2D[1], e2D[0], e2D[1], bbLineThickness);

    // BF line
    meshView.addLine(b2D[0], b2D[1], f2D[0], f2D[1], bbLineThickness);

    // CG line
    meshView.addLine(c2D[0], c2D[1], g2D[0], g2D[1], bbLineThickness);

    // DH line
    meshView.addLine(d2D[0], d2D[1], h2D[0], h2D[1], bbLineThickness);

    // EF line
    meshView.addLine(e2D[0], e2D[1], f2D[0], f2D[1], bbLineThickness);

    // FG line
    meshView.addLine(f2D[0], f2D[1], g2D[0], g2D[1], bbLineThickness);

    // GH line
    meshView.addLine(g2D[0], g2D[1], h2D[0], h2D[1], bbLineThickness);

    // HE line
    meshView.addLine(h2D[0], h2D[1], e2D[0], e2D[1], bbLineThickness);
  }


  _renderWireframe(mesh, mvpMat) {
    const meshView = mesh.meshView;
    const vertices = mesh.worldVertices;
    const uniqueEdges = mesh.uniqueEdges;
    const camPosition = this._camera.position;

    meshView.reset();
    const tmpVectorA = glmatrix.vec3.create();
    const tmpVectorB = glmatrix.vec3.create();

    for (let i = 0; i < uniqueEdges.length; i += 2) {
      const vertIndexA = uniqueEdges[i];
      const vertIndexB = uniqueEdges[i + 1];

      glmatrix.vec3.transformMat4(tmpVectorA, [vertices[3 * vertIndexA], vertices[3 * vertIndexA + 1], vertices[3 * vertIndexA + 2]], mvpMat);
      glmatrix.vec3.transformMat4(tmpVectorB, [vertices[3 * vertIndexB], vertices[3 * vertIndexB + 1], vertices[3 * vertIndexB + 2]], mvpMat);

      // No rendering if the two points are outside of projection  canonical/frustrum box
      if ((tmpVectorA[0] >= 1
      || tmpVectorA[0] <= -1
      || tmpVectorA[1] >= 1
      || tmpVectorA[1] <= -1
      || tmpVectorA[2] >= 1
      || tmpVectorA[2] <= -1)
      && (tmpVectorB[0] >= 1
      || tmpVectorB[0] <= -1
      || tmpVectorB[1] >= 1
      || tmpVectorB[1] <= -1
      || tmpVectorB[2] >= 1
      || tmpVectorB[2] <= -1)) {
        continue
      }

      const middlePoint = [
        (tmpVectorA[0] + tmpVectorB[0]) / 2,
        (tmpVectorA[1] + tmpVectorB[1]) / 2,
        (tmpVectorA[2] + tmpVectorB[2]) / 2,
      ];

      const mesh2camDistance = ((middlePoint[0] - camPosition[0]) ** 2 + (middlePoint[1] - camPosition[1]) ** 2 + (middlePoint[2] - camPosition[2]) ** 2) ** 0.5;
      const thickness = (mesh.lineThickness / (Math.tan(this._camera.fieldOfView / 2) * mesh2camDistance)) * (this._height / 2);
      const canvasPosA = this._unit2DPositionToCanvasPosition(tmpVectorA);
      const canvasPosB = this._unit2DPositionToCanvasPosition(tmpVectorB);

      meshView.addLine(canvasPosA[0], canvasPosA[1], canvasPosB[0], canvasPosB[1], thickness);
    }

    if (mesh.showBoundingBox) {
      this._addBoundingBox(mesh, mvpMat);
    }

    this._canvas.appendChild(meshView.view);
  }



  _renderWireframeRandomSub(mesh, mvpMat) {
    const meshView = mesh.meshView;
    const vertices = mesh.worldVertices;
    const uniqueEdges = mesh.uniqueEdges;
    const camPosition = this._camera.position;

    // Displaying at most 750 edges, but most likely 20% of the edges
    const edgesToRender = Math.min(750, mesh.uniqueEdges.length * 0.1);

    meshView.reset();
    const tmpVectorA = glmatrix.vec3.create();
    const tmpVectorB = glmatrix.vec3.create();

    const alreadyRenderedEdgeIndex = {};
    let i = 0;

    while (i < edgesToRender) {
      const edgeIndex = ~~(Math.random() * ((mesh.uniqueEdges.length - 1) * 0.5));

      if (edgeIndex in alreadyRenderedEdgeIndex) {
        continue
      } else {
        alreadyRenderedEdgeIndex[edgeIndex] = true;
        i += 1;
      }

      const vertIndexA = uniqueEdges[edgeIndex * 2];
      const vertIndexB = uniqueEdges[edgeIndex * 2 + 1];

      glmatrix.vec3.transformMat4(tmpVectorA, [vertices[3 * vertIndexA], vertices[3 * vertIndexA + 1], vertices[3 * vertIndexA + 2]], mvpMat);
      glmatrix.vec3.transformMat4(tmpVectorB, [vertices[3 * vertIndexB], vertices[3 * vertIndexB + 1], vertices[3 * vertIndexB + 2]], mvpMat);

      // No rendering if the two points are outside of projection  canonical/frustrum box
      if ((tmpVectorA[0] >= 1
      || tmpVectorA[0] <= -1
      || tmpVectorA[1] >= 1
      || tmpVectorA[1] <= -1
      || tmpVectorA[2] >= 1
      || tmpVectorA[2] <= -1)
      && (tmpVectorB[0] >= 1
      || tmpVectorB[0] <= -1
      || tmpVectorB[1] >= 1
      || tmpVectorB[1] <= -1
      || tmpVectorB[2] >= 1
      || tmpVectorB[2] <= -1)) {
        continue
      }

      const middlePoint = [
        (tmpVectorA[0] + tmpVectorB[0]) / 2,
        (tmpVectorA[1] + tmpVectorB[1]) / 2,
        (tmpVectorA[2] + tmpVectorB[2]) / 2,
      ];

      const mesh2camDistance = ((middlePoint[0] - camPosition[0]) ** 2 + (middlePoint[1] - camPosition[1]) ** 2 + (middlePoint[2] - camPosition[2]) ** 2) ** 0.5;
      const thickness = (mesh.lineThickness / (Math.tan(this._camera.fieldOfView / 2) * mesh2camDistance)) * (this._height / 2);
      const canvasPosA = this._unit2DPositionToCanvasPosition(tmpVectorA);
      const canvasPosB = this._unit2DPositionToCanvasPosition(tmpVectorB);

      meshView.addLine(canvasPosA[0], canvasPosA[1], canvasPosB[0], canvasPosB[1], thickness);
    }

    if (mesh.showBoundingBox) {
      this._addBoundingBox(mesh, mvpMat);
    }

    this._canvas.appendChild(meshView.view);
  }


  _renderFaceOpaquePlain(mesh, mvpMat) {
    const meshView = mesh.meshView;
    meshView.reset();
    const vertices = mesh.worldVertices;
    const faces = mesh.faces;
    const faceNormals = mesh.faceNormalsWorld;
    const faceCenters = mesh.faceCentersWorld;
    const camPosition = this._camera.position;
    const vpf = mesh.verticesPerFace;
    const nbFaces = faces.length / vpf;

    const faceNormal = glmatrix.vec3.create();
    const faceCenter = glmatrix.vec3.create();
    const camToCenter = glmatrix.vec3.create();
    const normalTip = glmatrix.vec3.create();
    const tmp = glmatrix.vec3.create();

    // will be filled with
    const polygonsToRender = [];
    const tmpCoord = glmatrix.vec3.create();

    for (let f = 0; f < nbFaces; f += 1) {
      const v0Index = f * vpf;

      // discard a face if its normal goes more or less the same direction as the vector camera-to-faceCenter.
      // IOW, if dot product >= 1
      faceNormal[0] = faceNormals[f * 3];
      faceNormal[1] = faceNormals[f * 3 + 1];
      faceNormal[2] = faceNormals[f * 3 + 2];

      faceCenter[0] = faceCenters[f * 3];
      faceCenter[1] = faceCenters[f * 3 + 1];
      faceCenter[2] = faceCenters[f * 3 + 2];

      camToCenter[0] = faceCenter[0] - camPosition[0];
      camToCenter[1] = faceCenter[1] - camPosition[1];
      camToCenter[2] = faceCenter[2] - camPosition[2];
      const camToCenterDist = glmatrix.vec3.length(camToCenter);
      glmatrix.vec3.normalize(camToCenter, camToCenter);

      // compute face center in 2D
      glmatrix.vec3.transformMat4(tmp, faceCenter, mvpMat);
      const faceCenter2D = this._unit2DPositionToCanvasPosition(tmp);

      // compute the normal vector in 2D
      normalTip[0] = faceCenter[0] + faceNormal[0] * 0.2;
      normalTip[1] = faceCenter[1] + faceNormal[1] * 0.2;
      normalTip[2] = faceCenter[2] + faceNormal[2] * 0.2;
      glmatrix.vec3.transformMat4(tmp, normalTip, mvpMat);
      const normalTip2D = this._unit2DPositionToCanvasPosition(tmp);

      const dotProd = glmatrix.vec3.dot(faceNormal, camToCenter);

      if (dotProd >= 0) {
        continue
      }

      // const allVerticesOfFace3D = [] // in the form [x, y, z, x, y, z, ...]
      const allVerticesOfFace2D = []; // in the form [x, y, x, y, ...]
      let allProjectionsAreOutsideFrustrum = true;
      for (let v = 0; v < vpf; v += 1) {
        const offset = faces[v0Index + v] * 3;
        tmpCoord[0] = vertices[offset];
        tmpCoord[1] = vertices[offset + 1];
        tmpCoord[2] = vertices[offset + 2];
        // allVerticesOfFace3D.push(tmpCoord[0], tmpCoord[1], tmpCoord[2])

        glmatrix.vec3.transformMat4(tmpCoord, tmpCoord, mvpMat);

        const isOutsideFrustrum = (tmpCoord[0] >= 1
                                || tmpCoord[0] <= -1
                                || tmpCoord[1] >= 1
                                || tmpCoord[1] <= -1
                                || tmpCoord[2] >= 1
                                || tmpCoord[2] <= -1);
        allProjectionsAreOutsideFrustrum = allProjectionsAreOutsideFrustrum && isOutsideFrustrum;
        const canvasPos = this._unit2DPositionToCanvasPosition(tmpCoord);
        allVerticesOfFace2D.push(canvasPos[0], canvasPos[1]);
      }

      // all the vertices must be oustise to not render
      if (allProjectionsAreOutsideFrustrum) {
        continue
      }

      polygonsToRender.push({
        points2D: allVerticesOfFace2D,
        faceCenter2D,
        normalTip2D,
        thickness: (mesh.lineThickness / (Math.tan(this._camera.fieldOfView / 2) * camToCenterDist)) * (this._height / 2),
        distanceToCam: camToCenterDist,
      });
    }

    polygonsToRender.sort((a, b) => (a.distanceToCam > b.distanceToCam ? -1 : 1)).forEach((polygon) => {
      // adding the face
      meshView.addFaceOpaquePlain(polygon.points2D, polygon.thickness);
    });

    this._canvas.appendChild(meshView.view);
  }











  _renderDebug(mesh, mvpMat) {
    const meshView = mesh.meshView;
    meshView.reset();
    const vertices = mesh.worldVertices;
    const faces = mesh.faces;
    const faceNormals = mesh.faceNormalsWorld;
    const faceCenters = mesh.faceCentersWorld;
    const camPosition = this._camera.position;
    const vpf = mesh.verticesPerFace;
    const nbFaces = faces.length / vpf;

    const faceNormal = glmatrix.vec3.create();
    const faceCenter = glmatrix.vec3.create();
    const camToCenter = glmatrix.vec3.create();
    const normalTip = glmatrix.vec3.create();
    const tmp = glmatrix.vec3.create();

    // will be filled with
    const polygonsToRender = [];
    const tmpCoord = glmatrix.vec3.create();

    for (let f = 0; f < nbFaces; f += 1) {
      const v0Index = f * vpf;

      // discard a face if its normal goes more or less the same direction as the vector camera-to-faceCenter.
      // IOW, if dot product >= 1
      faceNormal[0] = faceNormals[f * 3];
      faceNormal[1] = faceNormals[f * 3 + 1];
      faceNormal[2] = faceNormals[f * 3 + 2];

      faceCenter[0] = faceCenters[f * 3];
      faceCenter[1] = faceCenters[f * 3 + 1];
      faceCenter[2] = faceCenters[f * 3 + 2];

      camToCenter[0] = faceCenter[0] - camPosition[0];
      camToCenter[1] = faceCenter[1] - camPosition[1];
      camToCenter[2] = faceCenter[2] - camPosition[2];
      const camToCenterDist = glmatrix.vec3.length(camToCenter);
      glmatrix.vec3.normalize(camToCenter, camToCenter);

      // compute face center in 2D
      glmatrix.vec3.transformMat4(tmp, faceCenter, mvpMat);
      const faceCenter2D = this._unit2DPositionToCanvasPosition(tmp);

      // compute the normal vector in 2D
      normalTip[0] = faceCenter[0] + faceNormal[0] * 0.2;
      normalTip[1] = faceCenter[1] + faceNormal[1] * 0.2;
      normalTip[2] = faceCenter[2] + faceNormal[2] * 0.2;
      glmatrix.vec3.transformMat4(tmp, normalTip, mvpMat);
      const normalTip2D = this._unit2DPositionToCanvasPosition(tmp);

      // const dotProd = glmatrix.vec3.dot(faceNormal, camToCenter)

      // if (dotProd >= 0) {
      //   continue
      // }

      // const allVerticesOfFace3D = [] // in the form [x, y, z, x, y, z, ...]
      const allVerticesOfFace2D = []; // in the form [x, y, x, y, ...]
      let allProjectionsAreOutsideFrustrum = true;
      for (let v = 0; v < vpf; v += 1) {
        const offset = faces[v0Index + v] * 3;
        tmpCoord[0] = vertices[offset];
        tmpCoord[1] = vertices[offset + 1];
        tmpCoord[2] = vertices[offset + 2];
        // allVerticesOfFace3D.push(tmpCoord[0], tmpCoord[1], tmpCoord[2])

        glmatrix.vec3.transformMat4(tmpCoord, tmpCoord, mvpMat);

        const isOutsideFrustrum = (tmpCoord[0] >= 1
                                || tmpCoord[0] <= -1
                                || tmpCoord[1] >= 1
                                || tmpCoord[1] <= -1
                                || tmpCoord[2] >= 1
                                || tmpCoord[2] <= -1);
        allProjectionsAreOutsideFrustrum = allProjectionsAreOutsideFrustrum && isOutsideFrustrum;

        const canvasPos = this._unit2DPositionToCanvasPosition(tmpCoord);
        allVerticesOfFace2D.push(canvasPos[0], canvasPos[1]);
      }

      // all the vertices must be oustise to not render
      if (allProjectionsAreOutsideFrustrum) {
        continue
      }

      polygonsToRender.push({
        points2D: allVerticesOfFace2D,
        faceCenter2D,
        normalTip2D,
        distanceToCam: camToCenterDist,
      });
    }

    polygonsToRender.sort((a, b) => (a.distanceToCam > b.distanceToCam ? -1 : 1)).forEach((polygon) => {
      // adding the face
      meshView.addFaceOpaquePlain(polygon.points2D, 0.3);

      // adding the polygon center circle
      meshView.addCircle(polygon.faceCenter2D[0], polygon.faceCenter2D[1], 1);

      // adding the normal line
      meshView.addLine(polygon.faceCenter2D[0], polygon.faceCenter2D[1], polygon.normalTip2D[0], polygon.normalTip2D[1], 0.3);
    });

    this._canvas.appendChild(meshView.view);
  }

}

class ObjParser {
  static parse(objStr) {
    const meshData = parseWFObj(objStr);
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
