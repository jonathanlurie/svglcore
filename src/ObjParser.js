import parseWFObj from 'wavefront-obj-parser'


class ObjParser {
  static parse(objStr) {
    const meshData = parseWFObj(objStr)
    const faces = new Uint32Array(meshData.vertexPositionIndices.filter((v) => v >= 0)) // the lib leaves room for 4-vertices faces by adding -1
    const vertices = new Float32Array(meshData.vertexPositions)
    const normals = new Float32Array(meshData.vertexNormals)

    return {
      vertices,
      faces,
      normals,
    }
  }
}

export default ObjParser
