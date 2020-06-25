
// import parseWFObj from 'wavefront-obj-parser'
import parseOBJ from 'parse-wavefront-obj'


class ObjParser {
  static parse(objStr) {
    // const meshData = parseWFObj(objStr)
    // const faces = new Uint32Array(meshData.vertexPositionIndices.filter((v) => v >= 0)) // the lib leaves room for 4-vertices faces by adding -1
    // const vertices = new Float32Array(meshData.vertexPositions)
    // const normals = new Float32Array(meshData.vertexNormals)


    const meshData = parseOBJ(objStr)
    const vertices = new Float32Array(meshData.positions.flat())
    const faces = new Uint32Array(meshData.cells.flat())
    const verticesPerFace = meshData.cells[0].length

    return {
      vertices,
      faces,
      verticesPerFace,
    }
  }
}

export default ObjParser




