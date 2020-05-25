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
    if (this._circlePool.length < this._circlePoolCounter + 1 ) {
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
    circle.setAttributeNS(null, 'fill', this._mesh.color)
    circle.setAttributeNS(null, 'opacity', this._mesh.opacity)
    circle.setAttributeNS(null, 'stroke-width', 0)
    this._view.appendChild(circle)
  }
}

export default MeshView
