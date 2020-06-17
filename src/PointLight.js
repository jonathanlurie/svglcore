import * as glmatrix from 'gl-matrix'
import Light from './Light'
import LIGHT_TYPES from './LightTypes'

const tmpMat4 = glmatrix.mat4.create()
const tmpVec3 = glmatrix.vec3.create()
const tmpVec3_2 = glmatrix.vec3.create()

class PointLight extends Light {
  constructor() {
    super()
    this._type = LIGHT_TYPES.POINT
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
    // the word 'surface' is chosen rather than 'mesh' because it's more generic
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

    // newIntensity is just like this._intensity excepts it decays if the the decay options is enabled
    let newIntensity = this._intensity

    if (this._decayEnabled) {
      const lightToSurfaceDistance = (
        (this._position[0] - illuminatedPosition[0]) ** 2 +
        (this._position[1] - illuminatedPosition[1]) ** 2 +
        (this._position[2] - illuminatedPosition[2]) ** 2
      ) ** 0.5
      newIntensity = this._intensity / ((lightToSurfaceDistance / this._radius) ** 2)
      // newIntensity = Math.min(this._intensity, this._intensity / ((lightToSurfaceDistance / this._radius) ** 2))
    }

    // vector from this light source to the surface center
    const surfaceToLight = glmatrix.vec3.fromValues(
      this._position[0] - illuminatedPosition[0],
      this._position[1] - illuminatedPosition[1],
      this._position[2] - illuminatedPosition[2],
    )
    glmatrix.vec3.normalize(surfaceToLight, surfaceToLight)

    // dot product between the surface normal vector and the 
    let dotProd = glmatrix.vec3.dot(surfaceToLight, illuminatedNormal)
    dotProd = dotProd > 0 ? dotProd : 0 // onsly considering half space

    let addedColor = [
      255 * (surfaceColor[0] / 255) * (this._color[0] / 255) * dotProd * newIntensity,
      255 * (surfaceColor[1] / 255) * (this._color[1] / 255) * dotProd * newIntensity,
      255 * (surfaceColor[2] / 255) * (this._color[2] / 255) * dotProd * newIntensity,
    ]

    if (specularity > 0) {
      // Step 2: compute specularity. Only if 'specularity' is greater than 0. This is done with a Phong formula
      // that depends on the camera position and the resulting color is mostly the light source color
      // (and not a blend with the surface/mesh color)

      // A ray comes from the light source to the center of the surface with a given angle from the surface normal,
      // then bounces with an equal angle.
      // Compute this light bounce vector:
      // 1. compute the vector from light to surface center
      tmpVec3[0] = illuminatedPosition[0] - this._position[0]
      tmpVec3[1] = illuminatedPosition[1] - this._position[1]
      tmpVec3[2] = illuminatedPosition[2] - this._position[2]
      // 2. normalize it
      glmatrix.vec3.normalize(tmpVec3, tmpVec3)
      // 3. comput dot product
      const dotLightToNormal = glmatrix.vec3.dot(illuminatedNormal, tmpVec3)

      if (dotLightToNormal < 0) {
        // 4. compute reflection
        tmpVec3[0] = tmpVec3[0] - 2 * dotLightToNormal * illuminatedNormal[0]
        tmpVec3[1] = tmpVec3[1] - 2 * dotLightToNormal * illuminatedNormal[1]
        tmpVec3[2] = tmpVec3[2] - 2 * dotLightToNormal * illuminatedNormal[2]
        glmatrix.vec3.normalize(tmpVec3, tmpVec3)

        // 5. compute the vector surfaceCenter-to-camera
        tmpVec3_2[0] = cameraPosition[0] - illuminatedPosition[0]
        tmpVec3_2[1] = cameraPosition[1] - illuminatedPosition[1]
        tmpVec3_2[2] = cameraPosition[2] - illuminatedPosition[2]
        // 6. normalize this
        glmatrix.vec3.normalize(tmpVec3_2, tmpVec3_2)
        // 7. compute the dot product to have the specularity component
        const dotProd2 = glmatrix.vec3.dot(tmpVec3, tmpVec3_2) ** (30 / specularity) // the 2 is just to make the light smaller and more intense

        // 8. adding specularity to the diffuse light
        addedColor[0] += this._color[0] * dotProd2 * specularity * ((newIntensity + this._intensity) / 2)
        addedColor[1] += this._color[1] * dotProd2 * specularity * ((newIntensity + this._intensity) / 2)
        addedColor[2] += this._color[2] * dotProd2 * specularity * ((newIntensity + this._intensity) / 2)
      }
    }

    addedColor[0] = Math.min(255, addedColor[0])
    addedColor[1] = Math.min(255, addedColor[1])
    addedColor[2] = Math.min(255, addedColor[2])

    return addedColor
  }


}

export default PointLight
