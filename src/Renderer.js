import * as glmatrix from 'gl-matrix'
import Scene from './Scene'
import PerspectiveCamera from './PerspectiveCamera'
import CONSTANTS from './Constants'
import RENDER_MODES from './renderModes'

class Renderer {
  constructor(parentDiv, options) {
    this._width = 'width' in options ? options.width : window.innerWidth
    this._height = 'heigth' in options ? options.height : window.innerHeight
    this._parentDiv = parentDiv

    this._canvas = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'svg')
    this._canvas.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    this._canvas.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    this._canvas.setAttribute('height', `${this._height}`)
    this._canvas.setAttribute('width', `${this._width}`)
    this._canvas.setAttribute('viewBox', `0 0 ${this._width} ${this._height}`)
    this._parentDiv.appendChild(this._canvas)

    this._scene = null
    this._camera = null
  }


  set scene(s) {
    if (s instanceof Scene) {
      this._scene = s
    } else {
      throw new Error('Invalid Scene object.')
    }
  }


  set camera(c) {
    if (c instanceof PerspectiveCamera) {
      this._camera = c
    } else {
      throw new Error('Invalid Camera Object.')
    }
  }


  resetCanvas() {
    while (this._canvas.firstChild) {
      this._canvas.removeChild(this._canvas.firstChild)
    }
  }


  render() {
    if (this._camera === null) {
      throw new Error('A Camera must be set.')
    }

    if (this._scene === null) {
      throw new Error('A Scene must be set.')
    }

    this.resetCanvas()

    const meshes = this._scene.getAll()
    const viewMat = this._camera.viewMat
    const projMat = this._camera.projMat

    meshes.forEach((mesh) => {
      // dealing with matrices
      const modelMat = mesh.modelMat
      const modelViewMat = glmatrix.mat4.create()
      const modelViewProjMat = glmatrix.mat4.create()
      glmatrix.mat4.multiply(modelViewMat, modelMat, viewMat)
      glmatrix.mat4.multiply(modelViewProjMat, modelViewMat, projMat)

      switch (mesh.renderMode) {
        case RENDER_MODES.POINT_CLOUD:
          this._renderPointCloud(mesh, modelViewProjMat)
          break
        default: throw new Error('Only point cloud rendering is implemented for the moment.')
      }
    })
  }


  _renderPointCloud(mesh, mvpMat) {
    const meshView = mesh.meshView
    const vertices = mesh.vertices

    meshView.reset()
    const tmpVector = glmatrix.vec3.create()

    for (let i = 0; i < vertices.length; i += 3) {
      glmatrix.vec3.transformMat4(tmpVector, [vertices[i], vertices[i + 1], vertices[i + 2]], mvpMat)
      meshView.addCircle(tmpVector[0], tmpVector[1])
    }

    this._canvas.appendChild(meshView.view)
  }
}

export default Renderer
