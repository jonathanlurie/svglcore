import * as glmatrix from 'gl-matrix'


class PerspectiveCamera {
  constructor() {
    this._viewMat = glmatrix.mat4.create()
    this._projectionMat = glmatrix.mat4.create()

    // necessary for the view matrix
    this._position = glmatrix.vec3.fromValues(0, 0, -10)
    this._target = glmatrix.vec3.fromValues(0, 0, 0)
    this._up = glmatrix.vec3.fromValues(0, 1, 0)

    // necessary for the projection matrix
    this._fovy = Math.PI / 2
    this._aspectRatio = 16 / 9 // typically width / height
    this._near = 0.01
    this._far = 1e6

    // computing the matrices with the default values
    // view matrix:
    glmatrix.mat4.lookAt(this._viewMat, this._position, this._target, this._up)
    // projection matrix:
    glmatrix.mat4.perspective(this._projectionMat, this._fovy, this._aspectRatio, this._near, this._far)
  
    // TODO all the rest, including computing the viewProjection mat
    // useful link: https://www.3dgep.com/understanding-the-view-matrix/
  }
}

export default PerspectiveCamera
