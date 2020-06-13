/* eslint-disable no-undef */
import CONSTANTS from './Constants'

/**
 * A MeshView is a rendered SVG version of a given Mesh.
 * Each Mesh is associated to a MeshView
 */
class MeshView {
  constructor(mesh) {
    this._mesh = mesh

    this._view = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'g')
    this._view.setAttributeNS(null, 'id', mesh.id)

    this._circlePool = []
    this._circlePoolCounter = 0

    this._linePool = []
    this._linePoolCounter = 0

    this._polygonPool = []
    this._polygonPoolCounter = 0
  }


  get mesh() {
    return this._mesh
  }


  get view() {
    return this._view
  }


  reset() {
    // TODO: compare which is best
    this._view.innerHTML = ''
    // while (this._view.firstChild) {
    //   this._view.removeChild(this._view.firstChild)
    // }
    this._circlePoolCounter = 0
    this._linePoolCounter = 0
    this._polygonPoolCounter = 0
  }


  /**
   *
   * @param {*} x
   * @param {*} y
   * @param {*} radius
   */
  addCircle(x, y, radius) {
    let circle = null

    // the pool is not large enough, we create a new circle
    if (this._circlePool.length < this._circlePoolCounter + 1) {
      circle = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'circle')
      this._circlePool.push(circle)
    } else {
    // The pool is large enough, we borrow a circle from the pool
      circle = this._circlePool[this._circlePoolCounter]
    }

    this._circlePoolCounter += 1

    circle.setAttributeNS(null, 'cx', x)
    circle.setAttributeNS(null, 'cy', y)
    circle.setAttributeNS(null, 'r', radius)
    // circle.setAttributeNS(null, 'id', this._mesh.id)
    circle.setAttributeNS(null, 'style', `fill: ${this._mesh.edgeColorCss}; opacity: ${this._mesh.opacity}; stroke-width: 0;`)

    this._view.appendChild(circle)
  }


  addLine(xA, yA, xB, yB, thickness) {
    let line = null

    // the pool is not large enough, we create a new line
    if (this._linePool.length < this._linePoolCounter + 1) {
      line = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'line')
      this._linePool.push(line)
    } else {
    // The pool is large enough, we borrow a line from the pool
      line = this._linePool[this._linePoolCounter]
    }

    this._linePoolCounter += 1
    line.setAttributeNS(null, 'x1', xA)
    line.setAttributeNS(null, 'y1', yA)
    line.setAttributeNS(null, 'x2', xB)
    line.setAttributeNS(null, 'y2', yB)
    line.setAttributeNS(null, 'style', `fill: none; opacity: ${this._mesh.opacity}; stroke-width: ${thickness}; stroke: ${this._mesh.edgeColorCss}`)
    this._view.appendChild(line)
  }


  addFaceOpaquePlain(xyArr, thickness) {
    let polygon = null
    const mesh = this._mesh

    // the pool is not large enough, we create a new polygon
    if (this._polygonPool.length < this._polygonPoolCounter + 1) {
      polygon = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'polygon')
      this._polygonPool.push(polygon)
    } else {
    // The pool is large enough, we borrow a polygon from the pool
      polygon = this._polygonPool[this._polygonPoolCounter]
    }

    this._polygonPoolCounter += 1

    let pointsStr = ''
    for (let i = 0; i < xyArr.length - 1; i += 2) {
      pointsStr += `${xyArr[i]},${xyArr[i + 1]} `
    }

    polygon.setAttributeNS(null, 'points', pointsStr)
    polygon.setAttributeNS(null, 'style', `fill: ${mesh.faceColorCss}; opacity: ${mesh.opacity}; stroke: ${mesh.edgeColorCss}; stroke-width: ${thickness}`)
    this._view.appendChild(polygon)
  }





  addFaceColorNoStroke(xyArr, color) {
    let polygon = null
    const mesh = this._mesh

    // the pool is not large enough, we create a new polygon
    if (this._polygonPool.length < this._polygonPoolCounter + 1) {
      polygon = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'polygon')
      this._polygonPool.push(polygon)
    } else {
    // The pool is large enough, we borrow a polygon from the pool
      polygon = this._polygonPool[this._polygonPoolCounter]
    }

    this._polygonPoolCounter += 1

    let pointsStr = ''
    for (let i = 0; i < xyArr.length - 1; i += 2) {
      pointsStr += `${xyArr[i]},${xyArr[i + 1]} `
    }

    polygon.setAttributeNS(null, 'points', pointsStr)
    polygon.setAttributeNS(null, 'style', `fill: ${color}; opacity: ${mesh.opacity}; stroke-width: 0;`)
    this._view.appendChild(polygon)
  }
}

export default MeshView
