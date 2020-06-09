import * as glmatrix from 'gl-matrix'
import Tools from './Tools'
import RENDER_MODES from './renderModes'
import MeshView from './MeshView'
import Color from './Color'


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
    this._showBoundingBox = false

    this._scale = glmatrix.vec3.fromValues(1, 1, 1)
    this._quaternion = glmatrix.quat.create()
    this._position = glmatrix.vec3.create()

    // material data
    this._renderMode = RENDER_MODES.POINT_CLOUD
    this._edgeColor = [0, 0, 0]
    this._edgeColorCss = Color.rgbToCssRgb(this._edgeColor)
    this._faceColor = [200, 200, 200]
    this._faceColorCss = Color.rgbToCssRgb(this._faceColor)
    this._opacity = 1
    this._lineThickness = 1
    this._radius = 1

    this._matrix = glmatrix.mat4.create()
    this._worldVerticesNeedUpdate = true

    this._faceNormalsWorld = null
    this._faceNormalsWorldNeedUpdate = true

    this._faceCentersWorld = null
    this._faceCentersWorldNeedUpdate = true
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
    this._faceNormalsWorldNeedUpdate = true
    this._faceCentersWorldNeedUpdate = true
    this._worldVerticesNeedUpdate = true
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
      this._computeWorldVertices()
    }
    return this._worldVertices
  }


  _computeWorldVertices() {
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

    this._worldVerticesNeedUpdate = false
  }


  set faces(f) {
    this._faces = f
    this._faceNormalsWorldNeedUpdate = true
    this._faceCenterWorldNeedUpdate = true
  }


  get faces() {
    return this._faces
  }


  set edgeColor(c) {
    this._edgeColor = Color.whateverToRgb(c)
    this._edgeColorCss = Color.rgbToCssRgb(this._edgeColor)
  }


  get edgeColor() {
    return this._edgeColor
  }


  get edgeColorCss() {
    return this._edgeColorCss
  }


  set faceColor(c) {
    this._faceColor = Color.whateverToRgb(c)
    this._faceColorCss = Color.rgbToCssRgb(this._faceColor)
  }


  get faceColor() {
    return this._faceColor
  }


  get faceColorCss() {
    return this._faceColorCss
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


  set showBoundingBox(s) {
    this._showBoundingBox = s
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
      this._computeWorldVertices()
    }

    let minx = +Infinity
    let miny = +Infinity
    let minz = +Infinity
    let maxx = -Infinity
    let maxy = -Infinity
    let maxz = -Infinity

    for (let i = 0; i < this._worldVertices.length; i += 3) {
      minx = Math.min(minx, this._worldVertices[i])
      miny = Math.min(miny, this._worldVertices[i + 1])
      minz = Math.min(minz, this._worldVertices[i + 2])
      maxx = Math.max(maxx, this._worldVertices[i])
      maxy = Math.max(maxy, this._worldVertices[i + 1])
      maxz = Math.max(maxz, this._worldVertices[i + 2])
    }

    this._boundingBox.min[0] = minx
    this._boundingBox.min[1] = miny
    this._boundingBox.min[2] = minz
    this._boundingBox.max[0] = maxx
    this._boundingBox.max[1] = maxy
    this._boundingBox.max[2] = maxz

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

  get scale() {
    return this._scale.slice()
  }

  get uniqueEdges() {
    if (!this._uniqueEdges) {
      this._computeUniqueEdges()
    }
    return this._uniqueEdges
  }


  updateMatrix() {
    glmatrix.mat4.fromRotationTranslationScale(this._matrix, this._quaternion, this._position, this._scale)
    this._worldVerticesNeedUpdate = true
    this._boundingBoxNeedsUpdate = true
    this._faceNormalsWorldNeedUpdate = true
    this._faceCentersWorldNeedUpdate = true
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


  /**
   * Create a clone of this mesh with no shared structure. Can downsample the number of vertices
   * @param {*} nbVertices
   */
  clone() {
    const cpMesh = new Mesh()
    cpMesh.renderMode = this.renderMode
    cpMesh.position = this.position
    cpMesh.quaternion = this.quaternion
    cpMesh.scale = this.scale
    cpMesh.verticesPerFace = this.verticesPerFace
    cpMesh.edgeColor = this.edgeColor
    cpMesh.faceColor = this.faceColor
    cpMesh.opacity = this.opacity
    cpMesh.radius = this.radius
    cpMesh.lineThickness = this.lineThickness

    cpMesh.vertices = this._vertices ? this._vertices.slice() : null
    cpMesh.faces = this._faces ? this._faces.slice() : null

    return cpMesh
  }


  _computeFaceCentersWorld() {
    // just to make sure they are built
    const wv = this.worldVertices

    const faces = this._faces
    const vpf = this._verticesPerFace
    const nbFaces = this._faces.length / this._verticesPerFace
    const faceCentersWorld = []

    for (let f = 0; f < nbFaces; f += 1) {
      const v0Index = f * vpf
      let x = 0
      let y = 0
      let z = 0

      for (let v = 0; v < vpf; v += 1) {
        x += wv[faces[v0Index + v] * 3]
        y += wv[faces[v0Index + v] * 3 + 1]
        z += wv[faces[v0Index + v] * 3 + 2]
      }

      faceCentersWorld.push(
        x / vpf,
        y / vpf,
        z / vpf,
      )
    }

    this._faceCentersWorld = new Float32Array(faceCentersWorld)
    this._faceCentersWorldNeedUpdate = false
  }


  get faceCentersWorld() {
    if (this._faces === null) {
      return null
    }

    if (this._faceCentersWorldNeedUpdate) {
      this._computeFaceCentersWorld()
    }

    return this._faceCentersWorld
  }


  _computeFaceNormalWorld() {
    // just to make sure they are built
    const wv = this.worldVertices

    const faces = this._faces
    const vpf = this._verticesPerFace
    const faceNormalsWorld = []

    const ab = glmatrix.vec3.create()
    const bc = glmatrix.vec3.create()
    const n = glmatrix.vec3.create()

    for (let f = 0; f < faces.length; f += vpf) {
      const indexA = faces[f] * 3
      const indexB = faces[f + 1] * 3
      const indexC = faces[f + 2] * 3

      ab[0] = wv[indexB] - wv[indexA]
      ab[1] = wv[indexB + 1] - wv[indexA + 1]
      ab[2] = wv[indexB + 2] - wv[indexA + 2]
      glmatrix.vec3.normalize(ab, ab)

      bc[0] = wv[indexC] - wv[indexB]
      bc[1] = wv[indexC + 1] - wv[indexB + 1]
      bc[2] = wv[indexC + 2] - wv[indexB + 2]
      glmatrix.vec3.normalize(bc, bc)

      glmatrix.vec3.cross(n, ab, bc)
      glmatrix.vec3.normalize(n, n)
      faceNormalsWorld.push(n[0], n[1], n[2])
    }

    this._faceNormalsWorld = new Float32Array(faceNormalsWorld)
    this._faceNormalsWorldNeedUpdate = false
  }


  get faceNormalsWorld() {
    if (this._faces === null) {
      return null
    }

    if (this._faceNormalsWorldNeedUpdate) {
      this._computeFaceNormalWorld()
    }
    return this._faceNormalsWorld
  }
}

export default Mesh
