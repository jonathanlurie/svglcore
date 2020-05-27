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
    this._worldVertices = null
    this._faces = null
    this._uniqueEdges = null
    this._verticesPerFace = 3
    this._boundingBox = {
      min: glmatrix.vec3.fromValues(0, 0, 0),
      max: glmatrix.vec3.fromValues(0, 0, 0),
      center: glmatrix.vec3.fromValues(0, 0, 0),
    }
    this._boundingBoxNeedsUpdate = true

    this._scale = glmatrix.vec3.fromValues(1, 1, 1)
    this._quaternion = glmatrix.quat.create()
    this._position = glmatrix.vec3.create()

    // material data
    this._renderMode = RENDER_MODES.POINT_CLOUD
    this._color = '#000'
    this._opacity = 1
    this._lineThickness = 1
    this._radius = 1

    this._matrix = glmatrix.mat4.create()
    this._worldVerticesNeedsUpdate = true
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
    this._worldVertices = new v.constructor(v.length)
    this._boundingBoxNeedsUpdate = true
    return this
  }


  get vertices() {
    return this._vertices
  }


  get worldVertices() {
    if (!this._worldVerticesNeedsUpdate) {
      return this._worldVertices
    }

    const mat = this.modelMatrix
    const tmpVec3 = glmatrix.vec3.create()
    const vert = this._vertices

    for (let i = 0; i < this._worldVertices.length; i += 3) {
      tmpVec3[0] = vert[i]
      tmpVec3[1] = vert[i + 1]
      tmpVec3[2] = vert[i + 2]

      glmatrix.vec3.transformMat4(tmpVec3, tmpVec3, mat)
      this._worldVertices[i] = tmpVec3[0]
      this._worldVertices[i + 1] = tmpVec3[1]
      this._worldVertices[i + 2] = tmpVec3[2]
    }

    this._worldVerticesNeedsUpdate = false
    return this._worldVertices
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
  _computeBoundingBox() {
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

    this._boundingBox.center[0] = (this._boundingBox.min[0] + this._boundingBox.max[0]) / 2
    this._boundingBox.center[1] = (this._boundingBox.min[1] + this._boundingBox.max[1]) / 2
    this._boundingBox.center[2] = (this._boundingBox.min[2] + this._boundingBox.max[2]) / 2

    this._boundingBoxNeedsUpdate = false
  }


  get boundingBox() {
    if (this._boundingBoxNeedsUpdate) {
      this._computeBoundingBox()
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
    this._position[0] = p[0]
    this._position[1] = p[1]
    this._position[2] = p[2]
    this.updateMatrix()
  }


  get position() {
    return this._position.slice()
  }


  set quaternion(q) {
    this._quaternion[0] = q[0]
    this._quaternion[1] = q[1]
    this._quaternion[2] = q[2]
    this._quaternion[3] = q[3]
    this.updateMatrix()
  }


  get quaternion() {
    return this._quaternion.slice()
  }


  set scale(s) {
    this._scale[0] = s[0]
    this._scale[1] = s[1]
    this._scale[2] = s[2]
    this.updateMatrix()
  }

  get uniqueEdges() {
    if (!this._uniqueEdges) {
      this._computeUniqueEdges()
    }
    return this._uniqueEdges
  }


  updateMatrix() {
    glmatrix.mat4.fromRotationTranslationScale(this._matrix, this._quaternion, this._position, this._scale)
    this._worldVerticesNeedsUpdate = true
    this._boundingBoxNeedsUpdate = true
  }


  setRotationFromEulerDegree(x, y, z) {
    glmatrix.quat.fromEuler(this._quaternion, x, y, z)
    this.updateMatrix()
  }


  _computeUniqueEdges() {
    if (this._faces === null) {
      throw new Error('The faces must be set before computing unique edges.')
    }

    const f = this._faces
    const vpf = this._verticesPerFace

    const verticePairs = {}

    for (let i = 0; i < f.length; i += vpf) {
      for (let j = 1; j < vpf; j += 1) {
        const verticeA = f[i + j - 1]
        const verticeB = f[i + j]
        let verticeLowerIndex = null
        let verticeHigherIndex = null

        if (verticeA < verticeB) {
          verticeLowerIndex = verticeA
          verticeHigherIndex = verticeB
        } else {
          verticeLowerIndex = verticeB
          verticeHigherIndex = verticeA
        }

        if (!(verticeLowerIndex in verticePairs)) {
          verticePairs[verticeLowerIndex] = new Set()
        }

        verticePairs[verticeLowerIndex].add(verticeHigherIndex)
      }
    }

    const tmp = []
    const allFirtVertices = Object.keys(verticePairs).map((index) => parseInt(index, 10))

    for (let i = 0; i < allFirtVertices.length; i += 1) {
      const firstVertex = allFirtVertices[i]
      const it = verticePairs[firstVertex].entries()
      // eslint-disable-next-line no-restricted-syntax
      for (let secondVertex of it) {
        tmp.push(firstVertex, secondVertex[0])
      }
    }

    this._uniqueEdges = new Uint32Array(tmp)
  }



}

export default Mesh
