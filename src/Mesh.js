import * as glmatrix from 'gl-matrix'
import Tools from './Tools'
import RENDER_MODES from './renderModes'
import MeshView from './MeshView'

class Mesh {
  constructor() {
    this._id = Tools.uuidv4()
    this._meshView = new MeshView(this)

    // if visible is false, this mesh will not be rendered
    this._visible = true

    // geometry data
    this._vertices = null
    this._faces = null
    this._verticesPerFace = 3
    this._boundingBox = {
      min: glmatrix.vec3.fromValues(0, 0, 0),
      max: glmatrix.vec3.fromValues(0, 0, 0),
    }

    this._scale = glmatrix.vec3.fromValues(1, 1, 1)
    this._quaternion = glmatrix.quat.create()
    this._position = glmatrix.vec3.create()

    // material data
    this._renderMode = RENDER_MODES.POINT_CLOUD
    this._color = '#000'
    this._opacity = 1
    this._lineThickness = 1
    this._radius = 1
  }


  get id() {
    return this._id
  }


  set renderMode(rm) {
    if (Object.values(RENDER_MODES).includes(rm)) {
      this._renderMode = rm
    } else {
      throw new Error('The render mode is incorrect.')
    }
  }


  get renderMode() {
    return this._renderMode
  }


  set lineThickness(t) {
    this._lineThickness = t
  }


  get lineThickness() {
    return this._lineThickness
  }


  set radius(r) {
    this._radius = r
  }


  get radius() {
    return this._radius
  }


  set vertices(v) {
    if (v.length % 3 !== 0) {
      throw new Error('The vertice array length must be multiple of 3.')
    }

    this._vertices = v
    return this
  }


  get vertices() {
    return this._vertices
  }


  set faces(f) {
    this._faces = f
  }


  get faces() {
    return this._faces
  }


  set color(c) {
    this._color = c
  }


  get color() {
    return this._color
  }


  set opacity(o) {
    this._opacity = o
  }


  get opacity() {
    return this._opacity
  }


  set verticesPerFace(vpf) {
    this._verticesPerFace = vpf
  }


  get verticesPerFace() {
    return this._verticesPerFace
  }

  get visible() {
    return this._visible
  }


  set visible(v) {
    this._visible = v
  }


  /**
   * Note: the bounding box is in world coordinates
   */
  computeBoundingBox() {
    if (this._vertices === null) {
      throw new Error('This mesh does not have any vertex.')
    }

    let minx = +Infinity
    let miny = +Infinity
    let minz = +Infinity
    let maxx = -Infinity
    let maxy = -Infinity
    let maxz = -Infinity

    for (let i = 0; i < this._vertices.length; i += 3) {
      minx = Math.min(minx, this._vertices[i])
      miny = Math.min(miny, this._vertices[i + 1])
      minz = Math.min(minz, this._vertices[i + 2])
      maxx = Math.max(maxx, this._vertices[i])
      maxy = Math.max(maxy, this._vertices[i + 1])
      maxz = Math.max(maxz, this._vertices[i + 2])
    }

    const modelMat = this.modelMatrix
    const minInWorld = glmatrix.vec3.create()
    const maxInWorld = glmatrix.vec3.create()
    glmatrix.vec3.transformMat4(minInWorld, [minx, miny, minz], modelMat)
    glmatrix.vec3.transformMat4(maxInWorld, [maxx, maxy, maxz], modelMat)

    // if the model matrix encodes a rotation, min and max could be swapped on some dimensions
    this._boundingBox.min[0] = Math.min(minInWorld[0], maxInWorld[0])
    this._boundingBox.min[1] = Math.min(minInWorld[1], maxInWorld[1])
    this._boundingBox.min[2] = Math.min(minInWorld[2], maxInWorld[2])
    this._boundingBox.max[0] = Math.max(minInWorld[0], maxInWorld[0])
    this._boundingBox.max[1] = Math.max(minInWorld[1], maxInWorld[1])
    this._boundingBox.max[2] = Math.max(minInWorld[2], maxInWorld[2])

    return this
  }


  get boundingBox() {
    return this._boundingBox
  }


  get modelMatrix() {
    const mat = glmatrix.mat4.create()
    glmatrix.mat4.fromRotationTranslationScale(mat, this._quaternion, this._position, this._scale)
    return mat
  }


  get meshView() {
    return this._meshView
  }
}

export default Mesh
