import Light from './Light'
import LIGHT_TYPES from './LightTypes'

class AmbiantLight extends Light {
  constructor() {
    super()
    this._type = LIGHT_TYPES.AMBIANT
  }


  computeLight(options = {}) {
    let surfaceColor = null

    if ('surfaceColor' in options) {
      surfaceColor = options.surfaceColor
    } else {
      throw new Error('The surface color is mandatory to compute the light with AmbiantLight.')
    }

    return [
      ((this._color[0] / 255) * (surfaceColor[0] / 255)) * 255 * this._intensity,
      ((this._color[1] / 255) * (surfaceColor[1] / 255)) * 255 * this._intensity,
      ((this._color[2] / 255) * (surfaceColor[2] / 255)) * 255 * this._intensity,
    ]
  }
}

export default AmbiantLight
