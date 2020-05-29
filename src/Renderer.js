/* eslint-disable no-bitwise */
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
    this._canvas.innerHTML = ''
    // while (this._canvas.firstChild) {
    //   this._canvas.removeChild(this._canvas.firstChild)
    // }
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
        case RENDER_MODES.TRIANGLE_WIREFRAME:
          this._renderEdges(mesh, modelViewProjMat)
          break
        case RENDER_MODES.TRIANGLE_WIREFRAME_RANDOM_SUB:
          this._renderEdgesRandomSub(mesh, modelViewProjMat)
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
    const vertices = mesh.worldVertices
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


  _renderEdges(mesh, mvpMat) {
    const meshView = mesh.meshView
    const vertices = mesh.worldVertices
    const uniqueEdges = mesh.uniqueEdges
    const camPosition = this._camera.position

    meshView.reset()
    const tmpVectorA = glmatrix.vec3.create()
    const tmpVectorB = glmatrix.vec3.create()

    for (let i = 0; i < uniqueEdges.length; i += 2) {
      const vertIndexA = uniqueEdges[i]
      const vertIndexB = uniqueEdges[i + 1]

      glmatrix.vec3.transformMat4(tmpVectorA, [vertices[3 * vertIndexA], vertices[3 * vertIndexA + 1], vertices[3 * vertIndexA + 2]], mvpMat)
      glmatrix.vec3.transformMat4(tmpVectorB, [vertices[3 * vertIndexB], vertices[3 * vertIndexB + 1], vertices[3 * vertIndexB + 2]], mvpMat)

      // No rendering if the two points are outside of projection  canonical/frustrum box
      if ((tmpVectorA[0] >= 1
      || tmpVectorA[0] <= -1
      || tmpVectorA[1] >= 1
      || tmpVectorA[1] <= -1
      || tmpVectorA[2] >= 1
      || tmpVectorA[2] <= -1)
      && (tmpVectorB[0] >= 1
      || tmpVectorB[0] <= -1
      || tmpVectorB[1] >= 1
      || tmpVectorB[1] <= -1
      || tmpVectorB[2] >= 1
      || tmpVectorB[2] <= -1)) {
        continue
      }

      const middlePoint = [
        (tmpVectorA[0] + tmpVectorB[0]) / 2,
        (tmpVectorA[1] + tmpVectorB[1]) / 2,
        (tmpVectorA[2] + tmpVectorB[2]) / 2,
      ]

      const mesh2camDistance = ((middlePoint[0] - camPosition[0]) ** 2 + (middlePoint[1] - camPosition[1]) ** 2 + (middlePoint[2] - camPosition[2]) ** 2) ** 0.5
      const thickness = (mesh.lineThickness / (Math.tan(this._camera.fieldOfView / 2) * mesh2camDistance)) * (this._height / 2)
      const canvasPosA = this._unit2DPositionToCanvasPosition(tmpVectorA)
      const canvasPosB = this._unit2DPositionToCanvasPosition(tmpVectorB)

      meshView.addLine(canvasPosA[0], canvasPosA[1], canvasPosB[0], canvasPosB[1], thickness)
    }

    this._canvas.appendChild(meshView.view)
  }











  _renderEdgesRandomSub(mesh, mvpMat) {
    const meshView = mesh.meshView
    const vertices = mesh.worldVertices
    const uniqueEdges = mesh.uniqueEdges
    const camPosition = this._camera.position

    const edgesToRender = Math.min(750, mesh.uniqueEdges.length / 2)


    meshView.reset()
    const tmpVectorA = glmatrix.vec3.create()
    const tmpVectorB = glmatrix.vec3.create()

    const alreadyRenderedEdgeIndex = {}
    let i = 0

    while (i < edgesToRender) {
      const edgeIndex = ~~(Math.random() * ((mesh.uniqueEdges.length - 1) * 0.5))

      if (edgeIndex in alreadyRenderedEdgeIndex) {
        continue
      } else {
        alreadyRenderedEdgeIndex[edgeIndex] = true
        i += 1
      }

      const vertIndexA = uniqueEdges[edgeIndex * 2]
      const vertIndexB = uniqueEdges[edgeIndex * 2 + 1]

      glmatrix.vec3.transformMat4(tmpVectorA, [vertices[3 * vertIndexA], vertices[3 * vertIndexA + 1], vertices[3 * vertIndexA + 2]], mvpMat)
      glmatrix.vec3.transformMat4(tmpVectorB, [vertices[3 * vertIndexB], vertices[3 * vertIndexB + 1], vertices[3 * vertIndexB + 2]], mvpMat)

      // No rendering if the two points are outside of projection  canonical/frustrum box
      if ((tmpVectorA[0] >= 1
      || tmpVectorA[0] <= -1
      || tmpVectorA[1] >= 1
      || tmpVectorA[1] <= -1
      || tmpVectorA[2] >= 1
      || tmpVectorA[2] <= -1)
      && (tmpVectorB[0] >= 1
      || tmpVectorB[0] <= -1
      || tmpVectorB[1] >= 1
      || tmpVectorB[1] <= -1
      || tmpVectorB[2] >= 1
      || tmpVectorB[2] <= -1)) {
        continue
      }

      const middlePoint = [
        (tmpVectorA[0] + tmpVectorB[0]) / 2,
        (tmpVectorA[1] + tmpVectorB[1]) / 2,
        (tmpVectorA[2] + tmpVectorB[2]) / 2,
      ]

      const mesh2camDistance = ((middlePoint[0] - camPosition[0]) ** 2 + (middlePoint[1] - camPosition[1]) ** 2 + (middlePoint[2] - camPosition[2]) ** 2) ** 0.5
      const thickness = (mesh.lineThickness / (Math.tan(this._camera.fieldOfView / 2) * mesh2camDistance)) * (this._height / 2)
      const canvasPosA = this._unit2DPositionToCanvasPosition(tmpVectorA)
      const canvasPosB = this._unit2DPositionToCanvasPosition(tmpVectorB)

      meshView.addLine(canvasPosA[0], canvasPosA[1], canvasPosB[0], canvasPosB[1], thickness)
    }

    this._canvas.appendChild(meshView.view)
  }

}

export default Renderer
