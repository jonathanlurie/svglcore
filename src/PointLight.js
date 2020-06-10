import Light from './Light'

class PointLight extends Light {
  constructor() {
    super()
    this._type = Light.TYPE.POINT
    this._decayEnabled = false
    this._radius = 1
  }

  get radius() {
    return this._radius
  }


  set radius(r) {
    this._radius = r
  }

  enableDecay() {
    this._decayEnabled = true
  }


  disableDecay() {
    this._decayEnabled = false
  }


  isDecaysEnabled() {
    return this._decayEnabled
  }


  computeLight(options = {}) {
    // the word 'surface' is chosen rather than 'mesh' because the color may already be
    // the result of a blend from the mesh color and the ambiant light (if any)
    let surfaceColor = null
    if ('surfaceColor' in options) {
      surfaceColor = options.surfaceColor
    } else {
      throw new Error('The mesh color is mandatory to compute the light with PointLight.')
    }

    let illuminatedPosition = null
    if ('illuminatedPosition' in options) {
      illuminatedPosition = options.illuminatedPosition
    } else {
      throw new Error('The illuminated position is mandatory to compute the light with PointLight.')
    }

    let illuminatedNormal = null
    if ('illuminatedNormal' in options) {
      illuminatedNormal = options.illuminatedNormal
    } else {
      throw new Error('The illuminated normal is mandatory to compute the light with PointLight.')
    }

    const specularity = 'specularity' in options ? options.specularity : 0
    const cameraPosition = 'cameraPosition' in options ? options.cameraPosition : null

    if (specularity && !cameraPosition) {
      throw new Error('The camera position is required to compute the specularity')
    }

    // Step 1: compute diffuse light. This is not related to camera position, light with emit
    // on half space following a Lambertian law. The resulting color is a blend of the surface/mesh color.
    // If decay is enabled, the light decay follow an inverse square law (http://hyperphysics.phy-astr.gsu.edu/hbase/vision/isql.html)
    // where the intensity 'this._intensity' is effective only at the distance 'this._radius' and
    // the intensity at another distance d is:
    //        i = this._intensity  /  (d / this._radius)^2
    // TODO

    // Step 2: compute specularity. Only if 'specularity' is greater than 0. This is done with a Phong formula
    // that depends on the camera position and the resulting color is mostly the light source color
    // (and not a blend with the surface/mesh color)
    // TODO

    this
  }


}

export default PointLight
