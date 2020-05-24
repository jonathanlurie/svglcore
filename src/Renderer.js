/* eslint-disable no-continue */
import * as glmatrix from 'gl-matrix'
import Scene from './Scene'
import PerspectiveCamera from './PerspectiveCamera'
import CONSTANTS from './Constants'
import RENDER_MODES from './renderModes'

class Renderer {
  constructor(parentDiv, options) {
    this._width = 'width' in options ? options.width : window.innerWidth
    this._height = 'height' in options ? options.height : window.innerHeight
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

    if ('scene' in options) {
      this.scene = options.scene
    }

    if ('camera' in options) {
      this.camera = options.camera
    }

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
    const viewMat = this._camera.viewMatrix
    const projMat = this._camera.projMatrix

    meshes.forEach((mesh) => {
      if (!mesh.visible) {
        return
      }

      // dealing with matrices
      const modelMat = mesh.modelMatrix
      const modelViewMat = glmatrix.mat4.create()
      const modelViewProjMat = glmatrix.mat4.create()
      // glmatrix.mat4.multiply(modelViewMat, modelMat, viewMat)
      // glmatrix.mat4.multiply(modelViewProjMat, modelViewMat, projMat)

      glmatrix.mat4.multiply(modelViewMat, viewMat, modelMat)
      glmatrix.mat4.multiply(modelViewProjMat, projMat, modelViewMat)

      switch (mesh.renderMode) {
        case RENDER_MODES.POINT_CLOUD:
          this._renderPointCloud(mesh, modelViewProjMat)
          break
        default: throw new Error('Only point cloud rendering is implemented for the moment.')
      }
    })
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
    const meshView = mesh.meshView
    const vertices = mesh.vertices
    const camPosition = this._camera.position

    meshView.reset()
    const tmpVector = glmatrix.vec3.create()

    for (let i = 0; i < vertices.length; i += 3) {
      // computing the position of the center of the circle to add
      glmatrix.vec3.transformMat4(tmpVector, [vertices[i], vertices[i + 1], vertices[i + 2]], mvpMat)

      // No rendering if outside of projection  canonical/frustrum box
      if (tmpVector[0] >= 1
      || tmpVector[0] <= -1
      || tmpVector[1] >= 1
      || tmpVector[1] <= -1
      || tmpVector[2] >= 1
      || tmpVector[2] <= -1) {
        continue
      }

      const canvasPos = this._unit2DPositionToCanvasPosition(tmpVector)

      // computing the cirlce radius
      const mesh2camDistance = ((vertices[i] - camPosition[0]) ** 2 + (vertices[i + 1] - camPosition[1]) ** 2 + (vertices[i + 2] - camPosition[2]) ** 2) ** 0.5
      const radius = (mesh.radius / (Math.tan(this._camera.fieldOfView / 2) * mesh2camDistance)) * (this._height / 2)
      meshView.addCircle(canvasPos[0], canvasPos[1], radius)
    }

    this._canvas.appendChild(meshView.view)
  }
}

export default Renderer
