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
  }


  get mesh() {
    return this._mesh
  }


  get view() {
    return this._view
  }


  reset() {
    // TODO: compare which is best
    // this._view.innerHTML = ''
    while (this._view.firstChild) {
      this._view.removeChild(this._view.firstChild)
    }
  }
}

export default MeshView
