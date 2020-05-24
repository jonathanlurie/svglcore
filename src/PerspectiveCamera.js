import * as glmatrix from 'gl-matrix'

// inspired by:
// https://github.com/mikolalysenko/orbit-camera/blob/master/orbit.js

function quatFromVec(out, da) {
  const x = da[0]
  const y = da[1]
  const z = da[2]
  let s = x * x + y * y

  if (s > 1.0) {
    s = 1.0
  }
  out[0] = -da[0]
  out[1] = da[1]
  out[2] = da[2] || Math.sqrt(1.0 - s)
  out[3] = 0.0
}


let scratch0 = new Float32Array(16)
let scratch1 = new Float32Array(16)


class PerspectiveCamera {
  constructor(options = {}) {
    this._rotation = glmatrix.quat.create()
    this._center = glmatrix.vec3.create()
    this._distance = 10

    // necessary for the projection matrix
    this._fovy = Math.PI / 4
    this._aspectRatio = 16 / 9 // typically width / height
    this._near = 0.01
    this._far = Infinity

    if ('eye' in options && 'center' in options && 'up' in options) {
      this.lookAt(options.eye, options.center, options.up)
    }
  }

  lookAt(eye, center, up) {
    glmatrix.mat4.lookAt(scratch0, eye, center, up)
    glmatrix.mat3.fromMat4(scratch0, scratch0)
    glmatrix.quat.fromMat3(this._rotation, scratch0)
    glmatrix.vec3.copy(this._center, center)
    this._distance = glmatrix.vec3.distance(eye, center)
  }


  get viewMatrix() {
    const out = glmatrix.mat4.create()
    scratch1[0] = 0
    scratch1[1] = 0
    scratch1[2] = -this._distance
    glmatrix.mat4.fromRotationTranslation(
      out,
      glmatrix.quat.conjugate(scratch0, this._rotation),
      scratch1,
    )
    glmatrix.mat4.translate(out, out, glmatrix.vec3.negate(scratch0, this._center))
    return out
  }


  translate(vec) {
    const d = this._distance
    scratch0[0] = -d * (vec[0] || 0)
    scratch0[1] = d * (vec[1] || 0)
    scratch0[2] = d * (vec[2] || 0)
    glmatrix.vec3.transformQuat(scratch0, scratch0, this._rotation)
    glmatrix.vec3.add(this._center, this._center, scratch0)
  }


  dolly(d) {
    this._distance += d
    if (this._distance < 0.0) {
      this._distance = 0.0
    }
  }


  rotate(db) { // TODO: simplify this
    quatFromVec(scratch0, [0, 0])
    quatFromVec(scratch1, db)
    glmatrix.quat.invert(scratch1, scratch1)
    glmatrix.quat.multiply(scratch0, scratch0, scratch1)
    if (glmatrix.quat.length(scratch0) < 1e-6) {
      return
    }
    glmatrix.quat.multiply(this._rotation, this._rotation, scratch0)
    glmatrix.quat.normalize(this._rotation, this._rotation)
  }


  get projMatrix() {
    const pm = glmatrix.mat4.create()
    glmatrix.mat4.perspective(pm, this._fovy, this._aspectRatio, this._near, this._far)
    return pm
  }


  set aspectRatio(ar) {
    this._aspectRatio = ar
  }


  get apectRatio() {
    return this._aspectRatio
  }


  /**
   * Vertical field of view in radian
   */
  set fieldOfView(fov) {
    this._fovy = fov
  }

  get fieldOfView() {
    return this._fovy
  }


  set near(n) {
    this._near = n
  }


  get near() {
    return this._near
  }


  set far(f) {
    this._far = f
  }


  get far() {
    return this._far
  }

}

export default PerspectiveCamera
