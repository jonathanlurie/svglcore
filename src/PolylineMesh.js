import Mesh from './Mesh'

class PolylineMesh extends Mesh {
  constructor() {
    super()
    this._defaultColor = 'grey'
    this._lines = []
    this._colors = []
  }


  set defaultColor(c) {
    this._defaultColor = c
  }


  get defaultColor() {
    return this._defaultColor
  }


  /**
   * Vertices is expected to be in the shape of [x, y, z, x, y, z, etc.]
   * @param {*} vertices
   */
  addLine(vertices, color = this._defaultColor) {
    if (vertices.length % 3 !== 0) {
      throw new Error('The vertice array must contain triples.')
    }

    this._lines.push(vertices)
    this._colors.push(color)
  }
}

export default PolylineMesh
