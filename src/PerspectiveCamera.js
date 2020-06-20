import * as glmatrix from 'gl-matrix'

// inspired by:
// https://github.com/mikolalysenko/orbit-camera/blob/master/orbit.js
//
// Some other thread
// https://www.gamedev.net/forums/topic/497918-eye-and-up-vectors-from-view-matrix/

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


  get matrix() {
    let m = glmatrix.mat4.create()
    glmatrix.mat4.invert(m, this.viewMatrix)
    return m
  }

  get position() {
    const m = this.matrix
    return glmatrix.vec3.fromValues(m[12], m[13], m[14])
  }


  get eye() {
    return this.position
  }


  get up() {
    const vm = this.viewMatrix
    return glmatrix.vec3.fromValues(vm[1], vm[5], vm[9])
  }


  get right() {
    const vm = this.viewMatrix
    return glmatrix.vec3.fromValues(vm[0], vm[4], vm[8])
  }


  get direction() {
    const vm = this.viewMatrix
    return glmatrix.vec3.fromValues(vm[2], vm[6], vm[10])
  }


  get center() {
    return this._center.slice()
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


  /**
   * Relative to current location, where vec is:
   *  vec[0] --> move along right vector
   *  vec[1] --> move along up vector
   *  vec[2] --> move along dir vector
   * @param {*} vec 
   */
  moveAlong(vec) {
    const curEye = this.eye
    const curCenter = this.center
    const curUp = this.up

    const vm = this.viewMatrix
    const right = glmatrix.vec3.fromValues(vm[0], vm[4], vm[8])
    const up = glmatrix.vec3.fromValues(vm[1], vm[5], vm[9])
    const dir = glmatrix.vec3.fromValues(vm[2], vm[6], vm[10])

    const alongRight = [
      vec[0] * right[0],
      vec[0] * right[1],
      vec[0] * right[2],
    ]

    const alongUp = [
      vec[1] * up[0],
      vec[1] * up[1],
      vec[1] * up[2],
    ]

    const alongDir = [
      vec[2] * dir[0],
      vec[2] * dir[1],
      vec[2] * dir[2],
    ]

    const translation = [
      alongRight[0] + alongUp[0] + alongDir[0],
      alongRight[1] + alongUp[1] + alongDir[1],
      alongRight[2] + alongUp[2] + alongDir[2],
    ]

    const newEye = [
      curEye[0] + translation[0],
      curEye[1] + translation[1],
      curEye[2] + translation[2],
    ]

    const newCenter = [
      curCenter[0] + translation[0],
      curCenter[1] + translation[1],
      curCenter[2] + translation[2],
    ]

    this.lookAt(newEye, newCenter, curUp)
    return this
  }


  moveRight(d) {
    const curEye = this.eye
    const curCenter = this.center
    const curUp = this.up

    const vm = this.viewMatrix
    const right = glmatrix.vec3.fromValues(vm[0], vm[4], vm[8])

    const alongRight = [
      d * right[0],
      d * right[1],
      d * right[2],
    ]

    const newEye = [
      curEye[0] + alongRight[0],
      curEye[1] + alongRight[1],
      curEye[2] + alongRight[2],
    ]

    const newCenter = [
      curCenter[0] + alongRight[0],
      curCenter[1] + alongRight[1],
      curCenter[2] + alongRight[2],
    ]

    this.lookAt(newEye, newCenter, curUp)
  }


  moveUp(d) {
    const curEye = this.eye
    const curCenter = this.center
    const curUp = this.up

    const vm = this.viewMatrix
    const up = glmatrix.vec3.fromValues(vm[1], vm[5], vm[9])

    const alongUp = [
      d * up[0],
      d * up[1],
      d * up[2],
    ]

    const newEye = [
      curEye[0] + alongUp[0],
      curEye[1] + alongUp[1],
      curEye[2] + alongUp[2],
    ]

    const newCenter = [
      curCenter[0] + alongUp[0],
      curCenter[1] + alongUp[1],
      curCenter[2] + alongUp[2],
    ]

    this.lookAt(newEye, newCenter, curUp)
  }


  moveUpRight(u, r) {
    const curEye = this.eye
    const curCenter = this.center
    const curUp = this.up

    const vm = this.viewMatrix
    const up = glmatrix.vec3.fromValues(vm[1], vm[5], vm[9])
    const right = glmatrix.vec3.fromValues(vm[0], vm[4], vm[8])

    const alongUp = [
      u * up[0],
      u * up[1],
      u * up[2],
    ]

    const alongRight = [
      r * right[0],
      r * right[1],
      r * right[2],
    ]

    const newEye = [
      curEye[0] + alongUp[0] + alongRight[0],
      curEye[1] + alongUp[1] + alongRight[1],
      curEye[2] + alongUp[2] + alongRight[2],
    ]

    const newCenter = [
      curCenter[0] + alongUp[0] + alongRight[0],
      curCenter[1] + alongUp[1] + alongRight[1],
      curCenter[2] + alongUp[2] + alongRight[2],
    ]

    this.lookAt(newEye, newCenter, curUp)
  }

  // translate(vec) {
  //   const d = this._distance
  //   scratch0[0] = -d * (vec[0] || 0)
  //   scratch0[1] = d * (vec[1] || 0)
  //   scratch0[2] = d * (vec[2] || 0)
  //   glmatrix.vec3.transformQuat(scratch0, scratch0, this._rotation)
  //   glmatrix.vec3.add(this._center, this._center, scratch0)
  // }


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
