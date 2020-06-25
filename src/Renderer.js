/* eslint-disable no-bitwise */
/* eslint-disable no-continue */
import * as glmatrix from 'gl-matrix'
import Scene from './Scene'
import PerspectiveCamera from './PerspectiveCamera'
import CONSTANTS from './Constants'
import RENDER_MODES from './renderModes'
import Color from './Color'

class Renderer {
  constructor(parentDiv, options) {
    this._width = 'width' in options ? options.width : window.innerWidth
    this._height = 'height' in options ? options.height : window.innerHeight
    this._background = 'background' in options ? options.background : null
    this._parentDiv = parentDiv

    this._canvas = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'svg')
    this._canvas.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    this._canvas.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    this._canvas.setAttribute('height', `${this._height}`)
    this._canvas.setAttribute('width', `${this._width}`)
    this._canvas.setAttribute('style', `background-color: ${this._background};`)
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


  set background(b) {
    this._background = b
    this._canvas.setAttribute('style', `background-color: ${this._background};`)
  }

  get background() {
    return this._background
  }

  get svgText() {
    return this._canvas.outerHTML
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

    // Sort meshes by distance to the camera (from far to close) using the center of the bounding box

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

        case RENDER_MODES.WIREFRAME:
          this._renderWireframe(mesh, modelViewProjMat)
          break

        case RENDER_MODES.WIREFRAME_RANDOM_SUB:
          this._renderWireframeRandomSub(mesh, modelViewProjMat)
          break

        case RENDER_MODES.FACE_OPAQUE_PLAIN:
          this._renderFaceOpaquePlain(mesh, modelViewProjMat)
          break

        case RENDER_MODES.DEBUG_GEOMETRY:
          this._renderDebug(mesh, modelViewProjMat)
          break

        case RENDER_MODES.FACE_LIGHT:
          this._renderFaceLight(mesh, modelViewProjMat)
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

    if (mesh.showBoundingBox) {
      this._addBoundingBox(mesh, mvpMat)
    }

    this._canvas.appendChild(meshView.view)
  }

  /*

    The BOunding Box

                H +----------+ G (max)
                / |         /|
               /  |        / |                     y
            E +-----------+ F|                     Λ  . z
              |   |       |  |                     | /
              | D + - - - | -+ C                   |/
              |  /        | /                      +-------> x
              | /         |/
      (min) A +-----------+ B

  */

  _addBoundingBox(mesh, mvpMat, bbLineThickness = 0.33) {
    const tmpVector = glmatrix.vec3.create()
    const meshView = mesh.meshView

    const bb = mesh.boundingBox
    const a3D = [
      bb.min[0],
      bb.min[1],
      bb.min[2],
    ]
    glmatrix.vec3.transformMat4(tmpVector, a3D, mvpMat)
    const a2D = this._unit2DPositionToCanvasPosition(tmpVector)

    const b3D = [
      bb.max[0],
      bb.min[1],
      bb.min[2],
    ]
    glmatrix.vec3.transformMat4(tmpVector, b3D, mvpMat)
    const b2D = this._unit2DPositionToCanvasPosition(tmpVector)

    const c3D = [
      bb.max[0],
      bb.min[1],
      bb.max[2],
    ]
    glmatrix.vec3.transformMat4(tmpVector, c3D, mvpMat)
    const c2D = this._unit2DPositionToCanvasPosition(tmpVector)

    const d3D = [
      bb.min[0],
      bb.min[1],
      bb.max[2],
    ]
    glmatrix.vec3.transformMat4(tmpVector, d3D, mvpMat)
    const d2D = this._unit2DPositionToCanvasPosition(tmpVector)

    const e3D = [
      bb.min[0],
      bb.max[1],
      bb.min[2],
    ]
    glmatrix.vec3.transformMat4(tmpVector, e3D, mvpMat)
    const e2D = this._unit2DPositionToCanvasPosition(tmpVector)

    const f3D = [
      bb.max[0],
      bb.max[1],
      bb.min[2],
    ]
    glmatrix.vec3.transformMat4(tmpVector, f3D, mvpMat)
    const f2D = this._unit2DPositionToCanvasPosition(tmpVector)

    const g3D = [
      bb.max[0],
      bb.max[1],
      bb.max[2],
    ]
    glmatrix.vec3.transformMat4(tmpVector, g3D, mvpMat)
    const g2D = this._unit2DPositionToCanvasPosition(tmpVector)

    const h3D = [
      bb.min[0],
      bb.max[1],
      bb.max[2],
    ]
    glmatrix.vec3.transformMat4(tmpVector, h3D, mvpMat)
    const h2D = this._unit2DPositionToCanvasPosition(tmpVector)

    // AB line
    meshView.addLine(a2D[0], a2D[1], b2D[0], b2D[1], bbLineThickness)

    // BC line
    meshView.addLine(b2D[0], b2D[1], c2D[0], c2D[1], bbLineThickness)

    // CD line
    meshView.addLine(c2D[0], c2D[1], d2D[0], d2D[1], bbLineThickness)

    // DA line
    meshView.addLine(d2D[0], d2D[1], a2D[0], a2D[1], bbLineThickness)

    // AE line
    meshView.addLine(a2D[0], a2D[1], e2D[0], e2D[1], bbLineThickness)

    // BF line
    meshView.addLine(b2D[0], b2D[1], f2D[0], f2D[1], bbLineThickness)

    // CG line
    meshView.addLine(c2D[0], c2D[1], g2D[0], g2D[1], bbLineThickness)

    // DH line
    meshView.addLine(d2D[0], d2D[1], h2D[0], h2D[1], bbLineThickness)

    // EF line
    meshView.addLine(e2D[0], e2D[1], f2D[0], f2D[1], bbLineThickness)

    // FG line
    meshView.addLine(f2D[0], f2D[1], g2D[0], g2D[1], bbLineThickness)

    // GH line
    meshView.addLine(g2D[0], g2D[1], h2D[0], h2D[1], bbLineThickness)

    // HE line
    meshView.addLine(h2D[0], h2D[1], e2D[0], e2D[1], bbLineThickness)
  }


  _renderWireframe(mesh, mvpMat) {
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

    if (mesh.showBoundingBox) {
      this._addBoundingBox(mesh, mvpMat)
    }

    this._canvas.appendChild(meshView.view)
  }



  _renderWireframeRandomSub(mesh, mvpMat) {
    const meshView = mesh.meshView
    const vertices = mesh.worldVertices
    const uniqueEdges = mesh.uniqueEdges
    const camPosition = this._camera.position

    // Displaying at most 750 edges, but most likely 20% of the edges
    const edgesToRender = Math.min(750, mesh.uniqueEdges.length * 0.1)

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

    if (mesh.showBoundingBox) {
      this._addBoundingBox(mesh, mvpMat)
    }

    this._canvas.appendChild(meshView.view)
  }


  _renderFaceOpaquePlain(mesh, mvpMat) {
    const meshView = mesh.meshView
    meshView.reset()
    const vertices = mesh.worldVertices
    const faces = mesh.faces
    const faceNormals = mesh.faceNormalsWorld
    const faceCenters = mesh.faceCentersWorld
    const camPosition = this._camera.position
    const vpf = mesh.verticesPerFace
    const nbFaces = faces.length / vpf

    const faceNormal = glmatrix.vec3.create()
    const faceCenter = glmatrix.vec3.create()
    const camToCenter = glmatrix.vec3.create()
    const normalTip = glmatrix.vec3.create()
    const tmp = glmatrix.vec3.create()

    // will be filled with
    const polygonsToRender = []
    const tmpCoord = glmatrix.vec3.create()

    for (let f = 0; f < nbFaces; f += 1) {
      const v0Index = f * vpf

      // discard a face if its normal goes more or less the same direction as the vector camera-to-faceCenter.
      // IOW, if dot product >= 1
      faceNormal[0] = faceNormals[f * 3]
      faceNormal[1] = faceNormals[f * 3 + 1]
      faceNormal[2] = faceNormals[f * 3 + 2]

      faceCenter[0] = faceCenters[f * 3]
      faceCenter[1] = faceCenters[f * 3 + 1]
      faceCenter[2] = faceCenters[f * 3 + 2]

      camToCenter[0] = faceCenter[0] - camPosition[0]
      camToCenter[1] = faceCenter[1] - camPosition[1]
      camToCenter[2] = faceCenter[2] - camPosition[2]
      const camToCenterDist = glmatrix.vec3.length(camToCenter)
      glmatrix.vec3.normalize(camToCenter, camToCenter)

      // compute face center in 2D
      glmatrix.vec3.transformMat4(tmp, faceCenter, mvpMat)
      const faceCenter2D = this._unit2DPositionToCanvasPosition(tmp)

      // compute the normal vector in 2D
      normalTip[0] = faceCenter[0] + faceNormal[0] * 0.2
      normalTip[1] = faceCenter[1] + faceNormal[1] * 0.2
      normalTip[2] = faceCenter[2] + faceNormal[2] * 0.2
      glmatrix.vec3.transformMat4(tmp, normalTip, mvpMat)
      const normalTip2D = this._unit2DPositionToCanvasPosition(tmp)

      const dotProd = glmatrix.vec3.dot(faceNormal, camToCenter)

      if (dotProd >= 0) {
        continue
      }

      // const allVerticesOfFace3D = [] // in the form [x, y, z, x, y, z, ...]
      const allVerticesOfFace2D = [] // in the form [x, y, x, y, ...]
      let allProjectionsAreOutsideFrustrum = true
      for (let v = 0; v < vpf; v += 1) {
        const offset = faces[v0Index + v] * 3
        tmpCoord[0] = vertices[offset]
        tmpCoord[1] = vertices[offset + 1]
        tmpCoord[2] = vertices[offset + 2]
        // allVerticesOfFace3D.push(tmpCoord[0], tmpCoord[1], tmpCoord[2])

        glmatrix.vec3.transformMat4(tmpCoord, tmpCoord, mvpMat)

        const isOutsideFrustrum = (tmpCoord[0] >= 1
                                || tmpCoord[0] <= -1
                                || tmpCoord[1] >= 1
                                || tmpCoord[1] <= -1
                                || tmpCoord[2] >= 1
                                || tmpCoord[2] <= -1)
        allProjectionsAreOutsideFrustrum = allProjectionsAreOutsideFrustrum && isOutsideFrustrum
        const canvasPos = this._unit2DPositionToCanvasPosition(tmpCoord)
        allVerticesOfFace2D.push(canvasPos[0], canvasPos[1])
      }

      // all the vertices must be oustise to not render
      if (allProjectionsAreOutsideFrustrum) {
        continue
      }

      polygonsToRender.push({
        points2D: allVerticesOfFace2D,
        faceCenter2D,
        normalTip2D,
        thickness: (mesh.lineThickness / (Math.tan(this._camera.fieldOfView / 2) * camToCenterDist)) * (this._height / 2),
        distanceToCam: camToCenterDist,
      })
    }

    polygonsToRender.sort((a, b) => (a.distanceToCam > b.distanceToCam ? -1 : 1)).forEach((polygon) => {
      // adding the face
      meshView.addFaceOpaquePlain(polygon.points2D, polygon.thickness)
    })

    this._canvas.appendChild(meshView.view)
  }











  _renderDebug(mesh, mvpMat) {
    const meshView = mesh.meshView
    meshView.reset()
    const vertices = mesh.worldVertices
    const faces = mesh.faces
    const faceNormals = mesh.faceNormalsWorld
    const faceCenters = mesh.faceCentersWorld
    const camPosition = this._camera.position
    const vpf = mesh.verticesPerFace
    const nbFaces = faces.length / vpf

    const faceNormal = glmatrix.vec3.create()
    const faceCenter = glmatrix.vec3.create()
    const camToCenter = glmatrix.vec3.create()
    const normalTip = glmatrix.vec3.create()
    const tmp = glmatrix.vec3.create()

    // will be filled with
    const polygonsToRender = []
    const tmpCoord = glmatrix.vec3.create()

    for (let f = 0; f < nbFaces; f += 1) {
      const v0Index = f * vpf

      // discard a face if its normal goes more or less the same direction as the vector camera-to-faceCenter.
      // IOW, if dot product >= 1
      faceNormal[0] = faceNormals[f * 3]
      faceNormal[1] = faceNormals[f * 3 + 1]
      faceNormal[2] = faceNormals[f * 3 + 2]

      faceCenter[0] = faceCenters[f * 3]
      faceCenter[1] = faceCenters[f * 3 + 1]
      faceCenter[2] = faceCenters[f * 3 + 2]

      camToCenter[0] = faceCenter[0] - camPosition[0]
      camToCenter[1] = faceCenter[1] - camPosition[1]
      camToCenter[2] = faceCenter[2] - camPosition[2]
      const camToCenterDist = glmatrix.vec3.length(camToCenter)
      glmatrix.vec3.normalize(camToCenter, camToCenter)

      // compute face center in 2D
      glmatrix.vec3.transformMat4(tmp, faceCenter, mvpMat)
      const faceCenter2D = this._unit2DPositionToCanvasPosition(tmp)

      // compute the normal vector in 2D
      normalTip[0] = faceCenter[0] + faceNormal[0] * 0.2
      normalTip[1] = faceCenter[1] + faceNormal[1] * 0.2
      normalTip[2] = faceCenter[2] + faceNormal[2] * 0.2
      glmatrix.vec3.transformMat4(tmp, normalTip, mvpMat)
      const normalTip2D = this._unit2DPositionToCanvasPosition(tmp)

      // const dotProd = glmatrix.vec3.dot(faceNormal, camToCenter)

      // if (dotProd >= 0) {
      //   continue
      // }

      // const allVerticesOfFace3D = [] // in the form [x, y, z, x, y, z, ...]
      const allVerticesOfFace2D = [] // in the form [x, y, x, y, ...]
      let allProjectionsAreOutsideFrustrum = true
      for (let v = 0; v < vpf; v += 1) {
        const offset = faces[v0Index + v] * 3
        tmpCoord[0] = vertices[offset]
        tmpCoord[1] = vertices[offset + 1]
        tmpCoord[2] = vertices[offset + 2]
        // allVerticesOfFace3D.push(tmpCoord[0], tmpCoord[1], tmpCoord[2])

        glmatrix.vec3.transformMat4(tmpCoord, tmpCoord, mvpMat)

        const isOutsideFrustrum = (tmpCoord[0] >= 1
                                || tmpCoord[0] <= -1
                                || tmpCoord[1] >= 1
                                || tmpCoord[1] <= -1
                                || tmpCoord[2] >= 1
                                || tmpCoord[2] <= -1)
        allProjectionsAreOutsideFrustrum = allProjectionsAreOutsideFrustrum && isOutsideFrustrum

        const canvasPos = this._unit2DPositionToCanvasPosition(tmpCoord)
        allVerticesOfFace2D.push(canvasPos[0], canvasPos[1])
      }

      // all the vertices must be oustise to not render
      if (allProjectionsAreOutsideFrustrum) {
        continue
      }

      polygonsToRender.push({
        points2D: allVerticesOfFace2D,
        faceCenter2D,
        normalTip2D,
        distanceToCam: camToCenterDist,
      })
    }

    polygonsToRender.sort((a, b) => (a.distanceToCam > b.distanceToCam ? -1 : 1)).forEach((polygon) => {
      // adding the face
      meshView.addFaceOpaquePlain(polygon.points2D, 0.3)

      // adding the polygon center circle
      meshView.addCircle(polygon.faceCenter2D[0], polygon.faceCenter2D[1], 1)

      // adding the normal line
      meshView.addLine(polygon.faceCenter2D[0], polygon.faceCenter2D[1], polygon.normalTip2D[0], polygon.normalTip2D[1], 0.3)
    })

    this._canvas.appendChild(meshView.view)
  }










  _renderFaceLight(mesh, mvpMat) {
    const meshView = mesh.meshView
    meshView.reset()
    const vertices = mesh.worldVertices
    const faces = mesh.faces
    const faceNormals = mesh.faceNormalsWorld
    const faceCenters = mesh.faceCentersWorld
    const camPosition = this._camera.position
    const vpf = mesh.verticesPerFace
    const nbFaces = faces.length / vpf
    const meshColor = mesh.faceColor
    const meshSpecularity = mesh.specularity

    const A_SMALL_BIT = 0.25

    const faceNormal = glmatrix.vec3.create()
    const faceCenter = glmatrix.vec3.create()
    const camToCenter = glmatrix.vec3.create()
    const tmp = glmatrix.vec3.create()

    // const ambientLights = this._scene.getLightsByType(Light.TYPES.AMBIANT)
    // const pointLights = this._scene.getLightsByType(Light.TYPES.POINT)
    const allLights = this._scene.getAllLights()

    // will be filled with
    const polygonsToRender = []
    const tmpCoord = glmatrix.vec3.create()

    for (let f = 0; f < nbFaces; f += 1) {
      const v0Index = f * vpf

      // discard a face if its normal goes more or less the same direction as the vector camera-to-faceCenter.
      // IOW, if dot product >= 1
      faceNormal[0] = faceNormals[f * 3]
      faceNormal[1] = faceNormals[f * 3 + 1]
      faceNormal[2] = faceNormals[f * 3 + 2]

      faceCenter[0] = faceCenters[f * 3]
      faceCenter[1] = faceCenters[f * 3 + 1]
      faceCenter[2] = faceCenters[f * 3 + 2]

      camToCenter[0] = faceCenter[0] - camPosition[0]
      camToCenter[1] = faceCenter[1] - camPosition[1]
      camToCenter[2] = faceCenter[2] - camPosition[2]
      const camToCenterDist = glmatrix.vec3.length(camToCenter)
      glmatrix.vec3.normalize(camToCenter, camToCenter)

      // discard faces with normal on the wrong direction
      const dotProd = glmatrix.vec3.dot(faceNormal, camToCenter)
      if (dotProd >= 0) {
        continue
      }

      glmatrix.vec3.transformMat4(tmp, faceCenter, mvpMat)
      const faceCenter2D = this._unit2DPositionToCanvasPosition(tmp)

      // const allVerticesOfFace3D = [] // in the form [x, y, z, x, y, z, ...]
      const allVerticesOfFace2D = [] // in the form [x, y, x, y, ...]
      let allProjectionsAreOutsideFrustrum = true
      for (let v = 0; v < vpf; v += 1) {
        const offset = faces[v0Index + v] * 3
        tmpCoord[0] = vertices[offset]
        tmpCoord[1] = vertices[offset + 1]
        tmpCoord[2] = vertices[offset + 2]
        // allVerticesOfFace3D.push(tmpCoord[0], tmpCoord[1], tmpCoord[2])

        glmatrix.vec3.transformMat4(tmpCoord, tmpCoord, mvpMat)

        const isOutsideFrustrum = (tmpCoord[0] >= 1
                                || tmpCoord[0] <= -1
                                || tmpCoord[1] >= 1
                                || tmpCoord[1] <= -1
                                || tmpCoord[2] >= 1
                                || tmpCoord[2] <= -1)
        allProjectionsAreOutsideFrustrum = allProjectionsAreOutsideFrustrum && isOutsideFrustrum
        const canvasPos = this._unit2DPositionToCanvasPosition(tmpCoord)

        // we extend the face polygon just a tiny bit so that the stitches between two faces does not show
        tmp[0] = canvasPos[0] - faceCenter2D[0]
        tmp[1] = canvasPos[1] - faceCenter2D[1]
        glmatrix.vec3.normalize(tmp, tmp)

        allVerticesOfFace2D.push(canvasPos[0] + tmp[0] * A_SMALL_BIT, canvasPos[1] + tmp[1] * A_SMALL_BIT)
        // allVerticesOfFace2D.push(canvasPos[0], canvasPos[1])
      }

      // all the vertices must be oustise to not render
      if (allProjectionsAreOutsideFrustrum) {
        continue
      }

      // compute light.
      // 1. start from black color
      const faceColor = [0, 0, 0]

      // 2. Add contributions from each lights
      allLights.forEach((l) => {
        const colorToAdd = l.computeLight({
          surfaceColor: meshColor,
          illuminatedPosition: faceCenter,
          illuminatedNormal: faceNormal,
          specularity: meshSpecularity,
          cameraPosition: camPosition,
        })

        faceColor[0] += colorToAdd[0]
        faceColor[1] += colorToAdd[1]
        faceColor[2] += colorToAdd[2]
      })

      polygonsToRender.push({
        points2D: allVerticesOfFace2D,
        faceColor,
        distanceToCam: camToCenterDist,
      })
    }

    polygonsToRender.sort((a, b) => (a.distanceToCam > b.distanceToCam ? -1 : 1)).forEach((polygon) => {
      // adding the face
      meshView.addFaceColorNoStroke(polygon.points2D, Color.rgbToCssRgb(polygon.faceColor))
    })

    this._canvas.appendChild(meshView.view)
  }


}

export default Renderer
