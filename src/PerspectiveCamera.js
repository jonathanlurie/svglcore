import * as glmatrix from 'gl-matrix'


class PerspectiveCamera {
  constructor() {
    // necessary for the view matrix
    this._position = glmatrix.vec3.fromValues(0, 0, -10)
    this._target = glmatrix.vec3.fromValues(0, 0, 0)
    this._up = glmatrix.vec3.fromValues(0, 1, 0)

    // necessary for the projection matrix
    this._fovy = Math.PI / 4
    this._aspectRatio = 16 / 9 // typically width / height
    this._near = 0.01
    this._far = Infinity
  
    // TODO all the rest, including computing the viewProjection mat
    // useful link: https://www.3dgep.com/understanding-the-view-matrix/
  }


  get viewMatrix() {
    const vm = glmatrix.mat4.create()
    glmatrix.mat4.lookAt(vm, this._position, this._target, this._up)

    // this below gives the same mat
    // glmatrix.mat4.targetTo(vm, this._position, this._target, this._up)
    // glmatrix.mat4.invert(vm, vm)
    return vm
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
