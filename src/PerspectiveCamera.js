import * as glmatrix from 'gl-matrix'


class PerspectiveCamera {
  constructor() {
    // necessary for the view matrix
    this._position = glmatrix.vec3.fromValues(0, 0, -10)
    this._target = glmatrix.vec3.fromValues(0, 0, 0)
    this._up = glmatrix.vec3.fromValues(0, 1, 0)

    // necessary for the projection matrix
    this._fovy = Math.PI / 2
    this._aspectRatio = 16 / 9 // typically width / height
    this._near = 0.01
    this._far = 1e6
  
    // TODO all the rest, including computing the viewProjection mat
    // useful link: https://www.3dgep.com/understanding-the-view-matrix/
  }


  get viewMat() {
    const vm = glmatrix.mat4.create()
    glmatrix.mat4.lookAt(this._viewMat, this._position, this._target, this._up)
    return vm
  }


  get projMat() {
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
