import { vec3, quat, mat4, mat3 } from 'gl-matrix';
import parseWFObj from 'wavefront-obj-parser';

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
  TRIANGLE_WIREFRAME_RANDOM_SUB: 3,
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
    circle.setAttributeNS(null, 'style', `fill: ${this._mesh.color}; opacity: ${this._mesh.opacity}; stroke-width: 0;`);

    this._view.appendChild(circle);
  }


  addLine(xA, yA, xB, yB, thickness) {
    let line = null;

    // the pool is not large enough, we create a new line
    if (this._linePool.length < this._linePoolCounter + 1) {
      line = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'line');
      this._linePool.push(line);
    } else {
    // The pool is large enough, we borrow a circle from the pool
      line = this._linePool[this._linePoolCounter];
    }

    this._linePoolCounter += 1;
    line.setAttributeNS(null, 'x1', xA);
    line.setAttributeNS(null, 'y1', yA);
    line.setAttributeNS(null, 'x2', xB);
    line.setAttributeNS(null, 'y2', yB);
    // line.setAttributeNS(null, 'id', this._mesh.id)
    line.setAttributeNS(null, 'style', `fill: none; opacity: ${this._mesh.opacity}; stroke-width: ${thickness}; stroke: ${this._mesh.color}`);
    this._view.appendChild(line);
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
      min: vec3.fromValues(0, 0, 0),
      max: vec3.fromValues(0, 0, 0),
      center: vec3.fromValues(0, 0, 0),
    };
    this._boundingBoxNeedsUpdate = true;

    this._scale = vec3.fromValues(1, 1, 1);
    this._quaternion = quat.create();
    this._position = vec3.create();

    // material data
    this._renderMode = RENDER_MODES.POINT_CLOUD;
    this._color = '#000';
    this._opacity = 1;
    this._lineThickness = 1;
    this._radius = 1;

    this._matrix = mat4.create();
    this._worldVerticesNeedsUpdate = true;
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
    if (this._worldVerticesNeedsUpdate) {
      this._computeWorldVertices();
    }
    return this._worldVertices
  }


  _computeWorldVertices() {
    const mat = this.modelMatrix;
    const tmpVec3 = vec3.create();
    const vert = this._vertices;

    for (let i = 0; i < this._worldVertices.length; i += 3) {
      tmpVec3[0] = vert[i];
      tmpVec3[1] = vert[i + 1];
      tmpVec3[2] = vert[i + 2];

      vec3.transformMat4(tmpVec3, tmpVec3, mat);
      this._worldVertices[i] = tmpVec3[0];
      this._worldVertices[i + 1] = tmpVec3[1];
      this._worldVertices[i + 2] = tmpVec3[2];
    }

    this._worldVerticesNeedsUpdate = false;
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
  _computeBoundingBox() {
    if (this._vertices === null) {
      throw new Error('This mesh does not have any vertex.')
    }

    if (this._worldVerticesNeedsUpdate) {
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
    mat4.fromRotationTranslationScale(this._matrix, this._quaternion, this._position, this._scale);
    this._worldVerticesNeedsUpdate = true;
    this._boundingBoxNeedsUpdate = true;
  }


  setRotationFromEulerDegree(x, y, z) {
    quat.fromEuler(this._quaternion, x, y, z);
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
    cpMesh.color = this.color;
    cpMesh.opacity = this.opacity;
    cpMesh.radius = this.radius;
    cpMesh.lineThickness = this.lineThickness;

    cpMesh.vertices = this._vertices ? this._vertices.slice() : null;
    cpMesh.faces = this._faces ? this._faces.slice() : null;

    return cpMesh
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
    this._rotation = quat.create();
    this._center = vec3.create();
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
    mat4.lookAt(scratch0, eye, center, up);
    mat3.fromMat4(scratch0, scratch0);
    quat.fromMat3(this._rotation, scratch0);
    vec3.copy(this._center, center);
    this._distance = vec3.distance(eye, center);
  }

  get matrix() {
    let m = mat4.create();
    mat4.invert(m, this.viewMatrix);
    return m
  }

  get position() {
    const m = this.matrix;
    return vec3.fromValues(m[12], m[13], m[14])
  }

  get viewMatrix() {
    const out = mat4.create();
    scratch1[0] = 0;
    scratch1[1] = 0;
    scratch1[2] = -this._distance;
    mat4.fromRotationTranslation(
      out,
      quat.conjugate(scratch0, this._rotation),
      scratch1,
    );
    mat4.translate(out, out, vec3.negate(scratch0, this._center));
    return out
  }


  translate(vec) {
    const d = this._distance;
    scratch0[0] = -d * (vec[0] || 0);
    scratch0[1] = d * (vec[1] || 0);
    scratch0[2] = d * (vec[2] || 0);
    vec3.transformQuat(scratch0, scratch0, this._rotation);
    vec3.add(this._center, this._center, scratch0);
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
    quat.invert(scratch1, scratch1);
    quat.multiply(scratch0, scratch0, scratch1);
    if (quat.length(scratch0) < 1e-6) {
      return
    }
    quat.multiply(this._rotation, this._rotation, scratch0);
    quat.normalize(this._rotation, this._rotation);
  }


  get projMatrix() {
    const pm = mat4.create();
    mat4.perspective(pm, this._fovy, this._aspectRatio, this._near, this._far);
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
      const modelViewMat = mat4.create();
      const modelViewProjMat = mat4.create();
      // glmatrix.mat4.multiply(modelViewMat, modelMat, viewMat)
      // glmatrix.mat4.multiply(modelViewProjMat, modelViewMat, projMat)

      mat4.multiply(modelViewMat, viewMat, modelMat);
      mat4.multiply(modelViewProjMat, projMat, modelViewMat);

      switch (mesh.renderMode) {
        case RENDER_MODES.POINT_CLOUD:
          this._renderPointCloud(mesh, modelViewProjMat);
          break
        case RENDER_MODES.TRIANGLE_WIREFRAME:
          this._renderEdges(mesh, modelViewProjMat);
          break
        case RENDER_MODES.TRIANGLE_WIREFRAME_RANDOM_SUB:
          this._renderEdgesRandomSub(mesh, modelViewProjMat);
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
    const tmpVector = vec3.create();

    for (let i = 0; i < vertices.length; i += 3) {
      // computing the position of the center of the circle to add
      vec3.transformMat4(tmpVector, [vertices[i], vertices[i + 1], vertices[i + 2]], mvpMat);

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


  _renderEdges(mesh, mvpMat) {
    const meshView = mesh.meshView;
    const vertices = mesh.worldVertices;
    const uniqueEdges = mesh.uniqueEdges;
    const camPosition = this._camera.position;

    meshView.reset();
    const tmpVectorA = vec3.create();
    const tmpVectorB = vec3.create();

    for (let i = 0; i < uniqueEdges.length; i += 2) {
      const vertIndexA = uniqueEdges[i];
      const vertIndexB = uniqueEdges[i + 1];

      vec3.transformMat4(tmpVectorA, [vertices[3 * vertIndexA], vertices[3 * vertIndexA + 1], vertices[3 * vertIndexA + 2]], mvpMat);
      vec3.transformMat4(tmpVectorB, [vertices[3 * vertIndexB], vertices[3 * vertIndexB + 1], vertices[3 * vertIndexB + 2]], mvpMat);

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

    this._canvas.appendChild(meshView.view);
  }











  _renderEdgesRandomSub(mesh, mvpMat) {
    const meshView = mesh.meshView;
    const vertices = mesh.worldVertices;
    const uniqueEdges = mesh.uniqueEdges;
    const camPosition = this._camera.position;

    const edgesToRender = Math.min(750, mesh.uniqueEdges.length / 2);


    meshView.reset();
    const tmpVectorA = vec3.create();
    const tmpVectorB = vec3.create();

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

      vec3.transformMat4(tmpVectorA, [vertices[3 * vertIndexA], vertices[3 * vertIndexA + 1], vertices[3 * vertIndexA + 2]], mvpMat);
      vec3.transformMat4(tmpVectorB, [vertices[3 * vertIndexB], vertices[3 * vertIndexB + 1], vertices[3 * vertIndexB + 2]], mvpMat);

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

export default index;
//# sourceMappingURL=svglcore.es.js.map
