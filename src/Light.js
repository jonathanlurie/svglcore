import * as glmatrix from 'gl-matrix'
import Color from './Color'
import Tools from './Tools'


class Light {
  constructor() {
    this._id = Tools.uuidv4()
    this._position = glmatrix.vec3.create()
    this._color = glmatrix.vec3.fromValues(255, 255, 255)
    this._type = null
    this._intensity = 1
  }

  get id() {
    return this._id
  }


  set color(c) {
    this._color = Color.whateverToRgb(c)
  }


  get color() {
    return this._color
  }


  get type() {
    return this._type
  }


  set position(p) {
    this._position = p
  }


  get position() {
    return this._position
  }


  set intensity(i) {
    this._intensity = i
  }


  get intensity() {
    return this._intensity
  }


  // eslint-disable-next-line class-methods-use-this
  computeLight() {
    throw new Error('The Light class is only an interface. Use classes that extends it instead.')
  }
}

export default Light
